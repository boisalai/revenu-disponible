// ===========================================================================
// Poste 9 — Crédit d'impôt pour la solidarité
// Sortie code : QC_sol (crédit du ménage). Aucune sortie _bonif.
// Base légale : Loi sur les impôts (RLRQ, c. I-3), art. 1029.8.116.12 à 1029.8.116.35.
//   Crédit remboursable versé par Revenu Québec, modulé selon le revenu familial net (lignes 275).
// Sources : S10 (MFQ Paramètres 2026, tableau 4 — montants, seuil), S16 (Revenu Québec / CFFP — taux, structure, loi).
// Voir docs/revenu-disponible.md §5, Poste 9.
//
// Traçage : QC_sol = c2T350 (2025) / c2S350 (2026) = arr2xD53D58[5][0] (lignes 23017-23018, 23130).
//   c2T350 = round( max(0, (voletTVQ + voletLogement) − réduction) , 2 )
//     voletTVQ      = base + (couple ? conjoint : additionnel « vivant seule »)   (c2T347)
//     voletLogement = (couple ? montant couple : montant seule/mono) + nbEnfants × montant/enfant  (c2T348)
//     réduction     = max(0, revenuFamilialNet − seuil) × 6 %, plafonnée au total des volets  (c2T349)
//   Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).
//   Périodes du crédit : col. 2025 = juillet 2025–juin 2026 ; col. 2026 = juillet 2026–juin 2027.
// ===========================================================================

import { Annee, Menage, SITUATIONS } from "../socle";
import type { Parametres } from "../parametres";

export interface ParamsSolidarite {
  // Volet TVQ
  tvqBase: number; // montant de base ($)
  tvqConjoint: number; // montant pour conjoint (couple) ($)
  tvqAdditionnelSeule: number; // montant additionnel pour personne vivant seule (1 adulte) ($)
  // Volet logement
  logementCouple: number; // montant pour un couple ($)
  logementSeule: number; // montant pour une personne seule ou une famille monoparentale ($)
  logementParEnfant: number; // montant pour chaque enfant à charge ($)
  // Réduction
  seuilReduction: number; // seuil de réduction (revenu familial net) ($)
  tauxReduction: number; // taux de réduction (≥ 2 composantes)
}

export const SOLIDARITE: Record<Annee, ParamsSolidarite> = {
  // Juillet 2025 – juin 2026
  2025: {
    tvqBase: 356,
    tvqConjoint: 356,
    tvqAdditionnelSeule: 169,
    logementCouple: 888,
    logementSeule: 731,
    logementParEnfant: 155,
    seuilReduction: 42_325,
    tauxReduction: 0.06,
  },
  // Juillet 2026 – juin 2027
  2026: {
    tvqBase: 363,
    tvqConjoint: 363,
    tvqAdditionnelSeule: 172,
    logementCouple: 906,
    logementSeule: 746,
    logementParEnfant: 158,
    seuilReduction: 43_195,
    tauxReduction: 0.06,
  },
};

/**
 * Crédit d'impôt pour la solidarité (= QC_sol). Somme des volets **TVQ** et **logement**,
 * réduite de 6 % du revenu familial net excédant le seuil, sans descendre sous 0.
 *
 * Le modèle suppose que le ménage a droit aux deux volets (TVQ + logement) → réduction à 6 %
 * (le taux de 3 % à une seule composante ne survient pas). Le volet « village nordique » n'est
 * pas modélisé. Le montant additionnel « vivant seule » s'applique à tout ménage à 1 adulte
 * (la famille monoparentale est réputée vivre seule avec ses enfants à charge).
 *
 * @param revenuFamilialNet revenu familial net (somme des lignes 275 ; même base que la RAMQ)
 */
export function creditSolidarite(
  revenuFamilialNet: number,
  nbAdultes: 1 | 2,
  nbEnfants: number,
  annee: Annee | Parametres,
): number {
  const p = (typeof annee === "number" ? SOLIDARITE[annee] : annee.solidarite);
  const couple = nbAdultes === 2;
  const voletTVQ = p.tvqBase + (couple ? p.tvqConjoint : p.tvqAdditionnelSeule);
  const voletLogement = (couple ? p.logementCouple : p.logementSeule) + nbEnfants * p.logementParEnfant;
  const reduction = Math.max(0, revenuFamilialNet - p.seuilReduction) * p.tauxReduction;
  return Math.round(Math.max(0, voletTVQ + voletLogement - reduction) * 100) / 100;
}

/** Crédit pour la solidarité du ménage (= QC_sol). */
export function creditSolidariteMenage(menage: Menage, revenuFamilialNet: number, annee: Annee | Parametres): number {
  const { nbAdultes } = SITUATIONS[menage.situation];
  return creditSolidarite(revenuFamilialNet, nbAdultes, menage.enfants.length, annee);
}
