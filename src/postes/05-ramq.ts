// ===========================================================================
// Poste 5 — RAMQ (régime public d'assurance médicaments) — prime annuelle
// Sortie code : QC_ramq (total ménage). Aucune sortie _bonif.
// Base légale : Loi sur l'assurance médicaments (RLRQ, c. A-29.01), art. 10, 23, 24.
//   Prime calculée à l'annexe K (TP-1.D.K), reportée à la ligne 447 du TP-1.
// Sources : S11 (Revenu Québec — Annexe K + loi), S12 (RAMQ — tarifs/exonérations).
// Voir docs/revenu-disponible.md §5, Poste 5.
//
// Traçage : QC_ramq = c2T376 × (−1) [2025] / c2S376 × (−1) [2026].
//   c2T376 = round( (exonéré₁ ? 0 : c2T375) + (couple ? (exonéré₂ ? 0 : c2T375) : 0), 2)
//   c2T375 = min( taux₁ × min(5000, base) + taux₂ × max(0, base − 5000), primeMax )
//   base   = max(0, revenuFamilialNet − exonération[nbAdultes][nbEnfants])
//   La prime par adulte (c2T375) est commune au couple → un couple paie 2 × c2T375
//   (barème « avec conjoint », à demi-taux). Le code stocke le total en négatif.
//
// Convention de colonnes du modèle : pour l'année civile Y, le modèle prend le
// barème de la PÉRIODE TARIFAIRE en cours au 1ᵉʳ janvier (les taux et la prime max
// changent le 1ᵉʳ juillet ; la période en cours a débuté en juillet Y−1) ET les
// SEUILS d'exonération indexés pour l'année Y (indexation du 1ᵉʳ janvier). D'où :
//   2025 → barème période juill. 2024–juin 2025 (Annexe K 2024) + seuils 2025 (Annexe K 2025) ;
//   2026 → barème période juill. 2025–juin 2026 (Annexe K 2025) + seuils 2026 (indexés).
// ===========================================================================

import { Annee, Menage, SITUATIONS } from "../socle";

/** Barème à deux tranches de la prime, selon le nombre d'adultes du ménage. */
export interface BaremeRAMQ {
  tranche1: number; // taux sur la 1ʳᵉ tranche (les premiers 5 000 $ au-dessus de l'exonération)
  tranche2: number; // taux sur l'excédent
}

export interface ParamsRAMQ {
  primeMax: number; // prime maximale par adulte ($)
  largeurTranche1: number; // largeur de la 1ʳᵉ tranche de revenu ($)
  /** Barème selon le nombre d'adultes (1 = sans conjoint ; 2 = avec conjoint, à demi-taux). */
  taux: Record<1 | 2, BaremeRAMQ>;
  /** Seuil d'exonération [0 enfant, 1 enfant, 2 enfants ou plus] selon le nombre d'adultes. */
  exemption: Record<1 | 2, [number, number, number]>;
}

export const RAMQ: Record<Annee, ParamsRAMQ> = {
  // Barème : Annexe K 2024 (période juill. 2024–juin 2025). Seuils : Annexe K 2025.
  2025: {
    primeMax: 744,
    largeurTranche1: 5000,
    taux: {
      1: { tranche1: 0.0765, tranche2: 0.1148 },
      2: { tranche1: 0.0384, tranche2: 0.0575 },
    },
    exemption: {
      1: [19_890, 32_240, 36_460],
      2: [32_240, 36_460, 40_360],
    },
  },
  // Barème : Annexe K 2025 (période juill. 2025–juin 2026). Seuils : indexés 2026 (⚠️ Annexe K 2026 non publiée).
  2026: {
    primeMax: 766,
    largeurTranche1: 5000,
    taux: {
      1: { tranche1: 0.0784, tranche2: 0.1176 },
      2: { tranche1: 0.0393, tranche2: 0.0589 },
    },
    exemption: {
      1: [20_290, 32_890, 37_195],
      2: [32_890, 37_195, 41_175],
    },
  },
};

/**
 * Prime RAMQ d'un adulte, fonction du REVENU FAMILIAL NET (somme des lignes 275
 * des adultes du ménage). Deux tranches additives au-dessus de l'exonération,
 * le total étant plafonné à la prime maximale.
 */
export function primeRAMQparAdulte(
  revenuFamilialNet: number,
  nbAdultes: 1 | 2,
  nbEnfants: number,
  annee: Annee,
): number {
  const p = RAMQ[annee];
  const exemption = p.exemption[nbAdultes][Math.min(Math.max(nbEnfants, 0), 2)];
  const base = Math.max(0, revenuFamilialNet - exemption);
  const { tranche1, tranche2 } = p.taux[nbAdultes];
  const prime =
    tranche1 * Math.min(p.largeurTranche1, base) + // 1ʳᵉ tranche (jusqu'à 5 000 $)
    tranche2 * Math.max(0, base - p.largeurTranche1); // 2ᵉ tranche (excédent)
  return Math.min(prime, p.primeMax); // plafonnée à la prime maximale par adulte
}

/**
 * Prime RAMQ du ménage (= QC_ramq).
 *
 * Chaque adulte paie la prime calculée sur le revenu familial net commun ; un
 * couple paie donc 2 × la prime (barème « avec conjoint », à demi-taux). Le
 * revenu familial net doit être fourni (somme des lignes 275 des adultes), car
 * il est produit par le calcul d'impôt en aval (non encore construit).
 *
 * ⚠️ Exonérations individuelles non appliquées ici (un adulte ne paie pas la
 * prime s'il reçoit une aide financière de dernier recours, ou s'il a 65 ans ou
 * plus et touche le SRG maximal — ou ≥ 94 % de celui-ci). Ces conditions
 * dépendent de postes non encore construits (aide sociale ; PSV/SRG, poste 17).
 */
export function ramqMenage(menage: Menage, revenuFamilialNet: number, annee: Annee): number {
  const { nbAdultes } = SITUATIONS[menage.situation];
  const parAdulte = primeRAMQparAdulte(revenuFamilialNet, nbAdultes, menage.enfants.length, annee);
  return parAdulte * nbAdultes;
}
