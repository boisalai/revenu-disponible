// ===========================================================================
// Tests de PARITÉ : notre reconstruction reproduit-elle exactement les sorties de
// revenu-disponible_dec2025.js ? On exécute le calc() de la référence (chargé en Node)
// et on compare ses sorties aux nôtres, sur une grille de scénarios.
//
// Conventions de signe de la référence : les cotisations (RRQ, RQAP, AE, FSS, RAMQ) sont
// stockées en NÉGATIF (elles réduisent le revenu disponible) ; les transferts (Allocation
// famille, solidarité…) en POSITIF. Nos fonctions renvoient des montants positifs.
//
// Postes 5/7/9 (RAMQ, Allocation famille, solidarité) : modulés sur le revenu familial net
// que la référence calcule en interne (cotisations déduites). On le récupère via `_rfn_old`
// / `_rfn_new` (exposé par le chargeur) et on le fournit à nos fonctions → comparaison exacte.
// Postes 6 (frais de garde) et 8 (prime au travail) : nécessitent aussi les frais
// admissibles / le revenu de travail internes — couverts une fois le module d'impôt construit.
// ===========================================================================

import { describe, it, expect } from "vitest";
import { calcReference } from "./reference/load-reference";
import {
  Situation,
  SITUATIONS,
  TypeGarde,
  Menage,
  rrqMenage,
  rqapMenage,
  aeMenage,
  fssMenage,
  ramqMenage,
  allocationFamille,
  creditSolidarite,
  creditFraisGarde,
  primeAuTravail,
  allocationLogementMenage,
  montantSoutienAinesMenage,
  creditFraisMedicaux,
  aideSocialeMenage,
  allocationCanadienneEnfantsMenage,
  creditTPSMenage,
  allocationTravailleursMenage,
  securiteVieillesseMenage,
  supplementFraisMedicaux,
  impotFederalMenage,
  impotQuebecMenage,
  supplementFournituresScolaires,
  revenuDisponible,
  calculerRevenuDisponible,
  PARAMETRES_OFFICIELS,
} from "../src/index";

function menage(p: Partial<Menage> & Pick<Menage, "situation">): Menage {
  return { revenu1: 0, revenu2: 0, ageAdulte1: 40, ageAdulte2: 40, enfants: [], ...p };
}

const enfant = (age: number) => ({ age, fraisGarde: 0, typeGarde: 0 });

/** Convertit un ménage en entrées pour la référence (le libellé = SITUATIONS[s].libelle). */
function entrees(m: Menage) {
  return {
    Situation: SITUATIONS[m.situation].libelle,
    Revenu1: m.revenu1,
    AgeAdulte1: m.ageAdulte1,
    Revenu2: m.revenu2,
    AgeAdulte2: m.ageAdulte2,
    enfants: m.enfants.map((e) => ({
      age: e.age,
      frais: e.fraisGarde,
      typeGarde: e.fraisGarde > 0 ? (e.typeGarde === TypeGarde.NonSubventionne ? "Non subventionnée" : "Subventionnée") : "",
    })),
  };
}

function nomCas(m: Menage): string {
  const parts = [`${SITUATIONS[m.situation].libelle}, R1=${m.revenu1}`];
  if (m.revenu2) parts.push(`R2=${m.revenu2}`);
  if (m.enfants.length) parts.push(`${m.enfants.length} enf.`);
  return parts.join(", ");
}

/** Étiquette lisible (situation, âges, revenus, enfants) — pour identifier un cas en échec. */
function nomGrille(m: Menage): string {
  const couple = m.situation === Situation.Couple || m.situation === Situation.CoupleRetraites;
  const ages = couple ? `${m.ageAdulte1}/${m.ageAdulte2} ans` : `${m.ageAdulte1} ans`;
  const rev = m.revenu2 ? `${m.revenu1}+${m.revenu2} $` : `${m.revenu1} $`;
  const frais = m.enfants.some((e) => e.fraisGarde > 0) ? " +frais" : "";
  const enf = m.enfants.length ? `, ${m.enfants.length} enf.${frais}` : "";
  return `${SITUATIONS[m.situation].libelle}, ${ages}, ${rev}${enf}`;
}

/** Compare au demi-cent si `tolCents = 0` (strict), sinon à `tolCents` cent(s) près. */
function proche(actual: number, expected: number, tolCents: number) {
  if (tolCents <= 0) expect(actual).toBeCloseTo(expected, 2);
  else expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolCents / 100 + 1e-9);
}

/**
 * Parité bout-en-bout : bases de revenu, ventilation 2025 par poste, et RD final 2025 + 2026.
 * `tolCents > 0` absorbe les artéfacts d'arrondi au demi-cent (virgule flottante) ; un vrai écart de
 * modèle reste ≫ 1 cent (cf. ACT 23 $, RAMQ 155 $). La grille de base reste stricte (`tolCents = 0`).
 */
function verifierParite(m: Menage, tolCents = 0) {
  const co = calcReference(entrees(m));
  const r25 = calculerRevenuDisponible(m, 2025);
  const r26 = calculerRevenuDisponible(m, 2026);
  // bases de revenu reconstruites
  proche(r25.revenuNetFamilial, co._rfn_old, tolCents);
  proche(r25.afni, co._afni_old, tolCents);
  // ventilation poste par poste (nos montants positifs ; réf. négative pour cotisations/impôts)
  const d = r25.detail;
  proche(d.cotisations.rrq, -co.CA_rrq_old, tolCents);
  proche(d.cotisations.rqap, -co.QC_rqap_old, tolCents);
  proche(d.cotisations.assuranceEmploi, -co.CA_ae_old, tolCents);
  proche(d.cotisations.fss, -co.QC_fss_old, tolCents);
  proche(d.cotisations.ramq, -co.QC_ramq_old, tolCents);
  proche(d.transfertsQuebec.allocationFamille, co.QC_sae_old, tolCents);
  proche(d.transfertsQuebec.primeTravail, co.QC_pt_old, tolCents);
  proche(d.transfertsQuebec.solidarite, co.QC_sol_old, tolCents);
  proche(d.transfertsQuebec.allocationLogement, co.QC_al_old, tolCents);
  proche(d.transfertsQuebec.soutienAines, co.QC_aines_old, tolCents);
  proche(d.transfertsQuebec.aideSociale, co.QC_adr_old, tolCents);
  proche(d.impotQuebec, -co.QC_impot_old, tolCents);
  proche(d.transfertsFederaux.allocationEnfants, co.CA_ace_old, tolCents);
  proche(d.transfertsFederaux.creditTPS, co.CA_tps_old, tolCents);
  proche(d.transfertsFederaux.allocationTravailleurs, co.CA_pfrt_old, tolCents);
  proche(d.transfertsFederaux.securiteVieillesse, co.CA_psv_old, tolCents);
  proche(d.impotFederal, -co.CA_impot_old, tolCents);
  proche(d.transfertsQuebec.fraisGarde, co.QC_garde_old, tolCents); // crédit QC (frais non subv.)
  proche(d.fraisGardeCout, -co.Frais_garde_old, tolCents); // coût des frais de garde
  // revenu disponible de bout en bout (RD de la réf. non arrondi ; comparé au cent)
  proche(r25.revenuDisponible, round2(co.RD_old), tolCents);
  proche(r26.revenuDisponible, round2(co.RD_new), tolCents);
}

