// Métadonnées d'affichage pour l'éditeur de paramètres (phase 4c).
// Les clés du bundle `Parametres` sont regroupées par poste ; les libellés de groupe réutilisent
// les noms bilingues de POSTES_INFO. Les champs individuels sont « humanisés » depuis leur nom
// (les paramètres portent des noms français explicites, p. ex. maxParEnfant, seuilReduction).

import type { Bilingue, Lang } from "./i18n";
import { POSTES_INFO } from "./postes-info";
import { PARAMETRES_OFFICIELS } from "@/parametres";

/** clé du bundle Parametres → clé de POSTES_INFO (pour réutiliser le nom + la fiche pédagogique). */
export const CLE_VERS_POSTE: Record<string, string> = {
  rrq: "rrq",
  rqap: "rqap",
  ae: "assuranceEmploi",
  fss: "fss",
  ramq: "ramq",
  garde: "fraisGarde",
  allocationFamille: "allocationFamille",
  primeTravail: "primeTravail",
  solidarite: "solidarite",
  allocationLogement: "allocationLogement",
  soutienAines: "soutienAines",
  fraisMedicaux: "fraisMedicaux",
  aideSociale: "aideSociale",
  ace: "allocationEnfants",
  tps: "creditTPS",
  act: "allocationTravailleurs",
  psv: "securiteVieillesse",
  supplementMedical: "supplementMedical",
  impotQuebec: "impotQuebec",
  impotFederal: "impotFederal",
};

const LABELS_CUSTOM: Record<string, Bilingue> = {
  paliersQuebec: { fr: "Paliers d'imposition — Québec", en: "Quebec tax brackets" },
  paliersFederal: { fr: "Paliers d'imposition — fédéral", en: "Federal tax brackets" },
  facteurAL: { fr: "Ajustement pour l'allocation-logement", en: "Housing allowance adjustment" },
};

/** Ordre d'affichage des groupes dans l'éditeur (cotisations → transferts QC → impôt QC → féd. → impôt féd.). */
export const ORDRE_GROUPES: string[] = [
  "rrq", "rqap", "ae", "fss", "ramq",
  "allocationFamille", "primeTravail", "solidarite", "allocationLogement", "soutienAines", "garde", "fraisMedicaux", "aideSociale",
  "impotQuebec", "paliersQuebec",
  "ace", "tps", "act", "psv", "supplementMedical",
  "impotFederal", "paliersFederal",
  "facteurAL",
];

export function labelGroupe(cle: string, lang: Lang): string {
  const poste = CLE_VERS_POSTE[cle];
  if (poste && POSTES_INFO[poste]) return POSTES_INFO[poste].nom[lang];
  if (LABELS_CUSTOM[cle]) return LABELS_CUSTOM[cle][lang];
  return cle;
}

/** clé de fiche pédagogique (POSTES_INFO) associée à un groupe, le cas échéant. */
export function posteDeGroupe(cle: string): string | undefined {
  return CLE_VERS_POSTE[cle];
}

/**
 * Libellés descriptifs **bilingues** des paramètres « feuilles » de l'éditeur, par `groupe.champ`.
 * Noms ancrés sur la terminologie officielle (Retraite Québec, Revenu Québec, ARC, Service Canada ;
 * cf. sources S1-S27 de docs/revenu-disponible.md). Termes RRQ confirmés : MGA = « maximum
 * pensionable earnings (MPE) », MGAS = « additional maximum pensionable earnings (AMPE) ».
 */
