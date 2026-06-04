// Point d'entrée du modèle « Revenu disponible » (MFQ).
// Ré-exporte le socle, les cotisations (postes 1–4) et les paramètres d'impôt.

export * from "./socle";

// Cotisations
export * from "./postes/01-rrq";
export * from "./postes/02-rqap";
export * from "./postes/03-ae";
export * from "./postes/04-fss";

// Paramètres d'impôt (assemblage = poste 19, à venir)
export * from "./impot/parametres";
