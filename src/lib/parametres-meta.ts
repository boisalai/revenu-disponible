// Métadonnées d'affichage pour l'éditeur de paramètres (phase 4c).
// Les clés du bundle `Parametres` sont regroupées par poste ; les libellés de groupe réutilisent
// les noms bilingues de POSTES_INFO. Les champs individuels sont « humanisés » depuis leur nom
// (les paramètres portent des noms français explicites, p. ex. maxParEnfant, seuilReduction).

import type { Bilingue, Lang } from "./i18n";
import { POSTES_INFO } from "./postes-info";

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

/** Humanise un nom de champ : maxParEnfant → « Max par enfant ». */
export function labelChamp(cle: string): string {
  const espace = cle.replace(/([A-Z])/g, " $1").replace(/([a-z])([0-9])/g, "$1 $2");
  return espace.charAt(0).toUpperCase() + espace.slice(1);
}
