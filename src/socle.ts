// ===========================================================================
// Socle commun — modèle « Revenu disponible » (MFQ)
// Source : revenu-disponible_dec2025.js (colonne M = 2025, colonne L = 2026)
// Voir docs/revenu-disponible.md §4.
// ===========================================================================

export type Annee = 2025 | 2026;

/** Les 5 situations du modèle (ordre = code interne du fichier). */
export enum Situation {
  PersonneSeule = 0,
  FamilleMonoparentale = 1,
  Couple = 2,
  RetraiteSeul = 3,
  CoupleRetraites = 4,
}

/** Métadonnées de chaque situation, extraites du code (rangées B5:G9 ; col. C = nbAdultes, col. G = retraité). */
export const SITUATIONS: Record<
  Situation,
  { libelle: string; nbAdultes: 1 | 2; retraite: boolean }
> = {
  [Situation.PersonneSeule]: { libelle: "Personne vivant seule", nbAdultes: 1, retraite: false },
  [Situation.FamilleMonoparentale]: { libelle: "Famille monoparentale", nbAdultes: 1, retraite: false },
  [Situation.Couple]: { libelle: "Couple", nbAdultes: 2, retraite: false },
  [Situation.RetraiteSeul]: { libelle: "Retraité vivant seul", nbAdultes: 1, retraite: true },
  [Situation.CoupleRetraites]: { libelle: "Couple de retraités", nbAdultes: 2, retraite: true },
};

export interface Enfant {
  age: number;
  fraisGarde: number; // frais de garde annuels payés ($)
  typeGarde: number; // code du type de garde
}

export interface Menage {
  situation: Situation;
  revenu1: number; // revenu de travail adulte 1
  revenu2: number; // revenu de travail adulte 2 (0 si ménage à 1 adulte)
  ageAdulte1: number;
  ageAdulte2: number;
  enfants: Enfant[]; // NbEnfants = enfants.length (max 5)
}

/** Un palier d'imposition : taux marginal jusqu'au plafond (Infinity = dernier). */
export interface Palier {
  plafond: number;
  taux: number;
}

/** Impôt brut par application progressive des paliers. */
export function impotProgressif(revenuImposable: number, paliers: Palier[]): number {
  let impot = 0;
  let borneInf = 0;
  for (const { plafond, taux } of paliers) {
    if (revenuImposable <= borneInf) break;
    const tranche = Math.min(revenuImposable, plafond) - borneInf;
    impot += tranche * taux;
    borneInf = plafond;
  }
  return impot;
}

/** Crédit non remboursable = taux × montant admissible (réducteur d'impôt). */
export function credit(montant: number, taux: number): number {
  return montant * taux;
}

/** Liste des revenus de travail des adultes présents dans le ménage. */
export function revenusAdultes(menage: Menage): number[] {
  const revenus = [menage.revenu1];
  if (SITUATIONS[menage.situation].nbAdultes === 2) revenus.push(menage.revenu2);
  return revenus;
}
