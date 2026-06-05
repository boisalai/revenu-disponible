// ===========================================================================
// Tests de fidélité — reproduisent les maximums et points de contrôle OFFICIELS.
// Chaque assertion correspond à une valeur publiée par une source citée dans
// docs/revenu-disponible.md. Un test qui casse = un écart avec la source officielle.
// ===========================================================================

import { describe, it, expect } from "vitest";
import {
  Situation,
  Menage,
  Enfant,
  cotisationRRQ,
  rrqMenage,
  cotisationRQAP,
  cotisationAE,
  cotisationFSS,
  fssMenage,
  primeRAMQparAdulte,
  ramqMenage,
  RAMQ,
  tauxCreditGarde,
  plafondFraisEnfant,
  creditFraisGarde,
  allocationFamille,
  allocationFamilleMenage,
  primeAuTravail,
  creditSolidarite,
  allocationLogement,
  ALLOCATION_LOGEMENT,
  montantSoutienAines,
  SOUTIEN_AINES,
  creditFraisMedicaux,
  FRAIS_MEDICAUX,
  aideSociale,
  allocationCanadienneEnfants,
  creditTPS,
  allocationTravailleurs,
  securiteVieillesse,
  supplementFraisMedicaux,
  impotFederalAdulte,
  impotFederalCouple,
  IMPOT_FEDERAL,
  impotQuebecAdulte,
  impotQuebecCouple,
  IMPOT_QUEBEC,
  supplementFournituresScolaires,
  revenuDisponible,
  calculerRevenuDisponible,
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

/** Enfant minimal pour les tests (âge donné, sans frais de garde). */
function enfant(age: number): Enfant {
  return { age, fraisGarde: 0, typeGarde: 0 };
}

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

describe("Poste 5 — RAMQ assurance médicaments (S11, S12)", () => {
  it("prime maximale par adulte : 744 $ (2025) / 766 $ (2026) — Annexe K, ligne 83", () => {
    expect(primeRAMQparAdulte(HAUT, 1, 0, 2025)).toBeCloseTo(744, 2);
    expect(primeRAMQparAdulte(HAUT, 1, 0, 2026)).toBeCloseTo(766, 2);
  });

  it("prime maximale du ménage : couple = 2 × prime/adulte (1 488 $ / 1 532 $)", () => {
    const couple = menage({ situation: Situation.Couple, revenu1: HAUT, revenu2: HAUT });
    expect(ramqMenage(couple, HAUT, 2025)).toBeCloseTo(1488, 2);
    expect(ramqMenage(couple, HAUT, 2026)).toBeCloseTo(1532, 2);
  });

  it("exonération (sans conjoint, 0 enfant) : nulle au seuil 19 890 $, due juste au-dessus", () => {
    expect(primeRAMQparAdulte(19_890, 1, 0, 2025)).toBe(0);
    expect(primeRAMQparAdulte(19_891, 1, 0, 2025)).toBeGreaterThan(0);
  });

  it("barème 2025 sans conjoint (Annexe K 2024) : 7,65 % puis 11,48 %", () => {
    // revenu familial 25 000 $ : base = 5 110 $ ⇒ 5 000 × 7,65 % + 110 × 11,48 %
    expect(primeRAMQparAdulte(25_000, 1, 0, 2025)).toBeCloseTo(382.5 + 12.628, 3); // 395,128 $
  });

  it("barème 2025 avec conjoint (Annexe K 2024) : demi-taux 3,84 % / 5,75 %", () => {
    // couple, revenu familial 40 000 $, 0 enfant : exonération 32 240 $ ⇒ base 7 760 $
    // par adulte : 5 000 × 3,84 % + 2 760 × 5,75 % = 350,70 ; ménage = 2 × = 701,40
    const couple = menage({ situation: Situation.Couple, revenu1: 40_000 });
    expect(ramqMenage(couple, 40_000, 2025)).toBeCloseTo(701.4, 2);
  });

  it("barème 2026 sans conjoint (Annexe K 2025) : 7,84 % puis 11,76 %", () => {
    // revenu familial 27 000 $ : exonération 20 290 $ ⇒ base 6 710 $
    // 5 000 × 7,84 % + 1 710 × 11,76 % = 392 + 201,096 = 593,096
    expect(primeRAMQparAdulte(27_000, 1, 0, 2026)).toBeCloseTo(593.096, 3);
  });

  it("seuils d'exonération selon la composition (Annexe K 2025)", () => {
    // 1 adulte + 1 enfant (32 240 $) = 2 adultes + 0 enfant ; 1 adulte + 2 enfants (36 460 $) = 2 adultes + 1 enfant
    expect(RAMQ[2025].exemption[1][1]).toBe(RAMQ[2025].exemption[2][0]);
    expect(RAMQ[2025].exemption[1][2]).toBe(RAMQ[2025].exemption[2][1]);
    // « 2 enfants ou plus » : même seuil (40 360 $) pour 2 et pour 5 enfants
    expect(primeRAMQparAdulte(40_360, 2, 2, 2025)).toBe(0);
    expect(primeRAMQparAdulte(40_360, 2, 5, 2025)).toBe(0);
  });
});

describe("Poste 6 — Frais de garde / crédit (S10, S13)", () => {
  it("taux du crédit selon le revenu familial net (barème 2025, MFQ tableau 5)", () => {
    expect(tauxCreditGarde(24_795, 2025)).toBeCloseTo(0.78, 4); // « sans excéder 24 795 »
    expect(tauxCreditGarde(24_796, 2025)).toBeCloseTo(0.75, 4);
    expect(tauxCreditGarde(50_195, 2025)).toBeCloseTo(0.71, 4);
    expect(tauxCreditGarde(119_835, 2025)).toBeCloseTo(0.7, 4);
    expect(tauxCreditGarde(119_836, 2025)).toBeCloseTo(0.67, 4); // plancher
    expect(tauxCreditGarde(1_000_000, 2025)).toBeCloseTo(0.67, 4);
  });

  it("taux du crédit (barème 2026 : seuils indexés)", () => {
    expect(tauxCreditGarde(25_305, 2026)).toBeCloseTo(0.78, 4);
    expect(tauxCreditGarde(122_290, 2026)).toBeCloseTo(0.7, 4);
    expect(tauxCreditGarde(122_291, 2026)).toBeCloseTo(0.67, 4);
  });

  it("plafond des frais admissibles par enfant selon l'âge (2025)", () => {
    expect(plafondFraisEnfant(5, 2025)).toBe(12_275); // moins de 7 ans (fichier : âge ≤ 5)
    expect(plafondFraisEnfant(6, 2025)).toBe(6_180); // autre enfant admissible
    expect(plafondFraisEnfant(15, 2025)).toBe(6_180);
    expect(plafondFraisEnfant(16, 2025)).toBe(0); // non admissible (< 16 en 2025)
  });

  it("changement d'âge d'admissibilité en 2026 (moins de 16 → moins de 14 ans)", () => {
    expect(plafondFraisEnfant(5, 2026)).toBe(12_525);
    expect(plafondFraisEnfant(13, 2026)).toBe(6_305);
    expect(plafondFraisEnfant(14, 2025)).toBe(6_180); // encore admissible en 2025
    expect(plafondFraisEnfant(14, 2026)).toBe(0); // plus admissible dès 2026
  });

  it("crédit = taux × min(plafonds, frais) ; arrondi à la cent", () => {
    // 1 enfant de 3 ans, 10 000 $ de frais, revenu 40 000 $ (taux 75 %) → 7 500 $
    expect(creditFraisGarde(40_000, [{ age: 3, fraisAdmissibles: 10_000 }], 2025)).toBeCloseTo(7500, 2);
    // plafond liant : 3 ans, 15 000 $ (> 12 275 $), revenu 20 000 $ (taux 78 %) → 0,78 × 12 275 = 9 574,50 $
    expect(creditFraisGarde(20_000, [{ age: 3, fraisAdmissibles: 15_000 }], 2025)).toBeCloseTo(9574.5, 2);
  });

  it("plafonnement agrégé sur plusieurs enfants (fidèle au fichier)", () => {
    // revenu 30 000 $ (taux 75 %) ; A : 3 ans 14 000 $ ; B : 10 ans 3 000 $
    // plafonds = 12 275 + 6 180 = 18 455 ; frais = 17 000 ; min = 17 000 ⇒ 0,75 × 17 000 = 12 750 $
    const enfants = [
      { age: 3, fraisAdmissibles: 14_000 },
      { age: 10, fraisAdmissibles: 3_000 },
    ];
    expect(creditFraisGarde(30_000, enfants, 2025)).toBeCloseTo(12_750, 2);
  });

  it("aucun frais admissible (place subventionnée ou enfant trop âgé) ⇒ crédit nul", () => {
    expect(creditFraisGarde(40_000, [{ age: 3, fraisAdmissibles: 0 }], 2025)).toBe(0);
    expect(creditFraisGarde(40_000, [{ age: 16, fraisAdmissibles: 5_000 }], 2025)).toBe(0); // 16 ans : non admissible
  });
});

describe("Poste 7 — Allocation famille / QC_sae (S10, S14)", () => {
  it("montants maximaux sous le seuil de réduction (2025)", () => {
    // couple, 2 enfants, revenu 30 000 $ (< 59 369) : 2 × 3 006 = 6 012, aucune réduction
    expect(allocationFamille(30_000, 2, 2, 2025)).toBeCloseTo(6012, 2);
    // monoparentale, 1 enfant, revenu 30 000 $ (< 43 280) : 3 006 + supplément 1 055 = 4 061
    expect(allocationFamille(30_000, 1, 1, 2025)).toBeCloseTo(4061, 2);
  });

  it("plancher : montant minimal versé quel que soit le revenu (2025)", () => {
    // couple, 2 enfants, très haut revenu : plancher = 2 × 1 196 = 2 392
    expect(allocationFamille(1_000_000, 2, 2, 2025)).toBeCloseTo(2392, 2);
    // monoparentale, 1 enfant : plancher = 1 196 + 421 = 1 617
    expect(allocationFamille(1_000_000, 1, 1, 2025)).toBeCloseTo(1617, 2);
  });

  it("réduction de 4 % au-delà du seuil (couple, 2025)", () => {
    // revenu 100 000 $ : réduction = (100 000 − 59 369) × 4 % = 1 625,24 ; 6 012 − 1 625,24 = 4 386,76
    expect(allocationFamille(100_000, 2, 2, 2025)).toBeCloseTo(4386.76, 2);
    // au seuil exact : aucune réduction ; juste au-dessus : légère réduction
    expect(allocationFamille(59_369, 2, 2, 2025)).toBeCloseTo(6012, 2);
    expect(allocationFamille(59_370, 2, 2, 2025)).toBeLessThan(6012);
  });

  it("seuil de réduction plus bas pour une famille monoparentale (43 280 < 59 369)", () => {
    // à 50 000 $ : le couple est encore au maximum, la monoparentale est déjà réduite
    expect(allocationFamille(50_000, 2, 2, 2025)).toBeCloseTo(6012, 2); // couple : < 59 369
    expect(allocationFamille(50_000, 1, 1, 2025)).toBeLessThan(4061); // mono : > 43 280, réduite
  });

  it("montants 2026 (indexés) et absence d'enfant", () => {
    expect(allocationFamille(30_000, 2, 2, 2026)).toBeCloseTo(6136, 2); // 2 × 3 068
    expect(allocationFamille(1_000_000, 2, 2, 2026)).toBeCloseTo(2442, 2); // plancher 2 × 1 221
    expect(allocationFamille(50_000, 0, 2, 2025)).toBe(0); // aucun enfant
  });

  it("ménage : monoparentale (situation) reçoit le supplément", () => {
    const mono = menage({
      situation: Situation.FamilleMonoparentale,
      revenu1: 30_000,
      enfants: [{ age: 4, fraisGarde: 0, typeGarde: 0 }],
    });
    expect(allocationFamilleMenage(mono, 30_000, 2025)).toBeCloseTo(4061, 2); // 3 006 + 1 055
  });
});

describe("Poste 8 — Prime au travail générale / QC_pt (S10, S15)", () => {
  it("primes maximales par type de ménage (2025), atteintes au seuil de réduction", () => {
    // chaque prime max est atteinte quand revenu de travail = seuil de réduction, avant toute réduction
    expect(primeAuTravail(12_620, 12_620, 1, false, 2025)).toBeCloseTo(1185.52, 2); // personne seule
    expect(primeAuTravail(19_534, 19_534, 2, false, 2025)).toBeCloseTo(1848.34, 2); // couple sans enfants
    expect(primeAuTravail(12_620, 12_620, 1, true, 2025)).toBeCloseTo(3066, 2); // monoparentale
    expect(primeAuTravail(19_534, 19_534, 2, true, 2025)).toBeCloseTo(3983.5, 2); // couple avec enfants
  });

  it("croissance : 11,6 % (sans enfant) / 30 % (monoparentale) sur le revenu de travail excédant l'exclu", () => {
    // personne seule, travail 8 000 $ : (8 000 − 2 400) × 11,6 % = 649,60
    expect(primeAuTravail(8_000, 8_000, 1, false, 2025)).toBeCloseTo(649.6, 2);
    // monoparentale, travail 6 000 $ : (6 000 − 2 400) × 30 % = 1 080
    expect(primeAuTravail(6_000, 6_000, 1, true, 2025)).toBeCloseTo(1080, 2);
    // au revenu de travail exclu : aucune prime
    expect(primeAuTravail(2_400, 2_400, 1, false, 2025)).toBe(0);
  });

  it("réduction de 10 % du revenu familial net au-delà du seuil, jusqu'à épuisement (personne seule, 2025)", () => {
    // revenu 20 000 $ : 1 185,52 − (20 000 − 12 620) × 10 % = 1 185,52 − 738 = 447,52
    expect(primeAuTravail(20_000, 20_000, 1, false, 2025)).toBeCloseTo(447.52, 2);
    // revenu élevé : prime épuisée
    expect(primeAuTravail(30_000, 30_000, 1, false, 2025)).toBe(0);
  });

  it("croissance sur le travail, réduction sur le revenu familial (bases distinctes)", () => {
    // travail élevé (plafond atteint) mais revenu familial au seuil ⇒ prime maximale, aucune réduction
    expect(primeAuTravail(40_000, 12_620, 1, false, 2025)).toBeCloseTo(1185.52, 2);
  });

  it("montants 2026 (indexés)", () => {
    expect(primeAuTravail(12_808, 12_808, 1, true, 2026)).toBeCloseTo(3122.4, 2); // monoparentale max
    expect(primeAuTravail(19_828, 19_828, 2, true, 2026)).toBeCloseTo(4057, 2); // couple avec enfants max
  });
});

describe("Poste 9 — Crédit pour la solidarité / QC_sol (S10, S16)", () => {
  it("montants sous le seuil de réduction (2025) : volets TVQ + logement", () => {
    // personne seule, 0 enfant : TVQ (356 + 169) + logement 731 = 1 256
    expect(creditSolidarite(30_000, 1, 0, 2025)).toBeCloseTo(1256, 2);
    // couple, 0 enfant : TVQ (356 + 356) + logement 888 = 1 600
    expect(creditSolidarite(30_000, 2, 0, 2025)).toBeCloseTo(1600, 2);
    // couple, 2 enfants : 712 + (888 + 2 × 155) = 712 + 1 198 = 1 910
    expect(creditSolidarite(30_000, 2, 2, 2025)).toBeCloseTo(1910, 2);
  });

  it("réduction de 6 % du revenu familial net au-delà de 42 325 $ (2025)", () => {
    // 50 000 $ : 1 256 − (50 000 − 42 325) × 6 % = 1 256 − 460,50 = 795,50
    expect(creditSolidarite(50_000, 1, 0, 2025)).toBeCloseTo(795.5, 2);
    // au seuil exact : aucune réduction ; juste au-dessus : réduit
    expect(creditSolidarite(42_325, 1, 0, 2025)).toBeCloseTo(1256, 2);
    expect(creditSolidarite(42_326, 1, 0, 2025)).toBeLessThan(1256);
    // revenu élevé : crédit épuisé (plancher 0)
    expect(creditSolidarite(100_000, 1, 0, 2025)).toBe(0);
  });

  it("montants 2026 (indexés, juillet 2026–juin 2027)", () => {
    // couple, 0 enfant : (363 + 363) + 906 = 1 632
    expect(creditSolidarite(30_000, 2, 0, 2026)).toBeCloseTo(1632, 2);
    // personne seule, 1 enfant : (363 + 172) + (746 + 158) = 535 + 904 = 1 439
    expect(creditSolidarite(30_000, 1, 1, 2026)).toBeCloseTo(1439, 2);
  });
});

describe("Poste 10 — Allocation-logement / QC_al (S17)", () => {
  it("paliers d'effort logement → 100/150/170 $/mois (couple, 2 enfants, 2025)", () => {
    // loyer imputé 1 380 $/mois ⇒ effort = 16 560 / revenu
    expect(allocationLogement(20_000, 40, 2, 2, 2025)).toBeCloseTo(2040, 2); // effort 0,828 ≥ 80 % → 170 × 12
    expect(allocationLogement(35_000, 40, 2, 2, 2025)).toBeCloseTo(1200, 2); // effort 0,473 ∈ [30, 50 %) → 100 × 12
  });

  it("admissibilité : 50 ans ou enfant à charge", () => {
    expect(allocationLogement(15_000, 40, 1, 0, 2025)).toBe(0); // 40 ans, sans enfant : non admissible
    expect(allocationLogement(15_000, 55, 1, 0, 2025)).toBeCloseTo(1800, 2); // 55 ans : admissible (effort 0,685 → 150 × 12)
  });

  it("réduction dollar pour dollar au-delà du seuil (couple 2 enf., seuil 44 600 $, 2025)", () => {
    expect(allocationLogement(45_000, 40, 2, 2, 2025)).toBeCloseTo(800, 2); // 1 200 − (45 000 − 44 600)
    expect(allocationLogement(50_000, 40, 2, 2, 2025)).toBe(0); // épuisé
  });

  it("effort < 30 % ⇒ aucune allocation", () => {
    expect(allocationLogement(40_000, 55, 1, 0, 2025)).toBe(0); // effort 0,257 < 30 %
  });

  it("seuils indexés 2026", () => {
    expect(ALLOCATION_LOGEMENT[2026].seuilSeul0).toBe(22_900);
    expect(ALLOCATION_LOGEMENT[2026].seuilHaut).toBe(45_500);
  });
});

describe("Poste 11 — Soutien aux aînés / QC_aines (S10, S18)", () => {
  it("montant maximal 2 000 $ par aîné de 70 ans et plus, sous le seuil (2025)", () => {
    expect(montantSoutienAines(27_835, 1, 72, 0, 2025)).toBeCloseTo(2000, 2); // 1 aîné, au seuil
    expect(montantSoutienAines(45_270, 2, 72, 72, 2025)).toBeCloseTo(4000, 2); // couple, les deux 70+
    expect(montantSoutienAines(45_270, 2, 72, 65, 2025)).toBeCloseTo(2000, 2); // couple, un seul 70+
  });

  it("admissibilité : aucun adulte de 70 ans ⇒ crédit nul", () => {
    expect(montantSoutienAines(20_000, 1, 68, 0, 2025)).toBe(0);
    expect(montantSoutienAines(20_000, 2, 69, 65, 2025)).toBe(0);
  });

  it("réduction de 5,40 % du revenu familial net au-delà du seuil (2025)", () => {
    // 2 000 − (40 000 − 27 835) × 5,40 % = 2 000 − 656,91 = 1 343,09
    expect(montantSoutienAines(40_000, 1, 72, 0, 2025)).toBeCloseTo(1343.09, 2);
    expect(montantSoutienAines(70_000, 1, 72, 0, 2025)).toBe(0); // épuisé
  });

  it("taux et seuils indexés 2026 (5,47 % ; 28 405 / 46 200 $)", () => {
    expect(montantSoutienAines(28_405, 1, 72, 0, 2026)).toBeCloseTo(2000, 2);
    expect(SOUTIEN_AINES[2026].tauxReduction).toBeCloseTo(0.0547, 4);
    expect(SOUTIEN_AINES[2026].seuilCouple).toBe(46_200);
  });
});

describe("Poste 12 — Frais médicaux QC / QC_medic (S10, S19)", () => {
  it("paramètres confirmés (MFQ) : max 1 466/1 496 $, revenu travail min 3 750/3 825 $, seuil 28 335/28 915 $", () => {
    expect(FRAIS_MEDICAUX[2025]).toMatchObject({ creditMax: 1466, revenuTravailMin: 3750, seuilReduction: 28_335 });
    expect(FRAIS_MEDICAUX[2026]).toMatchObject({ creditMax: 1496, revenuTravailMin: 3825, seuilReduction: 28_915 });
  });

  it("régime du modèle : frais (prime RAMQ) sous 3 % du revenu ⇒ crédit nul", () => {
    expect(creditFraisMedicaux(744, 50_000, 30_000, 2025)).toBe(0); // 744 < 3 % × 30 000 = 900
    expect(creditFraisMedicaux(1488, 50_000, 40_000, 2025)).toBe(0); // frais admissibles minimes, épuisés
  });

  it("admissibilité : revenu de travail sous le minimum ⇒ crédit nul", () => {
    expect(creditFraisMedicaux(10_000, 3000, 20_000, 2025)).toBe(0); // 3 000 < 3 750
  });

  it("reproduit la forme ANOMALE du code : crédit plafonné à creditMax × 5 % (≈ 73 $), jamais le vrai 1 466 $", () => {
    // frais 10 000 $, revenu 20 000 $ : crédit = min(0,25 × 9 400, 1 466) = 1 466 ; excédent = 0
    // forme du code (1 466 − 0) × 5 % = 73,30 — illustre l'anomalie (jamais exercée dans le modèle, QC_medic ≡ 0)
    expect(creditFraisMedicaux(10_000, 50_000, 20_000, 2025)).toBeCloseTo(73.3, 2);
  });
});

describe("Poste 13 — Aide de dernier recours / QC_adr (S20)", () => {
  it("prestation de base annuelle selon la composition et l'âge (revenu nul, 2025)", () => {
    expect(aideSociale(0, 1, 40, 0, 0, 2025)).toBeCloseTo(10_548, 2); // seul < 50 sans enfant : (829 + 50) × 12
    expect(aideSociale(0, 1, 52, 0, 0, 2025)).toBeCloseTo(9948, 2); // seul 50-57 : 829 × 12
    expect(aideSociale(0, 1, 60, 0, 0, 2025)).toBeCloseTo(11_940, 2); // seul 58+ (contraintes) : (829 + 166) × 12
    expect(aideSociale(0, 2, 60, 60, 0, 2025)).toBeCloseTo(18_516, 2); // couple, les deux 58+ : (1 258 + 285) × 12
  });

  it("montants 2026 confirmés (quebec.ca) : 845 $ seul / 1 283 $ couple par mois", () => {
    expect(aideSociale(0, 1, 52, 0, 0, 2026)).toBeCloseTo(10_140, 2); // 845 × 12
    expect(aideSociale(0, 2, 40, 40, 0, 2026)).toBeCloseTo(15_396, 2); // 1 283 × 12
  });

  it("aucune aide à 65 ans et plus (PSV/SRG)", () => {
    expect(aideSociale(0, 1, 66, 0, 0, 2025)).toBe(0);
    expect(aideSociale(0, 2, 40, 66, 0, 2025)).toBe(0); // un seul conjoint de 65+ ⇒ 0
  });

  it("exemption de gains de travail (200 $/mois seul) puis incitation de 25 %", () => {
    expect(aideSociale(2400, 1, 40, 0, 0, 2025)).toBeCloseTo(10_548, 2); // 2 400 $/an = 200 $/mois exemptés : aucune réduction
    // revenu net 6 000 $/an (500 $/mois) : compté = 300 ; (829+50 − 300) + 25 %×300 = 579 + 75 = 654 → ×12
    expect(aideSociale(6000, 1, 40, 0, 0, 2025)).toBeCloseTo(7848, 2);
  });

  it("la prestation de base n'inclut pas de montant pour enfant (couvert par l'Allocation famille)", () => {
    // famille monoparentale (avec enfant) : pas le +50 « jeune seul » ⇒ 829 × 12
    expect(aideSociale(0, 1, 40, 0, 2, 2025)).toBeCloseTo(9948, 2);
  });
});

describe("Poste 14 — Allocation canadienne pour enfants / CA_ace (S21)", () => {
  it("montants maximaux sous le seuil (juillet 2025) : 7 997 $ (<6 ans), 6 748 $ (6-17)", () => {
    expect(allocationCanadienneEnfants(30_000, 1, 1, 2025)).toBeCloseTo(7997, 2); // 1 enfant de moins de 6 ans
    expect(allocationCanadienneEnfants(30_000, 1, 0, 2025)).toBeCloseTo(6748, 2); // 1 enfant de 6 à 17 ans
    expect(allocationCanadienneEnfants(30_000, 2, 1, 2025)).toBeCloseTo(14_745, 2); // 7 997 + 6 748
  });

  it("réduction 1ᵉʳ palier (7 % à 1 enfant) au-delà de 37 487 $", () => {
    // AFNI 50 000 : 7 997 − 7 % × (50 000 − 37 487) = 7 997 − 875,91 = 7 121,09
    expect(allocationCanadienneEnfants(50_000, 1, 1, 2025)).toBeCloseTo(7121.09, 2);
  });

  it("réduction 2ᵉ palier (au-delà de 81 222 $, 1 enfant)", () => {
    // AFNI 100 000 : 7 997 − 7 % × 43 735 − 3,2 % × 18 778 = 7 997 − 3 662,35 = 4 334,65
    expect(allocationCanadienneEnfants(100_000, 1, 1, 2025)).toBeCloseTo(4334.65, 2);
  });

  it("aucun enfant ⇒ 0 ; revenu très élevé ⇒ 0", () => {
    expect(allocationCanadienneEnfants(50_000, 0, 0, 2025)).toBe(0);
    expect(allocationCanadienneEnfants(300_000, 2, 1, 2025)).toBe(0);
  });

  it("montants indexés juillet 2026 (8 157 $ / 6 883 $)", () => {
    expect(allocationCanadienneEnfants(30_000, 1, 1, 2026)).toBeCloseTo(8157, 2);
    expect(allocationCanadienneEnfants(30_000, 1, 0, 2026)).toBeCloseTo(6883, 2);
  });
});

describe("Poste 15 — Crédit pour la TPS/TVH / CA_tps (S22)", () => {
  it("montants de base (juillet 2025) : 349 $/adulte, 184 $/enfant", () => {
    expect(creditTPS(30_000, 2, 0, 2025)).toBeCloseTo(698, 2); // couple : 2 × 349
    expect(creditTPS(30_000, 2, 2, 2025)).toBeCloseTo(1066, 2); // 2 × 349 + 2 × 184
    expect(creditTPS(30_000, 1, 1, 2025)).toBeCloseTo(882, 2); // monoparentale : 349 + 184 + supplément 349
  });

  it("supplément pour personne seule : 2 % du revenu au-delà de 11 337 $, plafonné à 184 $", () => {
    expect(creditTPS(10_000, 1, 0, 2025)).toBeCloseTo(349, 2); // sous le seuil : aucun supplément
    expect(creditTPS(15_000, 1, 0, 2025)).toBeCloseTo(422.26, 2); // 349 + 2 % × (15 000 − 11 337)
    expect(creditTPS(30_000, 1, 0, 2025)).toBeCloseTo(533, 2); // supplément plafonné : 349 + 184
  });

  it("réduction de 5 % au-delà de 45 521 $, jusqu'à épuisement", () => {
    expect(creditTPS(60_000, 2, 2, 2025)).toBeCloseTo(342.05, 2); // 1 066 − 5 % × (60 000 − 45 521)
    expect(creditTPS(60_000, 1, 0, 2025)).toBe(0); // épuisé
  });

  it("montants indexés juillet 2026 (356 $/adulte, 187 $/enfant)", () => {
    expect(creditTPS(30_000, 2, 0, 2026)).toBeCloseTo(712, 2); // 2 × 356
    expect(creditTPS(30_000, 2, 2, 2026)).toBeCloseTo(1086, 2); // 2 × 356 + 2 × 187
  });
});

describe("Poste 16 — Allocation canadienne pour les travailleurs / CA_pfrt (S23)", () => {
  // AFNI contrôlé pour isoler chaque phase (en pratique l'AFNI inclut l'aide sociale).
  it("accumulation : 37,3 % du revenu de travail au-delà de l'exclusion (personne seule, 2025)", () => {
    // travail 8 000 $ : (8 000 − 2 400) × 37,3 % = 2 088,80 ; AFNI sous le seuil ⇒ aucune réduction
    expect(allocationTravailleurs(8000, 0, 8000, 1, false, 2025)).toBeCloseTo(2088.8, 2);
  });

  it("prime maximale atteinte au plafond (personne seule : 3 812,06 $ ; couple : 5 943,38 $)", () => {
    expect(allocationTravailleurs(20_000, 0, 14_170.05, 1, false, 2025)).toBeCloseTo(3812.06, 2); // plafond seul
    expect(allocationTravailleurs(20_000, 0, 21_787.19, 2, false, 2025)).toBeCloseTo(5943.38, 2); // plafond couple
  });

  it("réduction de 20 % du revenu familial au-delà du seuil (personne seule, 2025)", () => {
    // AFNI 30 000 : 3 812,06 − (30 000 − 14 170,05) × 20 % = 3 812,06 − 3 165,99 = 646,07
    expect(allocationTravailleurs(20_000, 0, 30_000, 1, false, 2025)).toBeCloseTo(646.07, 2);
  });

  it("taux d'accumulation distincts avec enfants (mono 20 % ; couple 23,9 %)", () => {
    expect(allocationTravailleurs(8000, 0, 8000, 1, true, 2025)).toBeCloseTo(1120, 2); // mono : (8 000 − 2 400) × 20 %
    expect(allocationTravailleurs(12_000, 0, 12_000, 2, true, 2025)).toBeCloseTo(2007.6, 2); // couple : (12 000 − 3 600) × 23,9 %
  });

  it("plafond indexé 2026 (personne seule : 3 882,18 $)", () => {
    expect(allocationTravailleurs(20_000, 0, 14_484.06, 1, false, 2026)).toBeCloseTo(3882.18, 2);
  });
});

describe("Poste 17 — Sécurité de la vieillesse / PSV + SRG + Allocation (S24)", () => {
  // Montants = moyenne des 4 trimestres (paramètres révisés tous les 3 mois).
  it("personne seule de 65-74 ans, revenu nul : PSV + SRG + supplément maximaux (2025)", () => {
    // 8 791,14 (PSV) + 11 096,85 (SRG) + 2 033,97 (supplément) = 21 921,96
    expect(securiteVieillesse(70, 0, 0, 0, 1, 2025)).toBeCloseTo(21_921.96, 2);
  });

  it("supplément de 75 ans et plus s'ajoute à la PSV (+879,15 $ en 2025)", () => {
    const a = securiteVieillesse(76, 0, 0, 0, 1, 2025) - securiteVieillesse(70, 0, 0, 0, 1, 2025);
    expect(a).toBeCloseTo(879.15, 2);
  });

  it("récupération complète de la PSV à revenu élevé ⇒ aucune prestation", () => {
    expect(securiteVieillesse(70, 0, HAUT, 0, 1, 2025)).toBe(0);
  });

  it("couple, les deux de 65 ans et plus, revenu nul : PSV ×2 + SRG ×2 + supplément couple (2025)", () => {
    // 8 791,14 ×2 + 7 327,65 ×2 + 1 152,60 = 33 390,18
    expect(securiteVieillesse(70, 70, 0, 0, 2, 2025)).toBeCloseTo(33_390.18, 2);
  });

  it("Allocation maximale (16 695,09 $) pour un conjoint de 60-64 ans avec conjoint de 65 ans et plus, revenu nul", () => {
    // Conjoint 65+ : PSV 8 791,14 + SRG 7 327,65 + demi-supplément 576,30 = 16 695,09 ; + Allocation 16 695,09
    expect(securiteVieillesse(62, 70, 0, 0, 2, 2025)).toBeCloseTo(33_390.18, 2);
  });

  it("⚠️ asymétrie MFQ : supplément complémentaire entier si le 65+ est l'adulte 1, demi sinon", () => {
    // 65+ = adulte 1 (70/60) : supplément ENTIER (1 152,60) ⇒ 33 966,48 ; 65+ = adulte 2 (62/70) : demi ⇒ 33 390,18
    expect(securiteVieillesse(70, 60, 0, 0, 2, 2025)).toBeCloseTo(33_966.48, 2);
    expect(securiteVieillesse(62, 70, 0, 0, 2, 2025)).toBeCloseTo(33_390.18, 2);
  });

  it("paramètres indexés 2026 : personne seule de 65-74 ans, revenu nul (22 360,40 $)", () => {
    // 8 966,96 + 11 318,79 + 2 074,65 = 22 360,40
    expect(securiteVieillesse(70, 0, 0, 0, 1, 2026)).toBeCloseTo(22_360.4, 2);
  });
});

describe("Poste 18 — Supplément remboursable pour frais médicaux fédéral / CA_medic (S25)", () => {
  // Art. 122.51 LIR (ligne 45200). Frais admissibles isolés en mettant revenuNet et AFNI à 0.
  it("supplément maximal atteint (1 504 $ en 2025 ; 1 534 $ en 2026)", () => {
    expect(supplementFraisMedicaux(10_000, 50_000, 0, 0, 2025)).toBeCloseTo(1504, 2); // 25 % × 10 000 = 2 500, plafonné à 1 504
    expect(supplementFraisMedicaux(10_000, 50_000, 0, 0, 2026)).toBeCloseTo(1534, 2);
  });

  it("25 % des frais admissibles sous le plafond", () => {
    expect(supplementFraisMedicaux(4000, 50_000, 0, 0, 2025)).toBeCloseTo(1000, 2); // 25 % × 4 000
  });

  it("aucune admissibilité sous le revenu de travail minimal (4 390 $ en 2025)", () => {
    expect(supplementFraisMedicaux(10_000, 4389, 0, 0, 2025)).toBe(0);
    expect(supplementFraisMedicaux(10_000, 4390, 0, 0, 2025)).toBeCloseTo(1504, 2); // au seuil : admissible
  });

  it("réduction de 5 % de l'excédent du revenu familial net rajusté fédéral au-delà de 33 294 $ (2025)", () => {
    // AFNI = 43 294 ⇒ réduction 5 % × 10 000 = 500 ⇒ 1 504 − 500 = 1 004
    expect(supplementFraisMedicaux(10_000, 50_000, 0, 43_294, 2025)).toBeCloseTo(1004, 2);
  });

  it("supplément éliminé au plafond de revenu (63 374 $ en 2025)", () => {
    // 1 504 − 5 % × (63 374 − 33 294) = 1 504 − 1 504 = 0
    expect(supplementFraisMedicaux(10_000, 50_000, 0, 63_374, 2025)).toBe(0);
  });

  it("⚠️ réalité du modèle : avec la seule prime RAMQ (≈ 700 $), les frais ne dépassent pas le plancher de 3 % ⇒ 0", () => {
    expect(supplementFraisMedicaux(700, 50_000, 30_000, 30_000, 2025)).toBe(0); // 700 − min(900, 2 834) < 0
  });
});

describe("Poste 19 — Impôt fédéral, couche 1 : 1 adulte (S2, S26)", () => {
  it("montant personnel de base fédéral : 16 129 $ (2025) / 16 452 $ (2026), bonification incluse", () => {
    expect(IMPOT_FEDERAL[2025].bpaBase + IMPOT_FEDERAL[2025].bpaBonif).toBe(16_129);
    expect(IMPOT_FEDERAL[2026].bpaBase + IMPOT_FEDERAL[2026].bpaBonif).toBe(16_452);
  });

  it("montant en raison de l'âge (9 028 $) et montant pour pension (2 000 $) — 2025", () => {
    expect(IMPOT_FEDERAL[2025].ageMontant).toBe(9028);
    expect(IMPOT_FEDERAL[2025].pensionMax).toBe(2000);
  });

  it("abattement du Québec : 16,5 % de l'impôt fédéral", () => {
    expect(IMPOT_FEDERAL[2025].abattementQc).toBe(0.165);
  });

  it("personne seule active : 50 000 $ ⇒ 3 453,30 $ ; 25 000 $ ⇒ 674,75 $ (2025)", () => {
    expect(impotFederalAdulte(50_000, 40, false, false, 2025)).toBeCloseTo(3453.3, 2);
    expect(impotFederalAdulte(25_000, 40, false, false, 2025)).toBeCloseTo(674.75, 2);
  });

  it("retraité 72 ans, pension 30 000 $ ⇒ 1 408,60 $ (PSV imposable + âge + pension) (2025)", () => {
    expect(impotFederalAdulte(30_000, 72, true, false, 2025)).toBeCloseTo(1408.6, 2);
  });

  it("revenu sous le montant de base ⇒ aucun impôt fédéral", () => {
    expect(impotFederalAdulte(12_000, 40, false, false, 2025)).toBe(0);
  });

  it("couple deux revenus 50 000/30 000 ⇒ 4 611,61 $ (crédit médical du couple sur le 2ᵉ revenu)", () => {
    expect(impotFederalCouple(50_000, 40, 30_000, 40, false, 1488, 2025)).toBeCloseTo(4611.61, 2);
  });

  it("couple de retraités 30 000/0 ⇒ 0 $ (montant pour conjoint + transfert de l'âge inutilisé)", () => {
    expect(impotFederalCouple(30_000, 70, 0, 70, true, 496.12, 2025)).toBeCloseTo(0, 2);
  });
});

describe("Poste 19 — Impôt du Québec, couche 2 : 1 adulte (S1, S26)", () => {
  it("montant personnel de base QC : 18 571 $ (2025) / 18 952 $ (2026)", () => {
    expect(IMPOT_QUEBEC[2025].bpa).toBe(18_571);
    expect(IMPOT_QUEBEC[2026].bpa).toBe(18_952);
  });

  it("montant vivant seul (2 128 $), âge (3 906 $), déduction travailleur (max 1 420 $) — 2025", () => {
    expect(IMPOT_QUEBEC[2025].montantSeul).toBe(2128);
    expect(IMPOT_QUEBEC[2025].ageMontant).toBe(3906);
    expect(IMPOT_QUEBEC[2025].deducTravailleurMax).toBe(1420);
  });

  it("personne seule active : 50 000 $ ⇒ 3 996,40 $ ; 25 000 $ ⇒ 373,24 $ (2025)", () => {
    expect(impotQuebecAdulte(50_000, 40, false, true, 2025)).toBeCloseTo(3996.4, 2);
    expect(impotQuebecAdulte(25_000, 40, false, true, 2025)).toBeCloseTo(373.24, 2);
  });

  it("retraité 72 ans, pension 30 000 $ ⇒ 1 500,26 $ (vivant seul + âge + pension, montant réduit) (2025)", () => {
    expect(impotQuebecAdulte(30_000, 72, true, true, 2025)).toBeCloseTo(1500.26, 2);
  });

  it("montant combiné (seul + âge + pension) réduit de 18,75 % au-delà de 42 090 $ ⇒ nul à haut revenu", () => {
    // à 100 000 $, le montant combiné est entièrement résorbé : crédit = BPA seul
    expect(impotQuebecAdulte(100_000, 40, false, true, 2025)).toBeCloseTo(13_263.45, 2);
  });

  it("couple actif 50 000/0 ⇒ 1 527,31 $ (transfert du BPA inutilisé du conjoint sans revenu)", () => {
    expect(impotQuebecCouple(50_000, 40, 0, 40, false, 1488, 2025)).toBeCloseTo(1527.31, 2);
  });

  it("couple de retraités 30 000/0 ⇒ 14,23 $ (montant combiné des deux conjoints + transfert)", () => {
    expect(impotQuebecCouple(30_000, 70, 0, 70, true, 1488, 2025)).toBeCloseTo(14.23, 2);
  });
});

describe("Poste 20 — Revenu disponible / RD (agrégation)", () => {
  it("agrégation : revenu − cotisations + transferts QC − impôt QC + transferts féd. − impôt féd.", () => {
    // personne seule 50 000 $ (2025) : composantes vérifiées du modèle
    const rd = revenuDisponible({
      revenu: 50_000,
      cotisations: 4622, // RRQ 2976 + RQAP 247 + AE 655 + RAMQ 744
      transfertsQuebec: 908.6, // crédit solidarité
      impotQuebec: 3996.4,
      transfertsFederaux: 332.3, // crédit TPS
      impotFederal: 3453.3,
      fraisGarde: 0,
    });
    expect(rd).toBeCloseTo(39_169.2, 2);
  });

  it("supplément pour fournitures scolaires : 124 $/enfant de 4-16 ans (2025) ; 127 $ (2026)", () => {
    const m = menage({ situation: Situation.FamilleMonoparentale, enfants: [enfant(5), enfant(10)] });
    expect(supplementFournituresScolaires(m, 2025)).toBe(248); // 2 × 124
    expect(supplementFournituresScolaires(m, 2026)).toBe(254); // 2 × 127
  });

  it("fournitures scolaires : enfants hors de la tranche 4-16 ans exclus", () => {
    const m = menage({ situation: Situation.Couple, enfants: [enfant(3), enfant(17), enfant(8)] });
    expect(supplementFournituresScolaires(m, 2025)).toBe(124); // seul l'enfant de 8 ans compte
  });

  it("orchestrateur de bout en bout : personne seule 50 000 $ ⇒ RD 39 169,20 $ (2025)", () => {
    const r = calculerRevenuDisponible(menage({ situation: Situation.PersonneSeule, revenu1: 50_000, ageAdulte1: 40 }), 2025);
    expect(r.revenuDisponible).toBeCloseTo(39_169.2, 2);
    expect(r.revenuNetFamilial).toBeCloseTo(48_115, 2); // revenu net familial reconstruit
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
