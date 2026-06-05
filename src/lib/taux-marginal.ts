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

/** Courbe du taux marginal implicite en faisant varier le revenu de travail de l'adulte 1. */
export function courbeTauxMarginal(menage: Menage, annee: Annee, opts: OptionsTMI = {}): PointTMI[] {
  const max = opts.max ?? 100_000;
  const pas = opts.pas ?? 1000;
  const points: PointTMI[] = [];

  for (let r = 0; r <= max; r += pas) {
    const a = calculerRevenuDisponible({ ...menage, revenu1: r }, annee).composantes;
    const b = calculerRevenuDisponible({ ...menage, revenu1: r + pas }, annee).composantes;
    const taux = (x: number, y: number) => ((y - x) / pas) * 100;

    const cotisations = taux(a.cotisations, b.cotisations);
    const transfertsQuebec = -taux(a.transfertsQuebec, b.transfertsQuebec);
    const impotQuebec = taux(a.impotQuebec, b.impotQuebec);
    const transfertsFederaux = -taux(a.transfertsFederaux, b.transfertsFederaux);
    const impotFederal = taux(a.impotFederal, b.impotFederal);

    points.push({
      revenu: r,
      cotisations,
      transfertsQuebec,
      impotQuebec,
      transfertsFederaux,
      impotFederal,
      total: cotisations + transfertsQuebec + impotQuebec + transfertsFederaux + impotFederal,
    });
  }
  return points;
}
