"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { calculerRevenuDisponible, PARAMETRES_OFFICIELS, type Annee, type Parametres } from "@/index";
import { UI, type Lang } from "@/lib/i18n";
import { useLangue } from "@/components/lang-provider";
import { MENAGE_DEFAUT, versMenage, type MenageEtat } from "@/lib/menage-etat";
import { encoderBudget, decoderBudget, diffParams } from "@/lib/partage";
import { usePartageURL } from "@/lib/use-partage-url";
import { FormulaireMenage } from "@/components/formulaire-menage";
import { TableauResultats } from "@/components/tableau-resultats";
import { EditeurParametres } from "@/components/editeur-parametres";
import { BoutonsExport } from "@/components/boutons-export";
import { specBudget, labelJeu } from "@/lib/export-resultats";
import { AssistantChat, BoutonAssistant } from "@/components/assistant/assistant-chat";
import { EspaceTravail, BarreSuperieure } from "@/components/espace-travail";
import { BoutonEnregistrer } from "@/components/compte/bouton-enregistrer";
import { MenagePicker } from "@/components/menage-picker";
import { JeuPicker, cleOfficiel } from "@/components/jeu-picker";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const cloner = (a: Annee): Parametres => structuredClone(PARAMETRES_OFFICIELS[a]);

/** Un côté de la comparaison de paramètres : sélection d'un jeu + édition + réinitialisation. */
function PanneauParametres({
  cle,
  annee,
  bundle,
  onChoisir,
  onBundle,
  lang,
}: {
  cle: string;
  annee: Annee;
  bundle: Parametres;
  onChoisir: (cle: string, bundle: Parametres, annee: Annee) => void;
  onBundle: (b: Parametres) => void;
  lang: Lang;
}) {
  return (
    <div className="grid gap-4">
      <JeuPicker
        lang={lang}
        valeur={cle}
        onCharger={onChoisir}
        bundleCourant={bundle}
        anneeCourante={annee}
        avecEnregistrer
        label={UI.selectJeu[lang]}
      />
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => onBundle(cloner(annee))} className="gap-1.5">
          <RotateCcw className="size-4" />
          {UI.reinitialiser[lang]}
        </Button>
      </div>
      <EditeurParametres bundle={bundle} officiel={PARAMETRES_OFFICIELS[annee]} onChange={onBundle} lang={lang} />
    </div>
  );
}

