// ===========================================================================
// Poste 12 — Crédit d'impôt remboursable pour frais médicaux (Québec)
// Sortie code : QC_medic (crédit du ménage). Aucune sortie _bonif.
// Base légale : Loi sur les impôts (RLRQ, c. I-3) ; crédit remboursable de la ligne 462 du TP-1.
// Sources : S10 (MFQ Paramètres 2026 — montant max, revenu de travail min, seuil), S19 (Revenu Québec).
// Voir docs/revenu-disponible.md §5, Poste 12.
//
// Traçage : QC_medic = c2T311 (2025) / c2S311 (2026) = arr2xD59D62[2][0] = arr2xT414T422[7][0] (l. 23244, 23229).
//   c2T305 = c2T376 (= prime RAMQ — SEULE dépense médicale fournie par le modèle)
//   c2T306 = 0,03 × c2T271 (revenu familial net)
//   c2T307 = max(0, c2T305 − c2T306)                          → frais admissibles (au-delà de 3 % du revenu)
//   c2T309 = min(0,25 × c2T307, creditMax)                    → crédit (25 %, plafonné)
//   c2T310 = max(0, c2T271 − seuilReduction)                  → excédent de revenu
//   c2T311 = (revenuTravail ≥ min) ? round(max(0, (c2T309 − c2T310) × 0,05), 2) : 0
//   Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).
//
// ⚠️ DEUX RÉSERVES MAJEURES :
//  (1) Dans le modèle MFQ, la SEULE dépense médicale est la **prime RAMQ** (aucune autre entrée).
//      Or la prime ne dépasse JAMAIS 3 % du revenu familial net → frais admissibles = 0 →
//      **QC_medic ≡ 0 pour toutes les entrées** (vérifié empiriquement sur 165 scénarios + parité).
//  (2) La forme de réduction du code, `(crédit − excédent) × 5 %`, est **anormale** : la règle réelle
//      est `crédit − 5 % × excédent`. Comme le crédit est toujours nul, l'anomalie ne se manifeste
//      jamais et ne peut être validée par parité. On reproduit le code tel quel.
// ===========================================================================

import { Annee } from "../socle";
import type { Parametres } from "../parametres";

export interface ParamsFraisMedicaux {
  taux: number; // taux du crédit sur les frais admissibles
  creditMax: number; // crédit maximal ($)
  revenuTravailMin: number; // revenu de travail minimal pour ouvrir droit ($)
  seuilReduction: number; // seuil de réduction (revenu familial net) ($)
  tauxReduction: number; // taux de réduction
  seuilFrais: number; // part du revenu net en deçà de laquelle les frais ne comptent pas (3 %)
}

export const FRAIS_MEDICAUX: Record<Annee, ParamsFraisMedicaux> = {
  2025: { taux: 0.25, creditMax: 1466, revenuTravailMin: 3750, seuilReduction: 28_335, tauxReduction: 0.05, seuilFrais: 0.03 },
  2026: { taux: 0.25, creditMax: 1496, revenuTravailMin: 3825, seuilReduction: 28_915, tauxReduction: 0.05, seuilFrais: 0.03 },
};

/**
 * Crédit d'impôt remboursable pour frais médicaux (= QC_medic).
 *
 * ⚠️ Reproduit fidèlement le code, **anomalie comprise** : la réduction y est appliquée sous la
 * forme `(crédit − excédent) × 5 %` (la règle réelle serait `crédit − 5 % × excédent`). Dans le
 * modèle MFQ, `fraisMedicaux` = prime RAMQ uniquement → le résultat est **toujours 0** (les frais
 * ne dépassent jamais 3 % du revenu). La branche non nulle n'est donc jamais exercée ni validée.
 *
 * @param fraisMedicaux frais médicaux (dans le modèle : la prime RAMQ)
 * @param revenuTravailMax revenu de travail le plus élevé du ménage (pour l'admissibilité)
 * @param revenuFamilialNet revenu familial net (somme des lignes 275 ; même base que la RAMQ)
 */
export function creditFraisMedicaux(
  fraisMedicaux: number,
  revenuTravailMax: number,
  revenuFamilialNet: number,
  annee: Annee | Parametres,
): number {
  const p = (typeof annee === "number" ? FRAIS_MEDICAUX[annee] : annee.fraisMedicaux);
  if (revenuTravailMax < p.revenuTravailMin) return 0; // admissibilité : revenu de travail minimal
  const fraisAdmissibles = Math.max(0, fraisMedicaux - p.seuilFrais * revenuFamilialNet);
  const credit = Math.min(p.taux * fraisAdmissibles, p.creditMax);
  const excedent = Math.max(0, revenuFamilialNet - p.seuilReduction);
  // ⚠️ Forme du code (anomale, jamais exercée) : (crédit − excédent) × taux de réduction.
  return Math.round(Math.max(0, (credit - excedent) * p.tauxReduction) * 100) / 100;
}
