// ===========================================================================
// Tests de fidélité — reproduisent les maximums et points de contrôle OFFICIELS.
// Chaque assertion correspond à une valeur publiée par une source citée dans
// docs/revenu-disponible.md. Un test qui casse = un écart avec la source officielle.
// ===========================================================================

import { describe, it, expect } from "vitest";
import {
  Situation,
  Menage,
  cotisationRRQ,
  rrqMenage,
  cotisationRQAP,
  cotisationAE,
  cotisationFSS,
  fssMenage,
  PALIERS_QC,
  PALIERS_FEDERAL,
} from "../src/index";

/** Fabrique un ménage minimal pour les tests. */
function menage(p: Partial<Menage> & Pick<Menage, "situation">): Menage {
  return {
    revenu1: 0,
    revenu2: 0,
    ageAdulte1: 40,
    ageAdulte2: 40,
    enfants: [],
    ...p,
  };
}

const HAUT = 1_000_000; // revenu « au-dessus de tous les plafonds »

describe("Poste 1 — RRQ (S4, S5)", () => {
  it("2025 : décomposition et maximum employé (MGA 71 300, MGAS 81 200)", () => {
    const c = cotisationRRQ(HAUT, 2025);
    // Contrôles publiés (docs §5) : base + 1ʳᵉ suppl. = 67 800 × 6,4 % = 4 339,20 ; 2ᵉ suppl. = 9 900 × 4 % = 396,00
    expect(c.base).toBeCloseTo(3661.2, 2); // 67 800 × 5,4 %
    expect(c.supplementaire).toBeCloseTo(1074.0, 2); // 678 (1 %) + 396 (4 %)
    expect(c.total).toBeCloseTo(4735.2, 2);
  });

  it("2026 : maximum employé (taux base 5,3 %, MGA 74 600, MGAS 85 000)", () => {
    const c = cotisationRRQ(HAUT, 2026);
    // Contrôles publiés : 71 100 × 6,3 % = 4 479,30 ; 10 400 × 4 % = 416,00
    expect(c.base).toBeCloseTo(3768.3, 2); // 71 100 × 5,3 %
    expect(c.supplementaire).toBeCloseTo(1127.0, 2); // 711 (1 %) + 416 (4 %)
    expect(c.total).toBeCloseTo(4895.3, 2);
  });

  it("exemption de 3 500 $ : aucune cotisation au seuil", () => {
    expect(cotisationRRQ(3500, 2025).total).toBeCloseTo(0, 2);
  });

  it("ménage couple = somme des deux adultes", () => {
    const m = menage({ situation: Situation.Couple, revenu1: HAUT, revenu2: HAUT });
    expect(rrqMenage(m, 2025).total).toBeCloseTo(2 * 4735.2, 2);
  });
});

describe("Poste 2 — RQAP (S6)", () => {
  it("maximums : 484,12 $ (2025) et 442,90 $ (2026)", () => {
    expect(cotisationRQAP(HAUT, 2025)).toBeCloseTo(484.12, 2); // 98 000 × 0,494 %
    expect(cotisationRQAP(HAUT, 2026)).toBeCloseTo(442.9, 2); // 103 000 × 0,430 %
  });

  it("seuil de 2 000 $ : nul au seuil, non nul juste au-dessus", () => {
    expect(cotisationRQAP(2000, 2025)).toBe(0);
    expect(cotisationRQAP(2001, 2025)).toBeGreaterThan(0);
  });
});

describe("Poste 3 — Assurance-emploi (S7, S8)", () => {
  it("maximums : 860,67 $ (2025) et 895,70 $ (2026)", () => {
    expect(cotisationAE(HAUT, 2025)).toBeCloseTo(860.67, 2); // 65 700 × 1,31 %
    expect(cotisationAE(HAUT, 2026)).toBeCloseTo(895.7, 2); // 68 900 × 1,30 %
  });

  it("remboursement ≤ 2 000 $ (art. 96(4) LAE) : nul au seuil", () => {
    expect(cotisationAE(2000, 2025)).toBe(0);
    expect(cotisationAE(2001, 2025)).toBeGreaterThan(0);
  });
});

describe("Poste 4 — FSS particuliers (S9, S10)", () => {
  it("maximum de 1 000 $ (2025 et 2026)", () => {
    expect(cotisationFSS(HAUT, 2025)).toBeCloseTo(1000, 2);
    expect(cotisationFSS(HAUT, 2026)).toBeCloseTo(1000, 2);
  });

  it("profil 2025 (CFFP) : 0 → 18 130 ; 150 à 33 130 ; plateau ; 650 à 113 060 ; 1 000 à 148 060", () => {
    expect(cotisationFSS(18_130, 2025)).toBeCloseTo(0, 2);
    expect(cotisationFSS(25_630, 2025)).toBeCloseTo(75, 2); // (25 630 − 18 130) × 1 %
    expect(cotisationFSS(33_130, 2025)).toBeCloseTo(150, 2); // plafond tranche 1
    expect(cotisationFSS(50_000, 2025)).toBeCloseTo(150, 2); // plateau
    expect(cotisationFSS(63_060, 2025)).toBeCloseTo(150, 2);
    expect(cotisationFSS(113_060, 2025)).toBeCloseTo(650, 2); // 150 + 500
    expect(cotisationFSS(148_060, 2025)).toBeCloseTo(1000, 2);
  });

  it("formule 1ʳᵉ tranche 2026 (Bulletin 2025-8) : min(150, 1 % × (revenu − 18 500))", () => {
    expect(cotisationFSS(30_000, 2026)).toBeCloseTo(115, 2); // min(150, 115)
    expect(cotisationFSS(40_000, 2026)).toBeCloseTo(150, 2); // min(150, 215)
  });

  it("assujettissement : nul pour un actif, dû pour un retraité (par adulte)", () => {
    const actif = menage({ situation: Situation.PersonneSeule, revenu1: HAUT });
    const retraiteSeul = menage({ situation: Situation.RetraiteSeul, revenu1: HAUT });
    const coupleRetraites = menage({ situation: Situation.CoupleRetraites, revenu1: HAUT, revenu2: HAUT });
    expect(fssMenage(actif, 2025)).toBe(0); // revenu d'emploi exclu
    expect(fssMenage(retraiteSeul, 2025)).toBeCloseTo(1000, 2);
    expect(fssMenage(coupleRetraites, 2025)).toBeCloseTo(2000, 2); // cotisation individuelle × 2
  });
});

describe("Paramètres — Impôt (S1, S2) — algorithme = poste 19, à venir", () => {
  it("1ʳᵉ tranche QC : 14 % ; plafonds 53 255 (2025) / 54 345 (2026)", () => {
    expect(PALIERS_QC[2025][0]).toMatchObject({ plafond: 53_255, taux: 0.14 });
    expect(PALIERS_QC[2026][0]).toMatchObject({ plafond: 54_345, taux: 0.14 });
  });

  it("1ʳᵉ tranche fédérale : 14,5 % (transition 2025) → 14 % (2026)", () => {
    expect(PALIERS_FEDERAL[2025][0].taux).toBeCloseTo(0.145, 4);
    expect(PALIERS_FEDERAL[2026][0].taux).toBeCloseTo(0.14, 4);
  });

  it("dernière tranche = taux marginal supérieur (plafond Infinity)", () => {
    for (const annee of [2025, 2026] as const) {
      expect(PALIERS_QC[annee].at(-1)).toMatchObject({ plafond: Infinity, taux: 0.2575 });
      expect(PALIERS_FEDERAL[annee].at(-1)).toMatchObject({ plafond: Infinity, taux: 0.33 });
    }
  });
});
