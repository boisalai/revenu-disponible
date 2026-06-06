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
import { SelecteurLangue } from "@/components/calculateur";
import { BoutonPartage } from "@/components/bouton-partage";
import { BoutonEnregistrer } from "@/components/compte/bouton-enregistrer";
import { BarreCompte } from "@/components/compte/barre-compte";
import { ThemeToggle } from "@/components/theme-toggle";
import { MenagePicker } from "@/components/menage-picker";
import { JeuPicker, cleOfficiel } from "@/components/jeu-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DEFAUT_A: MenageEtat = MENAGE_DEFAUT;
const DEFAUT_B: MenageEtat = { ...MENAGE_DEFAUT, situation: Situation.Couple, revenu2: 30_000 };
const cloner = (a: Annee): Parametres => structuredClone(PARAMETRES_OFFICIELS[a]);

/** Un côté : ménage (chargé de la bibliothèque ou saisi) sur le jeu de paramètres partagé. */
function PanneauMenage({
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
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>{titre}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <MenagePicker lang={lang} etatCourant={etat} onCharger={onChange} />
        <FormulaireMenage etat={etat} onChange={onChange} lang={lang} prefixe={prefixe} />
      </CardContent>
    </Card>
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
    <div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{UI.comparaisonTitre[lang]}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{UI.comparaisonDesc[lang]}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium text-primary">
            <Link href="/" className="underline-offset-4 hover:underline">← {UI.navCalculateur[lang]}</Link>
            <Link href="/budget" className="underline-offset-4 hover:underline">{UI.navBudget[lang]}</Link>
            <Link href="/bibliotheque" className="underline-offset-4 hover:underline">{UI.navBibliotheque[lang]}</Link>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <BoutonEnregistrer type="COMPARAISON" encoded={encoded} lang={lang} />
          <BoutonPartage lang={lang} />
          <BarreCompte lang={lang} />
          <ThemeToggle />
          <SelecteurLangue lang={lang} onChange={setLang} />
        </div>
      </header>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <JeuPicker lang={lang} valeur={cleJeu} onCharger={choisirJeu} label={UI.selectJeu[lang]} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <PanneauMenage titre={UI.scenarioA[lang]} etat={etatA} onChange={setEtatA} lang={lang} prefixe="a-" />
        <PanneauMenage titre={UI.scenarioB[lang]} etat={etatB} onChange={setEtatB} lang={lang} prefixe="b-" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{UI.revenuDisponible[lang]}</CardTitle>
        </CardHeader>
        <CardContent>
          <TableauResultats
            rGauche={rA}
            rDroite={rB}
            lang={lang}
            enteteGauche={UI.scenarioA[lang]}
            enteteDroite={UI.scenarioB[lang]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
