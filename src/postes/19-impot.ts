// ===========================================================================
// Poste 19 — Impôt sur le revenu des particuliers (ASSEMBLAGE)
// Sorties code : QC_impot, CA_impot (impôt du ménage, par année).
// Base légale : Loi de l'impôt sur le revenu (LRC 1985, ch. 1 (5ᵉ suppl.)) — fédéral ;
//   Loi sur les impôts (RLRQ, c. I-3) — Québec. Abattement du Québec : art. 120(2) LIR.
// Sources : S1 (Revenu Québec — paramètres), S2 (ARC — paramètres), S26 (montants des crédits).
// Voir docs/revenu-disponible.md §5, Poste 19.
//
// ⚠️ CONSTRUCTION PAR COUCHES (parité vérifiée à chaque étape) :
//   COUCHE 1 (faite) — IMPÔT FÉDÉRAL, ménages à 1 adulte (actifs + retraités).  ← ce fichier
//   COUCHE 2 (à venir) — crédits du QUÉBEC (impôt québécois).
//   COUCHE 3 (à venir) — COUPLES : montant pour conjoint, transferts de crédits, PSV conjointe.
//
// Traçage (fédéral, adulte 1) :
//   c2T122 = round(c2T89 + c2T119, 2)                         → CA_impot (somme des adultes)
//   c2T89  = round(c2T87 − c2T87×0,165, 2) = round(impôt net × 0,835, 2)   → abattement QC (16,5 %)
//   c2T87  = max(0, c2T71 − c2T86)                            → impôt fédéral net
//   c2T71  = progressif(revenu imposable, paliers fédéraux)   → impôt brut
//   c2T86  = (Σ crédits) × taux du 1ᵉʳ palier                 → crédits non remboursables
//   revenu imposable = revenu + PSV imposable − RRQ supplémentaire (1 % + 4 %) − (SRG + supplément non imposables)
// ===========================================================================

import { Annee, Menage, Situation, SITUATIONS, impotProgressif } from "../socle";
import type { Parametres } from "../parametres";
import { cotisationRRQ } from "./01-rrq";
import { cotisationRQAP } from "./02-rqap";
import { cotisationAE } from "./03-ae";
import { securiteVieillesse, psvImposable } from "./17-securite-vieillesse";
import { PALIERS_FEDERAL, PALIERS_QC } from "../impot/parametres";

export interface ParamsImpotFederal {
  bpaBase: number; // montant personnel de base — partie de base ($)
  bpaBonif: number; // bonification du montant personnel de base ($)
  bpaBonifSeuil: number; // revenu net où la bonification commence à diminuer ($)
  bpaBonifPlafond: number; // revenu net où la bonification est nulle ($)
  ageMontant: number; // montant en raison de l'âge (65 ans et +) ($)
  ageSeuil: number; // seuil de réduction du montant en raison de l'âge ($)
  ageTaux: number; // taux de réduction du montant en raison de l'âge
  pensionMax: number; // montant maximal pour revenu de pension ($)
  emploiCanadaMax: number; // montant canadien pour emploi ($)
  abattementQc: number; // abattement du Québec (réduction de l'impôt fédéral)
}

export const IMPOT_FEDERAL: Record<Annee, ParamsImpotFederal> = {
  2025: { bpaBase: 14_538, bpaBonif: 1591, bpaBonifSeuil: 177_882, bpaBonifPlafond: 253_414, ageMontant: 9028, ageSeuil: 45_522, ageTaux: 0.15, pensionMax: 2000, emploiCanadaMax: 1471, abattementQc: 0.165 },
  2026: { bpaBase: 14_829, bpaBonif: 1623, bpaBonifSeuil: 181_440, bpaBonifPlafond: 258_482, ageMontant: 9208, ageSeuil: 46_432, ageTaux: 0.15, pensionMax: 2000, emploiCanadaMax: 1501, abattementQc: 0.165 },
};

