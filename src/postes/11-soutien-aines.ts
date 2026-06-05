// ===========================================================================
// Poste 11 — Crédit d'impôt pour soutien aux aînés (« Montant pour le soutien des aînés »)
// Sortie code : QC_aines (crédit du ménage). Aucune sortie _bonif.
// Base légale : Loi sur les impôts (RLRQ, c. I-3) ; crédit remboursable de la ligne 463 du TP-1.
// Sources : S10 (MFQ Paramètres 2026 — seuils, taux), S18 (Revenu Québec — montant, admissibilité, loi).
// Voir docs/revenu-disponible.md §5, Poste 11.
//
// Traçage : QC_aines = c2T399 (2025) / c2S399 (2026) = arr2xD59D62[3][0] (lignes 23123-23124, 23140-23141, 23233).
//   c2T399 = (1 adulte) ? c2T397 : c2T398
//     c2T397 = (1 adulte ET âge1 ≥ 70) ? max(0, montantMax − réduction) : 0
//     c2T398 = (2 adultes ET (âge1 ≥ 70 OU âge2 ≥ 70)) ? max(0, montantMax − réduction) : 0
//       montantMax = 2 000 $ par aîné admissible (couple où LES DEUX ont 70+ → 4 000 $)
//       réduction  = max(0, revenuFamilialNet − seuil) × taux ; seuil = seuilSeul (1 ad.) / seuilCouple (2 ad.)
//   Base de revenu : c2T392 = c2T271 = revenu familial net. Convention : 2025 = T (param. M) ; 2026 = S (param. L).
// ===========================================================================

import { Annee, Menage, SITUATIONS } from "../socle";
import type { Parametres } from "../parametres";

export interface ParamsSoutienAines {
  montantParAine: number; // montant maximal par aîné admissible ($)
  seuilSeul: number; // seuil de réduction — 1 adulte ($)
  seuilCouple: number; // seuil de réduction — 2 adultes ($)
  tauxReduction: number; // taux de réduction au-delà du seuil
  ageAdmissible: number; // âge ouvrant droit
}

export const SOUTIEN_AINES: Record<Annee, ParamsSoutienAines> = {
  2025: { montantParAine: 2000, seuilSeul: 27_835, seuilCouple: 45_270, tauxReduction: 0.054, ageAdmissible: 70 },
  2026: { montantParAine: 2000, seuilSeul: 28_405, seuilCouple: 46_200, tauxReduction: 0.0547, ageAdmissible: 70 },
};

/**
 * Crédit d'impôt pour soutien aux aînés (= QC_aines). Chaque adulte de 70 ans et plus ouvre droit
 * à un montant maximal (2 000 $ ; donc 4 000 $ pour un couple dont les deux conjoints sont admissibles),
 * réduit selon le revenu familial net au-delà d'un seuil. Plancher à 0.
 *
 * @param revenuFamilialNet revenu familial net (somme des lignes 275 ; même base que la RAMQ)
 * @param age2 âge de l'adulte 2 (ignoré si le ménage compte 1 adulte)
 */
export function montantSoutienAines(
  revenuFamilialNet: number,
  nbAdultes: 1 | 2,
  age1: number,
  age2: number,
  annee: Annee | Parametres,
): number {
  const p = (typeof annee === "number" ? SOUTIEN_AINES[annee] : annee.soutienAines);
  const nbAines = (age1 >= p.ageAdmissible ? 1 : 0) + (nbAdultes === 2 && age2 >= p.ageAdmissible ? 1 : 0);
  if (nbAines === 0) return 0; // aucun adulte de 70 ans et plus
  const montantMax = nbAines * p.montantParAine;
  const seuil = nbAdultes === 2 ? p.seuilCouple : p.seuilSeul;
  const reduction = Math.max(0, revenuFamilialNet - seuil) * p.tauxReduction;
  return Math.max(0, montantMax - reduction);
}

/** Crédit pour soutien aux aînés du ménage (= QC_aines). */
export function montantSoutienAinesMenage(menage: Menage, revenuFamilialNet: number, annee: Annee | Parametres): number {
  const { nbAdultes } = SITUATIONS[menage.situation];
  return montantSoutienAines(
    revenuFamilialNet,
    nbAdultes,
    menage.ageAdulte1,
    nbAdultes === 2 ? menage.ageAdulte2 : 0,
    annee,
  );
}
