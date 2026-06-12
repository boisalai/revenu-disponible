"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { calculerRevenuDisponible } from "@/index";
import { UI } from "@/lib/i18n";
import { useLangue } from "@/components/lang-provider";
import { MENAGE_DEFAUT, versMenage, type MenageEtat } from "@/lib/menage-etat";
import { encoderMenage, decoderMenage } from "@/lib/partage";
import { usePartageURL } from "@/lib/use-partage-url";
import { FormulaireMenage } from "@/components/formulaire-menage";
import { CasTypes } from "@/components/cas-types";
import { TableauResultats } from "@/components/tableau-resultats";
import { BoutonsExport } from "@/components/boutons-export";
import { AssistantChat, BoutonAssistant } from "@/components/assistant/assistant-chat";
import { EspaceTravail, BarreSuperieure } from "@/components/espace-travail";
import { GraphiqueTauxMarginal } from "@/components/graphique-taux-marginal";
import { SeuilsBascule } from "@/components/seuils-bascule";
import { BoutonEnregistrer } from "@/components/compte/bouton-enregistrer";

export function Calculateur() {
  const { lang, setLang } = useLangue();
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
    <EspaceTravail
      lang={lang}
      tailleGauche="22%"
      assistant={
        <AssistantChat
          lang={lang}
          api="/api/assistant"
          corps={{ menage: etat, lang }}
          intro={UI.assistantIntro[lang]}
          actionsRapides={[UI.assistantQ1[lang], UI.assistantQ2[lang]]}
          demoPossible
        />
      }
      header={
        <BarreSuperieure
          lang={lang}
          onLang={setLang}
          titre={UI.titre[lang]}
          sousTitre={UI.sousTitre[lang]}
          nav={
            <>
              <Link href="/comparaison" className="underline-offset-4 hover:underline">{UI.navComparaison[lang]}</Link>
              <Link href="/budget" className="underline-offset-4 hover:underline">{UI.navBudget[lang]}</Link>
              <Link href="/bibliotheque" className="underline-offset-4 hover:underline">{UI.navBibliotheque[lang]}</Link>
            </>
          }
          actions={<BoutonEnregistrer type="CALCULATEUR" encoded={encoded} lang={lang} />}
        />
      }
      gauche={{
        titre: UI.situationMenage[lang],
        contenu: (
          <div className="space-y-5 px-5 py-5">
            <CasTypes lang={lang} onCharger={setEtat} />
            <FormulaireMenage etat={etat} onChange={setEtat} lang={lang} />
          </div>
        ),
      }}
      central={{
        titre: UI.revenuDisponible[lang],
        actions: (
          <div className="flex items-center gap-2">
            <BoutonAssistant lang={lang} />
            <BoutonsExport etat={etat} r25={r25} r26={r26} lang={lang} />
          </div>
        ),
        contenu: (
          <>
            <div className="px-5 py-5">
              <TableauResultats rGauche={r25} rDroite={r26} lang={lang} enteteGauche="2025" enteteDroite="2026" />
            </div>
            <div className="border-t px-5 py-5">
              <h3 className="text-base font-semibold">{UI.seuilsTitre[lang]}</h3>
              <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">{UI.seuilsDesc[lang]}</p>
              <div className="mt-4">
                <SeuilsBascule menage={menage} revenuActuel={etat.revenu1} lang={lang} />
              </div>
            </div>
            <div className="border-t px-5 py-5">
              <h3 className="text-base font-semibold">{UI.tauxMarginalTitre[lang]}</h3>
              <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">{UI.tauxMarginalDesc[lang]}</p>
              <div className="mt-4">
                <GraphiqueTauxMarginal menage={menage} annee={2025} revenuActuel={etat.revenu1} lang={lang} />
              </div>
            </div>
          </>
        ),
      }}
    />
  );
}
