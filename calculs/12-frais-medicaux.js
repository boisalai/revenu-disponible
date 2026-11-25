// @ts-check
// ===========================================================================
// Programme 12 — Crédit d'impôt remboursable pour frais médicaux (Québec)
//
// Ce que fait le programme : un crédit remboursable pour les travailleurs qui
// paient des frais médicaux élevés : 25 % des frais qui dépassent 3 % du
// revenu familial, jusqu'à un maximum, réduit de 5 % du revenu familial qui
// dépasse un seuil.
// Qui y a droit : le « particulier admissible » de 18 ans ou plus dont le revenu
// de travail atteint un minimum (art. 1029.8.117).
// Base légale : Loi sur les impôts (RLRQ, c. I-3), art. 1029.8.117
//   (particulier admissible, revenu familial) et 1029.8.118 (formule A − B :
//   A, le moindre d'un maximum et de 25/20 du crédit de 20 % de l'art.
//   752.0.11, soit 25 % des frais qui dépassent 3 % du revenu familial ; B,
//   5 % du revenu familial au-delà d'un seuil) ; art. 7.5 (résultat négatif
//   réputé nul) ; déclaration de revenus du Québec (TP-1), ligne 462.
// Sources publiques : Revenu Québec (ligne 462, point 1) ;
//   ministère des Finances du Québec, « Paramètres du régime d'imposition des particuliers »
//   (maximum, revenu de travail minimal et seuil de chaque année).
// Simplifications du modèle : les seuls frais médicaux sont la prime
//   d'assurance médicaments (programme 5). Elle peut dépasser 3 % du revenu
//   familial (un couple de 2026, par exemple), mais le revenu familial dépasse
//   alors largement le seuil de réduction : avec les paramètres de 2025 et
//   2026, la réduction de 5 % annule le crédit (vérifié sur une grille de
//   ménages par tests/maximums.test.ts). Le crédit est tout de même calculé :
//   il réagit aux paramètres modifiés. Le revenu de travail est celui de
//   l'adulte qui en a le plus (dans un couple, l'un ou l'autre peut demander
//   le crédit) ; il est nul pour un ménage retraité. La déduction pour
//   produits et services de soutien à une personne handicapée (art. 358.0.1,
//   2e al., par. a, sous-par. ii) n'est pas modélisée.
// Paramètres (parametres.csv, groupe « fraisMedicaux ») : revenuTravailMin,
//   seuilFrais, taux, creditMax, seuilReduction, tauxReduction.
// ===========================================================================

/**
 * Crédit d'impôt remboursable pour frais médicaux.
 *
 * @param fraisMedicaux frais médicaux du ménage ($ ; dans le modèle, la prime d'assurance médicaments)
 * @param revenuTravailMax revenu de travail le plus élevé des adultes ($ ; pour l'admissibilité)
 * @param revenuFamilialNet revenu familial net ($)
 * @param parametresCredit paramètres du crédit de l'année
 * @param etapes journal du calcul (facultatif)
 * @returns le crédit de l'année ($), arrondi au cent
 */
function creditFraisMedicaux(fraisMedicaux, revenuTravailMax, revenuFamilialNet, parametresCredit, etapes) {
  // 1. Admissibilité : un revenu de travail « d'au moins 2 500 $ », montant indexé
  //    (art. 1029.8.117, définition de « particulier admissible », par. c).
  noter(etapes, "revenuTravail", revenuTravailMax);
  if (revenuTravailMax < parametresCredit.revenuTravailMin) {
    noter(etapes, "credit", 0);
    return 0;
  }

  // 2. Frais admissibles : les frais médicaux qui dépassent 3 % du revenu du particulier
  //    et de son conjoint (art. 752.0.11, 2e al., par. c).
  noter(etapes, "fraisMedicaux", fraisMedicaux);
  noter(etapes, "revenuFamilialNet", revenuFamilialNet);
  const fraisAdmissibles = excedent(fraisMedicaux, parametresCredit.seuilFrais * revenuFamilialNet);
  noter(etapes, "fraisAdmissibles", fraisAdmissibles);

  // 3. Montant A : 25 % des frais admissibles, au plus le crédit maximal (art. 1029.8.118,
  //    2e al., par. a : 25/20 du crédit de 20 % de l'art. 752.0.11).
  const montantA = plafonner(parametresCredit.taux * fraisAdmissibles, parametresCredit.creditMax);
  noter(etapes, "montantA", montantA);

  // 4. Réduction (B) : 5 % du revenu familial qui dépasse le seuil de réduction
  //    (2e al., par. b).
  const reduction = excedent(revenuFamilialNet, parametresCredit.seuilReduction) * parametresCredit.tauxReduction;
  noter(etapes, "reduction", reduction);

  // 5. Crédit : A − B, sans descendre sous zéro (art. 7.5).
  const credit = arrondiAuCent(auMoinsZero(montantA - reduction));
  noter(etapes, "credit", credit);
  return credit;
}

/**
 * Crédit d'impôt remboursable pour frais médicaux du ménage. Les frais sont la prime
 * d'assurance médicaments du ménage (programme 5).
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param primeAssuranceMedicaments prime d'assurance médicaments du ménage ($)
 * @param revenuFamilialNet revenu familial net ($)
 * @param parametresCredit paramètres du crédit de l'année
 * @param etapes journal du calcul (facultatif)
 * @returns le crédit de l'année ($), arrondi au cent
 */
function creditFraisMedicauxMenage(menage, primeAssuranceMedicaments, revenuFamilialNet, parametresCredit, etapes) {
  // Revenu de travail : celui de l'adulte qui en a le plus ; aucun pour un ménage retraité.
  let revenuTravailMax = 0;
  if (SITUATIONS[menage.situation].retraite === false) {
    revenuTravailMax = menage.revenu1;
    if (SITUATIONS[menage.situation].nbAdultes === 2 && menage.revenu2 > revenuTravailMax) {
      revenuTravailMax = menage.revenu2;
    }
  }
  return creditFraisMedicaux(primeAssuranceMedicaments, revenuTravailMax, revenuFamilialNet, parametresCredit, etapes);
}
