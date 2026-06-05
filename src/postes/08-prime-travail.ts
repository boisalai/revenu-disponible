// ===========================================================================
// Poste 8 — Prime au travail (générale) — crédit d'impôt remboursable
// Sortie code : QC_pt (prime du ménage). Aucune sortie _bonif.
// Base légale : Loi sur les impôts (RLRQ, c. I-3), art. 1029.8.116.1 à 1029.8.116.11.
//   Crédit remboursable ; croissance sur le revenu de TRAVAIL, réduction sur le revenu FAMILIAL net.
// Sources : S10 (MFQ Paramètres 2026 — montants max, seuils), S15 (Revenu Québec / CFFP — taux, structure, loi).
// Voir docs/revenu-disponible.md §5, Poste 8.
//
// Traçage : QC_pt = c2T343 (2025) / c2S343 (2026) = arr2xD53D58[4][0] (lignes 23015-23016, 23128-23129).
//   c2T343 = round( max(0, (croissance) − (réduction)) , 2 )   (une seule des 4 paires est active)
//     croissance[type] = min( max(0, revenuTravail − exclu) × tauxCroissance , primeMax )   (c2T335-338)
//     réduction[type]  = max(0, revenuFamilialNet − seuilRéduction) × tauxRéduction         (c2T339-342)
//   Les 4 types de ménage = (1 ou 2 adultes) × (sans / avec enfants), choisis par
//   c2T6 (= 0 si 1 adulte) et c2T7 (= nb enfants). Convention : 2025 = T (param. M) ; 2026 = S (param. L).
//   À noter : primeMax = (seuilRéduction − exclu) × tauxCroissance (la prime plafonne quand le
//   revenu de travail atteint le seuil de réduction).
// ===========================================================================

import { Annee, Menage, SITUATIONS } from "../socle";
import type { Parametres } from "../parametres";

/** Paramètres d'un des 4 types de ménage. */
export interface ParamsTypePT {
  revenuTravailExclu: number; // revenu de travail exclu / minimum pour ouvrir droit à la prime ($)
  tauxCroissance: number; // taux de croissance de la prime sur le revenu de travail excédentaire
  primeMax: number; // prime maximale ($)
  seuilReduction: number; // seuil de réduction (revenu familial net) ($)
}

export interface ParamsPrimeTravail {
  tauxReduction: number; // taux de réduction au-delà du seuil (commun aux 4 types)
  /** Paramètres par nombre d'adultes (1 / 2), puis selon la présence d'enfants. */
  parType: Record<1 | 2, { sansEnfants: ParamsTypePT; avecEnfants: ParamsTypePT }>;
}

export const PRIME_TRAVAIL: Record<Annee, ParamsPrimeTravail> = {
  2025: {
    tauxReduction: 0.1,
    parType: {
      1: {
        sansEnfants: { revenuTravailExclu: 2400, tauxCroissance: 0.116, primeMax: 1185.52, seuilReduction: 12_620 },
        avecEnfants: { revenuTravailExclu: 2400, tauxCroissance: 0.3, primeMax: 3066, seuilReduction: 12_620 },
      },
      2: {
        sansEnfants: { revenuTravailExclu: 3600, tauxCroissance: 0.116, primeMax: 1848.344, seuilReduction: 19_534 },
        avecEnfants: { revenuTravailExclu: 3600, tauxCroissance: 0.25, primeMax: 3983.5, seuilReduction: 19_534 },
      },
    },
  },
  2026: {
    tauxReduction: 0.1,
    parType: {
      1: {
        sansEnfants: { revenuTravailExclu: 2400, tauxCroissance: 0.116, primeMax: 1207.328, seuilReduction: 12_808 },
        avecEnfants: { revenuTravailExclu: 2400, tauxCroissance: 0.3, primeMax: 3122.4, seuilReduction: 12_808 },
      },
      2: {
        sansEnfants: { revenuTravailExclu: 3600, tauxCroissance: 0.116, primeMax: 1882.448, seuilReduction: 19_828 },
        avecEnfants: { revenuTravailExclu: 3600, tauxCroissance: 0.25, primeMax: 4057, seuilReduction: 19_828 },
      },
    },
  },
};

/**
 * Prime au travail générale (= QC_pt). La prime **croît** au taux applicable sur le revenu
 * de travail excédant le montant exclu, jusqu'à un maximum ; puis elle est **réduite** de
 * 10 % du revenu familial net excédant le seuil de réduction. Plancher à 0.
 *
 * @param revenuTravail revenu de travail du ménage (sert à la croissance)
 * @param revenuFamilialNet revenu familial net (sert à la réduction ; même base que la RAMQ)
 */
export function primeAuTravail(
  revenuTravail: number,
  revenuFamilialNet: number,
  nbAdultes: 1 | 2,
  aDesEnfants: boolean,
  annee: Annee | Parametres,
): number {
  const p = (typeof annee === "number" ? PRIME_TRAVAIL[annee] : annee.primeTravail);
  const t = p.parType[nbAdultes][aDesEnfants ? "avecEnfants" : "sansEnfants"];
  const croissance = Math.min(
    Math.max(0, revenuTravail - t.revenuTravailExclu) * t.tauxCroissance,
    t.primeMax,
  );
  const reduction = Math.max(0, revenuFamilialNet - t.seuilReduction) * p.tauxReduction;
  return Math.round(Math.max(0, croissance - reduction) * 100) / 100;
}

/** Prime au travail du ménage (= QC_pt). */
export function primeAuTravailMenage(
  menage: Menage,
  revenuTravail: number,
  revenuFamilialNet: number,
  annee: Annee | Parametres,
): number {
  const { nbAdultes } = SITUATIONS[menage.situation];
  return primeAuTravail(revenuTravail, revenuFamilialNet, nbAdultes, menage.enfants.length > 0, annee);
}
