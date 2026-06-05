// Bundle de TOUS les paramètres socio-fiscaux d'une année — pour permettre des scénarios
// « sur mesure » (modifier un paramètre et recalculer). Les fonctions des postes acceptent
// `Annee | Parametres` : un numéro d'année ⇒ préréglage officiel ; un bundle ⇒ paramètres fournis.

import type { Annee, Palier } from "./socle";
import { RRQ, type ParamsRRQ } from "./postes/01-rrq";
import { RQAP, type ParamsRQAP } from "./postes/02-rqap";
import { AE, type ParamsAE } from "./postes/03-ae";
import { FSS, type ParamsFSS } from "./postes/04-fss";
import { RAMQ, type ParamsRAMQ } from "./postes/05-ramq";
import { GARDE, type ParamsGarde } from "./postes/06-garde";
import { ALLOCATION_FAMILLE, type ParamsAllocationFamille } from "./postes/07-allocation-famille";
import { PRIME_TRAVAIL, type ParamsPrimeTravail } from "./postes/08-prime-travail";
import { SOLIDARITE, type ParamsSolidarite } from "./postes/09-solidarite";
import { ALLOCATION_LOGEMENT, type ParamsAllocationLogement } from "./postes/10-allocation-logement";
import { SOUTIEN_AINES, type ParamsSoutienAines } from "./postes/11-soutien-aines";
import { FRAIS_MEDICAUX, type ParamsFraisMedicaux } from "./postes/12-frais-medicaux";
import { AIDE_SOCIALE, type ParamsAideSociale } from "./postes/13-aide-sociale";
import { ACE, type ParamsACE } from "./postes/14-allocation-canadienne-enfants";
import { TPS, type ParamsTPS } from "./postes/15-credit-tps";
import { ACT, type ParamsACT } from "./postes/16-allocation-travailleurs";
import { PSV, type ParamsPSV } from "./postes/17-securite-vieillesse";
import { SUPPLEMENT_MEDICAL, type ParamsSupplementMedical } from "./postes/18-supplement-medical-federal";
import { IMPOT_QUEBEC, IMPOT_FEDERAL, type ParamsImpotQuebec, type ParamsImpotFederal } from "./postes/19-impot";
import { PALIERS_QC, PALIERS_FEDERAL } from "./impot/parametres";

/** Facteur d'ajustement du revenu pour l'allocation-logement (pensions, c2M241/c2M242). */
export const FACTEUR_AL: Record<Annee, { seul: number; couple: number }> = {
  2025: { seul: 0.0496305081653133, couple: 0.0496840465993831 },
  2026: { seul: 0.0389070256249721, couple: 0.0389042222091726 },
};

/** Ensemble complet des paramètres d'un scénario (une « année », officielle ou modifiée). */
export interface Parametres {
  rrq: ParamsRRQ;
  rqap: ParamsRQAP;
  ae: ParamsAE;
  fss: ParamsFSS;
  ramq: ParamsRAMQ;
  garde: ParamsGarde;
  allocationFamille: ParamsAllocationFamille;
  primeTravail: ParamsPrimeTravail;
  solidarite: ParamsSolidarite;
  allocationLogement: ParamsAllocationLogement;
  soutienAines: ParamsSoutienAines;
  fraisMedicaux: ParamsFraisMedicaux;
  aideSociale: ParamsAideSociale;
  ace: ParamsACE;
  tps: ParamsTPS;
  act: ParamsACT;
  psv: ParamsPSV;
  supplementMedical: ParamsSupplementMedical;
  impotQuebec: ParamsImpotQuebec;
  impotFederal: ParamsImpotFederal;
  paliersQuebec: Palier[];
  paliersFederal: Palier[];
  facteurAL: { seul: number; couple: number };
}

/** Préréglages officiels : le bundle complet pour chaque année vérifiée. */
export const PARAMETRES_OFFICIELS: Record<Annee, Parametres> = {
  2025: bundle(2025),
  2026: bundle(2026),
};

function bundle(a: Annee): Parametres {
  return {
    rrq: RRQ[a],
    rqap: RQAP[a],
    ae: AE[a],
    fss: FSS[a],
    ramq: RAMQ[a],
    garde: GARDE[a],
    allocationFamille: ALLOCATION_FAMILLE[a],
    primeTravail: PRIME_TRAVAIL[a],
    solidarite: SOLIDARITE[a],
    allocationLogement: ALLOCATION_LOGEMENT[a],
    soutienAines: SOUTIEN_AINES[a],
    fraisMedicaux: FRAIS_MEDICAUX[a],
    aideSociale: AIDE_SOCIALE[a],
    ace: ACE[a],
    tps: TPS[a],
    act: ACT[a],
    psv: PSV[a],
    supplementMedical: SUPPLEMENT_MEDICAL[a],
    impotQuebec: IMPOT_QUEBEC[a],
    impotFederal: IMPOT_FEDERAL[a],
    paliersQuebec: PALIERS_QC[a],
    paliersFederal: PALIERS_FEDERAL[a],
    facteurAL: FACTEUR_AL[a],
  };
}
