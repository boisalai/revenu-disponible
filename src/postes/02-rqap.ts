// ===========================================================================
// Poste 2 — RQAP (Régime québécois d'assurance parentale)
// Sorties code : QC_rqap (total ménage), QC_rqap_bonif (effet baisse de taux 2026)
// Base légale : Loi sur l'assurance parentale (RLRQ, c. A-29.011)
// Source : S6 (Revenu Québec / RQAP). Voir docs/revenu-disponible.md §5, Poste 2.
// ===========================================================================

import { Annee, Menage, revenusAdultes } from "../socle";

export interface ParamsRQAP {
  maxAssurable: number; // revenu maximal assurable ($)
  seuil: number; // revenu assurable minimal pour cotiser
  taux: number; // taux de cotisation (part employé)
}

export const RQAP: Record<Annee, ParamsRQAP> = {
  2025: { maxAssurable: 98_000, seuil: 2000, taux: 0.00494 },
  2026: { maxAssurable: 103_000, seuil: 2000, taux: 0.0043 },
};

/** Cotisation RQAP d'un adulte sur son revenu de travail assurable. */
export function cotisationRQAP(revenuAssurable: number, annee: Annee): number {
  const p = RQAP[annee];
  if (revenuAssurable <= p.seuil) return 0; // sous le minimum : aucune cotisation
  return Math.min(revenuAssurable, p.maxAssurable) * p.taux; // pas d'exemption : prime sur le plein montant
}

/** Cotisation RQAP du ménage (= QC_rqap). */
export function rqapMenage(menage: Menage, annee: Annee): number {
  return revenusAdultes(menage).reduce((tot, r) => tot + cotisationRQAP(r, annee), 0);
}
