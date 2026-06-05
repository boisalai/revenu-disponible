// ===========================================================================
// Poste 15 — Crédit pour la TPS/TVH (Goods and Services Tax credit)
// Sortie code : CA_tps (crédit annuel du ménage). Aucune sortie _bonif.
// Base légale : Loi de l'impôt sur le revenu (LRC 1985, ch. 1 (5e suppl.)), art. 122.5.
//   Crédit fédéral remboursable, versé trimestriellement par l'ARC (non imposable).
// Sources : S22 (Agence du revenu du Canada — montants, seuils, taux).
// Voir docs/revenu-disponible.md §5, Poste 15.
//
// Traçage : CA_tps = c2T194 (2025) / c2S194 (2026) = arr2xD66D71[2][0] = arr2xT406T411[2][0] (l. 23023, 23006).
//   c2T194 = round( max(0, (base + supplMonoparental + supplSeul) − réduction) , 2)
//     base               = nbAdultes × baseAdulte + nbEnfants × parEnfant            (c2T190)
//     supplMonoparental  = (1 adulte ET enfants) ? supplMonoparental : 0             (c2T191)
//     supplSeul          = (1 adulte SANS enfant) ? max(0, min(2 % × (AFNI − seuilPhaseIn), plafond)) : 0  (c2T192)
//     réduction          = max(0, AFNI − seuilReduction) × 5 %, plafonnée au total   (c2T193)
//   AFNI = c2T124/c2T121 = revenu familial net rajusté FÉDÉRAL.
//   Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).
// ===========================================================================

import { Annee, Menage, SITUATIONS } from "../socle";
import type { Parametres } from "../parametres";

export interface ParamsTPS {
  baseAdulte: number; // montant de base par adulte ($)
  parEnfant: number; // montant par enfant ($)
  supplMonoparental: number; // supplément pour famille monoparentale (équivalent conjoint) ($)
  seuilPhaseIn: number; // seuil de début du supplément pour personne seule ($)
  tauxPhaseIn: number; // taux d'accumulation du supplément pour personne seule
  plafondPhaseIn: number; // supplément maximal pour personne seule ($)
  seuilReduction: number; // seuil de réduction (AFNI) ($)
  tauxReduction: number; // taux de réduction
}

export const TPS: Record<Annee, ParamsTPS> = {
  // Année de prestation juillet 2025 – juin 2026
  2025: { baseAdulte: 349, parEnfant: 184, supplMonoparental: 349, seuilPhaseIn: 11_337, tauxPhaseIn: 0.02, plafondPhaseIn: 184, seuilReduction: 45_521, tauxReduction: 0.05 },
  // Année de prestation juillet 2026 – juin 2027 (indexée)
  2026: { baseAdulte: 356, parEnfant: 187, supplMonoparental: 356, seuilPhaseIn: 11_564, tauxPhaseIn: 0.02, plafondPhaseIn: 187, seuilReduction: 46_432, tauxReduction: 0.05 },
};

/**
 * Crédit pour la TPS/TVH (= CA_tps), montant annuel. Base par adulte et par enfant, plus un
 * supplément (famille monoparentale, ou personne seule sans enfant — celui-ci s'accumule à 2 %
 * du revenu), le tout réduit de 5 % du revenu familial net rajusté excédant le seuil.
 *
 * @param revenuFamilialNetAjuste revenu familial net rajusté fédéral (AFNI ; produit par le calcul d'impôt fédéral)
 */
export function creditTPS(
  revenuFamilialNetAjuste: number,
  nbAdultes: 1 | 2,
  nbEnfants: number,
  annee: Annee | Parametres,
): number {
  const p = (typeof annee === "number" ? TPS[annee] : annee.tps);
  const base = nbAdultes * p.baseAdulte + nbEnfants * p.parEnfant;
  const supplMono = nbAdultes === 1 && nbEnfants > 0 ? p.supplMonoparental : 0;
  const supplSeul =
    nbAdultes === 1 && nbEnfants === 0
      ? Math.max(0, Math.min(p.tauxPhaseIn * (revenuFamilialNetAjuste - p.seuilPhaseIn), p.plafondPhaseIn))
      : 0;
  const total = base + supplMono + supplSeul;
  const reduction = Math.max(0, revenuFamilialNetAjuste - p.seuilReduction) * p.tauxReduction;
  return Math.round(Math.max(0, total - reduction) * 100) / 100;
}

/** Crédit pour la TPS/TVH du ménage (= CA_tps). */
export function creditTPSMenage(menage: Menage, revenuFamilialNetAjuste: number, annee: Annee | Parametres): number {
  const { nbAdultes } = SITUATIONS[menage.situation];
  return creditTPS(revenuFamilialNetAjuste, nbAdultes, menage.enfants.length, annee);
}
