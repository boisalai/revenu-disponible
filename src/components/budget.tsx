"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { calculerRevenuDisponible, PARAMETRES_OFFICIELS, type Annee, type Parametres } from "@/index";
import { UI, type Lang } from "@/lib/i18n";
import { MENAGE_DEFAUT, versMenage, type MenageEtat } from "@/lib/menage-etat";
import { FormulaireMenage } from "@/components/formulaire-menage";
import { TableauResultats } from "@/components/tableau-resultats";
import { EditeurParametres } from "@/components/editeur-parametres";
import { SelecteurLangue } from "@/components/calculateur";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ANNEES: Annee[] = [2025, 2026];
const cloner = (a: Annee): Parametres => structuredClone(PARAMETRES_OFFICIELS[a]);

export function Budget() {
  const [lang, setLang] = useState<Lang>("fr");
  const [etat, setEtat] = useState<MenageEtat>(MENAGE_DEFAUT);
  const [anneeBase, setAnneeBase] = useState<Annee>(2025);
  const [bundle, setBundle] = useState<Parametres>(() => cloner(2025));

  const changerAnnee = (a: Annee) => {
    setAnneeBase(a);
    setBundle(cloner(a)); // repartir des paramètres officiels de la nouvelle année de base
  };

  const menage = useMemo(() => versMenage(etat), [etat]);
  const rOfficiel = useMemo(() => calculerRevenuDisponible(menage, PARAMETRES_OFFICIELS[anneeBase]), [menage, anneeBase]);
  const rModifie = useMemo(() => calculerRevenuDisponible(menage, bundle), [menage, bundle]);

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{UI.budgetTitre[lang]}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{UI.budgetDesc[lang]}</p>
          <div className="mt-3 flex gap-4 text-sm font-medium text-primary">
            <Link href="/" className="underline-offset-4 hover:underline">← {UI.navCalculateur[lang]}</Link>
            <Link href="/comparaison" className="underline-offset-4 hover:underline">{UI.navComparaison[lang]}</Link>
          </div>
        </div>
        <SelecteurLangue lang={lang} onChange={setLang} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="grid gap-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{UI.situationMenage[lang]}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <FormulaireMenage etat={etat} onChange={setEtat} lang={lang} />
              <div className="grid gap-1.5">
                <Label>{UI.anneeBase[lang]}</Label>
                <Select value={String(anneeBase)} onValueChange={(v) => changerAnnee(Number(v) as Annee)}>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>{UI.parametres[lang]}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setBundle(cloner(anneeBase))}>
                {UI.reinitialiser[lang]}
              </Button>
            </CardHeader>
            <CardContent>
              <EditeurParametres bundle={bundle} officiel={PARAMETRES_OFFICIELS[anneeBase]} onChange={setBundle} lang={lang} />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{UI.revenuDisponible[lang]}</CardTitle>
          </CardHeader>
          <CardContent>
            <TableauResultats
              rGauche={rOfficiel}
              rDroite={rModifie}
              lang={lang}
              enteteGauche={`${UI.officiel[lang]} ${anneeBase}`}
              enteteDroite={UI.modifie[lang]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
