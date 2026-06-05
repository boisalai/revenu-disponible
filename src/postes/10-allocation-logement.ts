// ===========================================================================
// Poste 10 — Programme Allocation-logement (Société d'habitation du Québec)
// Sortie code : QC_al (allocation du ménage). Aucune sortie _bonif.
// Base légale : programme de la Société d'habitation du Québec (Loi sur la SHQ,
//   RLRQ, c. S-8), administré par Revenu Québec ; paramètres fixés par décret.
// Sources : S17 (Revenu Québec / CFFP — montants, paliers d'effort, seuils, loi).
// Voir docs/revenu-disponible.md §5, Poste 10.
//
// Traçage : QC_al = c2T362 (2025) / c2S362 (2026) = arr2xD59D62[1][0] (lignes 23019-23020, 23132).
//   c2T362 = max(0, c2T359 − c2T361)
//     c2T359 = admissible ? (palier d'effort logement × 12) : 0
//       effort = round((loyer × 12) / revenuAL, 4) ; palier : <30 %→0, <50 %→100, <80 %→150, ≥80 %→170 $/mois
//     c2T361 = max(0, revenuAL − seuil) × 1   (réduction dollar pour dollar au-delà du seuil)
//   admissible (c2T353) = (un adulte ≥ 50 ans) OU (≥ 1 enfant à charge).
//   Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).
//
// ⚠️ Le programme réel utilise le LOYER RÉEL ; faute d'entrée « loyer », le modèle l'IMPUTE
//    selon la composition (loyerImpute ci-dessous — choix de modélisation, non réglementaire).
// ⚠️ Le revenu aux fins de l'AL (revenuAL = c2T357) vaut le revenu familial net pour les
//    non-aînés ; pour les 65 ans et plus, un ajustement (≈ revenu net − pensions × facteur)
//    s'applique (implique PSV/SRG, hors périmètre) → fourni en entrée.
// ===========================================================================

import { Annee, Menage, SITUATIONS } from "../socle";

export interface ParamsAllocationLogement {
  /** Loyer mensuel imputé par le modèle, par nombre d'adultes puis tranche d'enfants (0,1,2,3+). */
  loyerImpute: Record<1 | 2, number[]>;
  // Seuils de réduction du revenu ($) :
  seuilSeul0: number; // 1 adulte, 0 enfant
  seuilCouple0: number; // 2 adultes, 0 enfant
  seuilMoyen: number; // 1 adulte 1-2 enf. ; 2 adultes 1 enf.
  seuilHaut: number; // 1 adulte 3+ enf. ; 2 adultes 2+ enf.
  // Montants mensuels par palier d'effort logement ($) :
  montant30: number; // effort 30 % à < 50 %
  montant50: number; // effort 50 % à < 80 %
  montant80: number; // effort ≥ 80 %
  ageAdmissible: number; // âge ouvrant droit (sans enfant)
}

export const ALLOCATION_LOGEMENT: Record<Annee, ParamsAllocationLogement> = {
  2025: {
    loyerImpute: { 1: [856, 1002, 1131, 1380], 2: [1002, 1131, 1380] },
    seuilSeul0: 22_400,
    seuilCouple0: 31_500,
    seuilMoyen: 38_700,
    seuilHaut: 44_600,
    montant30: 100,
    montant50: 150,
    montant80: 170,
    ageAdmissible: 50,
  },
  2026: {
    loyerImpute: { 1: [856, 1002, 1131, 1380], 2: [1002, 1131, 1380] }, // loyers imputés non indexés
    seuilSeul0: 22_900,
    seuilCouple0: 32_100, // ⚠️ le guide CFFP affiche 32 200 $ (écart de 100 $ — à reconfirmer)
    seuilMoyen: 39_500,
    seuilHaut: 45_500,
    montant30: 100,
    montant50: 150,
    montant80: 170,
    ageAdmissible: 50,
  },
};

function loyerImpute(nbAdultes: 1 | 2, nbEnfants: number, p: ParamsAllocationLogement): number {
  const table = p.loyerImpute[nbAdultes];
  return table[Math.min(nbEnfants, table.length - 1)];
}

function seuilReduction(nbAdultes: 1 | 2, nbEnfants: number, p: ParamsAllocationLogement): number {
  if (nbEnfants === 0) return nbAdultes === 1 ? p.seuilSeul0 : p.seuilCouple0;
  if (nbAdultes === 1) return nbEnfants <= 2 ? p.seuilMoyen : p.seuilHaut; // 1-2 enf. → moyen ; 3+ → haut
  return nbEnfants === 1 ? p.seuilMoyen : p.seuilHaut; // 2 adultes : 1 enf. → moyen ; 2+ → haut
}

/**
 * Allocation-logement (= QC_al). Le ménage admissible (un adulte ≥ 50 ans ou un enfant à
 * charge) reçoit un montant mensuel selon son taux d'effort logement (loyer imputé / revenu),
 * réduit dollar pour dollar du revenu excédant un seuil. Plancher à 0.
 *
 * @param revenuAL revenu aux fins de l'AL (= revenu familial net pour les non-aînés ; voir ⚠️ en tête)
 * @param ageMaxAdulte âge le plus élevé parmi les adultes présents
 */
export function allocationLogement(
  revenuAL: number,
  ageMaxAdulte: number,
  nbAdultes: 1 | 2,
  nbEnfants: number,
  annee: Annee,
): number {
  const p = ALLOCATION_LOGEMENT[annee];
  const admissible = ageMaxAdulte >= p.ageAdmissible || nbEnfants > 0;
  if (!admissible) return 0;
  const loyer = loyerImpute(nbAdultes, nbEnfants, p);
  const effort = Math.round(((loyer * 12) / revenuAL) * 10_000) / 10_000; // arrondi à 4 décimales (comme le code)
  const mensuel = effort < 0.3 ? 0 : effort < 0.5 ? p.montant30 : effort < 0.8 ? p.montant50 : p.montant80;
  const reduction = Math.max(0, revenuAL - seuilReduction(nbAdultes, nbEnfants, p));
  return Math.max(0, mensuel * 12 - reduction);
}

/** Allocation-logement du ménage (= QC_al). */
export function allocationLogementMenage(menage: Menage, revenuAL: number, annee: Annee): number {
  const { nbAdultes } = SITUATIONS[menage.situation];
  const ageMaxAdulte = Math.max(menage.ageAdulte1, nbAdultes === 2 ? menage.ageAdulte2 : 0);
  return allocationLogement(revenuAL, ageMaxAdulte, nbAdultes, menage.enfants.length, annee);
}
