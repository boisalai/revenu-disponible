// URL de la source officielle par poste — lien « En savoir plus » du panneau d'information.
// Clés = clés du `detail` de l'orchestrateur (= clés de POSTES_INFO).

export const SOURCE_POSTE: Record<string, string> = {
  // Cotisations
  rrq: "https://www.rrq.gouv.qc.ca",
  rqap: "https://www.rqap.gouv.qc.ca",
  assuranceEmploi: "https://www.canada.ca/fr/emploi-developpement-social/services/assurance-emploi.html",
  fss: "https://www.revenuquebec.ca",
  ramq: "https://www.ramq.gouv.qc.ca",
  // Transferts — Québec
  allocationFamille: "https://www.revenuquebec.ca",
  fournituresScolaires: "https://www.revenuquebec.ca",
  primeTravail: "https://www.revenuquebec.ca",
  solidarite: "https://www.revenuquebec.ca",
  allocationLogement: "https://www.revenuquebec.ca",
  soutienAines: "https://www.revenuquebec.ca",
  fraisGarde: "https://www.revenuquebec.ca",
  fraisMedicaux: "https://www.revenuquebec.ca",
  aideSociale: "https://www.revenuquebec.ca",
  impotQuebec: "https://www.revenuquebec.ca",
  // Transferts + impôt — fédéral
  allocationEnfants: "https://www.canada.ca/fr/agence-revenu.html",
  creditTPS: "https://www.canada.ca/fr/agence-revenu.html",
  allocationTravailleurs: "https://www.canada.ca/fr/agence-revenu.html",
  securiteVieillesse: "https://www.canada.ca/fr/emploi-developpement-social/programmes/securite-vieillesse.html",
  supplementMedical: "https://www.canada.ca/fr/agence-revenu.html",
  impotFederal: "https://www.canada.ca/fr/agence-revenu.html",
};