/** Montant personnel de base fédéral, bonification incluse (diminuée dans la tranche d'imposition supérieure). */
function bpaFederal(revenuNet: number, p: ParamsImpotFederal): number {
  const reductionBonif =
    (p.bpaBonif * Math.max(0, Math.min(revenuNet, p.bpaBonifPlafond) - p.bpaBonifSeuil)) /
    (p.bpaBonifPlafond - p.bpaBonifSeuil);
  return p.bpaBase + Math.max(0, p.bpaBonif - reductionBonif);
}

const TAUX_FRAIS_MED = 0.03; // plancher du crédit médical fédéral (3 % du revenu net)

interface ComposantesFederales {
  taxable: number; // revenu imposable
  net: number; // revenu net (seuils, planchers)
  brut: number; // impôt brut
  horsAgePension: number; // crédits hors âge/pension (BPA + cotisations + emploi Canada), montants
  age: number; // montant en raison de l'âge
  pension: number; // montant pour revenu de pension
}

/** Composantes fédérales d'un adulte (revenus, impôt brut, crédits) — base commune seul/couple. */
function composantesFederales(revenu: number, age: number, retraite: boolean, annee: Annee | Parametres, deduction = 0): ComposantesFederales {
  const p = (typeof annee === "number" ? IMPOT_FEDERAL[annee] : annee.impotFederal);
  const rrq = retraite ? { base: 0, supplementaire: 0 } : cotisationRRQ(revenu, annee);
  const rqap = retraite ? 0 : cotisationRQAP(revenu, annee);
  const ae = retraite ? 0 : cotisationAE(revenu, annee);
  const psvImpos = psvImposable(age, revenu, annee); // PSV imposable (SRG/supplément exclus, non imposables)
  const net = revenu + psvImpos - rrq.supplementaire - deduction; // ≈ ligne 23600 ; déduction frais de garde incluse
  return {
    taxable: net,
    net,
    brut: impotProgressif(net, (typeof annee === "number" ? PALIERS_FEDERAL[annee] : annee.paliersFederal)),
    horsAgePension: bpaFederal(net, p) + rrq.base + rqap + ae + (retraite ? 0 : Math.min(p.emploiCanadaMax, revenu)),
    age: age >= 65 ? Math.max(0, p.ageMontant - p.ageTaux * Math.max(0, net - p.ageSeuil)) : 0,
    pension: retraite ? Math.min(p.pensionMax, revenu) : 0,
  };
}

/**
 * Impôt fédéral d'un adulte, après abattement du Québec (= `c2T89` / `c2T119`).
 * `revenu` est le revenu de travail (actif) ou de pension (retraité) selon `retraite`.
 * `proche` = vrai si l'adulte demande le **montant pour un proche admissible** (parent seul) —
 * un second montant personnel de base (ligne 30400), soumis à la même réduction de bonification.
 */
export function impotFederalAdulte(revenu: number, age: number, retraite: boolean, proche: boolean, annee: Annee | Parametres, deduction = 0): number {
  const p = (typeof annee === "number" ? IMPOT_FEDERAL[annee] : annee.impotFederal);
  const c = composantesFederales(revenu, age, retraite, annee, deduction);
  const credits = c.horsAgePension + c.age + c.pension + (proche ? bpaFederal(c.net, p) : 0);
  const impotNet = Math.max(0, c.brut - credits * (typeof annee === "number" ? PALIERS_FEDERAL[annee] : annee.paliersFederal)[0].taux);
  return Math.round(impotNet * (1 - p.abattementQc) * 100) / 100; // après abattement du Québec
}

/**
 * Impôt fédéral d'un couple (= `c2T89 + c2T119`). Mécanismes propres aux couples :
 *  (1) **montant pour conjoint** = `max(0, BPA − revenu imposable du conjoint)` ;
 *  (2) **transfert** de la partie inutilisée des montants d'âge + pension au conjoint ;
 *  (3) **crédit médical** du couple = `max(0, prime RAMQ − 3 % × revenu net)`, réclamé par celui qui
 *      en tire le plus, **plafonné à son impôt résiduel** (appliqué en dernier).
 * `ramqPremium` = prime d'assurance médicaments du ménage (poste 5).
 */
