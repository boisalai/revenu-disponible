// @ts-check
// ===========================================================================
// Socle commun des calculs : les situations de ménage, le type de service de
// garde, l'impôt selon un barème progressif et la liste des revenus des adultes.
// Les constantes sont déclarées avec `var` pour que la page et les tests les
// trouvent (scripts classiques, sans modules).
// ===========================================================================

/** Les cinq situations de ménage (codes numériques). */
var Situation = {
  PersonneSeule: 0,
  FamilleMonoparentale: 1,
  Couple: 2,
  RetraiteSeul: 3,
  CoupleRetraites: 4,
};

/** Caractéristiques de chaque situation : libellé, nombre d'adultes, ménage retraité ou non. */
var SITUATIONS = {
  [Situation.PersonneSeule]: { libelle: "Personne vivant seule", nbAdultes: 1, retraite: false },
  [Situation.FamilleMonoparentale]: { libelle: "Famille monoparentale", nbAdultes: 1, retraite: false },
  [Situation.Couple]: { libelle: "Couple", nbAdultes: 2, retraite: false },
  [Situation.RetraiteSeul]: { libelle: "Retraité vivant seul", nbAdultes: 1, retraite: true },
  [Situation.CoupleRetraites]: { libelle: "Couple de retraités", nbAdultes: 2, retraite: true },
};

/** Service de garde d'un enfant. Seuls les frais NON subventionnés ouvrent droit au crédit du Québec. */
var TypeGarde = { Subventionne: 0, NonSubventionne: 1 };

/**
 * Impôt selon un barème progressif : chaque tranche de revenu est imposée à son propre taux
 * (fédéral : par. 117(2) de la Loi de l'impôt sur le revenu ; Québec : art. 750 de la Loi sur
 * les impôts).
 *
 * @param revenuImposable revenu imposable ($)
 * @param paliers paliers du barème, du plus bas au plus haut : { plafond, taux } ; le dernier
 *   plafond est illimité
 * @returns l'impôt avant crédits ($)
 */
function impotProgressif(revenuImposable, paliers) {
  let impot = 0;
  let debutDeTranche = 0;
  for (const palier of paliers) {
    // Le revenu n'atteint pas cette tranche : le calcul est terminé.
    if (revenuImposable <= debutDeTranche) {
      return impot;
    }
    // Partie du revenu comprise dans la tranche, imposée au taux de la tranche.
    const revenuDansLaTranche = plafonner(revenuImposable, palier.plafond) - debutDeTranche;
    impot = impot + revenuDansLaTranche * palier.taux;
    debutDeTranche = palier.plafond;
  }
  return impot;
}

/**
 * Revenus des adultes du ménage : le revenu de l'adulte 1 et, dans un couple, celui de
 * l'adulte 2.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @returns la liste des revenus ($)
 */
function revenusAdultes(menage) {
  const revenus = [menage.revenu1];
  if (SITUATIONS[menage.situation].nbAdultes === 2) {
    revenus.push(menage.revenu2);
  }
  return revenus;
}