export const PARAMS_LABELS: Record<string, Bilingue> = {
  // RRQ — Régime de rentes du Québec / Québec Pension Plan
  "rrq.exemption": { fr: "Exemption générale (en $)", en: "Basic exemption ($)" },
  "rrq.mga": { fr: "Maximum des gains admissibles — MGA (en $)", en: "Maximum pensionable earnings — MPE ($)" },
  "rrq.mgas": { fr: "Maximum supplémentaire des gains admissibles — MGAS (en $)", en: "Additional maximum pensionable earnings — AMPE ($)" },
  "rrq.tauxBase": { fr: "Taux du régime de base (part de l'employé)", en: "Base plan rate (employee share)" },
  "rrq.tauxSuppl1": { fr: "Taux de la 1ʳᵉ cotisation supplémentaire", en: "First additional contribution rate" },
  "rrq.tauxSuppl2": { fr: "Taux de la 2ᵉ cotisation supplémentaire (MGA → MGAS)", en: "Second additional contribution rate (MPE → AMPE)" },

  // RQAP — Régime québécois d'assurance parentale / Québec Parental Insurance Plan
  "rqap.maxAssurable": { fr: "Revenu maximal assurable (en $)", en: "Maximum insurable earnings ($)" },
  "rqap.seuil": { fr: "Revenu assurable minimal pour cotiser (en $)", en: "Minimum insurable earnings to contribute ($)" },
  "rqap.taux": { fr: "Taux de cotisation (part de l'employé)", en: "Premium rate (employee share)" },

  // Assurance-emploi / Employment Insurance
  "ae.mra": { fr: "Maximum de la rémunération assurable — MRA (en $)", en: "Maximum insurable earnings — MIE ($)" },
  "ae.seuil": { fr: "Rémunération assurable minimale — cotisation remboursée en deçà (en $)", en: "Minimum insurable earnings — premium refunded below ($)" },
  "ae.taux": { fr: "Taux de cotisation (part de l'employé, taux réduit du Québec)", en: "Premium rate (employee, Quebec reduced rate)" },

  // FSS — Fonds des services de santé / Health Services Fund
  "fss.seuil1": { fr: "Seuil de la 1ʳᵉ tranche (en $)", en: "First bracket threshold ($)" },
  "fss.taux1": { fr: "Taux de la 1ʳᵉ tranche", en: "First bracket rate" },
  "fss.plafond1": { fr: "Plafond de la 1ʳᵉ tranche (en $)", en: "First bracket cap ($)" },
  "fss.seuil2": { fr: "Seuil de la 2ᵉ tranche (en $)", en: "Second bracket threshold ($)" },
  "fss.taux2": { fr: "Taux de la 2ᵉ tranche", en: "Second bracket rate" },
  "fss.plafond2": { fr: "Plafond de la 2ᵉ tranche (en $)", en: "Second bracket cap ($)" },

  // RAMQ — Régime public d'assurance médicaments / Prescription Drug Insurance Plan
  "ramq.primeMax": { fr: "Prime maximale par adulte (en $)", en: "Maximum premium per adult ($)" },
  "ramq.largeurTranche1": { fr: "Largeur de la 1ʳᵉ tranche de revenu (en $)", en: "Width of the first income bracket ($)" },

  // Frais de garde — crédit QC + déduction fédérale / Child care
  "garde.plafondJeune": { fr: "Crédit QC — plafond des frais admissibles, enfant de moins de 7 ans (en $)", en: "QC credit — eligible-expense cap, child under 7 ($)" },
  "garde.plafondAutre": { fr: "Crédit QC — plafond des frais admissibles, autre enfant (en $)", en: "QC credit — eligible-expense cap, other child ($)" },
  "garde.ageMax": { fr: "Crédit QC — âge maximal admissible (exclusif)", en: "QC credit — maximum eligible age (exclusive)" },
  "garde.plafondFedJeune": { fr: "Déduction fédérale — plafond, enfant de moins de 7 ans (en $)", en: "Federal deduction — cap, child under 7 ($)" },
  "garde.plafondFedAutre": { fr: "Déduction fédérale — plafond, autre enfant (en $)", en: "Federal deduction — cap, other child ($)" },
  "garde.ageMaxFed": { fr: "Déduction fédérale — âge maximal admissible (exclusif)", en: "Federal deduction — maximum eligible age (exclusive)" },
  "garde.fractionRevenuFed": { fr: "Déduction fédérale — fraction du revenu de travail (⅔)", en: "Federal deduction — fraction of earned income (⅔)" },

  // Allocation famille / Family Allowance
  "allocationFamille.maxParEnfant": { fr: "Montant maximal par enfant (en $)", en: "Maximum amount per child ($)" },
  "allocationFamille.minParEnfant": { fr: "Montant minimal par enfant — universel (en $)", en: "Minimum amount per child — universal ($)" },
  "allocationFamille.suppMonoMax": { fr: "Supplément pour famille monoparentale — maximum (en $)", en: "Single-parent family supplement — maximum ($)" },
  "allocationFamille.suppMonoMin": { fr: "Supplément pour famille monoparentale — minimum (en $)", en: "Single-parent family supplement — minimum ($)" },
  "allocationFamille.seuilMonoparental": { fr: "Seuil de réduction du revenu familial — 1 adulte (en $)", en: "Family-income reduction threshold — 1 adult ($)" },
  "allocationFamille.seuilCouple": { fr: "Seuil de réduction du revenu familial — 2 adultes (en $)", en: "Family-income reduction threshold — 2 adults ($)" },
  "allocationFamille.tauxReduction": { fr: "Taux de réduction au-delà du seuil", en: "Reduction rate above the threshold" },
  "allocationFamille.supplementFournitures": { fr: "Supplément pour fournitures scolaires, par enfant de 4 à 16 ans (en $)", en: "School-supplies supplement, per child aged 4 to 16 ($)" },

  // Prime au travail / Work Premium
  "primeTravail.tauxReduction": { fr: "Taux de réduction (revenu familial net)", en: "Reduction rate (net family income)" },

  // Crédit d'impôt pour solidarité / Solidarity Tax Credit
  "solidarite.tvqBase": { fr: "Composante TVQ — montant de base (en $)", en: "QST component — base amount ($)" },
  "solidarite.tvqConjoint": { fr: "Composante TVQ — montant pour conjoint (en $)", en: "QST component — amount for a spouse ($)" },
  "solidarite.tvqAdditionnelSeule": { fr: "Composante TVQ — montant additionnel, personne vivant seule (en $)", en: "QST component — additional amount, person living alone ($)" },
  "solidarite.logementCouple": { fr: "Composante logement — couple (en $)", en: "Housing component — couple ($)" },
  "solidarite.logementSeule": { fr: "Composante logement — personne seule ou monoparentale (en $)", en: "Housing component — single person or single parent ($)" },
  "solidarite.logementParEnfant": { fr: "Composante logement — par enfant à charge (en $)", en: "Housing component — per dependent child ($)" },
  "solidarite.seuilReduction": { fr: "Seuil de réduction (revenu familial net) (en $)", en: "Reduction threshold (net family income) ($)" },
  "solidarite.tauxReduction": { fr: "Taux de réduction (au moins 2 composantes)", en: "Reduction rate (at least 2 components)" },

  // Allocation-logement / Shelter Allowance
  "allocationLogement.seuilSeul0": { fr: "Seuil de revenu — 1 adulte, 0 enfant (en $)", en: "Income threshold — 1 adult, 0 children ($)" },
  "allocationLogement.seuilCouple0": { fr: "Seuil de revenu — 2 adultes, 0 enfant (en $)", en: "Income threshold — 2 adults, 0 children ($)" },
  "allocationLogement.seuilMoyen": { fr: "Seuil de revenu — 1 adulte (1-2 enf.) ou 2 adultes (1 enf.) (en $)", en: "Income threshold — 1 adult (1-2 children) or 2 adults (1 child) ($)" },
  "allocationLogement.seuilHaut": { fr: "Seuil de revenu — 1 adulte (3+ enf.) ou 2 adultes (2+ enf.) (en $)", en: "Income threshold — 1 adult (3+ children) or 2 adults (2+ children) ($)" },
  "allocationLogement.montant30": { fr: "Montant mensuel — effort de logement de 30 % à moins de 50 % (en $)", en: "Monthly amount — housing effort 30% to under 50% ($)" },
  "allocationLogement.montant50": { fr: "Montant mensuel — effort de logement de 50 % à moins de 80 % (en $)", en: "Monthly amount — housing effort 50% to under 80% ($)" },
  "allocationLogement.montant80": { fr: "Montant mensuel — effort de logement de 80 % et plus (en $)", en: "Monthly amount — housing effort 80% and over ($)" },
  "allocationLogement.ageAdmissible": { fr: "Âge ouvrant droit (sans enfant)", en: "Eligibility age (without children)" },

  // Soutien aux aînés / Senior Assistance Amount
  "soutienAines.montantParAine": { fr: "Montant maximal par aîné admissible (en $)", en: "Maximum amount per eligible senior ($)" },
  "soutienAines.seuilSeul": { fr: "Seuil de réduction — 1 adulte (en $)", en: "Reduction threshold — 1 adult ($)" },
  "soutienAines.seuilCouple": { fr: "Seuil de réduction — 2 adultes (en $)", en: "Reduction threshold — 2 adults ($)" },
  "soutienAines.tauxReduction": { fr: "Taux de réduction au-delà du seuil", en: "Reduction rate above the threshold" },
  "soutienAines.ageAdmissible": { fr: "Âge ouvrant droit", en: "Eligibility age" },

  // Frais médicaux — crédit remboursable QC / Refundable medical-expense credit (QC)
  "fraisMedicaux.taux": { fr: "Taux du crédit sur les frais admissibles", en: "Credit rate on eligible expenses" },
  "fraisMedicaux.creditMax": { fr: "Crédit maximal (en $)", en: "Maximum credit ($)" },
  "fraisMedicaux.revenuTravailMin": { fr: "Revenu de travail minimal pour ouvrir droit (en $)", en: "Minimum work income to qualify ($)" },
  "fraisMedicaux.seuilReduction": { fr: "Seuil de réduction (revenu familial net) (en $)", en: "Reduction threshold (net family income) ($)" },
  "fraisMedicaux.tauxReduction": { fr: "Taux de réduction", en: "Reduction rate" },
  "fraisMedicaux.seuilFrais": { fr: "Part du revenu net en deçà de laquelle les frais ne comptent pas (3 %)", en: "Share of net income below which expenses are disregarded (3%)" },

  // Aide de dernier recours / Social Assistance
  "aideSociale.baseSeul": { fr: "Prestation de base mensuelle — 1 adulte (en $)", en: "Monthly basic benefit — 1 adult ($)" },
  "aideSociale.baseCouple": { fr: "Prestation de base mensuelle — 2 adultes (en $)", en: "Monthly basic benefit — 2 adults ($)" },
  "aideSociale.ajust58Seul": { fr: "Ajustement mensuel — un seul adulte de 58 ans et plus (en $)", en: "Monthly adjustment — one adult aged 58 and over ($)" },
  "aideSociale.ajust58Couple": { fr: "Ajustement mensuel — les deux adultes de 58 ans et plus (en $)", en: "Monthly adjustment — both adults aged 58 and over ($)" },
  "aideSociale.ajustJeuneSeul": { fr: "Ajustement mensuel — adulte seul sans enfant de moins de 50 ans (en $)", en: "Monthly adjustment — single childless adult under 50 ($)" },
  "aideSociale.exemptionSeul": { fr: "Exemption mensuelle de gains de travail — 1 adulte (en $)", en: "Monthly earned-income exemption — 1 adult ($)" },
  "aideSociale.exemptionCouple": { fr: "Exemption mensuelle de gains de travail — 2 adultes (en $)", en: "Monthly earned-income exemption — 2 adults ($)" },
  "aideSociale.tauxIncitation": { fr: "Taux d'incitation au travail (part exemptée au-delà de l'exemption)", en: "Work-incentive rate (share exempt above the exemption)" },

  // Allocation canadienne pour enfants / Canada Child Benefit
  "ace.maxJeune": { fr: "Montant maximal — enfant de moins de 6 ans (en $)", en: "Maximum amount — child under 6 ($)" },
  "ace.maxAine": { fr: "Montant maximal — enfant de 6 à 17 ans (en $)", en: "Maximum amount — child aged 6 to 17 ($)" },
  "ace.seuil1": { fr: "Premier seuil de réduction (revenu familial net rajusté) (en $)", en: "First reduction threshold (adjusted family net income) ($)" },
  "ace.seuil2": { fr: "Second seuil de réduction (en $)", en: "Second reduction threshold ($)" },

  // Crédit pour la TPS/TVH / GST/HST credit
  "tps.baseAdulte": { fr: "Montant de base par adulte (en $)", en: "Base amount per adult ($)" },
  "tps.parEnfant": { fr: "Montant par enfant (en $)", en: "Amount per child ($)" },
  "tps.supplMonoparental": { fr: "Supplément pour famille monoparentale (en $)", en: "Single-parent supplement ($)" },
  "tps.seuilPhaseIn": { fr: "Seuil de début du supplément pour personne seule (en $)", en: "Phase-in threshold for the single supplement ($)" },
  "tps.tauxPhaseIn": { fr: "Taux d'accumulation du supplément pour personne seule", en: "Phase-in rate of the single supplement" },
  "tps.plafondPhaseIn": { fr: "Supplément maximal pour personne seule (en $)", en: "Maximum single supplement ($)" },
  "tps.seuilReduction": { fr: "Seuil de réduction (revenu familial net rajusté) (en $)", en: "Reduction threshold (adjusted family net income) ($)" },
  "tps.tauxReduction": { fr: "Taux de réduction", en: "Reduction rate" },

  // Allocation canadienne pour les travailleurs / Canada Workers Benefit
  "act.exclusionSeul": { fr: "Revenu de travail exclu de l'accumulation — 1 adulte (en $)", en: "Earned income excluded from phase-in — 1 adult ($)" },
  "act.exclusionCouple": { fr: "Revenu de travail exclu de l'accumulation — 2 adultes (en $)", en: "Earned income excluded from phase-in — 2 adults ($)" },
  "act.tauxReduction": { fr: "Taux de réduction", en: "Reduction rate" },
  "act.exemptionSecondRevenu": { fr: "Exemption du revenu de travail du conjoint le moins payé (en $)", en: "Secondary-earner exemption ($)" },

  // Sécurité de la vieillesse + SRG + Allocation / Old Age Security + GIS + Allowance
  "psv.oasBase": { fr: "Pension de la Sécurité de la vieillesse — base, 65-74 ans (annuelle, en $)", en: "Old Age Security pension — base, ages 65-74 (annual, $)" },
  "psv.oas75": { fr: "Supplément de la PSV — 75 ans et plus (en $)", en: "OAS supplement — age 75 and over ($)" },
  "psv.seuilRecuperation": { fr: "Seuil de l'impôt de récupération de la PSV (en $)", en: "OAS recovery tax threshold ($)" },
  "psv.tauxRecuperation": { fr: "Taux de l'impôt de récupération de la PSV", en: "OAS recovery tax rate" },
  "psv.srgMaxSeul": { fr: "Supplément de revenu garanti (SRG) maximal — personne seule (en $)", en: "Maximum Guaranteed Income Supplement (GIS) — single person ($)" },
  "psv.srgMaxCouple": { fr: "SRG maximal par adulte — couple (en $)", en: "Maximum GIS per adult — couple ($)" },
  "psv.srgTauxSeul": { fr: "Taux de réduction du SRG — personne seule", en: "GIS reduction rate — single person" },
  "psv.srgTauxCouple": { fr: "Taux de réduction du SRG — couple", en: "GIS reduction rate — couple" },
  "psv.srgTrancheSeul": { fr: "Largeur de tranche du SRG — personne seule (en $)", en: "GIS bracket width — single person ($)" },
  "psv.srgTrancheCouple": { fr: "Largeur de tranche du SRG — couple (en $)", en: "GIS bracket width — couple ($)" },
  "psv.topupMaxSeul": { fr: "Supplément complémentaire du SRG — maximum, personne seule (en $)", en: "GIS top-up — maximum, single person ($)" },
  "psv.topupMaxCouple": { fr: "Supplément complémentaire du SRG — maximum, couple (en $)", en: "GIS top-up — maximum, couple ($)" },
  "psv.topupTaux": { fr: "Taux de réduction du supplément complémentaire du SRG", en: "GIS top-up reduction rate" },
  "psv.topupExemptionSeul": { fr: "Exemption du supplément complémentaire — personne seule (en $)", en: "GIS top-up exemption — single person ($)" },
  "psv.topupExemptionCouple": { fr: "Exemption du supplément complémentaire — couple (en $)", en: "GIS top-up exemption — couple ($)" },
  "psv.topupTrancheSeul": { fr: "Largeur de tranche du supplément complémentaire — personne seule (en $)", en: "GIS top-up bracket width — single person ($)" },
  "psv.topupTrancheCouple": { fr: "Largeur de tranche du supplément complémentaire — couple (en $)", en: "GIS top-up bracket width — couple ($)" },
  "psv.allocationMax": { fr: "Allocation au conjoint — montant maximal (en $)", en: "Allowance — maximum amount ($)" },
  "psv.allocationSeuil": { fr: "Allocation au conjoint — seuil entre les deux taux (en $)", en: "Allowance — threshold between the two rates ($)" },
  "psv.allocationTaux1": { fr: "Allocation au conjoint — taux de réduction sous le seuil", en: "Allowance — reduction rate below the threshold" },
  "psv.allocationTaux2": { fr: "Allocation au conjoint — taux de réduction au-delà du seuil", en: "Allowance — reduction rate above the threshold" },
  "psv.allocationTranche": { fr: "Allocation au conjoint — largeur de tranche (en $)", en: "Allowance — bracket width ($)" },

  // Supplément remboursable pour frais médicaux (fédéral) / Refundable medical expense supplement
  "supplementMedical.taux": { fr: "Taux du supplément sur les frais admissibles", en: "Supplement rate on eligible expenses" },
  "supplementMedical.supplementMax": { fr: "Supplément maximal (en $)", en: "Maximum supplement ($)" },
  "supplementMedical.revenuTravailMin": { fr: "Revenu de travail minimal pour ouvrir droit (en $)", en: "Minimum work income to qualify ($)" },
  "supplementMedical.seuilReduction": { fr: "Seuil de réduction (revenu familial net rajusté) (en $)", en: "Reduction threshold (adjusted family net income) ($)" },
  "supplementMedical.tauxReduction": { fr: "Taux de réduction", en: "Reduction rate" },
  "supplementMedical.seuilFrais": { fr: "Part du revenu net en deçà de laquelle les frais ne comptent pas (3 %)", en: "Share of net income below which expenses are disregarded (3%)" },
  "supplementMedical.plafondSeuilFrais": { fr: "Plafond du plancher de 3 % (en $)", en: "Cap on the 3% floor ($)" },

  // Impôt du Québec / Quebec income tax
  "impotQuebec.bpa": { fr: "Montant personnel de base (en $)", en: "Basic personal amount ($)" },
  "impotQuebec.deducTravailleurTaux": { fr: "Déduction pour travailleur — taux", en: "Deduction for workers — rate" },
  "impotQuebec.deducTravailleurMax": { fr: "Déduction pour travailleur — plafond (en $)", en: "Deduction for workers — cap ($)" },
  "impotQuebec.montantSeul": { fr: "Montant pour personne vivant seule (en $)", en: "Amount for a person living alone ($)" },
  "impotQuebec.ageMontant": { fr: "Montant en raison de l'âge — 65 ans et plus (en $)", en: "Age amount — 65 and over ($)" },
  "impotQuebec.pensionMax": { fr: "Montant maximal pour revenus de retraite (en $)", en: "Maximum amount for retirement income ($)" },
  "impotQuebec.reductionTaux": { fr: "Taux de réduction du montant combiné (seul + âge + retraite)", en: "Reduction rate of the combined amount (alone + age + retirement)" },
  "impotQuebec.reductionSeuil": { fr: "Seuil de réduction (revenu net) (en $)", en: "Reduction threshold (net income) ($)" },
  "impotQuebec.medicalTaux": { fr: "Taux du crédit non remboursable pour frais médicaux (couples)", en: "Non-refundable medical-expense credit rate (couples)" },

  // Impôt fédéral / Federal income tax
  "impotFederal.bpaBase": { fr: "Montant personnel de base — partie de base (en $)", en: "Basic personal amount — base portion ($)" },
  "impotFederal.bpaBonif": { fr: "Montant personnel de base — bonification (en $)", en: "Basic personal amount — enhancement ($)" },
  "impotFederal.bpaBonifSeuil": { fr: "Seuil de réduction de la bonification du BPA (en $)", en: "BPA-enhancement reduction threshold ($)" },
  "impotFederal.bpaBonifPlafond": { fr: "Plafond de réduction de la bonification du BPA (en $)", en: "BPA-enhancement reduction ceiling ($)" },
  "impotFederal.ageMontant": { fr: "Montant en raison de l'âge — 65 ans et plus (en $)", en: "Age amount — 65 and over ($)" },
  "impotFederal.ageSeuil": { fr: "Seuil de réduction du montant en raison de l'âge (en $)", en: "Age-amount reduction threshold ($)" },
  "impotFederal.ageTaux": { fr: "Taux de réduction du montant en raison de l'âge", en: "Age-amount reduction rate" },
  "impotFederal.pensionMax": { fr: "Montant maximal pour revenu de pension (en $)", en: "Maximum pension-income amount ($)" },
  "impotFederal.emploiCanadaMax": { fr: "Montant canadien pour emploi — maximum (en $)", en: "Canada employment amount — maximum ($)" },
  "impotFederal.abattementQc": { fr: "Abattement du Québec (% de l'impôt fédéral)", en: "Quebec abatement (% of federal tax)" },

  // Ajustement pour l'allocation-logement / Housing-allowance adjustment
  "facteurAL.seul": { fr: "Ajustement pour pensions — personne seule", en: "Pension adjustment factor — single person" },
  "facteurAL.couple": { fr: "Ajustement pour pensions — couple", en: "Pension adjustment factor — couple" },
};

