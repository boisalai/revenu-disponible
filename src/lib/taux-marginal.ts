// Taux marginal implicite de taxation (TMI) par poste et cumulatif.
//
// Pour un dollar de revenu de travail supplémentaire, quelle part n'aboutit PAS au revenu
// disponible ? TMI = 1 − dRD/dr. On le décompose par grande catégorie (différences finies) :
//   RD = revenu − cotisations + transferts QC − impôt QC + transferts féd. − impôt féd.
//   ⇒ TMI = dCotis − dTransfQC + dImpôtQC − dTransfFéd + dImpôtFéd   (dérivées / revenu)
// Une cotisation/un impôt qui augmente AJOUTE au taux ; un transfert récupéré (qui baisse) aussi ;
// un transfert en phase de hausse (ex. prime au travail) RETRANCHE (contribution négative).

import { calculerRevenuDisponible, type Annee, type Menage } from "@/index";

export interface PointTMI {
  revenu: number; // revenu de travail (adulte 1) au point
  cotisations: number; // contributions au TMI, en % (peuvent être négatives)
  transfertsQuebec: number;
  impotQuebec: number;
  transfertsFederaux: number;
  impotFederal: number;
  total: number; // TMI cumulatif (%)
}

export interface OptionsTMI {
  max?: number; // revenu maximal balayé ($)
  pas?: number; // pas du balayage / Δ des différences finies ($)
}

/** TEMI décomposé à un revenu de travail donné (différence finie sur [revenu, revenu+pas]). */
export function tauxMarginalAu(menage: Menage, annee: Annee, revenu: number, pas = 1000): PointTMI {
  const a = calculerRevenuDisponible({ ...menage, revenu1: revenu }, annee).composantes;
  const b = calculerRevenuDisponible({ ...menage, revenu1: revenu + pas }, annee).composantes;
  const taux = (x: number, y: number) => ((y - x) / pas) * 100;

  const cotisations = taux(a.cotisations, b.cotisations);
  const transfertsQuebec = -taux(a.transfertsQuebec, b.transfertsQuebec);
  const impotQuebec = taux(a.impotQuebec, b.impotQuebec);
  const transfertsFederaux = -taux(a.transfertsFederaux, b.transfertsFederaux);
  const impotFederal = taux(a.impotFederal, b.impotFederal);

  return {
    revenu,
    cotisations,
    transfertsQuebec,
    impotQuebec,
    transfertsFederaux,
    impotFederal,
    total: cotisations + transfertsQuebec + impotQuebec + transfertsFederaux + impotFederal,
  };
}

/** Courbe du TEMI en faisant varier le revenu de travail de l'adulte 1. */
export function courbeTauxMarginal(menage: Menage, annee: Annee, opts: OptionsTMI = {}): PointTMI[] {
  const max = opts.max ?? 100_000;
  const pas = opts.pas ?? 1000;
  const points: PointTMI[] = [];
  for (let r = 0; r <= max; r += pas) points.push(tauxMarginalAu(menage, annee, r, pas));
  return points;
}

/** Seuil de TMI au-delà duquel on parle de « trappe à la pauvreté » (%). */
export const SEUIL_TRAPPE = 60;

/**
 * Plages de revenu où le TMI total dépasse `seuil` — les **trappes à la pauvreté** : un dollar de
 * revenu de travail supplémentaire y rapporte moins de (100 − seuil) cents de revenu disponible.
 * Chaque point couvre la tranche [revenu, revenu + pas] ; on fusionne les tranches contiguës.
 */
export function zonesTrappe(points: PointTMI[], seuil = SEUIL_TRAPPE): { debut: number; fin: number }[] {
  const pas = points.length > 1 ? points[1].revenu - points[0].revenu : 1000;
  const zones: { debut: number; fin: number }[] = [];
  let debut: number | null = null;
  for (let i = 0; i < points.length; i++) {
    if (points[i].total > seuil) {
      if (debut === null) debut = points[i].revenu;
    } else if (debut !== null) {
      zones.push({ debut, fin: points[i - 1].revenu + pas });
      debut = null;
    }
  }
  if (debut !== null) zones.push({ debut, fin: points[points.length - 1].revenu + pas });
  return zones;
}
