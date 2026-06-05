// Libellés français des postes, alignés sur les clés de `DetailRevenuDisponible` (poste 20).
// (Le volet pédagogique complet — description, objectif, règles, références — viendra en phase 2.)

export const LABELS_COTISATIONS: Record<string, string> = {
  rrq: "Régime de rentes du Québec",
  rqap: "Régime québécois d'assurance parentale",
  assuranceEmploi: "Assurance-emploi",
  fss: "Fonds des services de santé",
  ramq: "Assurance médicaments (RAMQ)",
};

export const LABELS_TRANSFERTS_QC: Record<string, string> = {
  allocationFamille: "Allocation famille",
  fournituresScolaires: "Supplément pour fournitures scolaires",
  primeTravail: "Prime au travail",
  solidarite: "Crédit pour la solidarité",
  allocationLogement: "Allocation-logement",
  soutienAines: "Montant pour le soutien des aînés",
  fraisGarde: "Crédit pour frais de garde",
  fraisMedicaux: "Crédit pour frais médicaux",
  aideSociale: "Aide de dernier recours",
};

export const LABELS_TRANSFERTS_FED: Record<string, string> = {
  allocationEnfants: "Allocation canadienne pour enfants",
  creditTPS: "Crédit pour la TPS/TVH",
  allocationTravailleurs: "Allocation canadienne pour les travailleurs",
  securiteVieillesse: "Sécurité de la vieillesse",
  supplementMedical: "Supplément remboursable pour frais médicaux",
};
