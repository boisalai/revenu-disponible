// ===========================================================================
// Poste 16 — Allocation canadienne pour les travailleurs (ACT / Canada Workers Benefit)
//   — version reconfigurée pour le Québec.
// Sortie code : CA_pfrt (montant annuel du ménage). Aucune sortie _bonif.
// Base légale : Loi de l'impôt sur le revenu (LRC 1985, ch. 1 (5e suppl.)), art. 122.7 ;
//   reconfiguration Québec par entente Canada-Québec. Crédit remboursable de l'ARC.
// Sources : S23 (Agence du revenu du Canada — montants du Québec, taux, seuils).
// Voir docs/revenu-disponible.md §5, Poste 16.
//
// Traçage : CA_pfrt = c2T188 (2025) / c2S188 (2026) = arr2xD66D71[3][0] = arr2xT406T411[3][0] (l. 23025, 23008).
//   c2T188 = round( max(0, phaseIn − phaseOut) , 2)
//     phaseIn  = min( tauxPhaseIn × max(0, revenuTravail − exclusion) , primeMax )      (arr2xT183T186)
//     phaseOut = max(0, (AFNI − exemption2eRevenu) − seuilReduction) × 20 %             (c2T187)
//   4 types de ménage (1/2 adultes × sans/avec enfants) ; AFNI = c2T124 = revenu net rajusté FÉDÉRAL.
//
// ⚠️ Poste-intrant inverse : l'AFNI **inclut l'aide sociale** (poste 13) → CA_pfrt dépend de QC_adr.
//   Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).
// ===========================================================================

import { Annee, Menage, SITUATIONS } from "../socle";

export interface ParamsTypeACT {
  tauxPhaseIn: number; // taux d'accumulation sur le revenu de travail
  primeMax: number; // accumulation maximale ($)
  seuilReduction: number; // seuil de réduction (AFNI) ($)
}

export interface ParamsACT {
  exclusionSeul: number; // revenu de travail exclu (phase-in) — 1 adulte ($)
  exclusionCouple: number; // 2 adultes ($)
  tauxReduction: number; // taux de réduction
  exemptionSecondRevenu: number; // exemption du revenu de travail du conjoint à plus faible revenu ($)
  /** Paramètres par nombre d'adultes, puis selon la présence d'enfants. */
  parType: Record<1 | 2, { sansEnfants: ParamsTypeACT; avecEnfants: ParamsTypeACT }>;
}

export const ACT: Record<Annee, ParamsACT> = {
  2025: {
    exclusionSeul: 2400,
    exclusionCouple: 3600,
    tauxReduction: 0.2,
    exemptionSecondRevenu: 16_386,
    parType: {
      1: {
        sansEnfants: { tauxPhaseIn: 0.373, primeMax: 3812.06, seuilReduction: 14_170.05 },
        avecEnfants: { tauxPhaseIn: 0.2, primeMax: 2044, seuilReduction: 14_341.56 },
      },
      2: {
        sansEnfants: { tauxPhaseIn: 0.373, primeMax: 5943.38, seuilReduction: 21_787.19 },
        avecEnfants: { tauxPhaseIn: 0.239, primeMax: 3808.23, seuilReduction: 22_007.75 },
      },
    },
  },
  2026: {
    exclusionSeul: 2400,
    exclusionCouple: 3600,
    tauxReduction: 0.2,
    exemptionSecondRevenu: 16_714,
    parType: {
      1: {
        sansEnfants: { tauxPhaseIn: 0.373, primeMax: 3882.18, seuilReduction: 14_484.06 },
        avecEnfants: { tauxPhaseIn: 0.2, primeMax: 2081.6, seuilReduction: 14_644.79 },
      },
      2: {
        sansEnfants: { tauxPhaseIn: 0.373, primeMax: 6053.04, seuilReduction: 22_268.97 },
        avecEnfants: { tauxPhaseIn: 0.239, primeMax: 3878.49, seuilReduction: 22_477.43 },
      },
    },
  },
};

/**
 * Allocation canadienne pour les travailleurs (= CA_pfrt), montant annuel. La prime **croît** sur
 * le revenu de travail au-delà d'un montant exclu, jusqu'à un maximum ; puis elle est **réduite**
 * de 20 % du revenu familial net rajusté (diminué de l'exemption du second revenu) excédant un seuil.
 *
 * @param revenuTravail revenu de travail total du ménage (sert à l'accumulation)
 * @param revenuTravailMoindre revenu de travail du conjoint à plus faible revenu (0 si 1 adulte)
 * @param revenuFamilialNetAjuste AFNI fédéral (inclut l'aide sociale ; produit par le calcul d'impôt)
 */
export function allocationTravailleurs(
  revenuTravail: number,
  revenuTravailMoindre: number,
  revenuFamilialNetAjuste: number,
  nbAdultes: 1 | 2,
  aDesEnfants: boolean,
  annee: Annee,
): number {
  const p = ACT[annee];
  const t = p.parType[nbAdultes][aDesEnfants ? "avecEnfants" : "sansEnfants"];
  const exclusion = nbAdultes === 2 ? p.exclusionCouple : p.exclusionSeul;
  const phaseIn = Math.min(Math.max(0, revenuTravail - exclusion) * t.tauxPhaseIn, t.primeMax);
  const exemption = Math.min(p.exemptionSecondRevenu, revenuTravailMoindre);
  const phaseOut = Math.max(0, revenuFamilialNetAjuste - exemption - t.seuilReduction) * p.tauxReduction;
  return Math.round(Math.max(0, phaseIn - phaseOut) * 100) / 100;
}

/** Allocation canadienne pour les travailleurs du ménage (= CA_pfrt). */
export function allocationTravailleursMenage(
  menage: Menage,
  revenuFamilialNetAjuste: number,
  annee: Annee,
): number {
  const { nbAdultes } = SITUATIONS[menage.situation];
  const r1 = menage.revenu1;
  const r2 = nbAdultes === 2 ? menage.revenu2 : 0;
  return allocationTravailleurs(
    r1 + r2,
    Math.min(r1, r2),
    revenuFamilialNetAjuste,
    nbAdultes,
    menage.enfants.length > 0,
    annee,
  );
}
