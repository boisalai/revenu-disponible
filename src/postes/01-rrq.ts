// ===========================================================================
// Poste 1 — RRQ (Régime de rentes du Québec) + bonification
// Sorties code : CA_rrq (total ménage), CA_rrq_bonif (effet baisse de taux 2026)
// Base légale : Loi sur le régime de rentes du Québec (RLRQ, c. R-9)
// Sources : S4 (Retraite Québec), S5 (Revenu Québec). Voir docs/revenu-disponible.md §5, Poste 1.
// ===========================================================================

import { Annee, Menage, revenusAdultes } from "../socle";

export interface ParamsRRQ {
  exemption: number; // exemption générale ($)
  mga: number; // maximum des gains admissibles
  mgas: number; // maximum supplémentaire (114 % du MGA)
  tauxBase: number; // régime de base (part employé)
  tauxSuppl1: number; // 1ʳᵉ cotisation supplémentaire (part employé)
  tauxSuppl2: number; // 2ᵉ cotisation supplémentaire (bande MGA→MGAS, part employé)
}

export const RRQ: Record<Annee, ParamsRRQ> = {
  2025: { exemption: 3500, mga: 71_300, mgas: 81_200, tauxBase: 0.054, tauxSuppl1: 0.01, tauxSuppl2: 0.04 },
  2026: { exemption: 3500, mga: 74_600, mgas: 85_000, tauxBase: 0.053, tauxSuppl1: 0.01, tauxSuppl2: 0.04 },
};

export interface CotisationRRQ {
  base: number; // régime de base → ouvre droit à un crédit d'impôt
  supplementaire: number; // régimes supplémentaires (1er + 2e) → déductibles
  total: number; // base + supplementaire (= CA_rrq)
}

/** Cotisation RRQ d'un adulte sur son revenu de travail. */
export function cotisationRRQ(revenuTravail: number, annee: Annee): CotisationRRQ {
  const p = RRQ[annee];
  // Bande 1 : entre l'exemption et le MGA
  const bande1 = Math.max(0, Math.min(revenuTravail, p.mga) - p.exemption);
  // Bande 2 : entre le MGA et le MGAS (2e cotisation supplémentaire uniquement)
  const bande2 = Math.max(0, Math.min(revenuTravail, p.mgas) - p.mga);

  const base = bande1 * p.tauxBase;
  const supplementaire = bande1 * p.tauxSuppl1 + bande2 * p.tauxSuppl2;
  return { base, supplementaire, total: base + supplementaire };
}

/** Cotisation RRQ du ménage. CA_rrq = `total`. */
export function rrqMenage(menage: Menage, annee: Annee): CotisationRRQ {
  return revenusAdultes(menage)
    .map((r) => cotisationRRQ(r, annee))
    .reduce(
      (a, c) => ({
        base: a.base + c.base,
        supplementaire: a.supplementaire + c.supplementaire,
        total: a.total + c.total,
      }),
      { base: 0, supplementaire: 0, total: 0 },
    );
}