const ACTIVES = [Situation.PersonneSeule, Situation.FamilleMonoparentale, Situation.Couple];
// Revenus couvrant exemptions (3 500), seuils (2 000) et maximums (MGA 71 300, MRA 65 700, max RQAP 98 000).
const REVENUS = [0, 2000, 2001, 30_000, 50_000, 65_700, 71_300, 98_000, 120_000];

describe("Parité référence — cotisations (postes 1-4), ménages actifs", () => {
  const cas: Menage[] = [];
  for (const situation of ACTIVES) for (const r of REVENUS) cas.push(menage({ situation, revenu1: r }));
  cas.push(menage({ situation: Situation.Couple, revenu1: 60_000, revenu2: 45_000 })); // deux revenus

  for (const m of cas) {
    it(`${nomCas(m)}`, () => {
      const co = calcReference(entrees(m));
      // Cotisations stockées en négatif → on compare nos montants positifs à −co.X.
      expect(rrqMenage(m, 2025).total).toBeCloseTo(-co.CA_rrq_old, 2);
      expect(rrqMenage(m, 2026).total).toBeCloseTo(-co.CA_rrq_new, 2);
      expect(rqapMenage(m, 2025)).toBeCloseTo(-co.QC_rqap_old, 2);
      expect(rqapMenage(m, 2026)).toBeCloseTo(-co.QC_rqap_new, 2);
      expect(aeMenage(m, 2025)).toBeCloseTo(-co.CA_ae_old, 2);
      expect(aeMenage(m, 2026)).toBeCloseTo(-co.CA_ae_new, 2);
      expect(fssMenage(m, 2025)).toBeCloseTo(-co.QC_fss_old, 2); // actif : 0
    });
  }
});

describe("Parité référence — FSS des retraités (poste 4)", () => {
  const cas: Menage[] = [];
  for (const situation of [Situation.RetraiteSeul, Situation.CoupleRetraites]) {
    const deux = situation === Situation.CoupleRetraites;
    for (const r of [10_000, 30_000, 60_000, 150_000]) {
      cas.push(menage({ situation, revenu1: r, revenu2: deux ? r : 0, ageAdulte1: 70, ageAdulte2: 70 }));
    }
  }
  for (const m of cas) {
    it(`${nomCas(m)}`, () => {
      const co = calcReference(entrees(m));
      expect(fssMenage(m, 2025)).toBeCloseTo(-co.QC_fss_old, 2);
      expect(fssMenage(m, 2026)).toBeCloseTo(-co.QC_fss_new, 2);
    });
  }
});

describe("Parité référence — transferts sur le revenu familial net (postes 5, 7, 9)", () => {
  // Combinaisons VALIDES seulement : la situation détermine si des enfants comptent
  // (drapeau « F » du modèle). « Personne vivant seule » et les retraités → 0 enfant ;
  // les enfants ne comptent que pour « Famille monoparentale » (1 adulte) et « Couple ».
  const cas: Menage[] = [];
  for (const r of [20_000, 40_000, 60_000, 100_000]) {
    cas.push(menage({ situation: Situation.PersonneSeule, revenu1: r }));
    cas.push(menage({ situation: Situation.Couple, revenu1: r }));
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, enfants: [enfant(5), enfant(8)] }));
    cas.push(menage({ situation: Situation.Couple, revenu1: r, enfants: [enfant(5), enfant(8)] }));
  }

  for (const m of cas) {
    it(`${nomCas(m)}`, () => {
      const co = calcReference(entrees(m));
      const { nbAdultes } = SITUATIONS[m.situation];
      const nbEnf = m.enfants.length;
      // RAMQ : cotisation (négative dans la référence). Notre valeur, arrondie à la cent.
      expect(round2(ramqMenage(m, co._rfn_old, 2025))).toBeCloseTo(-co.QC_ramq_old, 2);
      expect(round2(ramqMenage(m, co._rfn_new, 2026))).toBeCloseTo(-co.QC_ramq_new, 2);
      // Allocation famille (positive).
      expect(allocationFamille(co._rfn_old, nbEnf, nbAdultes, 2025)).toBeCloseTo(co.QC_sae_old, 2);
      expect(allocationFamille(co._rfn_new, nbEnf, nbAdultes, 2026)).toBeCloseTo(co.QC_sae_new, 2);
      // Crédit pour la solidarité (positif).
      expect(creditSolidarite(co._rfn_old, nbAdultes, nbEnf, 2025)).toBeCloseTo(co.QC_sol_old, 2);
      expect(creditSolidarite(co._rfn_new, nbAdultes, nbEnf, 2026)).toBeCloseTo(co.QC_sol_new, 2);
    });
  }
});

