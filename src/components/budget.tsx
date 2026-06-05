"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { calculerRevenuDisponible, PARAMETRES_OFFICIELS, type Annee, type Parametres } from "@/index";
import { UI, type Lang } from "@/lib/i18n";
import { MENAGE_DEFAUT, versMenage, type MenageEtat } from "@/lib/menage-etat";
import { encoderBudget, decoderBudget } from "@/lib/partage";
import { usePartageURL } from "@/lib/use-partage-url";
import { FormulaireMenage } from "@/components/formulaire-menage";
import { TableauResultats } from "@/components/tableau-resultats";
import { EditeurParametres } from "@/components/editeur-parametres";
import { SelecteurLangue } from "@/components/calculateur";
import { BoutonPartage } from "@/components/bouton-partage";
import { BoutonEnregistrer } from "@/components/compte/bouton-enregistrer";
import { BarreCompte } from "@/components/compte/barre-compte";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ANNEES: Annee[] = [2025, 2026];
const cloner = (a: Annee): Parametres => structuredClone(PARAMETRES_OFFICIELS[a]);

/** Contrôles + éditeur d'un scénario de paramètres (année de base, réinitialisation, édition). */
function PanneauParametres({
  annee,
  bundle,
  onAnnee,
  onBundle,
  lang,
}: {
  annee: Annee;
  bundle: Parametres;
  onAnnee: (a: Annee) => void;
  onBundle: (b: Parametres) => void;
  lang: Lang;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="grid gap-1.5">
          <Label>{UI.anneeBase[lang]}</Label>
          <Select value={String(annee)} onValueChange={(v) => onAnnee(Number(v) as Annee)}>
            <SelectTrigger className="w-28">
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
        <Button variant="outline" size="sm" onClick={() => onBundle(cloner(annee))}>
          {UI.reinitialiser[lang]}
        </Button>
      </div>
      <EditeurParametres bundle={bundle} officiel={PARAMETRES_OFFICIELS[annee]} onChange={onBundle} lang={lang} />
    </div>
  );
}

export function Budget() {
  const [lang, setLang] = useState<Lang>("fr");
  const [etat, setEtat] = useState<MenageEtat>(MENAGE_DEFAUT);
  const [anneeA, setAnneeA] = useState<Annee>(2025);
  const [bundleA, setBundleA] = useState<Parametres>(() => cloner(2025));
  const [anneeB, setAnneeB] = useState<Annee>(2026);
  const [bundleB, setBundleB] = useState<Parametres>(() => cloner(2026));

  const changerAnneeA = (a: Annee) => { setAnneeA(a); setBundleA(cloner(a)); };
  const changerAnneeB = (a: Annee) => { setAnneeB(a); setBundleB(cloner(a)); };

  const encoded = useMemo(
    () => encoderBudget({ etat, anneeA, bundleA, anneeB, bundleB }),
    [etat, anneeA, bundleA, anneeB, bundleB],
  );
  const onCharger = useCallback((s: string) => {
    const d = decoderBudget(s);
    if (d) {
      setEtat(d.etat);
      setAnneeA(d.anneeA);
      setBundleA(d.bundleA);
      setAnneeB(d.anneeB);
      setBundleB(d.bundleB);
    }
  }, []);
  usePartageURL(encoded, onCharger);

  const menage = useMemo(() => versMenage(etat), [etat]);
  const rA = useMemo(() => calculerRevenuDisponible(menage, bundleA), [menage, bundleA]);
  const rB = useMemo(() => calculerRevenuDisponible(menage, bundleB), [menage, bundleB]);

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
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <BoutonEnregistrer type="BUDGET" encoded={encoded} lang={lang} />
          <BoutonPartage lang={lang} />
          <BarreCompte lang={lang} />
          <SelecteurLangue lang={lang} onChange={setLang} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="grid gap-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{UI.situationMenage[lang]}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormulaireMenage etat={etat} onChange={setEtat} lang={lang} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{UI.parametres[lang]}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="a">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="a" className="flex-1">{`${UI.scenarioA[lang]} (${anneeA})`}</TabsTrigger>
                  <TabsTrigger value="b" className="flex-1">{`${UI.scenarioB[lang]} (${anneeB})`}</TabsTrigger>
                </TabsList>
                <TabsContent value="a">
                  <PanneauParametres annee={anneeA} bundle={bundleA} onAnnee={changerAnneeA} onBundle={setBundleA} lang={lang} />
                </TabsContent>
                <TabsContent value="b">
                  <PanneauParametres annee={anneeB} bundle={bundleB} onAnnee={changerAnneeB} onBundle={setBundleB} lang={lang} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
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
    </div>
  );
}
