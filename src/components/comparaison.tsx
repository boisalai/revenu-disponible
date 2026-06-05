"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { calculerRevenuDisponible, Situation, type Annee } from "@/index";
import { UI, type Lang } from "@/lib/i18n";
import { MENAGE_DEFAUT, versMenage, type MenageEtat } from "@/lib/menage-etat";
import { encoderComparaison, decoderComparaison } from "@/lib/partage";
import { usePartageURL } from "@/lib/use-partage-url";
import { FormulaireMenage } from "@/components/formulaire-menage";
import { TableauResultats } from "@/components/tableau-resultats";
import { SelecteurLangue } from "@/components/calculateur";
import { BoutonPartage } from "@/components/bouton-partage";
import { BoutonEnregistrer } from "@/components/compte/bouton-enregistrer";
import { BarreCompte } from "@/components/compte/barre-compte";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ANNEES: Annee[] = [2025, 2026];

const DEFAUT_A: MenageEtat = MENAGE_DEFAUT;
const DEFAUT_B: MenageEtat = { ...MENAGE_DEFAUT, situation: Situation.Couple, revenu2: 30_000 };

function SelecteurAnnee({ annee, onChange, lang }: { annee: Annee; onChange: (a: Annee) => void; lang: Lang }) {
  return (
    <div className="grid gap-1.5">
      <Label>{UI.annee[lang]}</Label>
      <Select value={String(annee)} onValueChange={(v) => onChange(Number(v) as Annee)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ANNEES.map((a) => (
            <SelectItem key={a} value={String(a)}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PanneauScenario({
  titre,
  etat,
  onChangeEtat,
  annee,
  onChangeAnnee,
  lang,
  prefixe,
}: {
  titre: string;
  etat: MenageEtat;
  onChangeEtat: (e: MenageEtat) => void;
  annee: Annee;
  onChangeAnnee: (a: Annee) => void;
  lang: Lang;
  prefixe: string;
}) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>{titre}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <FormulaireMenage etat={etat} onChange={onChangeEtat} lang={lang} prefixe={prefixe} />
        <SelecteurAnnee annee={annee} onChange={onChangeAnnee} lang={lang} />
      </CardContent>
    </Card>
  );
}

export function Comparaison() {
  const [lang, setLang] = useState<Lang>("fr");
  const [etatA, setEtatA] = useState<MenageEtat>(DEFAUT_A);
  const [anneeA, setAnneeA] = useState<Annee>(2025);
  const [etatB, setEtatB] = useState<MenageEtat>(DEFAUT_B);
  const [anneeB, setAnneeB] = useState<Annee>(2025);

  const encoded = useMemo(() => encoderComparaison({ etatA, anneeA, etatB, anneeB }), [etatA, anneeA, etatB, anneeB]);
  const onCharger = useCallback((s: string) => {
    const d = decoderComparaison(s);
    if (d) {
      setEtatA(d.etatA);
      setAnneeA(d.anneeA);
      setEtatB(d.etatB);
      setAnneeB(d.anneeB);
    }
  }, []);
  usePartageURL(encoded, onCharger);

  const rA = useMemo(() => calculerRevenuDisponible(versMenage(etatA), anneeA), [etatA, anneeA]);
  const rB = useMemo(() => calculerRevenuDisponible(versMenage(etatB), anneeB), [etatB, anneeB]);

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{UI.comparaisonTitre[lang]}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{UI.comparaisonDesc[lang]}</p>
          <div className="mt-3 flex gap-4 text-sm font-medium text-primary">
            <Link href="/" className="underline-offset-4 hover:underline">← {UI.navCalculateur[lang]}</Link>
            <Link href="/budget" className="underline-offset-4 hover:underline">{UI.navBudget[lang]}</Link>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <BoutonEnregistrer type="COMPARAISON" encoded={encoded} lang={lang} />
          <BoutonPartage lang={lang} />
          <BarreCompte lang={lang} />
          <SelecteurLangue lang={lang} onChange={setLang} />
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <PanneauScenario titre={`${UI.scenarioA[lang]}`} etat={etatA} onChangeEtat={setEtatA} annee={anneeA} onChangeAnnee={setAnneeA} lang={lang} prefixe="a-" />
        <PanneauScenario titre={`${UI.scenarioB[lang]}`} etat={etatB} onChangeEtat={setEtatB} annee={anneeB} onChangeAnnee={setAnneeB} lang={lang} prefixe="b-" />
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
            enteteGauche={`${UI.scenarioA[lang]} (${anneeA})`}
            enteteDroite={`${UI.scenarioB[lang]} (${anneeB})`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
