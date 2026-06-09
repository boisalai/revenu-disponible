"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { calculerRevenuDisponible, PARAMETRES_OFFICIELS, Situation, type Annee, type Parametres } from "@/index";
import { UI, type Lang } from "@/lib/i18n";
import { MENAGE_DEFAUT, versMenage, type MenageEtat } from "@/lib/menage-etat";
import { encoderComparaison, decoderComparaison, diffParams } from "@/lib/partage";
import { usePartageURL } from "@/lib/use-partage-url";
import { FormulaireMenage } from "@/components/formulaire-menage";
import { TableauResultats } from "@/components/tableau-resultats";
import { EspaceTravail, BarreSuperieure } from "@/components/espace-travail";
import { BoutonEnregistrer } from "@/components/compte/bouton-enregistrer";
import { MenagePicker } from "@/components/menage-picker";
import { JeuPicker, cleOfficiel } from "@/components/jeu-picker";

const DEFAUT_A: MenageEtat = MENAGE_DEFAUT;
const DEFAUT_B: MenageEtat = { ...MENAGE_DEFAUT, situation: Situation.Couple, revenu2: 30_000 };
const cloner = (a: Annee): Parametres => structuredClone(PARAMETRES_OFFICIELS[a]);

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
        <FormulaireMenage etat={etat} onChange={onChange} lang={lang} prefixe={prefixe} />
      </div>
    </div>
  );
}

export function Comparaison() {
  const [lang, setLang] = useState<Lang>("fr");
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

  return (
    <EspaceTravail
      lang={lang}
      tailleGauche="32%"
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
        contenu: (
          <div className="px-5 py-5">
            <TableauResultats
              rGauche={rA}
              rDroite={rB}
              lang={lang}
              enteteGauche={UI.scenarioA[lang]}
              enteteDroite={UI.scenarioB[lang]}
            />
          </div>
        ),
      }}
    />
  );
}
