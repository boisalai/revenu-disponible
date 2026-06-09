"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CircleUser, Pencil, Plus, Trash2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import {
  listerMenages,
  supprimerMenage,
  listerJeuxParametres,
  supprimerJeuParametres,
  type MenageResume,
  type JeuResume,
} from "@/lib/bibliotheque";
import { appliquerParams } from "@/lib/partage";
import { UI, type Lang } from "@/lib/i18n";
import { aDeuxAdultes, normaliserMenageEtat, type MenageEtat } from "@/lib/menage-etat";
import { EspaceTravail, BarreSuperieure } from "@/components/espace-travail";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import { AuthDialog } from "@/components/compte/auth-dialog";
import { MenageDialog, type MenageInitial } from "@/components/menage-dialog";
import { JeuDialog, type JeuInitial } from "@/components/jeu-dialog";
import { Button } from "@/components/ui/button";

const fmt = (n: number, lang: Lang) => `${n.toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")} $`;

function resumeMenage(e: MenageEtat, lang: Lang): string {
  const sit = UI.situations[e.situation]?.[lang] ?? "";
  const montants = aDeuxAdultes(e.situation)
    ? `${fmt(e.revenu1, lang)} + ${fmt(e.revenu2, lang)}`
    : fmt(e.revenu1, lang);
  const nb = e.enfants?.length ?? 0;
  const enf = nb ? ` · ${nb} enf.` : "";
  return `${sit} · ${montants}${enf}`;
}

function resumeJeu(j: JeuResume, lang: Lang): string {
  const n = Object.keys(j.data).length;
  return `${UI.officiel[lang]} ${j.anneeBase} · ${n} ${n <= 1 ? UI.uneModif[lang] : UI.desModifs[lang]}`;
}

/** Bouton « + Nouveau » d'en-tête de volet. */
function BoutonNouveau({ libelle, onClick }: { libelle: string; onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" className="gap-1.5" onClick={onClick}>
      <Plus className="size-4" />
      {libelle}
    </Button>
  );
}

function Vide({ texte }: { texte: string }) {
  return <p className="px-5 py-8 text-center text-sm text-muted-foreground">{texte}</p>;
}