export function Budget() {
  const { lang, setLang } = useLangue();
  const [etat, setEtat] = useState<MenageEtat>(MENAGE_DEFAUT);
  const [anneeA, setAnneeA] = useState<Annee>(2025);
  const [bundleA, setBundleA] = useState<Parametres>(() => cloner(2025));
  const [cleA, setCleA] = useState<string>(cleOfficiel(2025));
  const [anneeB, setAnneeB] = useState<Annee>(2026);
  const [bundleB, setBundleB] = useState<Parametres>(() => cloner(2026));
  const [cleB, setCleB] = useState<string>(cleOfficiel(2026));

  const choisirA = (cle: string, b: Parametres, a: Annee) => {
    setCleA(cle);
    setBundleA(b);
    setAnneeA(a);
  };
  const choisirB = (cle: string, b: Parametres, a: Annee) => {
    setCleB(cle);
    setBundleB(b);
    setAnneeB(a);
  };

  const encoded = useMemo(
    () => encoderBudget({ etat, anneeA, bundleA, anneeB, bundleB }),
    [etat, anneeA, bundleA, anneeB, bundleB],
  );
  const onCharger = useCallback((s: string) => {
    const d = decoderBudget(s);
    if (!d) return;
    setEtat(d.etat);
    setAnneeA(d.anneeA);
    setBundleA(d.bundleA);
    setCleA(cleOfficiel(d.anneeA));
    setAnneeB(d.anneeB);
    setBundleB(d.bundleB);
    setCleB(cleOfficiel(d.anneeB));
  }, []);
  usePartageURL(encoded, onCharger);

  const menage = useMemo(() => versMenage(etat), [etat]);
  const rA = useMemo(() => calculerRevenuDisponible(menage, bundleA), [menage, bundleA]);
  const rB = useMemo(() => calculerRevenuDisponible(menage, bundleB), [menage, bundleB]);

  // Écarts de chaque jeu vs officiel : libellés d'export + contexte de l'assistant.
  const diffA = useMemo(() => diffParams(bundleA, PARAMETRES_OFFICIELS[anneeA]), [bundleA, anneeA]);
  const diffB = useMemo(() => diffParams(bundleB, PARAMETRES_OFFICIELS[anneeB]), [bundleB, anneeB]);

  return (
    <EspaceTravail
      lang={lang}
      tailleGauche="34%"
      assistant={
        <AssistantChat
          lang={lang}
          api="/api/assistant-scenarios"
          corps={{
            mode: "parametres",
            menageA: etat,
            jeuA: { annee: anneeA, diff: diffA },
            jeuB: { annee: anneeB, diff: diffB },
            lang,
          }}
          intro={UI.assistantScenariosIntro[lang]}
          actionsRapides={[UI.assistantScenariosQ1[lang], UI.assistantScenariosQ2[lang]]}
          demoPossible
        />
      }
      header={
        <BarreSuperieure
          lang={lang}
          onLang={setLang}
          titre={UI.budgetTitre[lang]}
          sousTitre={UI.budgetDesc[lang]}
          nav={
            <>
              <Link href="/" className="underline-offset-4 hover:underline">← {UI.navCalculateur[lang]}</Link>
              <Link href="/comparaison" className="underline-offset-4 hover:underline">{UI.navComparaison[lang]}</Link>
              <Link href="/bibliotheque" className="underline-offset-4 hover:underline">{UI.navBibliotheque[lang]}</Link>
            </>
          }
          actions={<BoutonEnregistrer type="BUDGET" encoded={encoded} lang={lang} />}
        />
      }
      gauche={{
        titre: UI.voletMenageParametres[lang],
        contenu: (
          <div className="divide-y">
            <div className="px-5 py-5">
              <h3 className="mb-3 text-sm font-semibold">{UI.situationMenage[lang]}</h3>
              <div className="grid gap-4">
                <MenagePicker lang={lang} etatCourant={etat} onCharger={setEtat} />
                <FormulaireMenage etat={etat} onChange={setEtat} lang={lang} />
              </div>
            </div>
            <div className="px-5 py-5">
              <h3 className="mb-3 text-sm font-semibold">{UI.parametres[lang]}</h3>
              <Tabs defaultValue="a">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="a" className="flex-1">{`${UI.scenarioA[lang]} (${anneeA})`}</TabsTrigger>
                  <TabsTrigger value="b" className="flex-1">{`${UI.scenarioB[lang]} (${anneeB})`}</TabsTrigger>
                </TabsList>
                <TabsContent value="a">
                  <PanneauParametres cle={cleA} annee={anneeA} bundle={bundleA} onChoisir={choisirA} onBundle={setBundleA} lang={lang} />
                </TabsContent>
                <TabsContent value="b">
                  <PanneauParametres cle={cleB} annee={anneeB} bundle={bundleB} onChoisir={choisirB} onBundle={setBundleB} lang={lang} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ),
      }}
      central={{
        titre: UI.revenuDisponible[lang],
        actions: (
          <div className="flex items-center gap-2">
            <BoutonAssistant lang={lang} />
            <BoutonsExport
              spec={specBudget(
                etat, rA, rB,
                anneeA, labelJeu(anneeA, Object.keys(diffA).length, lang),
                anneeB, labelJeu(anneeB, Object.keys(diffB).length, lang),
                lang,
              )}
              lang={lang}
            />
          </div>
        ),
        contenu: (
          <div className="px-5 py-5">
            <TableauResultats
              rGauche={rA}
              rDroite={rB}
              lang={lang}
              enteteGauche={`${UI.scenarioA[lang]} (${anneeA})`}
              enteteDroite={`${UI.scenarioB[lang]} (${anneeB})`}
            />
          </div>
        ),
      }}
    />
  );
}
