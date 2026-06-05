// Registre pédagogique bilingue : pour chaque poste, nom du programme, description, objectif,
// règle de calcul et références. Les clés correspondent à celles de `DetailRevenuDisponible`
// (poste 20). Sources : docs/revenu-disponible-pedagogie.md et docs/hypotheses-mfq.md.

import type { Bilingue } from "./i18n";

export interface PosteInfo {
  nom: Bilingue;
  description: Bilingue;
  objectif: Bilingue;
  regle: Bilingue;
  references: Bilingue;
}

export const POSTES_INFO: Record<string, PosteInfo> = {
  // ---------- Cotisations ----------
  rrq: {
    nom: { fr: "Régime de rentes du Québec (RRQ)", en: "Quebec Pension Plan (QPP)" },
    description: {
      fr: "Cotisation obligatoire prélevée sur le revenu de travail, qui finance les rentes de retraite, d'invalidité et de survivant du régime public québécois.",
      en: "A mandatory contribution levied on employment income funding the public Quebec plan's retirement, disability and survivor pensions.",
    },
    objectif: {
      fr: "Assurer un revenu de remplacement à la retraite (et en cas d'invalidité ou de décès), proportionnel aux gains de travail.",
      en: "Provide replacement income at retirement (and in case of disability or death), proportional to work earnings.",
    },
    regle: {
      fr: "Taux appliqué aux gains entre l'exemption de 3 500 $ et le maximum des gains admissibles, en deux volets : régime de base (créditable à l'impôt) et régime supplémentaire (déductible).",
      en: "A rate applied to earnings between the $3,500 exemption and the maximum pensionable earnings, in two parts: a base plan (eligible for a tax credit) and an enhanced plan (deductible).",
    },
    references: {
      fr: "Loi sur le régime de rentes du Québec (RLRQ, c. R-9) ; Retraite Québec.",
      en: "Act respecting the Québec Pension Plan (CQLR, c. R-9); Retraite Québec.",
    },
  },
  rqap: {
    nom: { fr: "Régime québécois d'assurance parentale (RQAP)", en: "Quebec Parental Insurance Plan (QPIP)" },
    description: {
      fr: "Cotisation sur le revenu de travail finançant les prestations de maternité, de paternité, parentales et d'adoption.",
      en: "A contribution on employment income funding maternity, paternity, parental and adoption benefits.",
    },
    objectif: {
      fr: "Soutenir financièrement les parents à la naissance ou à l'adoption d'un enfant.",
      en: "Provide financial support to parents at the birth or adoption of a child.",
    },
    regle: {
      fr: "Taux fixe (part de l'employé) appliqué au revenu assurable au-delà d'un seuil minimal, jusqu'à un maximum.",
      en: "A flat rate (employee share) applied to insurable income above a minimum threshold, up to a maximum.",
    },
    references: {
      fr: "Loi sur l'assurance parentale (RLRQ, c. A-29.011) ; Conseil de gestion de l'assurance parentale.",
      en: "Act respecting parental insurance (CQLR, c. A-29.011); Conseil de gestion de l'assurance parentale.",
    },
  },
  assuranceEmploi: {
    nom: { fr: "Assurance-emploi (AE)", en: "Employment Insurance (EI)" },
    description: {
      fr: "Cotisation fédérale sur le revenu d'emploi finançant les prestations en cas de perte d'emploi (taux réduit au Québec, qui a son propre régime parental).",
      en: "A federal contribution on employment income funding benefits in case of job loss (reduced rate in Quebec, which has its own parental plan).",
    },
    objectif: {
      fr: "Offrir un revenu temporaire aux personnes qui perdent leur emploi.",
      en: "Provide temporary income to people who lose their job.",
    },
    regle: {
      fr: "Taux (réduit pour le Québec, part de l'employé) appliqué au revenu assurable jusqu'au maximum de la rémunération assurable, au-delà d'un seuil minimal.",
      en: "A rate (reduced for Quebec, employee share) applied to insurable earnings up to the maximum insurable earnings, above a minimum threshold.",
    },
    references: {
      fr: "Loi sur l'assurance-emploi (L.C. 1996, ch. 23) ; Service Canada.",
      en: "Employment Insurance Act (S.C. 1996, c. 23); Service Canada.",
    },
  },
  fss: {
    nom: { fr: "Fonds des services de santé (FSS)", en: "Health Services Fund (HSF)" },
    description: {
      fr: "Cotisation des particuliers (surtout les retraités) sur certains revenus autres que d'emploi, qui contribue au financement des services de santé.",
      en: "A contribution by individuals (mainly retirees) on certain non-employment income, helping fund health services.",
    },
    objectif: {
      fr: "Faire contribuer au financement de la santé des revenus non assujettis aux cotisations d'emploi.",
      en: "Have income not subject to employment contributions help fund the health system.",
    },
    regle: {
      fr: "Montant calculé par paliers sur le revenu assujetti au-delà d'un seuil d'exonération, plafonné.",
      en: "An amount computed in brackets on the subject income above an exemption threshold, capped.",
    },
    references: {
      fr: "Loi sur la Régie de l'assurance maladie du Québec (annexe F) ; Revenu Québec.",
      en: "Act respecting the Régie de l'assurance maladie du Québec (Schedule F); Revenu Québec.",
    },
  },
  ramq: {
    nom: { fr: "Assurance médicaments (RAMQ)", en: "Public Prescription Drug Insurance (RAMQ)" },
    description: {
      fr: "Prime annuelle du régime public d'assurance médicaments, payée par les adultes non couverts par un régime privé.",
      en: "Annual premium of the public prescription drug insurance plan, paid by adults not covered by a private plan.",
    },
    objectif: {
      fr: "Financer l'accès aux médicaments d'ordonnance pour les personnes sans assurance privée.",
      en: "Fund access to prescription drugs for people without private insurance.",
    },
    regle: {
      fr: "Prime par adulte calculée par paliers selon le revenu familial net, jusqu'à un maximum ; nulle sous un seuil d'exonération.",
      en: "A per-adult premium computed in brackets based on family net income, up to a maximum; zero below an exemption threshold.",
    },
    references: {
      fr: "Loi sur l'assurance médicaments (RLRQ, c. A-29.01) ; RAMQ.",
      en: "Act respecting prescription drug insurance (CQLR, c. A-29.01); RAMQ.",
    },
  },

  // ---------- Transferts — Québec ----------
  allocationFamille: {
    nom: { fr: "Allocation famille", en: "Family Allowance" },
    description: {
      fr: "Prestation versée par Retraite Québec pour chaque enfant à charge de moins de 18 ans, plus un supplément pour famille monoparentale.",
      en: "A benefit paid by Retraite Québec for each dependent child under 18, plus a single-parent supplement.",
    },
    objectif: {
      fr: "Aider les familles à assumer les coûts liés aux enfants.",
      en: "Help families with the costs of raising children.",
    },
    regle: {
      fr: "Montant maximal par enfant réduit de 4 % du revenu familial net au-delà d'un seuil, sans descendre sous un montant minimal versé à toutes les familles.",
      en: "A maximum amount per child reduced by 4% of family net income above a threshold, never below a minimum paid to all families.",
    },
    references: {
      fr: "Loi sur les impôts (RLRQ, c. I-3), art. 1029.8.61.8 et suivants ; Retraite Québec.",
      en: "Taxation Act (CQLR, c. I-3), s. 1029.8.61.8 et seq.; Retraite Québec.",
    },
  },
  fournituresScolaires: {
    nom: { fr: "Supplément pour fournitures scolaires", en: "School Supplies Supplement" },
    description: {
      fr: "Montant fixe versé avec l'Allocation famille pour chaque enfant d'âge scolaire (4 à 16 ans).",
      en: "A fixed amount paid with the Family Allowance for each school-age child (4 to 16).",
    },
    objectif: {
      fr: "Aider à payer les fournitures scolaires à la rentrée.",
      en: "Help pay for school supplies at the start of the year.",
    },
    regle: {
      fr: "Montant fixe par enfant de 4 à 16 ans, sans réduction selon le revenu.",
      en: "A fixed amount per child aged 4 to 16, with no income-based reduction.",
    },
    references: {
      fr: "Loi sur les impôts (RLRQ, c. I-3) ; Retraite Québec.",
      en: "Taxation Act (CQLR, c. I-3); Retraite Québec.",
    },
  },
  primeTravail: {
    nom: { fr: "Prime au travail", en: "Work Premium" },
    description: {
      fr: "Crédit d'impôt remboursable qui bonifie le revenu des personnes en emploi à faible ou moyen revenu.",
      en: "A refundable tax credit that tops up the income of low- and modest-income workers.",
    },
    objectif: {
      fr: "Inciter au travail et soutenir la transition de l'aide sociale vers l'emploi.",
      en: "Encourage work and support the transition from social assistance to employment.",
    },
    regle: {
      fr: "Pourcentage des revenus de travail au-delà d'un seuil, jusqu'à un maximum, puis réduit selon le revenu familial.",
      en: "A percentage of work income above a threshold, up to a maximum, then reduced based on family income.",
    },
    references: {
      fr: "Loi sur les impôts (RLRQ, c. I-3) ; Revenu Québec.",
      en: "Taxation Act (CQLR, c. I-3); Revenu Québec.",
    },
  },
  solidarite: {
    nom: { fr: "Crédit d'impôt pour la solidarité", en: "Solidarity Tax Credit" },
    description: {
      fr: "Crédit remboursable combinant un volet TVQ, un volet logement et un volet pour les habitants d'un village nordique.",
      en: "A refundable credit combining a QST component, a housing component and a northern-village component.",
    },
    objectif: {
      fr: "Compenser la taxe de vente et une partie des coûts de logement pour les ménages à revenu faible ou moyen.",
      en: "Offset sales tax and part of housing costs for low- and modest-income households.",
    },
    regle: {
      fr: "Somme des volets admissibles, réduite de 6 % du revenu familial net au-delà d'un seuil.",
      en: "The sum of eligible components, reduced by 6% of family net income above a threshold.",
    },
    references: {
      fr: "Loi sur les impôts (RLRQ, c. I-3) ; Revenu Québec.",
      en: "Taxation Act (CQLR, c. I-3); Revenu Québec.",
    },
  },
  allocationLogement: {
    nom: { fr: "Allocation-logement", en: "Housing Allowance" },
    description: {
      fr: "Aide mensuelle aux ménages à faible revenu consacrant une part trop élevée de leur revenu au logement.",
      en: "Monthly assistance for low-income households spending too large a share of their income on housing.",
    },
    objectif: {
      fr: "Réduire le fardeau du logement pour les ménages à faible revenu (aînés ou avec enfants).",
      en: "Ease the housing burden for low-income households (seniors or with children).",
    },
    regle: {
      fr: "Prestation selon le taux d'effort au logement et la composition du ménage, réduite selon le revenu ; condition d'âge (50 ans et plus) ou présence d'enfants.",
      en: "A benefit based on the housing effort ratio and household composition, reduced by income; age (50+) or children required.",
    },
    references: {
      fr: "Programme Allocation-logement ; Société d'habitation du Québec ; Revenu Québec.",
      en: "Housing Allowance program; Société d'habitation du Québec; Revenu Québec.",
    },
  },
  soutienAines: {
    nom: { fr: "Montant pour le soutien des aînés", en: "Senior Assistance Amount" },
    description: {
      fr: "Crédit d'impôt remboursable pour les personnes de 70 ans et plus à revenu faible ou moyen.",
      en: "A refundable tax credit for people aged 70 and over with low or modest income.",
    },
    objectif: {
      fr: "Soutenir le revenu des aînés les plus vulnérables.",
      en: "Support the income of the most vulnerable seniors.",
    },
    regle: {
      fr: "Montant par aîné admissible (70 ans et plus), réduit selon le revenu familial au-delà d'un seuil.",
      en: "An amount per eligible senior (70+), reduced by family income above a threshold.",
    },
    references: {
      fr: "Loi sur les impôts (RLRQ, c. I-3) ; Revenu Québec.",
      en: "Taxation Act (CQLR, c. I-3); Revenu Québec.",
    },
  },
  fraisGarde: {
    nom: { fr: "Crédit d'impôt pour frais de garde d'enfants", en: "Tax Credit for Childcare Expenses" },
    description: {
      fr: "Crédit remboursable couvrant une part des frais de garde non subventionnés payés pour un enfant.",
      en: "A refundable credit covering part of the non-subsidized childcare expenses paid for a child.",
    },
    objectif: {
      fr: "Soutenir les parents qui travaillent ou étudient et assument des frais de garde.",
      en: "Support parents who work or study and pay for childcare.",
    },
    regle: {
      fr: "Pourcentage (dégressif selon le revenu) des frais admissibles, plafonnés par enfant selon l'âge.",
      en: "A percentage (declining with income) of eligible expenses, capped per child by age.",
    },
    references: {
      fr: "Loi sur les impôts (RLRQ, c. I-3) ; Revenu Québec.",
      en: "Taxation Act (CQLR, c. I-3); Revenu Québec.",
    },
  },
  fraisMedicaux: {
    nom: { fr: "Crédit remboursable pour frais médicaux (Québec)", en: "Refundable Tax Credit for Medical Expenses (Quebec)" },
    description: {
      fr: "Crédit remboursable pour les travailleurs à faible revenu ayant des frais médicaux supérieurs à un seuil.",
      en: "A refundable credit for low-income workers with medical expenses above a threshold.",
    },
    objectif: {
      fr: "Alléger les frais médicaux des travailleurs à faible revenu.",
      en: "Ease medical costs for low-income workers.",
    },
    regle: {
      fr: "Pourcentage des frais au-delà d'une part du revenu, plafonné et réduit selon le revenu ; ici, la seule dépense (prime RAMQ) ne dépasse pas le seuil, donc généralement nul.",
      en: "A percentage of expenses above a share of income, capped and reduced by income; here, the only expense (the RAMQ premium) stays below the threshold, so usually zero.",
    },
    references: {
      fr: "Loi sur les impôts (RLRQ, c. I-3) ; Revenu Québec.",
      en: "Taxation Act (CQLR, c. I-3); Revenu Québec.",
    },
  },
  aideSociale: {
    nom: { fr: "Aide de dernier recours (aide sociale)", en: "Last-Resort Financial Assistance" },
    description: {
      fr: "Prestation de base versée aux personnes sans ressources suffisantes pour subvenir à leurs besoins.",
      en: "A basic benefit paid to people without sufficient resources to meet their needs.",
    },
    objectif: {
      fr: "Garantir un revenu minimal aux personnes et familles à très faible revenu.",
      en: "Guarantee a minimum income to very-low-income people and families.",
    },
    regle: {
      fr: "Prestation de base (seul ou couple) plus des ajustements, réduite du revenu du ménage ; les gains de travail sont partiellement exemptés pour encourager le travail.",
      en: "A base benefit (single or couple) plus adjustments, reduced by household income; work earnings are partly exempt to encourage work.",
    },
    references: {
      fr: "Loi sur l'aide aux personnes et aux familles (RLRQ, c. A-13.1.1) ; ministère de l'Emploi et de la Solidarité sociale.",
      en: "Individual and Family Assistance Act (CQLR, c. A-13.1.1); ministère de l'Emploi et de la Solidarité sociale.",
    },
  },

  // ---------- Impôt du Québec ----------
  impotQuebec: {
    nom: { fr: "Impôt sur le revenu du Québec", en: "Quebec Income Tax" },
    description: {
      fr: "Impôt provincial calculé sur le revenu imposable selon un barème progressif, diminué des crédits non remboursables.",
      en: "Provincial tax computed on taxable income using a progressive scale, reduced by non-refundable credits.",
    },
    objectif: {
      fr: "Financer les services publics québécois selon la capacité de payer.",
      en: "Fund Quebec public services according to ability to pay.",
    },
    regle: {
      fr: "Barème progressif appliqué au revenu imposable, moins les crédits (montant personnel de base, déduction pour travailleur, âge, retraite, etc.).",
      en: "A progressive scale applied to taxable income, less credits (basic personal amount, worker deduction, age, retirement, etc.).",
    },
    references: {
      fr: "Loi sur les impôts (RLRQ, c. I-3) ; Revenu Québec.",
      en: "Taxation Act (CQLR, c. I-3); Revenu Québec.",
    },
  },

  // ---------- Transferts — fédéral ----------
  allocationEnfants: {
    nom: { fr: "Allocation canadienne pour enfants (ACE)", en: "Canada Child Benefit (CCB)" },
    description: {
      fr: "Prestation fédérale non imposable versée mensuellement pour chaque enfant de moins de 18 ans.",
      en: "A non-taxable federal benefit paid monthly for each child under 18.",
    },
    objectif: {
      fr: "Aider les familles avec les coûts liés aux enfants.",
      en: "Help families with the costs of raising children.",
    },
    regle: {
      fr: "Montant maximal par enfant (selon l'âge) réduit selon le revenu familial net rajusté au-delà de seuils.",
      en: "A maximum amount per child (by age) reduced by adjusted family net income above thresholds.",
    },
    references: {
      fr: "Loi de l'impôt sur le revenu (L.R.C. 1985, ch. 1 (5e suppl.)), art. 122.6 et suivants ; ARC.",
      en: "Income Tax Act (R.S.C. 1985, c. 1 (5th supp.)), s. 122.6 et seq.; CRA.",
    },
  },
  creditTPS: {
    nom: { fr: "Crédit pour la TPS/TVH", en: "GST/HST Credit" },
    description: {
      fr: "Crédit fédéral remboursable versé trimestriellement pour compenser la taxe de vente.",
      en: "A refundable federal credit paid quarterly to offset sales tax.",
    },
    objectif: {
      fr: "Compenser une partie de la TPS/TVH payée par les ménages à revenu faible ou modeste.",
      en: "Offset part of the GST/HST paid by low- and modest-income households.",
    },
    regle: {
      fr: "Montant de base par adulte et par enfant, plus un supplément, réduit selon le revenu familial net rajusté.",
      en: "A base amount per adult and per child, plus a supplement, reduced by adjusted family net income.",
    },
    references: {
      fr: "Loi de l'impôt sur le revenu, art. 122.5 ; ARC.",
      en: "Income Tax Act, s. 122.5; CRA.",
    },
  },
  allocationTravailleurs: {
    nom: { fr: "Allocation canadienne pour les travailleurs (ACT)", en: "Canada Workers Benefit (CWB)" },
    description: {
      fr: "Crédit fédéral remboursable bonifiant le revenu des travailleurs à faible revenu (configuration propre au Québec).",
      en: "A refundable federal credit topping up the income of low-income workers (Quebec-specific configuration).",
    },
    objectif: {
      fr: "Encourager et récompenser le travail chez les personnes à faible revenu.",
      en: "Encourage and reward work among low-income individuals.",
    },
    regle: {
      fr: "Pourcentage des revenus de travail au-delà d'une exclusion, jusqu'à un maximum, puis réduit selon le revenu familial.",
      en: "A percentage of work income above an exclusion, up to a maximum, then reduced by family income.",
    },
    references: {
      fr: "Loi de l'impôt sur le revenu, art. 122.7 ; ARC.",
      en: "Income Tax Act, s. 122.7; CRA.",
    },
  },
  securiteVieillesse: {
    nom: { fr: "Sécurité de la vieillesse (PSV, SRG, Allocation)", en: "Old Age Security (OAS, GIS, Allowance)" },
    description: {
      fr: "Pension fédérale de base pour les 65 ans et plus (PSV), bonifiée pour les aînés à faible revenu (Supplément de revenu garanti) ; l'Allocation vise les 60-64 ans dont le conjoint la reçoit.",
      en: "A basic federal pension for people 65 and over (OAS), topped up for low-income seniors (Guaranteed Income Supplement); the Allowance targets 60-64 year-olds whose spouse receives it.",
    },
    objectif: {
      fr: "Garantir un revenu de base à la retraite et protéger les aînés à faible revenu.",
      en: "Guarantee a basic retirement income and protect low-income seniors.",
    },
    regle: {
      fr: "PSV (montant fixe, récupérée à revenu élevé) + SRG (réduit selon le revenu de retraite) ; montants révisés chaque trimestre.",
      en: "OAS (a fixed amount, clawed back at high income) + GIS (reduced by retirement income); amounts revised quarterly.",
    },
    references: {
      fr: "Loi sur la sécurité de la vieillesse (L.R.C. 1985, ch. O-9) ; Emploi et Développement social Canada.",
      en: "Old Age Security Act (R.S.C. 1985, c. O-9); Employment and Social Development Canada.",
    },
  },
  supplementMedical: {
    nom: { fr: "Supplément remboursable pour frais médicaux (fédéral)", en: "Refundable Medical Expense Supplement (federal)" },
    description: {
      fr: "Crédit fédéral remboursable pour les travailleurs à faible revenu ayant des frais médicaux élevés.",
      en: "A refundable federal credit for low-income workers with high medical expenses.",
    },
    objectif: {
      fr: "Rembourser une partie des frais médicaux des travailleurs, même s'ils paient peu d'impôt.",
      en: "Refund part of medical expenses for workers, even if they pay little tax.",
    },
    regle: {
      fr: "25 % des frais admissibles, plafonné et réduit selon le revenu familial ; ici, la seule dépense (prime RAMQ) ne dépasse pas le seuil, donc nul.",
      en: "25% of eligible expenses, capped and reduced by family income; here, the only expense (the RAMQ premium) stays below the threshold, so zero.",
    },
    references: {
      fr: "Loi de l'impôt sur le revenu, art. 122.51 ; ARC (ligne 45200).",
      en: "Income Tax Act, s. 122.51; CRA (line 45200).",
    },
  },

  // ---------- Impôt fédéral ----------
  impotFederal: {
    nom: { fr: "Impôt sur le revenu fédéral", en: "Federal Income Tax" },
    description: {
      fr: "Impôt fédéral calculé sur le revenu imposable selon un barème progressif, diminué des crédits non remboursables et de l'abattement du Québec (16,5 %).",
      en: "Federal tax computed on taxable income using a progressive scale, reduced by non-refundable credits and the Quebec abatement (16.5%).",
    },
    objectif: {
      fr: "Financer les services publics fédéraux selon la capacité de payer.",
      en: "Fund federal public services according to ability to pay.",
    },
    regle: {
      fr: "Barème progressif moins les crédits (montant personnel de base, montant pour conjoint, âge, pension, cotisations…), puis abattement du Québec de 16,5 %.",
      en: "A progressive scale less credits (basic personal amount, spouse amount, age, pension, contributions…), then the 16.5% Quebec abatement.",
    },
    references: {
      fr: "Loi de l'impôt sur le revenu (L.R.C. 1985, ch. 1 (5e suppl.)), art. 118 et suivants ; ARC.",
      en: "Income Tax Act (R.S.C. 1985, c. 1 (5th supp.)), s. 118 et seq.; CRA.",
    },
  },
};