describe("Parité référence — frais de garde (poste 6)", () => {
  // Frais NON subventionnés → admissibles au crédit. On contrôle les frais en entrée et on
  // fournit les mêmes frais admissibles à notre fonction (le revenu net vient de `_rfn`).
  const cas = [
    { m: menage({ situation: Situation.FamilleMonoparentale, revenu1: 35_000, enfants: [enfant(3), enfant(8)] }), frais: [9000, 4000] },
    { m: menage({ situation: Situation.Couple, revenu1: 50_000, enfants: [enfant(2)] }), frais: [12_000] },
    { m: menage({ situation: Situation.Couple, revenu1: 90_000, revenu2: 30_000, enfants: [enfant(4), enfant(10)] }), frais: [8000, 5000] },
  ];
  for (const { m, frais } of cas) {
    it(`${nomCas(m)}`, () => {
      const ent = entrees(m);
      ent.enfants = m.enfants.map((e, i) => ({ age: e.age, frais: frais[i] ?? 0, typeGarde: "Non subventionnée" }));
      const co = calcReference(ent);
      const enfantsGarde = m.enfants.map((e, i) => ({ age: e.age, fraisAdmissibles: frais[i] ?? 0 }));
      expect(creditFraisGarde(co._rfn_old, enfantsGarde, 2025)).toBeCloseTo(co.QC_garde_old, 2);
      expect(creditFraisGarde(co._rfn_new, enfantsGarde, 2026)).toBeCloseTo(co.QC_garde_new, 2);
    });
  }
});

describe("Parité référence — prime au travail (poste 8)", () => {
  // La croissance porte sur le revenu de travail (= Revenu1 + Revenu2 pour un ménage actif),
  // la réduction sur le revenu familial net (`_rfn`).
  const cas: Menage[] = [];
  for (const r of [8000, 12_000, 20_000, 35_000]) {
    cas.push(menage({ situation: Situation.PersonneSeule, revenu1: r }));
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, enfants: [enfant(5)] }));
    cas.push(menage({ situation: Situation.Couple, revenu1: r, enfants: [enfant(5)] }));
  }
  for (const m of cas) {
    it(`${nomCas(m)}`, () => {
      const co = calcReference(entrees(m));
      const { nbAdultes } = SITUATIONS[m.situation];
      const revenuTravail = m.revenu1 + m.revenu2;
      const aDesEnfants = m.enfants.length > 0;
      expect(round2(primeAuTravail(revenuTravail, co._rfn_old, nbAdultes, aDesEnfants, 2025))).toBeCloseTo(co.QC_pt_old, 2);
      expect(round2(primeAuTravail(revenuTravail, co._rfn_new, nbAdultes, aDesEnfants, 2026))).toBeCloseTo(co.QC_pt_new, 2);
    });
  }
});

describe("Parité référence — allocation-logement (poste 10)", () => {
  // Admissibles : avec enfants (mono/couple) à divers revenus, et sans enfant avec un adulte 50+.
  // Le revenu aux fins de l'AL (`_ral`) = revenu net pour les non-aînés, ajusté pour les retraités.
  const cas: Menage[] = [];
  for (const r of [12_000, 20_000, 30_000, 40_000, 50_000]) {
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, enfants: [enfant(5)] }));
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, enfants: [enfant(5), enfant(8), enfant(11)] }));
    cas.push(menage({ situation: Situation.Couple, revenu1: r, enfants: [enfant(5), enfant(8)] }));
    cas.push(menage({ situation: Situation.PersonneSeule, revenu1: r, ageAdulte1: 55 })); // 50+ sans enfant
    cas.push(menage({ situation: Situation.Couple, revenu1: r, ageAdulte1: 55, ageAdulte2: 55 }));
  }
  cas.push(menage({ situation: Situation.RetraiteSeul, revenu1: 18_000, ageAdulte1: 70 }));
  cas.push(menage({ situation: Situation.CoupleRetraites, revenu1: 15_000, revenu2: 15_000, ageAdulte1: 70, ageAdulte2: 70 }));

  for (const m of cas) {
    it(`${nomCas(m)}`, () => {
      const co = calcReference(entrees(m));
      expect(allocationLogementMenage(m, co._ral_old, 2025)).toBeCloseTo(co.QC_al_old, 2);
      expect(allocationLogementMenage(m, co._ral_new, 2026)).toBeCloseTo(co.QC_al_new, 2);
    });
  }
});

describe("Parité référence — soutien aux aînés (poste 11)", () => {
  // Crédit fonction de l'âge (≥ 70 ans) et du revenu familial net (`_rfn`).
  const cas: Menage[] = [];
  for (const r of [15_000, 28_000, 40_000, 55_000, 70_000]) {
    cas.push(menage({ situation: Situation.RetraiteSeul, revenu1: r, ageAdulte1: 72 }));
    cas.push(menage({ situation: Situation.RetraiteSeul, revenu1: r, ageAdulte1: 68 })); // non admissible
    cas.push(menage({ situation: Situation.CoupleRetraites, revenu1: r, revenu2: r, ageAdulte1: 72, ageAdulte2: 72 }));
    cas.push(menage({ situation: Situation.CoupleRetraites, revenu1: r, revenu2: 0, ageAdulte1: 72, ageAdulte2: 66 })); // un seul 70+
  }
  for (const m of cas) {
    it(`${nomCas(m)} — âges ${m.ageAdulte1}/${m.ageAdulte2}`, () => {
      const co = calcReference(entrees(m));
      expect(montantSoutienAinesMenage(m, co._rfn_old, 2025)).toBeCloseTo(co.QC_aines_old, 2);
      expect(montantSoutienAinesMenage(m, co._rfn_new, 2026)).toBeCloseTo(co.QC_aines_new, 2);
    });
  }
});

describe("Parité référence — frais médicaux (poste 12) : QC_medic ≡ 0", () => {
  // La seule dépense médicale du modèle est la prime RAMQ (= −co.QC_ramq) : on la fournit à
  // notre fonction et on vérifie qu'elle reproduit le 0 du modèle, sur tout le grille.
  const cas: Menage[] = [];
  for (const sit of [Situation.PersonneSeule, Situation.Couple, Situation.RetraiteSeul, Situation.CoupleRetraites]) {
    const deux = sit === Situation.Couple || sit === Situation.CoupleRetraites;
    const age = sit === Situation.RetraiteSeul || sit === Situation.CoupleRetraites ? 72 : 45;
    for (const r of [10_000, 25_000, 40_000, 60_000, 90_000]) {
      cas.push(menage({ situation: sit, revenu1: r, revenu2: deux ? r : 0, ageAdulte1: age, ageAdulte2: age }));
    }
  }
  for (const m of cas) {
    it(`${nomCas(m)}`, () => {
      const co = calcReference(entrees(m));
      const revTravailMax = Math.max(m.revenu1, m.revenu2);
      // frais médicaux = prime RAMQ du modèle (stockée en négatif)
      expect(creditFraisMedicaux(-co.QC_ramq_old, revTravailMax, co._rfn_old, 2025)).toBeCloseTo(co.QC_medic_old, 2);
      expect(creditFraisMedicaux(-co.QC_ramq_new, revTravailMax, co._rfn_new, 2026)).toBeCloseTo(co.QC_medic_new, 2);
      expect(co.QC_medic_old).toBeCloseTo(0, 2); // constat : toujours nul
    });
  }
});

