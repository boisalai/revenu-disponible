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
import { SelecteurLangue } from "@/components/calculateur";
import { BarreCompte } from "@/components/compte/barre-compte";
import { AuthDialog } from "@/components/compte/auth-dialog";
import { MenageDialog, type MenageInitial } from "@/components/menage-dialog";
import { JeuDialog, type JeuInitial } from "@/components/jeu-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{UI.bibliothequeTitre[lang]}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{UI.bibliothequeDesc[lang]}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium text-primary">
            <Link href="/" className="underline-offset-4 hover:underline">← {UI.navCalculateur[lang]}</Link>
            <Link href="/comparaison" className="underline-offset-4 hover:underline">{UI.navComparaison[lang]}</Link>
            <Link href="/budget" className="underline-offset-4 hover:underline">{UI.navBudget[lang]}</Link>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <BarreCompte lang={lang} />
          <SelecteurLangue lang={lang} onChange={setLang} />
        </div>
      </header>

      {!isPending && !session ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CircleUser className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">{UI.connexionRequiseBibliotheque[lang]}</p>
            <Button onClick={() => setAuthOuvert(true)}>{UI.seConnecter[lang]}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle>{UI.mesMenages[lang]}</CardTitle>
              <Button size="sm" className="gap-1.5" onClick={() => setMDlg({ open: true, initial: {} })}>
                <Plus className="size-4" />
                {UI.nouveauMenage[lang]}
              </Button>
            </CardHeader>
            <CardContent>
              {menages === null ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{UI.chargement[lang]}</p>
              ) : menages.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{UI.aucunMenage[lang]}</p>
              ) : (
                <ul className="grid gap-2">
                  {menages.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="min-w-0">
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
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle>{UI.mesJeux[lang]}</CardTitle>
              <Button size="sm" className="gap-1.5" onClick={() => setJDlg({ open: true, initial: {} })}>
                <Plus className="size-4" />
                {UI.nouveauJeu[lang]}
              </Button>
            </CardHeader>
            <CardContent>
              {jeux === null ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{UI.chargement[lang]}</p>
              ) : jeux.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{UI.aucunJeu[lang]}</p>
              ) : (
                <ul className="grid gap-2">
                  {jeux.map((j) => (
                    <li key={j.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="min-w-0">
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
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <AuthDialog open={authOuvert} onOpenChange={setAuthOuvert} lang={lang} />
      <MenageDialog open={mDlg.open} onOpenChange={(o) => setMDlg((s) => ({ ...s, open: o }))} lang={lang} initial={mDlg.initial} onSaved={recharger} />
      <JeuDialog open={jDlg.open} onOpenChange={(o) => setJDlg((s) => ({ ...s, open: o }))} lang={lang} initial={jDlg.initial} onSaved={recharger} />
    </div>
  );
}
