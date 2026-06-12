"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { calculerRevenuDisponible, PARAMETRES_OFFICIELS, SITUATIONS, Situation, type Annee, type Parametres } from "@/index";
import { UI, type Lang } from "@/lib/i18n";
import { useLangue } from "@/components/lang-provider";
import { MENAGE_DEFAUT, versMenage, type MenageEtat } from "@/lib/menage-etat";
import { encoderComparaison, decoderComparaison, diffParams } from "@/lib/partage";
import { usePartageURL } from "@/lib/use-partage-url";
import { FormulaireMenage } from "@/components/formulaire-menage";
import { CasTypes } from "@/components/cas-types";
import { TableauResultats } from "@/components/tableau-resultats";
import { TauxVariation } from "@/components/taux-variation";
import { BoutonsExport } from "@/components/boutons-export";
import { specComparaison, labelJeu } from "@/lib/export-resultats";
import { AssistantChat, BoutonAssistant } from "@/components/assistant/assistant-chat";
import { EspaceTravail, BarreSuperieure } from "@/components/espace-travail";
import { BoutonEnregistrer } from "@/components/compte/bouton-enregistrer";
import { MenagePicker } from "@/components/menage-picker";
import { JeuPicker, cleOfficiel } from "@/components/jeu-picker";

const DEFAUT_A: MenageEtat = MENAGE_DEFAUT;
const DEFAUT_B: MenageEtat = { ...MENAGE_DEFAUT, situation: Situation.Couple, revenu2: 30_000 };
const cloner = (a: Annee): Parametres => structuredClone(PARAMETRES_OFFICIELS[a]);

/** Court descriptif d'un ménage (contenu du hover card sur le titre de scénario). */
function descriptionMenage(etat: MenageEtat, lang: Lang): ReactNode {
  const meta = SITUATIONS[etat.situation];
  const couple = meta.nbAdultes === 2;
  const fmt = (n: number) => `${Math.round(n).toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")} $`;
  const ligne = (label: string, valeur: string) => (
    <div className="flex justify-between gap-6">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{valeur}</span>
    </div>
  );
  return (
    <div className="space-y-1.5 text-sm">
      <p className="font-semibold">{UI.situations[etat.situation][lang]}</p>
      {ligne(
        (meta.retraite ? UI.revenuRetraite : UI.revenuTravail)[lang],
        couple ? `${fmt(etat.revenu1)} + ${fmt(etat.revenu2)}` : fmt(etat.revenu1),
      )}
      {ligne(UI.age[lang], couple ? `${etat.age1} / ${etat.age2}` : String(etat.age1))}
      {etat.enfants.length > 0 && ligne(UI.nbEnfants[lang], String(etat.enfants.length))}
    </div>
  );
}

/** Un côté : ménage (chargé de la bibliothèque ou saisi) sur le jeu de paramètres partagé. */
function SectionMenage({
  titre,
  etat,
  onChange,
  lang,
  prefixe,
}: {
  titre: string;
  etat: MenageEtat;
  onChange: (e: MenageEtat) => void;
  lang: Lang;
  prefixe: string;
}) {
  return (
    <div className="px-5 py-5">
      <h3 className="mb-3 text-sm font-semibold">{titre}</h3>
      <div className="grid gap-4">
        <MenagePicker lang={lang} etatCourant={etat} onCharger={onChange} />
        <CasTypes lang={lang} etat={etat} onCharger={onChange} />
        <FormulaireMenage etat={etat} onChange={onChange} lang={lang} prefixe={prefixe} />
      </div>
    </div>
  );
}