describe("Parité référence — aide de dernier recours (poste 13)", () => {
  // Ménages actifs (situations 0-2), divers âges (bandes < 50 / 50-57 / 58-64) et revenus de travail.
  const cas: Menage[] = [];
  for (const age of [30, 45, 49, 50, 55, 58, 62, 64]) {
    for (const r of [0, 2400, 5000, 8000, 12_000, 18_000]) {
      cas.push(menage({ situation: Situation.PersonneSeule, revenu1: r, ageAdulte1: age }));
      cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, ageAdulte1: age, enfants: [enfant(5)] }));
      cas.push(menage({ situation: Situation.Couple, revenu1: r, ageAdulte1: age, ageAdulte2: age }));
    }
  }
  // couples à âges mixtes (un seul 58+ ⇒ +166 ; un seul 65+ ⇒ 0)
  cas.push(menage({ situation: Situation.Couple, revenu1: 5000, ageAdulte1: 60, ageAdulte2: 40 }));
  cas.push(menage({ situation: Situation.Couple, revenu1: 5000, ageAdulte1: 66, ageAdulte2: 40 }));
  cas.push(menage({ situation: Situation.Couple, revenu1: 30_000, revenu2: 20_000, ageAdulte1: 45, ageAdulte2: 45 }));

  for (const m of cas) {
    it(`${nomCas(m)} — âge ${m.ageAdulte1}/${m.ageAdulte2}`, () => {
      const co = calcReference(entrees(m));
      expect(aideSocialeMenage(m, 2025)).toBeCloseTo(co.QC_adr_old, 2);
      expect(aideSocialeMenage(m, 2026)).toBeCloseTo(co.QC_adr_new, 2);
    });
  }
});

describe("Parité référence — Allocation canadienne pour enfants (poste 14)", () => {
  // Prestation fonction du nombre/âge des enfants et du revenu net rajusté fédéral (`_afni`).
  const familles = [
    [enfant(3)],
    [enfant(10)],
    [enfant(3), enfant(8)],
    [enfant(2), enfant(4), enfant(12)],
  ];
  const cas: Menage[] = [];
  for (const enfants of familles) {
    for (const r of [0, 25_000, 50_000, 90_000, 150_000]) {
      cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, enfants }));
      cas.push(menage({ situation: Situation.Couple, revenu1: r, ageAdulte2: 40, enfants }));
    }
  }
  for (const m of cas) {
    it(`${nomCas(m)}`, () => {
      const co = calcReference(entrees(m));
      expect(allocationCanadienneEnfantsMenage(m, co._afni_old, 2025)).toBeCloseTo(co.CA_ace_old, 2);
      expect(allocationCanadienneEnfantsMenage(m, co._afni_new, 2026)).toBeCloseTo(co.CA_ace_new, 2);
    });
  }
});

describe("Parité référence — crédit pour la TPS/TVH (poste 15)", () => {
  const cas: Menage[] = [];
  for (const r of [8000, 15_000, 30_000, 50_000, 65_000]) {
    cas.push(menage({ situation: Situation.PersonneSeule, revenu1: r })); // seul sans enfant (phase-in du supplément)
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, enfants: [enfant(5), enfant(10)] }));
    cas.push(menage({ situation: Situation.Couple, revenu1: r, ageAdulte2: 40 }));
    cas.push(menage({ situation: Situation.Couple, revenu1: r, ageAdulte2: 40, enfants: [enfant(5), enfant(10)] }));
  }
  for (const m of cas) {
    it(`${nomCas(m)}`, () => {
      const co = calcReference(entrees(m));
      expect(creditTPSMenage(m, co._afni_old, 2025)).toBeCloseTo(co.CA_tps_old, 2);
      expect(creditTPSMenage(m, co._afni_new, 2026)).toBeCloseTo(co.CA_tps_new, 2);
    });
  }
});

describe("Parité référence — Allocation canadienne pour les travailleurs (poste 16)", () => {
  const cas: Menage[] = [];
  for (const r of [3600, 8000, 12_000, 16_000, 25_000, 35_000, 45_000]) {
    cas.push(menage({ situation: Situation.PersonneSeule, revenu1: r }));
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, enfants: [enfant(8)] }));
    cas.push(menage({ situation: Situation.Couple, revenu1: r, ageAdulte2: 40 }));
    cas.push(menage({ situation: Situation.Couple, revenu1: r, ageAdulte2: 40, enfants: [enfant(8)] }));
  }
  // couples à deux revenus (exemption du second revenu)
  cas.push(menage({ situation: Situation.Couple, revenu1: 20_000, revenu2: 12_000, ageAdulte2: 40 }));
  cas.push(menage({ situation: Situation.Couple, revenu1: 15_000, revenu2: 15_000, ageAdulte2: 40, enfants: [enfant(5)] }));
  for (const m of cas) {
    it(`${nomCas(m)}`, () => {
      const co = calcReference(entrees(m));
      expect(allocationTravailleursMenage(m, co._afni_old, 2025)).toBeCloseTo(co.CA_pfrt_old, 2);
      expect(allocationTravailleursMenage(m, co._afni_new, 2026)).toBeCloseTo(co.CA_pfrt_new, 2);
    });
  }
});

