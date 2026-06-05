// ===========================================================================
// Poste 6 — Frais de garde : crédit d'impôt remboursable pour frais de garde
// Sortie code : QC_garde (crédit, ménage). (Frais_garde = coût total de garde — passthrough, voir doc.)
// Base légale : Loi sur les impôts (RLRQ, c. I-3), art. 1029.8.67 et suivants.
//   Crédit demandé à l'annexe C (TP-1.D.C) ; revenu familial net = somme des lignes 275.
// Sources : S10 (MFQ Paramètres 2026 — taux, seuils, plafonds), S13 (Revenu Québec — règles, âges, loi).
// Voir docs/revenu-disponible.md §5, Poste 6.
//
// Traçage : QC_garde = c2T332 × 1 (2025) / c2S332 (2026) = arr2xT414T422[5][0] = arr2xD59D62[0][0].
//   c2T332 = round( c2M327 × c2M322 , 2 )
//     c2M322 = max( arr2xM314M321[0..7] )         → TAUX du crédit (barème selon le revenu familial net)
//       arr2xM314M321[i] = (revenuFamilialNet ≤ seuil_i) ? taux_i : 0   (taux en colonne K = constants)
//     c2M327 = min( arr2xM324M324 , arr2xE46E46 ) → FRAIS admissibles (Σ frais non subv., plafonnés)
//       arr2xM324M324 = Σ_enfant (frais_enfant > 0 et non subv. ? plafond_enfant : 0)   (plafond agrégé)
//       arr2xE46E46   = Σ_enfant frais de garde non subventionnés
//   Le plafond par enfant vaut c2M307 (moins de 7 ans) ou c2M308 (autre enfant admissible),
//   l'admissibilité tenant à l'âge (< 16 en 2025 ; < 14 dès 2026 — drapeaux G33G37 vs F33F37).
//   Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).
// ===========================================================================

import { Annee } from "../socle";
import type { Parametres } from "../parametres";

/** Un palier du taux du crédit : revenu familial net ≤ plafond → taux. */
export interface PalierTauxGarde {
  plafond: number;
  taux: number;
}

export interface ParamsGarde {
  /** Barème du taux selon le revenu familial net (paliers ascendants ; dernier = plancher, plafond Infinity). */
  taux: PalierTauxGarde[];
  /** Plafond annuel des frais admissibles — enfant de moins de 7 ans ($). */
  plafondJeune: number;
  /** Plafond annuel des frais admissibles — autre enfant admissible ($). */
  plafondAutre: number;
  /** Âge d'admissibilité (exclusif) : enfant admissible si âge < ageMax. 16 (2025) ; 14 (2026 et suiv.). */
  ageMax: number;
}

export const GARDE: Record<Annee, ParamsGarde> = {
  2025: {
    taux: [
      { plafond: 24_795, taux: 0.78 },
      { plafond: 43_725, taux: 0.75 },
      { plafond: 45_340, taux: 0.74 },
      { plafond: 46_970, taux: 0.73 },
      { plafond: 48_570, taux: 0.72 },
      { plafond: 50_195, taux: 0.71 },
      { plafond: 119_835, taux: 0.7 },
      { plafond: Infinity, taux: 0.67 },
    ],
    plafondJeune: 12_275,
    plafondAutre: 6_180,
    ageMax: 16,
  },
  2026: {
    taux: [
      { plafond: 25_305, taux: 0.78 },
      { plafond: 44_620, taux: 0.75 },
      { plafond: 46_270, taux: 0.74 },
      { plafond: 47_935, taux: 0.73 },
      { plafond: 49_565, taux: 0.72 },
      { plafond: 51_225, taux: 0.71 },
      { plafond: 122_290, taux: 0.7 },
      { plafond: Infinity, taux: 0.67 },
    ],
    plafondJeune: 12_525,
    plafondAutre: 6_305,
    ageMax: 14,
  },
};

/** Taux du crédit selon le revenu familial net (décroît par paliers de 78 % à 67 %). */
export function tauxCreditGarde(revenuFamilialNet: number, annee: Annee | Parametres): number {
  const paliers = (typeof annee === "number" ? GARDE[annee] : annee.garde).taux;
  const palier = paliers.find((p) => revenuFamilialNet <= p.plafond);
  return (palier ?? paliers[paliers.length - 1]).taux; // dernier palier (Infinity) = taux plancher
}

/**
 * Plafond annuel des frais de garde admissibles pour un enfant, selon son âge.
 *
 * ⚠️ Le fichier compare l'âge à 5 (plafond élevé pour âge ≤ 5), alors que la règle
 * officielle vise « un enfant de moins de 7 ans » (âge ≤ 6) : divergence d'un an au
 * seuil jeune/autre, reproduite ici par fidélité au modèle (voir doc). Le plafond
 * « enfant handicapé » (16 800 $/17 145 $) n'est pas modélisé (aucune entrée handicap).
 */
export function plafondFraisEnfant(age: number, annee: Annee | Parametres): number {
  const p = (typeof annee === "number" ? GARDE[annee] : annee.garde);
  if (age <= 5) return p.plafondJeune; // « moins de 7 ans » au sens du fichier (âge ≤ 5)
  if (age < p.ageMax) return p.plafondAutre; // autre enfant admissible (< 16 en 2025 ; < 14 dès 2026)
  return 0; // au-delà de l'âge d'admissibilité
}

export interface EnfantGarde {
  age: number;
  /** Frais de garde NON subventionnés payés ($). Les frais d'une place subventionnée sont exclus du crédit. */
  fraisAdmissibles: number;
}

/**
 * Crédit d'impôt remboursable pour frais de garde d'enfants (= QC_garde).
 *
 *   crédit = taux(revenu familial net) × min( Σ plafonds , Σ frais admissibles )
 *
 * ⚠️ Plafonnement **agrégé** (fidèle au fichier) : on additionne les plafonds des
 * enfants ayant des frais admissibles, puis on borne la somme des frais — au lieu de
 * borner enfant par enfant. Cela peut surévaluer les frais admissibles quand un enfant
 * dépasse son plafond et un autre est en deçà.
 *
 * @param revenuFamilialNet revenu familial net (somme des lignes 275 des adultes ; même base que la RAMQ)
 */
export function creditFraisGarde(
  revenuFamilialNet: number,
  enfants: EnfantGarde[],
  annee: Annee | Parametres,
): number {
  const taux = tauxCreditGarde(revenuFamilialNet, annee);
  const plafondTotal = enfants.reduce(
    (s, e) => s + (e.fraisAdmissibles > 0 ? plafondFraisEnfant(e.age, annee) : 0),
    0,
  );
  const fraisTotal = enfants.reduce((s, e) => s + e.fraisAdmissibles, 0);
  return Math.round(taux * Math.min(plafondTotal, fraisTotal) * 100) / 100;
}