export function impotFederalCouple(
  revenu1: number, age1: number, revenu2: number, age2: number,
  retraite: boolean, ramqPremium: number, annee: Annee | Parametres, deduction = 0,
): number {
  const p = (typeof annee === "number" ? IMPOT_FEDERAL[annee] : annee.impotFederal);
  const taux = (typeof annee === "number" ? PALIERS_FEDERAL[annee] : annee.paliersFederal)[0].taux;
  // La déduction pour frais de garde est réclamée par le conjoint au revenu de travail le moins élevé.
  const c1 = composantesFederales(revenu1, age1, retraite, annee, revenu1 <= revenu2 ? deduction : 0);
  const c2 = composantesFederales(revenu2, age2, retraite, annee, revenu1 <= revenu2 ? 0 : deduction);

  // (1) Montant pour conjoint (l'un des deux seulement est non nul).
  const conjoint1 = Math.max(0, bpaFederal(c1.net, p) - c2.taxable);
  const conjoint2 = Math.max(0, bpaFederal(c2.net, p) - c1.taxable);
  const hors1 = c1.horsAgePension + conjoint1; // crédits hors âge/pension/médical
  const hors2 = c2.horsAgePension + conjoint2;

  // (2) Transfert de la partie inutilisée de l'âge + pension vers le conjoint (le plus grand transfert l'emporte).
  const transferable1 = Math.max(0, c1.age + c1.pension - Math.max(0, c1.taxable - hors1));
  const transferable2 = Math.max(0, c2.age + c2.pension - Math.max(0, c2.taxable - hors2));
  let cred1 = hors1 + c1.age + c1.pension;
  let cred2 = hors2 + c2.age + c2.pension;
  if (transferable2 >= transferable1) { cred1 += transferable2; cred2 -= transferable2; }
  else { cred2 += transferable1; cred1 -= transferable1; }

  // Impôt résiduel avant crédit médical.
  const preTax1 = Math.max(0, c1.brut - cred1 * taux);
  const preTax2 = Math.max(0, c2.brut - cred2 * taux);

  // (3) Crédit médical du couple, plafonné à l'impôt résiduel de chacun ; le plus grand l'emporte.
  const med1 = Math.min(Math.max(0, ramqPremium - TAUX_FRAIS_MED * c1.net), preTax1 / taux);
  const med2 = Math.min(Math.max(0, ramqPremium - TAUX_FRAIS_MED * c2.net), preTax2 / taux);
  const finalTax1 = preTax1 - (med1 >= med2 ? med1 : 0) * taux;
  const finalTax2 = preTax2 - (med2 > med1 ? med2 : 0) * taux;

  // Abattement du Québec : adulte 1 arrondi (c2T89), adulte 2 non arrondi (c2T119), puis somme arrondie.
  const a1 = Math.round(finalTax1 * (1 - p.abattementQc) * 100) / 100;
  const a2 = finalTax2 * (1 - p.abattementQc);
  return Math.round((a1 + a2) * 100) / 100;
}

/**
 * Impôt fédéral du ménage (= `CA_impot`), somme des adultes.
 * `ramqPremium` = prime RAMQ du ménage (poste 5), nécessaire au crédit médical des couples
 * (≡ 0 pour 1 adulte, où le crédit médical est toujours nul — voir poste 12).
 */
export function impotFederalMenage(menage: Menage, annee: Annee | Parametres, ramqPremium = 0, deductionGarde = 0): number {
  const { nbAdultes, retraite } = SITUATIONS[menage.situation];
  if (nbAdultes === 2) {
    return impotFederalCouple(menage.revenu1, menage.ageAdulte1, menage.revenu2, menage.ageAdulte2, retraite, ramqPremium, annee, deductionGarde);
  }
  const proche = menage.situation === Situation.FamilleMonoparentale; // parent seul → proche admissible
  return impotFederalAdulte(menage.revenu1, menage.ageAdulte1, retraite, proche, annee, deductionGarde);
}