describe("Parité référence — Sécurité de la vieillesse + SRG (poste 17)", () => {
  const cas: Menage[] = [];
  // Retraité seul : âges 65 / 70 / 75 (PSV de base puis supplément 75+), revenus couvrant SRG → récupération.
  for (const age of [65, 70, 75]) {
    for (const r of [0, 5000, 12_000, 20_000, 40_000, 100_000, 130_000]) {
      cas.push(menage({ situation: Situation.RetraiteSeul, revenu1: r, ageAdulte1: age }));
    }
  }
  // Couple de retraités (les deux 65+), revenu sur un ou deux conjoints.
  for (const [age1, age2] of [[70, 70], [75, 72], [68, 80]] as const) {
    for (const r of [0, 10_000, 30_000, 60_000, 120_000]) {
      cas.push(menage({ situation: Situation.CoupleRetraites, revenu1: r, ageAdulte1: age1, ageAdulte2: age2 }));
    }
  }
  cas.push(menage({ situation: Situation.CoupleRetraites, revenu1: 18_000, revenu2: 12_000, ageAdulte1: 70, ageAdulte2: 70 }));
  // Couples MIXTES : un conjoint de 60-64 ans (Allocation), l'autre de 65 ans et plus.
  for (const [age1, age2] of [[62, 70], [64, 68], [70, 60]] as const) {
    for (const r of [0, 5000, 15_000, 30_000, 50_000]) {
      cas.push(menage({ situation: Situation.CoupleRetraites, revenu1: r, ageAdulte1: age1, ageAdulte2: age2 }));
    }
  }

  for (const m of cas) {
    it(`${nomCas(m)} — âges ${m.ageAdulte1}/${m.ageAdulte2}`, () => {
      const co = calcReference(entrees(m));
      expect(securiteVieillesseMenage(m, 2025)).toBeCloseTo(co.CA_psv_old, 2);
      expect(securiteVieillesseMenage(m, 2026)).toBeCloseTo(co.CA_psv_new, 2);
    });
  }
});

describe("Parité référence — supplément médical fédéral (poste 18) : CA_medic ≡ 0", () => {
  // Comme QC_medic : la seule dépense médicale du modèle est la prime RAMQ. On la fournit à notre
  // fonction (avec le revenu net `_rfn` pour le plancher de 3 % et l'AFNI `_afni` pour la réduction)
  // et on vérifie qu'elle reproduit le 0 du modèle sur toute la grille.
  const cas: Menage[] = [];
  for (const sit of [Situation.PersonneSeule, Situation.FamilleMonoparentale, Situation.Couple, Situation.RetraiteSeul, Situation.CoupleRetraites]) {
    const deux = sit === Situation.Couple || sit === Situation.CoupleRetraites;
    const age = sit === Situation.RetraiteSeul || sit === Situation.CoupleRetraites ? 72 : 45;
    const enfants = sit === Situation.FamilleMonoparentale ? [enfant(5)] : [];
    for (const r of [3000, 5000, 25_000, 40_000, 60_000, 90_000]) {
      cas.push(menage({ situation: sit, revenu1: r, revenu2: deux ? r : 0, ageAdulte1: age, ageAdulte2: age, enfants }));
    }
  }
  for (const m of cas) {
    it(`${nomCas(m)}`, () => {
      const co = calcReference(entrees(m));
      const revTravailMax = Math.max(m.revenu1, m.revenu2);
      // frais médicaux = prime RAMQ du modèle (stockée en négatif) ; réduction sur l'AFNI fédéral
      expect(supplementFraisMedicaux(-co.QC_ramq_old, revTravailMax, co._rfn_old, co._afni_old, 2025)).toBeCloseTo(co.CA_medic_old, 2);
      expect(supplementFraisMedicaux(-co.QC_ramq_new, revTravailMax, co._rfn_new, co._afni_new, 2026)).toBeCloseTo(co.CA_medic_new, 2);
      expect(co.CA_medic_old).toBeCloseTo(0, 2); // constat : toujours nul
    });
  }
});

describe("Parité référence — impôt fédéral (poste 19, couche 1 : 1 adulte)", () => {
  // CA_impot = Σ adultes de l'impôt fédéral après abattement du Québec (16,5 %).
  // Couche 1 : ménages à 1 adulte (actifs : seul, monoparentale ; retraités : retraité seul).
  const cas: Menage[] = [];
  for (const r of [0, 8000, 15_000, 25_000, 50_000, 90_000, 150_000, 300_000]) {
    cas.push(menage({ situation: Situation.PersonneSeule, revenu1: r, ageAdulte1: 40 }));
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, ageAdulte1: 40, enfants: [enfant(5)] }));
  }
  for (const r of [0, 5000, 15_000, 30_000, 60_000, 120_000]) {
    cas.push(menage({ situation: Situation.RetraiteSeul, revenu1: r, ageAdulte1: 72 }));
    cas.push(menage({ situation: Situation.RetraiteSeul, revenu1: r, ageAdulte1: 68 }));
  }
  for (const m of cas) {
    it(`${nomCas(m)} — âge ${m.ageAdulte1}`, () => {
      const co = calcReference(entrees(m));
      // co.CA_impot est négatif (réduit le revenu disponible) ; notre fonction renvoie le positif.
      expect(impotFederalMenage(m, 2025)).toBeCloseTo(-co.CA_impot_old, 2);
      expect(impotFederalMenage(m, 2026)).toBeCloseTo(-co.CA_impot_new, 2);
    });
  }
});

describe("Parité référence — impôt fédéral (poste 19, couche 3 : couples)", () => {
  // CA_impot des couples : montant pour conjoint, transfert âge/pension, crédit médical du couple.
  const cas: Menage[] = [];
  for (const [r1, r2] of [[50_000, 0], [50_000, 30_000], [80_000, 20_000], [50_000, 50_000], [40_000, 0], [120_000, 60_000], [25_000, 15_000]] as const) {
    cas.push(menage({ situation: Situation.Couple, revenu1: r1, revenu2: r2, ageAdulte1: 40, ageAdulte2: 40 }));
  }
  for (const [r1, r2] of [[30_000, 0], [25_000, 25_000], [60_000, 0], [15_000, 15_000], [40_000, 20_000]] as const) {
    cas.push(menage({ situation: Situation.CoupleRetraites, revenu1: r1, revenu2: r2, ageAdulte1: 70, ageAdulte2: 70 }));
  }
  for (const m of cas) {
    it(`${nomCas(m)} — ${m.revenu1}/${m.revenu2}`, () => {
      const co = calcReference(entrees(m));
      // prime RAMQ du ménage (stockée en négatif), nécessaire au crédit médical du couple
      expect(impotFederalMenage(m, 2025, -co.QC_ramq_old)).toBeCloseTo(-co.CA_impot_old, 2);
      expect(impotFederalMenage(m, 2026, -co.QC_ramq_new)).toBeCloseTo(-co.CA_impot_new, 2);
    });
  }
});

