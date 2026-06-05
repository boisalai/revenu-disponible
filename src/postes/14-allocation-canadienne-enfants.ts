// ===========================================================================
// Poste 14 — Allocation canadienne pour enfants (ACE / Canada Child Benefit)
// Sortie code : CA_ace (prestation annuelle du ménage). Aucune sortie _bonif.
// Base légale : Loi de l'impôt sur le revenu (LIR, LRC 1985, ch. 1 (5e suppl.)), art. 122.6 à 122.64.
//   Prestation fédérale NON IMPOSABLE versée mensuellement par l'ARC.
// Sources : S21 (Agence du revenu du Canada — montants, seuils, taux).
// Voir docs/revenu-disponible.md §5, Poste 14.
//
// Traçage : CA_ace = c2T180 (2025) / c2S180 (2026) = arr2xD66D71[1][0] = arr2xT406T411[1][0] (l. 23021, 23003).
//   c2T177 = (enfants < 6 ans × maxJeune) + (enfants 6-17 × maxAîné)            (prestation maximale)
//   bande1 = max(0, min(AFNI − seuil1, seuil2 − seuil1))                        (revenu entre seuil1 et seuil2)
//   bande2 = max(0, AFNI − seuil2)                                              (revenu au-delà du seuil2)
//   c2T180 = round(max(0, c2T177 − taux1 × bande1 − taux2 × bande2), 2)
//   Les taux (taux1 = c2T178, taux2 = c2T179) dépendent du NOMBRE d'enfants (1/2/3/4+).
//   AFNI = c2T124 = revenu familial net rajusté FÉDÉRAL. Convention : 2025 = T (param. M) ; 2026 = S (param. L).
// ===========================================================================

import { Annee, Menage } from "../socle";
import type { Parametres } from "../parametres";

export interface ParamsACE {
  maxJeune: number; // montant maximal par enfant de moins de 6 ans ($)
  maxAine: number; // montant maximal par enfant de 6 à 17 ans ($)
  seuil1: number; // premier seuil de réduction (AFNI) ($)
  seuil2: number; // second seuil de réduction ($)
  tauxPalier1: [number, number, number, number]; // taux 1ᵉʳ palier selon le nb d'enfants (1, 2, 3, 4+)
  tauxPalier2: [number, number, number, number]; // taux 2ᵉ palier
}

export const ACE: Record<Annee, ParamsACE> = {
  // Année de prestation juillet 2025 – juin 2026
  2025: {
    maxJeune: 7997,
    maxAine: 6748,
    seuil1: 37_487,
    seuil2: 81_222,
    tauxPalier1: [0.07, 0.135, 0.19, 0.23],
    tauxPalier2: [0.032, 0.057, 0.08, 0.095],
  },
  // Année de prestation juillet 2026 – juin 2027 (indexée)
  2026: {
    maxJeune: 8157,
    maxAine: 6883,
    seuil1: 38_237,
    seuil2: 82_847,
    tauxPalier1: [0.07, 0.135, 0.19, 0.23],
    tauxPalier2: [0.032, 0.057, 0.08, 0.095],
  },
};

/**
 * Allocation canadienne pour enfants (= CA_ace), montant annuel. La prestation maximale (selon
 * le nombre d'enfants et leur âge) est réduite selon le revenu familial net rajusté, à deux
 * paliers dont les taux dépendent du nombre d'enfants. Plancher à 0.
 *
 * @param revenuFamilialNetAjuste revenu familial net rajusté fédéral (AFNI ; produit par le calcul d'impôt fédéral)
 */
export function allocationCanadienneEnfants(
  revenuFamilialNetAjuste: number,
  nbEnfants: number,
  nbEnfantsMoins6: number,
  annee: Annee | Parametres,
): number {
  if (nbEnfants <= 0) return 0;
  const p = (typeof annee === "number" ? ACE[annee] : annee.ace);
  const maxBenefit = nbEnfantsMoins6 * p.maxJeune + (nbEnfants - nbEnfantsMoins6) * p.maxAine;
  const i = Math.min(nbEnfants, 4) - 1; // index du taux : 1, 2, 3, 4+ enfants
  const bande1 = Math.max(0, Math.min(revenuFamilialNetAjuste - p.seuil1, p.seuil2 - p.seuil1));
  const bande2 = Math.max(0, revenuFamilialNetAjuste - p.seuil2);
  const reduction = p.tauxPalier1[i] * bande1 + p.tauxPalier2[i] * bande2;
  return Math.round(Math.max(0, maxBenefit - reduction) * 100) / 100;
}

/** Allocation canadienne pour enfants du ménage (= CA_ace). « Moins de 6 ans » = âge ≤ 5. */
export function allocationCanadienneEnfantsMenage(
  menage: Menage,
  revenuFamilialNetAjuste: number,
  annee: Annee | Parametres,
): number {
  const nbEnfants = menage.enfants.length;
  const nbEnfantsMoins6 = menage.enfants.filter((e) => e.age < 6).length;
  return allocationCanadienneEnfants(revenuFamilialNetAjuste, nbEnfants, nbEnfantsMoins6, annee);
}