// ---------------------------------------------------------------------------
// COUCHE 2 — Impôt du QUÉBEC (QC_impot)
// ---------------------------------------------------------------------------

export interface ParamsImpotQuebec {
  bpa: number; // montant personnel de base ($)
  deducTravailleurTaux: number; // taux de la déduction pour travailleur
  deducTravailleurMax: number; // plafond de la déduction pour travailleur ($)
  montantSeul: number; // montant pour personne vivant seule ($)
  ageMontant: number; // montant en raison de l'âge (65 ans et +) ($)
  pensionMax: number; // montant maximal pour revenus de retraite ($)
  reductionTaux: number; // taux de réduction du montant combiné (seul + âge + pension)
  reductionSeuil: number; // seuil de réduction (revenu net) ($)
  medicalTaux: number; // taux du crédit non remboursable pour frais médicaux (couples)
}

export const IMPOT_QUEBEC: Record<Annee, ParamsImpotQuebec> = {
  2025: { bpa: 18_571, deducTravailleurTaux: 0.06, deducTravailleurMax: 1420, montantSeul: 2128, ageMontant: 3906, pensionMax: 3470, reductionTaux: 0.1875, reductionSeuil: 42_090, medicalTaux: 0.20 },
  2026: { bpa: 18_952, deducTravailleurTaux: 0.06, deducTravailleurMax: 1450, montantSeul: 2172, ageMontant: 3986, pensionMax: 3541, reductionTaux: 0.1875, reductionSeuil: 42_955, medicalTaux: 0.20 },
};

/**
 * Impôt du Québec d'un adulte (= `c2T244` / `c2T269`).
 * `vivantSeul` = vrai si le ménage n'a qu'un adulte (ouvre le montant pour personne vivant seule).
 * Pas d'abattement (propre au fédéral). Les cotisations ne sont **pas** créditées au Québec dans
 * le modèle (la déduction pour travailleur en tient lieu) — voir docs.
 */
export function impotQuebecAdulte(revenu: number, age: number, retraite: boolean, vivantSeul: boolean, annee: Annee | Parametres): number {
  const p = (typeof annee === "number" ? IMPOT_QUEBEC[annee] : annee.impotQuebec);
  const tauxCredit = (typeof annee === "number" ? PALIERS_QC[annee] : annee.paliersQuebec)[0].taux; // crédits au taux du 1ᵉʳ palier (14 %)

  const rrqSuppl = retraite ? 0 : cotisationRRQ(revenu, annee).supplementaire;
  const psvImpos = psvImposable(age, revenu, annee);
  const caPsv = securiteVieillesse(age, 0, revenu, 0, 1, annee);
  const deducTravailleur = retraite ? 0 : Math.min(p.deducTravailleurTaux * revenu, p.deducTravailleurMax);

  const revenuNet = revenu + caPsv - deducTravailleur - rrqSuppl; // c2T271 (SRG/supplément inclus)
  const revenuImposable = revenu + psvImpos - deducTravailleur - rrqSuppl; // SRG/supplément retranchés

  const impotBrut = impotProgressif(revenuImposable, (typeof annee === "number" ? PALIERS_QC[annee] : annee.paliersQuebec));

  // Montant combiné (personne seule + âge + revenus de retraite), réduit de 18,75 % au-delà du seuil.
  const combine =
    (vivantSeul ? p.montantSeul : 0) +
    (age >= 65 ? p.ageMontant : 0) +
    (retraite ? Math.min(revenu, p.pensionMax) : 0);
  const combineReduit = Math.max(0, combine - p.reductionTaux * Math.max(0, revenuNet - p.reductionSeuil));

  const credits = (p.bpa + combineReduit) * tauxCredit;
  return Math.round(Math.max(0, impotBrut - credits) * 100) / 100;
}

