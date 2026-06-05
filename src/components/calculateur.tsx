"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { calculerRevenuDisponible } from "@/index";
import { UI, type Lang } from "@/lib/i18n";
import { MENAGE_DEFAUT, versMenage, type MenageEtat } from "@/lib/menage-etat";
import { encoderMenage, decoderMenage } from "@/lib/partage";
import { usePartageURL } from "@/lib/use-partage-url";
import { FormulaireMenage } from "@/components/formulaire-menage";
import { TableauResultats } from "@/components/tableau-resultats";
import { GraphiqueTauxMarginal } from "@/components/graphique-taux-marginal";
import { BoutonPartage } from "@/components/bouton-partage";
import { BoutonEnregistrer } from "@/components/compte/bouton-enregistrer";
import { BarreCompte } from "@/components/compte/barre-compte";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Bascule de langue FR/EN. */
export function SelecteurLangue({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-md border text-sm">
      {(["fr", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`px-3 py-1.5 font-medium uppercase transition-colors ${
            lang === l ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Calculateur() {
  const [lang, setLang] = useState<Lang>("fr");
  const [etat, setEtat] = useState<MenageEtat>(MENAGE_DEFAUT);

  const encoded = useMemo(() => encoderMenage(etat), [etat]);
  const onCharger = useCallback((s: string) => {
    const m = decoderMenage(s);
    if (m) setEtat(m);
  }, []);
  usePartageURL(encoded, onCharger);

  const menage = useMemo(() => versMenage(etat), [etat]);
  const r25 = useMemo(() => calculerRevenuDisponible(menage, 2025), [menage]);
  const r26 = useMemo(() => calculerRevenuDisponible(menage, 2026), [menage]);

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{UI.titre[lang]}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{UI.sousTitre[lang]}</p>
          <div className="mt-3 flex gap-4 text-sm font-medium text-primary">
            <Link href="/comparaison" className="underline-offset-4 hover:underline">{UI.navComparaison[lang]}</Link>
            <Link href="/budget" className="underline-offset-4 hover:underline">{UI.navBudget[lang]}</Link>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <BoutonEnregistrer type="CALCULATEUR" encoded={encoded} lang={lang} />
          <BoutonPartage lang={lang} />
          <BarreCompte lang={lang} />
          <SelecteurLangue lang={lang} onChange={setLang} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{UI.situationMenage[lang]}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <FormulaireMenage etat={etat} onChange={setEtat} lang={lang} />
            <p className="text-xs text-muted-foreground">{UI.disclaimer[lang]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{UI.revenuDisponible[lang]}</CardTitle>
          </CardHeader>
          <CardContent>
            <TableauResultats rGauche={r25} rDroite={r26} lang={lang} enteteGauche="2025" enteteDroite="2026" />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{UI.tauxMarginalTitre[lang]}</CardTitle>
          <CardDescription>{UI.tauxMarginalDesc[lang]}</CardDescription>
        </CardHeader>
        <CardContent>
          <GraphiqueTauxMarginal menage={menage} annee={2025} revenuActuel={etat.revenu1} lang={lang} />
        </CardContent>
      </Card>
    </div>
  );
}