describe("Parité référence — impôt du Québec (poste 19, couche 2 : 1 adulte)", () => {
  // QC_impot = Σ adultes de l'impôt québécois (sans abattement).
  const cas: Menage[] = [];
  for (const r of [0, 8000, 15_000, 25_000, 50_000, 90_000, 150_000, 300_000]) {
    cas.push(menage({ situation: Situation.PersonneSeule, revenu1: r, ageAdulte1: 40 }));
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, ageAdulte1: 40, enfants: [enfant(5)] }));
  }
  for (const r of [0, 5000, 15_000, 30_000, 60_000, 120_000]) {
    cas.push(menage({ situation: Situation.RetraiteSeul, revenu1: r, ageAdulte1: 72 }));
    cas.push(menage({ situation: Situation.RetraiteSeul, revenu1: r, ageAdulte1: 68 }));
  }
  for (const m of cas) {
    it(`${nomCas(m)} — âge ${m.ageAdulte1}`, () => {
      const co = calcReference(entrees(m));
      expect(impotQuebecMenage(m, 2025)).toBeCloseTo(-co.QC_impot_old, 2);
      expect(impotQuebecMenage(m, 2026)).toBeCloseTo(-co.QC_impot_new, 2);
    });
  }
});

describe("Parité référence — impôt du Québec (poste 19, couche 3b : couples)", () => {
  const cas: Menage[] = [];
  for (const [r1, r2] of [[50_000, 0], [50_000, 30_000], [80_000, 20_000], [50_000, 50_000], [40_000, 0], [120_000, 60_000]] as const) {
    cas.push(menage({ situation: Situation.Couple, revenu1: r1, revenu2: r2, ageAdulte1: 40, ageAdulte2: 40 }));
  }
  for (const [r1, r2] of [[30_000, 0], [25_000, 25_000], [60_000, 0], [40_000, 20_000]] as const) {
    cas.push(menage({ situation: Situation.CoupleRetraites, revenu1: r1, revenu2: r2, ageAdulte1: 70, ageAdulte2: 70 }));
  }
  for (const m of cas) {
    it(`${nomCas(m)} — ${m.revenu1}/${m.revenu2}`, () => {
      const co = calcReference(entrees(m));
      expect(impotQuebecMenage(m, 2025, -co.QC_ramq_old)).toBeCloseTo(-co.QC_impot_old, 2);
      expect(impotQuebecMenage(m, 2026, -co.QC_ramq_new)).toBeCloseTo(-co.QC_impot_new, 2);
    });
  }
});

describe("Parité référence — revenu disponible (poste 20 : agrégation finale)", () => {
  // RD = revenu − cotisations + transferts QC − impôt QC + transferts fédéraux − impôt fédéral.
  // On agrège les composantes du modèle (signes de la référence) + notre SFS, et on compare à RD.
  const cas: Menage[] = [
    menage({ situation: Situation.PersonneSeule, revenu1: 50_000, ageAdulte1: 40 }),
    menage({ situation: Situation.PersonneSeule, revenu1: 8000, ageAdulte1: 40 }),
    menage({ situation: Situation.FamilleMonoparentale, revenu1: 25_000, ageAdulte1: 40, enfants: [enfant(5), enfant(10)] }),
    menage({ situation: Situation.FamilleMonoparentale, revenu1: 45_000, ageAdulte1: 40, enfants: [enfant(2)] }),
    menage({ situation: Situation.Couple, revenu1: 50_000, revenu2: 30_000, ageAdulte1: 40, ageAdulte2: 40 }),
    menage({ situation: Situation.Couple, revenu1: 60_000, revenu2: 0, ageAdulte1: 40, ageAdulte2: 40, enfants: [enfant(5), enfant(8), enfant(14)] }),
    menage({ situation: Situation.RetraiteSeul, revenu1: 30_000, ageAdulte1: 72 }),
    menage({ situation: Situation.CoupleRetraites, revenu1: 30_000, revenu2: 0, ageAdulte1: 70, ageAdulte2: 70 }),
    menage({ situation: Situation.CoupleRetraites, revenu1: 20_000, revenu2: 20_000, ageAdulte1: 70, ageAdulte2: 70 }),
  ];
  for (const m of cas) {
    it(`${nomCas(m)} — ${m.revenu1}/${m.revenu2}`, () => {
      const co = calcReference(entrees(m));
      for (const [suf, an] of [["old", 2025], ["new", 2026]] as const) {
        const g = (k: string) => co[`${k}_${suf}`] ?? 0;
        // notre supplément pour fournitures scolaires (SFS) doit reproduire la référence
        expect(supplementFournituresScolaires(m, an)).toBeCloseTo(g("SFS"), 2);
        const rd = revenuDisponible({
          revenu: m.revenu1 + m.revenu2,
          cotisations: -(g("QC_ramq") + g("QC_fss") + g("CA_rrq") + g("QC_rqap") + g("CA_ae")),
          transfertsQuebec:
            g("QC_sae") + g("QC_pt") + g("QC_sol") + g("QC_al") + g("QC_aines") + g("QC_garde") + g("QC_adr") + g("QC_medic") + supplementFournituresScolaires(m, an),
          impotQuebec: -g("QC_impot"),
          transfertsFederaux: g("CA_ace") + g("CA_tps") + g("CA_pfrt") + g("CA_psv") + g("CA_medic"),
          impotFederal: -g("CA_impot"),
          fraisGarde: -g("Frais_garde"),
        });
        expect(rd).toBeCloseTo(g("RD"), 2);
      }
    });
  }
});