/** Revenu imposable québécois d'un adulte (revenu + PSV imposable − déduction travailleur − RRQ suppl.). */
function imposableQuebec(revenu: number, age: number, retraite: boolean, p: ParamsImpotQuebec, annee: Annee | Parametres): number {
  const rrqSuppl = retraite ? 0 : cotisationRRQ(revenu, annee).supplementaire;
  const deduc = retraite ? 0 : Math.min(p.deducTravailleurTaux * revenu, p.deducTravailleurMax);
  return revenu + psvImposable(age, revenu, annee) - deduc - rrqSuppl;
}

/**
 * Impôt du Québec d'un couple (= `c2T244 + c2T269`). Particularités québécoises :
 *  (1) **adulte 1** réclame le montant combiné des DEUX conjoints (âge + revenus de retraite),
 *      réduit de 18,75 % du **revenu net familial** au-delà du seuil ; **adulte 2** n'a que le BPA ;
 *  (2) **crédit médical non remboursable** du couple = `max(0, prime RAMQ − 3 % × revenu net familial) × 20 %` ;
 *  (3) **transfert général** : la partie inutilisée des crédits d'un conjoint réduit l'impôt de l'autre.
 * `ramqPremium` = prime d'assurance médicaments du ménage (poste 5).
 */
export function impotQuebecCouple(
  revenu1: number, age1: number, revenu2: number, age2: number,
  retraite: boolean, ramqPremium: number, annee: Annee | Parametres,
): number {
  const p = (typeof annee === "number" ? IMPOT_QUEBEC[annee] : annee.impotQuebec);
  const taux = (typeof annee === "number" ? PALIERS_QC[annee] : annee.paliersQuebec)[0].taux; // 0,14
  const t1 = imposableQuebec(revenu1, age1, retraite, p, annee);
  const t2 = imposableQuebec(revenu2, age2, retraite, p, annee);
  const brut1 = impotProgressif(t1, (typeof annee === "number" ? PALIERS_QC[annee] : annee.paliersQuebec));
  const brut2 = impotProgressif(t2, (typeof annee === "number" ? PALIERS_QC[annee] : annee.paliersQuebec));
  const revenuNetFamilial = t1 + t2;

  // (1) Montant combiné (âge + pension des DEUX conjoints), réclamé par l'adulte 1.
  const montant = (revenu: number, age: number) =>
    (age >= 65 ? p.ageMontant : 0) + (retraite ? Math.min(revenu, p.pensionMax) : 0);
  const combine = Math.max(
    0,
    montant(revenu1, age1) + montant(revenu2, age2) - p.reductionTaux * Math.max(0, revenuNetFamilial - p.reductionSeuil),
  );
  // (2) Crédit médical non remboursable du couple (adulte 1).
  const medical = Math.max(0, ramqPremium - 0.03 * revenuNetFamilial) * p.medicalTaux;

  const credits1 = (p.bpa + combine) * taux + medical;
  const credits2 = p.bpa * taux;
  const pre1 = brut1 - credits1;
  const pre2 = brut2 - credits2;
  // (3) Transfert de la partie inutilisée des crédits vers le conjoint.
  const excedent1 = Math.max(0, -pre1);
  const excedent2 = Math.max(0, -pre2);
  const impot1 = Math.round(Math.max(0, pre1 - excedent2) * 100) / 100;
  const impot2 = Math.max(0, pre2 - excedent1);
  return Math.round((impot1 + impot2) * 100) / 100;
}

/**
 * Impôt du Québec du ménage (= `QC_impot`), somme des adultes.
 * `ramqPremium` = prime RAMQ du ménage (poste 5), nécessaire au crédit médical des couples
 * (≡ 0 pour 1 adulte).
 */
export function impotQuebecMenage(menage: Menage, annee: Annee | Parametres, ramqPremium = 0): number {
  const { nbAdultes, retraite } = SITUATIONS[menage.situation];
  if (nbAdultes === 2) {
    return impotQuebecCouple(menage.revenu1, menage.ageAdulte1, menage.revenu2, menage.ageAdulte2, retraite, ramqPremium, annee);
  }
  return impotQuebecAdulte(menage.revenu1, menage.ageAdulte1, retraite, true, annee);
}
