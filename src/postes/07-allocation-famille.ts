// ===========================================================================
// Poste 7 — Allocation famille (ancien « Soutien aux enfants ») — Retraite Québec
// Sortie code : QC_sae (allocation totale du ménage). Aucune sortie _bonif.
// Base légale : Loi sur les impôts (RLRQ, c. I-3), art. 1029.8.61.8 à 1029.8.61.60.
//   Prestation versée par Retraite Québec, modulée selon le revenu familial net (lignes 275).
// Sources : S10 (MFQ Paramètres 2026 — montants et seuils), S14 (Retraite Québec / CFFP — taux, structure, loi).
// Voir docs/revenu-disponible.md §5, Poste 7.
//
// Traçage : QC_sae = c2T326 (2025) / c2S326 (2026) = arr2xD53D58[2][0] (lignes 22761-22762, 23013-23014).
//   c2T326 = round( max(0, max( minimum , maximum − réduction )) , 2 )
//     maximum  = Σ_enfant montant max (arr2xT314T318) + supplément monoparental (si 1 adulte)
//     minimum  = Σ_enfant montant min (arr2xT321T325) + supplément monoparental min (si 1 adulte)
//     réduction = max(0, revenuFamilialNet − seuil) × 4 %   (c2T319 si 1 adulte ; c2T320 si 2 adultes)
//   Les montants max/min par enfant sont identiques quel que soit le rang de l'enfant.
//   Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).
// ===========================================================================

import { Annee, Menage, SITUATIONS } from "../socle";
import type { Parametres } from "../parametres";

export interface ParamsAllocationFamille {
  maxParEnfant: number; // montant maximal par enfant ($)
  minParEnfant: number; // montant minimal par enfant — versé à toutes les familles ($)
  suppMonoMax: number; // supplément pour famille monoparentale — maximum ($)
  suppMonoMin: number; // supplément pour famille monoparentale — minimum ($)
  seuilMonoparental: number; // seuil de réduction du revenu familial — 1 adulte ($)
  seuilCouple: number; // seuil de réduction du revenu familial — 2 adultes ($)
  tauxReduction: number; // taux de réduction au-delà du seuil
  supplementFournitures: number; // supplément pour fournitures scolaires, par enfant de 4-16 ans ($)
}

export const ALLOCATION_FAMILLE: Record<Annee, ParamsAllocationFamille> = {
  2025: {
    maxParEnfant: 3006,
    minParEnfant: 1196,
    suppMonoMax: 1055,
    suppMonoMin: 421,
    seuilMonoparental: 43_280,
    seuilCouple: 59_369,
    tauxReduction: 0.04,
    supplementFournitures: 124,
  },
  2026: {
    maxParEnfant: 3068,
    minParEnfant: 1221,
    suppMonoMax: 1077,
    suppMonoMin: 430,
    seuilMonoparental: 44_032,
    seuilCouple: 60_398,
    tauxReduction: 0.04,
    supplementFournitures: 127,
  },
};

/**
 * Allocation famille (= QC_sae). Le montant maximal (montants par enfant + supplément
 * monoparental) est réduit de 4 % du revenu familial net excédant le seuil applicable,
 * sans jamais descendre sous le montant minimal — lequel est versé à toutes les familles
 * admissibles, quel que soit le revenu.
 *
 * @param revenuFamilialNet revenu familial net (somme des lignes 275 des adultes ; même base que la RAMQ)
 * @param nbEnfants nombre d'enfants à charge (le modèle les suppose tous de moins de 18 ans)
 * @param nbAdultes 1 (famille monoparentale) ou 2 (couple)
 */
export function allocationFamille(
  revenuFamilialNet: number,
  nbEnfants: number,
  nbAdultes: 1 | 2,
  annee: Annee | Parametres,
): number {
  if (nbEnfants <= 0) return 0;
  const p = (typeof annee === "number" ? ALLOCATION_FAMILLE[annee] : annee.allocationFamille);
  const monoparental = nbAdultes === 1;
  const maximum = nbEnfants * p.maxParEnfant + (monoparental ? p.suppMonoMax : 0);
  const minimum = nbEnfants * p.minParEnfant + (monoparental ? p.suppMonoMin : 0);
  const seuil = monoparental ? p.seuilMonoparental : p.seuilCouple;
  const reduction = Math.max(0, revenuFamilialNet - seuil) * p.tauxReduction;
  return Math.round(Math.max(minimum, maximum - reduction) * 100) / 100;
}

/** Allocation famille du ménage (= QC_sae). */
export function allocationFamilleMenage(
  menage: Menage,
  revenuFamilialNet: number,
  annee: Annee | Parametres,
): number {
  const { nbAdultes } = SITUATIONS[menage.situation];
  return allocationFamille(revenuFamilialNet, menage.enfants.length, nbAdultes, annee);
}

/**
 * Supplément pour l'achat de fournitures scolaires (= SFS). Montant fixe par enfant **de 4 à 16 ans**
 * (`âge > 3` et `âge < 17`), sans réduction selon le revenu. Versé avec l'Allocation famille.
 */
export function supplementFournituresScolaires(menage: Menage, annee: Annee | Parametres): number {
  const nb = menage.enfants.filter((e) => e.age > 3 && e.age < 17).length;
  return nb * (typeof annee === "number" ? ALLOCATION_FAMILLE[annee] : annee.allocationFamille).supplementFournitures;
}
