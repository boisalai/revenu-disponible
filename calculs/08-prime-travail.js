// @ts-check
// ===========================================================================
// Programme 8 — Prime au travail (générale)
//
// Ce que fait le programme : un crédit d'impôt remboursable qui encourage le
// travail. Il croît avec le revenu de travail du ménage au-delà d'un montant
// exclu, jusqu'à un maximum atteint au seuil de réduction ; il diminue ensuite
// de 10 % du revenu familial qui dépasse ce seuil.
// Qui y a droit : le particulier admissible qui réside au Québec à la fin de
// l'année (art. 1029.8.116.5) ; un couple reçoit une seule prime
// (art. 1029.8.116.11).
// Base légale : Loi sur les impôts (RLRQ, c. I-3), art. 1029.8.116.1 à
//   1029.8.116.11 ; le calcul est la formule (A × B) − (10 % × C) de
//   l'art. 1029.8.116.5 ; seuils de réduction publiés chaque année
//   (art. 1029.8.116.5.1).
// Sources publiques : la loi (taux, montants exclus) ; pour les seuils de réduction,
//   ministère des Finances du Québec, « Paramètres du régime d'imposition des particuliers ».
// Simplifications du modèle : « avec enfants » tient lieu d'« a une personne
//   à sa charge » ; la prime au travail adaptée (art. 1029.8.116.5.0.1) n'est
//   pas modélisée.
// Paramètres (parametres.csv, groupe « primeTravail ») : tauxReduction et, pour
//   chacun des quatre types de ménage (1 ou 2 adultes, avec ou sans enfants),
//   revenuTravailExclu, tauxCroissance, seuilReduction. La prime maximale (publiée
//   avec les seuils) n'est pas un paramètre : elle découle de la formule
//   (tauxCroissance × (seuilReduction − revenuTravailExclu)).
// ===========================================================================

/**
 * Prime au travail d'un ménage.
 *
 * @param revenuTravail revenu de travail du ménage ($ ; celui des deux conjoints)
 * @param revenuFamilialNet revenu familial net ($ ; revenu net des deux conjoints)
 * @param nbAdultes 1 (sans conjoint) ou 2 (avec conjoint)
 * @param aDesEnfants `true` si le ménage a au moins un enfant
 * @param primeTravail paramètres de la prime au travail de l'année
 * @returns la prime de l'année ($), arrondie au cent
 */
function primeAuTravail(revenuTravail, revenuFamilialNet, nbAdultes, aDesEnfants, primeTravail, etapes) {
  // 1. Barème du type de ménage : avec ou sans conjoint, avec ou sans personne à charge
  //    (art. 1029.8.116.5, 2e al., par. a à c).
  let typeDeMenage = "sansEnfants";
  if (aDesEnfants) {
    typeDeMenage = "avecEnfants";
  }
  const bareme = primeTravail.parType[nbAdultes][typeDeMenage];
  noter(etapes, "revenuTravailExclu", bareme.revenuTravailExclu);
  noter(etapes, "tauxCroissance", bareme.tauxCroissance);
  noter(etapes, "seuilReduction", bareme.seuilReduction);
  noter(etapes, "revenuTravail", revenuTravail);

  // 2. Montant de croissance (A × B) : le taux × « l'excédent, sur 2 400 $ [3 600 $ avec
  //    conjoint], du moins élevé du seuil de réduction […] et de son revenu de travail »
  //    (2e al., par. a et b). La croissance s'arrête donc au seuil de réduction.
  const revenuTravailRetenu = plafonner(revenuTravail, bareme.seuilReduction);
  const croissance = excedent(revenuTravailRetenu, bareme.revenuTravailExclu) * bareme.tauxCroissance;
  noter(etapes, "croissance", croissance);

  // 3. Réduction (10 % × C) : 10 % du revenu familial qui dépasse le seuil de réduction
  //    (1er al. ; 2e al., par. c).
  noter(etapes, "revenuFamilialNet", revenuFamilialNet);
  const reduction = excedent(revenuFamilialNet, bareme.seuilReduction) * primeTravail.tauxReduction;
  noter(etapes, "reduction", reduction);

  // 4. Prime : la croissance moins la réduction, sans descendre sous zéro (art. 7.5).
  const prime = arrondiAuCent(auMoinsZero(croissance - reduction));
  noter(etapes, "prime", prime);
  return prime;
}

/**
 * Prime au travail du ménage.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param revenuTravail revenu de travail du ménage ($)
 * @param revenuFamilialNet revenu familial net ($)
 * @param primeTravail paramètres de la prime au travail de l'année
 * @returns la prime de l'année ($)
 */
function primeAuTravailMenage(menage, revenuTravail, revenuFamilialNet, primeTravail, etapes) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  const aDesEnfants = menage.enfants.length > 0;
  return primeAuTravail(revenuTravail, revenuFamilialNet, nbAdultes, aDesEnfants, primeTravail, etapes);
}