describe("Parité référence — ORCHESTRATEUR de bout en bout (ménage → RD)", () => {
  // calculerRevenuDisponible reconstruit toutes les bases de revenu et enchaîne tous les postes.
  const cas: Menage[] = [];
  for (const r of [0, 8000, 15_000, 25_000, 50_000, 90_000]) {
    cas.push(menage({ situation: Situation.PersonneSeule, revenu1: r, ageAdulte1: 40 }));
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, ageAdulte1: 40, enfants: [enfant(5), enfant(10)] }));
  }
  for (const [r1, r2] of [[50_000, 30_000], [60_000, 0], [25_000, 25_000]] as const) {
    cas.push(menage({ situation: Situation.Couple, revenu1: r1, revenu2: r2, ageAdulte1: 40, ageAdulte2: 40 }));
  }
  for (const r of [10_000, 20_000, 40_000]) {
    cas.push(menage({ situation: Situation.RetraiteSeul, revenu1: r, ageAdulte1: 72 }));
    cas.push(menage({ situation: Situation.CoupleRetraites, revenu1: r, revenu2: 0, ageAdulte1: 70, ageAdulte2: 70 }));
  }
  // Frais de garde > 0 : coût (RD) + déduction fédérale (AFNI → ACE/TPS/impôt féd.) + crédit QC (non subv. seulement).
  const NON = TypeGarde.NonSubventionne;
  const SUB = TypeGarde.Subventionne;
  cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: 50_000, ageAdulte1: 35, enfants: [{ age: 3, fraisGarde: 9000, typeGarde: NON }] }));
  cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: 35_000, ageAdulte1: 35, enfants: [{ age: 3, fraisGarde: 9000, typeGarde: NON }, { age: 8, fraisGarde: 6000, typeGarde: NON }] }));
  cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: 50_000, ageAdulte1: 35, enfants: [{ age: 4, fraisGarde: 9000, typeGarde: SUB }] }));
  cas.push(menage({ situation: Situation.Couple, revenu1: 50_000, revenu2: 6000, ageAdulte1: 35, ageAdulte2: 35, enfants: [{ age: 4, fraisGarde: 12_000, typeGarde: NON }] }));
  cas.push(menage({ situation: Situation.Couple, revenu1: 90_000, revenu2: 30_000, ageAdulte1: 40, ageAdulte2: 40, enfants: [{ age: 2, fraisGarde: 11_000, typeGarde: NON }, { age: 10, fraisGarde: 4000, typeGarde: SUB }] }));
  for (const m of cas) {
    it(`${nomCas(m)} — ${m.revenu1}/${m.revenu2}`, () => verifierParite(m));
  }
});

describe("Parité référence — grille élargie (ménages types)", () => {
  const NON = TypeGarde.NonSubventionne;
  const SUB = TypeGarde.Subventionne;
  const cas: Menage[] = [];

  // (1) Personne seule (< 65 ans) : âges 18 / 35 / 60, revenu de travail brut de 0 à 150 000 $.
  for (const age of [18, 35, 60])
    for (const r of [0, 5_000, 15_000, 25_000, 40_000, 60_000, 90_000, 120_000, 150_000])
      cas.push(menage({ situation: Situation.PersonneSeule, revenu1: r, ageAdulte1: age }));

  // (2) Couple sans enfants : âges et revenus de travail variés.
  for (const [a1, a2] of [[35, 35], [40, 30], [55, 45], [60, 25]] as const)
    for (const [r1, r2] of [[50_000, 30_000], [80_000, 0], [40_000, 40_000], [120_000, 60_000], [25_000, 15_000]] as const)
      cas.push(menage({ situation: Situation.Couple, revenu1: r1, revenu2: r2, ageAdulte1: a1, ageAdulte2: a2 }));

  // (3) Famille monoparentale : âges/revenus variés, nombre d'enfants variable, sans frais de garde.
  for (const age of [30, 45])
    for (const r of [18_000, 35_000, 55_000, 80_000]) {
      cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, ageAdulte1: age, enfants: [enfant(4)] }));
      cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, ageAdulte1: age, enfants: [enfant(3), enfant(8)] }));
      cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, ageAdulte1: age, enfants: [enfant(2), enfant(6), enfant(11)] }));
    }
  // (3b) Famille monoparentale avec frais de garde (subventionnés et non subventionnés).
  for (const r of [30_000, 50_000]) {
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, ageAdulte1: 35, enfants: [{ age: 3, fraisGarde: 9_000, typeGarde: NON }] }));
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, ageAdulte1: 35, enfants: [{ age: 3, fraisGarde: 2_800, typeGarde: SUB }] }));
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, ageAdulte1: 35, enfants: [{ age: 3, fraisGarde: 9_500, typeGarde: NON }, { age: 7, fraisGarde: 6_000, typeGarde: NON }] }));
    cas.push(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, ageAdulte1: 35, enfants: [{ age: 4, fraisGarde: 9_000, typeGarde: NON }, { age: 9, fraisGarde: 2_500, typeGarde: SUB }] }));
  }

  // (4) Couples avec enfants : revenus/âges variés, avec et sans frais de garde.
  cas.push(menage({ situation: Situation.Couple, revenu1: 45_000, revenu2: 30_000, ageAdulte1: 35, ageAdulte2: 33, enfants: [enfant(4), enfant(9)] }));
  cas.push(menage({ situation: Situation.Couple, revenu1: 70_000, revenu2: 0, ageAdulte1: 40, ageAdulte2: 38, enfants: [enfant(2), enfant(6), enfant(12)] }));
  cas.push(menage({ situation: Situation.Couple, revenu1: 90_000, revenu2: 55_000, ageAdulte1: 45, ageAdulte2: 42, enfants: [enfant(7)] }));
  cas.push(menage({ situation: Situation.Couple, revenu1: 120_000, revenu2: 80_000, ageAdulte1: 50, ageAdulte2: 48, enfants: [enfant(10), enfant(15)] }));
  cas.push(menage({ situation: Situation.Couple, revenu1: 50_000, revenu2: 35_000, ageAdulte1: 34, ageAdulte2: 32, enfants: [{ age: 3, fraisGarde: 10_000, typeGarde: NON }, { age: 6, fraisGarde: 7_000, typeGarde: NON }] }));
  cas.push(menage({ situation: Situation.Couple, revenu1: 60_000, revenu2: 6_000, ageAdulte1: 35, ageAdulte2: 35, enfants: [{ age: 4, fraisGarde: 12_000, typeGarde: NON }] }));
  cas.push(menage({ situation: Situation.Couple, revenu1: 80_000, revenu2: 40_000, ageAdulte1: 38, ageAdulte2: 36, enfants: [{ age: 2, fraisGarde: 11_000, typeGarde: NON }, { age: 5, fraisGarde: 3_000, typeGarde: SUB }] }));

  // (5) Personne âgée (65 ans et plus) : revenu de retraite brut varié.
  for (const age of [65, 70, 75])
    for (const r of [0, 15_000, 30_000, 50_000, 90_000, 150_000])
      cas.push(menage({ situation: Situation.RetraiteSeul, revenu1: r, ageAdulte1: age }));

  // (6) Couple de personnes âgées (65 ans et plus), sans enfants : revenus de retraite variés.
  for (const [a1, a2] of [[65, 65], [70, 68], [75, 72]] as const)
    for (const [r1, r2] of [[20_000, 20_000], [40_000, 10_000], [30_000, 0], [60_000, 40_000], [90_000, 90_000]] as const)
      cas.push(menage({ situation: Situation.CoupleRetraites, revenu1: r1, revenu2: r2, ageAdulte1: a1, ageAdulte2: a2 }));

  // tolérance de 1 cent : absorbe les artéfacts d'arrondi au demi-cent (prime au travail, RD) ;
  // les vrais écarts de modèle restent ≫ 1 cent et échoueraient.
  for (const m of cas) it(nomGrille(m), () => verifierParite(m, 1));
});

