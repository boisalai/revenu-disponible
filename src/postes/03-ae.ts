// ===========================================================================
// Poste 3 — Assurance-emploi (AE) — taux réduit du Québec
// Sortie code : CA_ae (total ménage). Aucune sortie _bonif.
// Base légale : Loi sur l'assurance-emploi (fédérale, LC 1996, ch. 23),
//   art. 4 (MRA), 66 (taux), 69(2) (réduction régime provincial), 96(4) (remboursement ≤ 2 000 $)
// Sources : S7 (Service Canada), S8 (LAE + BSIF). Voir docs/revenu-disponible.md §5, Poste 3.
// ===========================================================================

import { Annee, Menage, revenusAdultes } from "../socle";

export interface ParamsAE {
  mra: number; // maximum de la rémunération assurable ($)
  seuil: number; // rémunération assurable min. ; en deçà, cotisation remboursée (art. 96(4) LAE)
  taux: number; // taux de cotisation (part employé, taux réduit du Québec)
}

export const AE: Record<Annee, ParamsAE> = {
  2025: { mra: 65_700, seuil: 2000, taux: 0.0131 },
  2026: { mra: 68_900, seuil: 2000, taux: 0.013 },
};

/** Cotisation AE d'un adulte sur son revenu de travail assurable. */
export function cotisationAE(revenuAssurable: number, annee: Annee): number {
  const p = AE[annee];
  if (revenuAssurable <= p.seuil) return 0; // ≤ 2 000 $ : cotisation remboursée (art. 96(4))
  return Math.min(revenuAssurable, p.mra) * p.taux; // pas d'exemption : prime sur le plein montant, plafonné au MRA
}

/** Cotisation AE du ménage (= CA_ae). */
export function aeMenage(menage: Menage, annee: Annee): number {
  return revenusAdultes(menage).reduce((tot, r) => tot + cotisationAE(r, annee), 0);
}
