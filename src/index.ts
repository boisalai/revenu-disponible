// Point d'entrée du modèle « Revenu disponible » (MFQ).
// Ré-exporte le socle, les cotisations (postes 1–4) et les paramètres d'impôt.

export * from "./socle";

// Cotisations
export * from "./postes/01-rrq";
export * from "./postes/02-rqap";
export * from "./postes/03-ae";
export * from "./postes/04-fss";
export * from "./postes/05-ramq";

// Transferts et crédits
export * from "./postes/06-garde";
export * from "./postes/07-allocation-famille";
export * from "./postes/08-prime-travail";
export * from "./postes/09-solidarite";
export * from "./postes/10-allocation-logement";
export * from "./postes/11-soutien-aines";
export * from "./postes/12-frais-medicaux";
export * from "./postes/13-aide-sociale";

// Transferts fédéraux
export * from "./postes/14-allocation-canadienne-enfants";
export * from "./postes/15-credit-tps";
export * from "./postes/16-allocation-travailleurs";
export * from "./postes/17-securite-vieillesse";
export * from "./postes/18-supplement-medical-federal";

// Paramètres d'impôt + assemblage (poste 19)
export * from "./impot/parametres";
export * from "./postes/19-impot";

// Agrégation finale (poste 20)
export * from "./postes/20-revenu-disponible";