export function Comparaison() {
  const { lang, setLang } = useLangue();
  const [etatA, setEtatA] = useState<MenageEtat>(DEFAUT_A);
  const [etatB, setEtatB] = useState<MenageEtat>(DEFAUT_B);
  const [cleJeu, setCleJeu] = useState<string>(cleOfficiel(2025));
  const [anneeJeu, setAnneeJeu] = useState<Annee>(2025);
  const [bundleJeu, setBundleJeu] = useState<Parametres>(() => cloner(2025));

  const choisirJeu = (cle: string, b: Parametres, a: Annee) => {
    setCleJeu(cle);
    setBundleJeu(b);
    setAnneeJeu(a);
  };

  const encoded = useMemo(
    () => encoderComparaison({ etatA, etatB, anneeJeu, bundleJeu }),
    [etatA, etatB, anneeJeu, bundleJeu],
  );
  const onCharger = useCallback((s: string) => {
    const d = decoderComparaison(s);
    if (!d) return;
    setEtatA(d.etatA);
    setEtatB(d.etatB);
    setAnneeJeu(d.anneeJeu);
    setBundleJeu(d.bundleJeu);
    const modifie = Object.keys(diffParams(d.bundleJeu, PARAMETRES_OFFICIELS[d.anneeJeu])).length > 0;
    setCleJeu(modifie ? "__partage__" : cleOfficiel(d.anneeJeu));
  }, []);
  usePartageURL(encoded, onCharger);

  const rA = useMemo(() => calculerRevenuDisponible(versMenage(etatA), bundleJeu), [etatA, bundleJeu]);
  const rB = useMemo(() => calculerRevenuDisponible(versMenage(etatB), bundleJeu), [etatB, bundleJeu]);

  // Écarts du jeu courant vs officiel : libellé d'export + contexte de l'assistant.
  const diffJeu = useMemo(() => diffParams(bundleJeu, PARAMETRES_OFFICIELS[anneeJeu]), [bundleJeu, anneeJeu]);

  return (
    <EspaceTravail
      lang={lang}
      tailleGauche="32%"
      assistant={
        <AssistantChat
          lang={lang}
          api="/api/assistant-scenarios"
          corps={{ mode: "menages", menageA: etatA, menageB: etatB, jeuA: { annee: anneeJeu, diff: diffJeu }, lang }}
          intro={UI.assistantScenariosIntro[lang]}
          actionsRapides={[UI.assistantScenariosQ1[lang], UI.assistantScenariosQ2[lang]]}
          demoPossible
        />
      }
      header={
        <BarreSuperieure
          lang={lang}
          onLang={setLang}
          titre={UI.comparaisonTitre[lang]}
          sousTitre={UI.comparaisonDesc[lang]}
          nav={
            <>
              <Link href="/" className="underline-offset-4 hover:underline">← {UI.navCalculateur[lang]}</Link>
              <Link href="/budget" className="underline-offset-4 hover:underline">{UI.navBudget[lang]}</Link>
              <Link href="/bibliotheque" className="underline-offset-4 hover:underline">{UI.navBibliotheque[lang]}</Link>
            </>
          }
          actions={<BoutonEnregistrer type="COMPARAISON" encoded={encoded} lang={lang} />}
        />
      }
      gauche={{
        titre: UI.voletMenagesCompares[lang],
        contenu: (
          <div className="divide-y">
            <div className="px-5 py-5">
              <JeuPicker lang={lang} valeur={cleJeu} onCharger={choisirJeu} label={UI.selectJeu[lang]} />
            </div>
            <SectionMenage titre={UI.scenarioA[lang]} etat={etatA} onChange={setEtatA} lang={lang} prefixe="a-" />
            <SectionMenage titre={UI.scenarioB[lang]} etat={etatB} onChange={setEtatB} lang={lang} prefixe="b-" />
          </div>
        ),
      }}
      central={{
        titre: UI.revenuDisponible[lang],
        actions: (
          <div className="flex items-center gap-2">
            <BoutonAssistant lang={lang} />
            <BoutonsExport
              spec={specComparaison(etatA, etatB, rA, rB, labelJeu(anneeJeu, Object.keys(diffJeu).length, lang), lang)}
              lang={lang}
            />
          </div>
        ),
        contenu: (
          <div className="space-y-5 px-5 py-5">
            <TableauResultats
              rGauche={rA}
              rDroite={rB}
              lang={lang}
              enteteGauche={UI.scenarioA[lang]}
              enteteDroite={UI.scenarioB[lang]}
              descGauche={descriptionMenage(etatA, lang)}
              descDroite={descriptionMenage(etatB, lang)}
            />
            <TauxVariation etatA={etatA} etatB={etatB} rA={rA} rB={rB} lang={lang} />
          </div>
        ),
      }}
    />
  );
}