/** Libellé descriptif bilingue d'un champ (`groupe.champ`) ; repli sur le nom « humanisé ». */
export function labelChamp(groupe: string, champ: string, lang: Lang): string {
  const l = PARAMS_LABELS[`${groupe}.${champ}`];
  if (l) return l[lang];
  const espace = champ.replace(/([A-Z])/g, " $1").replace(/([a-z])([0-9])/g, "$1 $2");
  return espace.charAt(0).toUpperCase() + espace.slice(1);
}

/** poste (clé POSTES_INFO) → clé du groupe de paramètres (inverse de CLE_VERS_POSTE). */
export const POSTE_VERS_PARAM: Record<string, string> = Object.fromEntries(
  Object.entries(CLE_VERS_POSTE).map(([groupe, poste]) => [poste, groupe]),
);

/** Formate une valeur de paramètre : montant (« 71 300 $ »), taux (« 5,4 % ») ou valeur brute. */
function formatValeur(valeur: number, estDollar: boolean, lang: Lang): string {
  const loc = lang === "fr" ? "fr-CA" : "en-CA";
  if (estDollar) return `${Math.round(valeur).toLocaleString(loc)} $`;
  if (valeur > 0 && valeur < 1) return `${(valeur * 100).toLocaleString(loc, { maximumFractionDigits: 3 })} %`;
  return valeur.toLocaleString(loc);
}