export function Bibliotheque() {
  const [lang, setLang] = useState<Lang>("fr");
  const { data: session, isPending } = useSession();
  const [authOuvert, setAuthOuvert] = useState(false);
  const [menages, setMenages] = useState<MenageResume[] | null>(null);
  const [jeux, setJeux] = useState<JeuResume[] | null>(null);
  const [mDlg, setMDlg] = useState<{ open: boolean; initial?: MenageInitial }>({ open: false });
  const [jDlg, setJDlg] = useState<{ open: boolean; initial?: JeuInitial }>({ open: false });

  const recharger = useCallback(() => {
    if (!session) {
      setMenages([]);
      setJeux([]);
      return;
    }
    listerMenages().then(setMenages).catch(() => setMenages([]));
    listerJeuxParametres().then(setJeux).catch(() => setJeux([]));
  }, [session]);
  useEffect(() => {
    recharger();
  }, [recharger]);

  const supprimerM = async (id: string) => {
    setMenages((p) => p?.filter((m) => m.id !== id) ?? null);
    await supprimerMenage(id);
  };
  const supprimerJ = async (id: string) => {
    setJeux((p) => p?.filter((j) => j.id !== id) ?? null);
    await supprimerJeuParametres(id);
  };

  const connecte = !!session;
  const nonConnecte = !isPending && !connecte;

  // Volet gauche : ménages types
  const corpsMenages = nonConnecte ? (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <CircleUser className="size-9 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{UI.connexionRequiseBibliotheque[lang]}</p>
      <Button onClick={() => setAuthOuvert(true)}>{UI.seConnecter[lang]}</Button>
    </div>
  ) : menages === null ? (
    <Vide texte={UI.chargement[lang]} />
  ) : menages.length === 0 ? (
    <Vide texte={UI.aucunMenage[lang]} />
  ) : (
    <ul className="flex flex-col gap-2 px-5 py-5">
      {menages.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{m.name}</p>
            <p className="text-xs text-muted-foreground">{resumeMenage(m.data, lang)}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label={UI.modifier[lang]}
              onClick={() => setMDlg({ open: true, initial: { id: m.id, name: m.name, etat: normaliserMenageEtat(m.data) } })}
            >
              <Pencil className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label={UI.supprimer[lang]} onClick={() => supprimerM(m.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );

  // Volet central : jeux de paramètres
  const corpsJeux = nonConnecte ? (
    <Vide texte={UI.connexionRequiseBibliotheque[lang]} />
  ) : jeux === null ? (
    <Vide texte={UI.chargement[lang]} />
  ) : jeux.length === 0 ? (
    <Vide texte={UI.aucunJeu[lang]} />
  ) : (
    <ul className="flex flex-col gap-2 px-5 py-5">
      {jeux.map((j) => (
        <li key={j.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{j.name}</p>
            <p className="text-xs text-muted-foreground">{resumeJeu(j, lang)}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label={UI.modifier[lang]}
              onClick={() =>
                setJDlg({
                  open: true,
                  initial: { id: j.id, name: j.name, anneeBase: j.anneeBase, bundle: appliquerParams(j.anneeBase, j.data) },
                })
              }
            >
              <Pencil className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label={UI.supprimer[lang]} onClick={() => supprimerJ(j.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );

  // Volet droit : aide
  const aide = (
    <div className="space-y-4 px-5 py-5 text-sm">
      <p className="leading-relaxed text-muted-foreground">{UI.bibliothequeDesc[lang]}</p>
      <div>
        <h3 className="font-medium">{UI.mesMenages[lang]}</h3>
        <p className="mt-1 leading-relaxed text-muted-foreground">{UI.bibliothequeAideMenages[lang]}</p>
      </div>
      <div>
        <h3 className="font-medium">{UI.mesJeux[lang]}</h3>
        <p className="mt-1 leading-relaxed text-muted-foreground">{UI.bibliothequeAideJeux[lang]}</p>
      </div>
      <p className="leading-relaxed text-muted-foreground">{UI.bibliothequeAideUsage[lang]}</p>
    </div>
  );

  return (
    <>
      <EspaceTravail
        lang={lang}
        tailleGauche="34%"
        header={
          <BarreSuperieure
            lang={lang}
            onLang={setLang}
            titre={UI.bibliothequeTitre[lang]}
            sousTitre={UI.bibliothequeDesc[lang]}
            avecPartage={false}
            nav={
              <>
                <Link href="/" className="underline-offset-4 hover:underline">← {UI.navCalculateur[lang]}</Link>
                <Link href="/comparaison" className="underline-offset-4 hover:underline">{UI.navComparaison[lang]}</Link>
                <Link href="/budget" className="underline-offset-4 hover:underline">{UI.navBudget[lang]}</Link>
              </>
            }
          />
        }
        gauche={{
          titre: UI.mesMenages[lang],
          actions: connecte ? <BoutonNouveau libelle={UI.nouveau[lang]} onClick={() => setMDlg({ open: true, initial: {} })} /> : undefined,
          contenu: corpsMenages,
        }}
        central={{
          titre: UI.mesJeux[lang],
          actions: connecte ? <BoutonNouveau libelle={UI.nouveau[lang]} onClick={() => setJDlg({ open: true, initial: {} })} /> : undefined,
          contenu: corpsJeux,
        }}
        droite={{ titre: UI.aide[lang], contenu: aide }}
        assistant={
          <AssistantChat
            lang={lang}
            api="/api/assistant-bibliotheque"
            corps={{ lang }}
            intro={UI.assistantBiblioIntro[lang]}
            actionsRapides={[UI.assistantBiblioQ1[lang], UI.assistantBiblioQ2[lang]]}
            onTermine={recharger}
            requiertConnexion
          />
        }
      />

      <AuthDialog open={authOuvert} onOpenChange={setAuthOuvert} lang={lang} />
      <MenageDialog open={mDlg.open} onOpenChange={(o) => setMDlg((s) => ({ ...s, open: o }))} lang={lang} initial={mDlg.initial} onSaved={recharger} />
      <JeuDialog open={jDlg.open} onOpenChange={(o) => setJDlg((s) => ({ ...s, open: o }))} lang={lang} initial={jDlg.initial} onSaved={recharger} />
    </>
  );
}