describe("Parité référence — balayage dense (verrou anti-régression)", () => {
  // Couvre les coins révélés par l'élargissement : balayage fin du revenu (5 situations), bornes
  // d'âge des aînés, couples d'âges mixtes (allocataire, LES DEUX ordres), parent seul d'un jeune
  // enfant. Tolérance 1 cent (artéfacts d'arrondi au demi-cent).
  it("RD au cent sur grille dense (revenus × situations × âges)", () => {
    const ecarts: string[] = [];
    const verifie = (m: Menage) => {
      const co = calcReference(entrees(m));
      for (const [suf, an] of [["old", 2025], ["new", 2026]] as const) {
        const ours = calculerRevenuDisponible(m, an).revenuDisponible;
        const ref = round2(co[`RD_${suf}`] ?? 0);
        if (Math.abs(ours - ref) > 0.011) ecarts.push(`${nomGrille(m)} (${an}) : ${ours} vs ${ref}`);
      }
    };
    // Balayage fin du revenu, 5 situations.
    for (let r = 0; r <= 150_000; r += 2000) {
      verifie(menage({ situation: Situation.PersonneSeule, revenu1: r }));
      verifie(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, enfants: [enfant(3), enfant(9)] }));
      verifie(menage({ situation: Situation.Couple, revenu1: r, revenu2: 15_000 }));
      verifie(menage({ situation: Situation.RetraiteSeul, revenu1: r, ageAdulte1: 70 }));
      verifie(menage({ situation: Situation.CoupleRetraites, revenu1: r, revenu2: 10_000, ageAdulte1: 70, ageAdulte2: 70 }));
    }
    // Bornes d'âge des aînés (PSV 65, bonus 75, retraité < 65).
    for (const age of [58, 60, 64, 65, 66, 74, 75]) for (const r of [0, 5000, 20_000, 45_000])
      verifie(menage({ situation: Situation.RetraiteSeul, revenu1: r, ageAdulte1: age }));
    // Couples d'âges mixtes (allocataire) — les deux ordres, 1 et 2 revenus, jusqu'à revenu élevé.
    for (const [a1, a2] of [[65, 60], [65, 62], [66, 64], [62, 65], [64, 66], [70, 63]] as const)
      for (const r of [0, 5000, 12_000, 20_000, 35_000, 50_000]) {
        verifie(menage({ situation: Situation.CoupleRetraites, revenu1: r, revenu2: 0, ageAdulte1: a1, ageAdulte2: a2 }));
        verifie(menage({ situation: Situation.CoupleRetraites, revenu1: Math.round(r / 2), revenu2: Math.round(r / 2), ageAdulte1: a1, ageAdulte2: a2 }));
      }
    // Parent seul d'un jeune enfant (contrainte temporaire), faible revenu.
    for (const r of [0, 5000, 12_000, 20_000]) verifie(menage({ situation: Situation.FamilleMonoparentale, revenu1: r, ageAdulte1: 30, enfants: [enfant(2), enfant(7)] }));

    expect(ecarts).toEqual([]);
  });
});

describe("Paramétrage (phase 4a) — le bundle officiel reproduit exactement le chemin par année", () => {
  const cas: Menage[] = [
    menage({ situation: Situation.PersonneSeule, revenu1: 8000, ageAdulte1: 40 }),
    menage({ situation: Situation.PersonneSeule, revenu1: 50_000, ageAdulte1: 40 }),
    menage({ situation: Situation.FamilleMonoparentale, revenu1: 25_000, ageAdulte1: 40, enfants: [enfant(5), enfant(10)] }),
    menage({ situation: Situation.Couple, revenu1: 60_000, revenu2: 30_000, ageAdulte1: 40, ageAdulte2: 40 }),
    menage({ situation: Situation.RetraiteSeul, revenu1: 30_000, ageAdulte1: 72 }),
    menage({ situation: Situation.CoupleRetraites, revenu1: 20_000, revenu2: 20_000, ageAdulte1: 70, ageAdulte2: 70 }),
  ];
  for (const m of cas) {
    it(`${nomCas(m)}`, () => {
      for (const an of [2025, 2026] as const) {
        const parAnnee = calculerRevenuDisponible(m, an);
        const parBundle = calculerRevenuDisponible(m, PARAMETRES_OFFICIELS[an]);
        expect(parBundle.revenuDisponible).toBe(parAnnee.revenuDisponible);
        expect(parBundle.detail).toEqual(parAnnee.detail);
        expect(parBundle.revenuNetFamilial).toBe(parAnnee.revenuNetFamilial);
        expect(parBundle.afni).toBe(parAnnee.afni);
      }
    });
  }
});

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
