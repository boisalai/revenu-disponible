// ===========================================================================
// Poste 18 — Supplément remboursable pour frais médicaux (fédéral)
// Sortie code : CA_medic (supplément du ménage). Aucune sortie _bonif.
// Base légale : Loi de l'impôt sur le revenu (LRC 1985, ch. 1 (5ᵉ suppl.)), art. 122.51 — ligne 45200.
// Sources : S25 (ARC — ligne 45200 ; indexation ; TaxTips citant l'art. 122.51(1)).
// Voir docs/revenu-disponible.md §5, Poste 18.
//
// Traçage : CA_medic = c2T174 (2025) / c2S174 (2026)  (l. 23203, 23197 → arr2x…66/71[5][0] → c1C34/c1D34).
//   c2T161 = c2T376 (= prime RAMQ — SEULE dépense médicale fournie par le modèle, comme au poste 12)
//   c2T162 = min(0,03 × revenuNet, 2 834 $)                   → plancher de 3 % (plafonné), ligne 33200
//   c2T171 = (revenuTravail > 4 390 $) ? min(0,25 × (c2T161 − c2T162), 1 504 $) : 0   → supplément avant réduction
//   c2T169 = max(0, c2T124 − 33 294 $)                        → excédent du revenu familial net rajusté FÉDÉRAL (AFNI)
//   c2T173 = 0,05 × c2T169                                    → réduction
//   c2T174 = max(0, c2T171 − c2T173)                          → supplément (forme de réduction CORRECTE, ≠ poste 12)
//   Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).
//
// ⚠️ Comme au poste 12 (QC) : dans le modèle MFQ, la SEULE dépense médicale est la **prime RAMQ**
//    (`c2T376`). Or elle ne dépasse jamais le plancher de 3 % du revenu net → frais admissibles = 0
//    → **CA_medic ≡ 0 pour toutes les entrées** (vérifié empiriquement sur 450 scénarios + parité).
//    La réduction utilise le **revenu familial net rajusté fédéral** (AFNI, `c2T124`), comme l'ACE,
//    le crédit TPS et l'ACT (postes 14-16). Voir docs/hypotheses-mfq.md.
// ===========================================================================

import { Annee } from "../socle";

export interface ParamsSupplementMedical {
  taux: number; // taux du supplément sur les frais admissibles (25 %)
  supplementMax: number; // supplément maximal ($)
  revenuTravailMin: number; // revenu de travail minimal pour ouvrir droit ($)
  seuilReduction: number; // seuil de réduction (revenu familial net rajusté fédéral) ($)
  tauxReduction: number; // taux de réduction (5 %)
  seuilFrais: number; // part du revenu net en deçà de laquelle les frais ne comptent pas (3 %)
  plafondSeuilFrais: number; // plafond du plancher de 3 % ($)
}

export const SUPPLEMENT_MEDICAL: Record<Annee, ParamsSupplementMedical> = {
  2025: { taux: 0.25, supplementMax: 1504, revenuTravailMin: 4390, seuilReduction: 33_294, tauxReduction: 0.05, seuilFrais: 0.03, plafondSeuilFrais: 2834 },
  2026: { taux: 0.25, supplementMax: 1534, revenuTravailMin: 4478, seuilReduction: 33_960, tauxReduction: 0.05, seuilFrais: 0.03, plafondSeuilFrais: 2890 },
};

/**
 * Supplément remboursable pour frais médicaux fédéral (= CA_medic), art. 122.51 LIR (ligne 45200).
 *
 * `min(25 % × frais admissibles, max)` réduit de `5 % × (AFNI − seuil)`. Les frais admissibles =
 * `max(0, frais − min(3 % × revenuNet, plafond))` (ligne 33200). Forme de réduction **correcte**
 * (≠ l'anomalie du poste 12 québécois). Dans le modèle MFQ, `fraisMedicaux` = prime RAMQ uniquement
 * → frais admissibles = 0 → résultat **toujours 0** (la branche non nulle n'est jamais exercée).
 *
 * @param fraisMedicaux frais médicaux (dans le modèle : la prime RAMQ)
 * @param revenuTravailMax revenu de travail le plus élevé du ménage (pour l'admissibilité)
 * @param revenuNet revenu net servant au plancher de 3 %
 * @param afni revenu familial net rajusté fédéral (`c2T124`), base de la réduction de 5 %
 */
export function supplementFraisMedicaux(
  fraisMedicaux: number,
  revenuTravailMax: number,
  revenuNet: number,
  afni: number,
  annee: Annee,
): number {
  const p = SUPPLEMENT_MEDICAL[annee];
  if (revenuTravailMax < p.revenuTravailMin) return 0; // admissibilité : revenu de travail minimal
  const plancher = Math.min(p.seuilFrais * revenuNet, p.plafondSeuilFrais);
  const fraisAdmissibles = Math.max(0, fraisMedicaux - plancher); // ligne 33200 (au-delà de 3 %, plafonné)
  const supplement = Math.min(p.taux * fraisAdmissibles, p.supplementMax);
  const reduction = p.tauxReduction * Math.max(0, afni - p.seuilReduction); // 5 % de l'excédent d'AFNI
  return Math.round(Math.max(0, supplement - reduction) * 100) / 100;
}
