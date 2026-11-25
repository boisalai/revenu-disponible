// @ts-check
// ===========================================================================
// Programme 11 — Crédit d'impôt pour soutien aux aînés
//
// Ce que fait le programme : un crédit d'impôt remboursable de 2 000 $ par
// adulte de 70 ans ou plus, réduit d'un pourcentage du revenu familial qui
// dépasse un seuil.
// Qui y a droit : le « particulier admissible » (art. 1029.8.61.103) de 70 ans
// ou plus à la fin de l'année ; un couple dont les deux conjoints ont 70 ans ou
// plus reçoit deux montants.
// Base légale : Loi sur les impôts (RLRQ, c. I-3), art. 1029.8.61.103 à
//   1029.8.61.106 ; le calcul est la formule A − B de l'art. 1029.8.61.104 ;
//   indexation des seuils : art. 1029.6.0.6 ; déclaration de revenus du Québec
//   (TP-1), ligne 463.
// Sources publiques : Revenu Québec, formulaire TP-1029.SA ;
//   ministère des Finances du Québec, « Paramètres du régime d'imposition des particuliers »
//   (seuils et taux de chaque année).
// Simplifications du modèle : le crédit est calculé pour le ménage ; le
//   partage entre conjoints (art. 1029.8.61.105) ne change pas le total. Les
//   conditions de résidence et d'exclusion (art. 1029.8.61.103) sont réputées
//   remplies. Le taux de réduction est celui que publie et applique Revenu
//   Québec (5,40 % en 2025) : la formule de la loi, 4 000 / (119 350 − seuil
//   du couple) (art. 1029.8.61.104, 3e al.), dont le 5e alinéa ne retient
//   que les deux premières décimales, donnerait 5,39 % (2025) et 5,46 %
//   (2026) ; Revenu Québec arrondit.
// Paramètres (parametres.csv, groupe « soutienAines ») : ageAdmissible,
//   montantParAine, seuilSeul, seuilCouple, tauxReduction.
// ===========================================================================

/**
 * Crédit d'impôt pour soutien aux aînés du ménage.
 *
 * @param revenuFamilialNet revenu familial net ($ ; revenu net de l'adulte et de son conjoint)
 * @param nbAdultes 1 ou 2
 * @param age1 âge de l'adulte 1
 * @param age2 âge de l'adulte 2 (sans effet s'il n'y a qu'un adulte)
 * @param soutienAines paramètres du crédit de l'année
 * @returns le crédit de l'année ($)
 */
function montantSoutienAines(revenuFamilialNet, nbAdultes, age1, age2, soutienAines, etapes) {
  // 1. Nombre d'aînés admissibles : chaque adulte de 70 ans ou plus (art. 1029.8.61.104,
  //    2e al., par. a).
  let nbAines = 0;
  if (age1 >= soutienAines.ageAdmissible) {
    nbAines = nbAines + 1;
  }
  if (nbAdultes === 2 && age2 >= soutienAines.ageAdmissible) {
    nbAines = nbAines + 1;
  }
  noter(etapes, "nbAines", nbAines);
  if (nbAines === 0) {
    noter(etapes, "credit", 0);
    return 0;
  }

  // 2. Montant de base (A) : 2 000 $ par aîné admissible (2e al., par. a).
  const montantDeBase = nbAines * soutienAines.montantParAine;
  noter(etapes, "montantDeBase", montantDeBase);

  // 3. Seuil de réduction : sans conjoint ou avec conjoint (2e al., par. b).
  let seuil = soutienAines.seuilSeul;
  if (nbAdultes === 2) {
    seuil = soutienAines.seuilCouple;
  }
  noter(etapes, "seuil", seuil);

  // 4. Réduction (B) : le taux de réduction × le revenu familial qui dépasse le seuil
  //    (2e al., par. b, et 3e al.).
  noter(etapes, "revenuFamilialNet", revenuFamilialNet);
  const reduction = excedent(revenuFamilialNet, seuil) * soutienAines.tauxReduction;
  noter(etapes, "reduction", reduction);

  // 5. Crédit : A − B, sans descendre sous zéro (art. 7.5).
  const credit = auMoinsZero(montantDeBase - reduction);
  noter(etapes, "credit", credit);
  return credit;
}

/**
 * Crédit d'impôt pour soutien aux aînés du ménage, à partir du ménage.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param revenuFamilialNet revenu familial net ($)
 * @param soutienAines paramètres du crédit de l'année
 * @returns le crédit de l'année ($)
 */
function montantSoutienAinesMenage(menage, revenuFamilialNet, soutienAines, etapes) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  let age2 = 0;
  if (nbAdultes === 2) {
    age2 = menage.ageAdulte2;
  }
  return montantSoutienAines(revenuFamilialNet, nbAdultes, menage.ageAdulte1, age2, soutienAines, etapes);
}