/**
 * Lignes du tableau de paramètres d'un poste : libellé bilingue (suffixe d'unité retiré) et valeurs
 * 2025/2026 formatées. Vide si le poste n'a pas de groupe de paramètres (ex. revenu, frais de garde).
 */
export function parametresDuPoste(posteCle: string, lang: Lang): { label: string; v2025: string; v2026: string }[] {
  const groupe = POSTE_VERS_PARAM[posteCle];
  if (!groupe) return [];
  const o25 = (PARAMETRES_OFFICIELS[2025] as unknown as Record<string, unknown>)[groupe];
  const o26 = (PARAMETRES_OFFICIELS[2026] as unknown as Record<string, unknown>)[groupe];
  if (!o25 || typeof o25 !== "object") return [];
  const a = o25 as Record<string, unknown>;
  const b = (o26 ?? {}) as Record<string, unknown>;
  const lignes: { label: string; v2025: string; v2026: string }[] = [];
  for (const [champ, val] of Object.entries(a)) {
    if (typeof val !== "number") continue; // on saute les sous-structures (barèmes imbriqués)
    const lbl = PARAMS_LABELS[`${groupe}.${champ}`];
    const complet = lbl ? lbl[lang] : champ;
    const estDollar = complet.includes("$");
    const label = complet.replace(/\s*\((en )?\$\)$/, ""); // l'unité est portée par la valeur formatée
    const v26 = typeof b[champ] === "number" ? (b[champ] as number) : val;
    lignes.push({ label, v2025: formatValeur(val, estDollar, lang), v2026: formatValeur(v26, estDollar, lang) });
  }
  return lignes;
}
