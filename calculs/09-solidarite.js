// @ts-check
// ===========================================================================
// Programme 9 — Crédit d'impôt pour la solidarité
//
// Ce que fait le programme : un crédit remboursable versé par Revenu Québec,
// fait d'un volet lié à la TVQ et d'un volet lié au logement, puis réduit à
// mesure que le revenu familial dépasse un seuil.
// Qui y a droit : le « particulier admissible » (art. 1029.8.116.12) ; le
// modèle traite tout ménage comme admissible.
// Base légale : Loi sur les impôts (RLRQ, c. I-3), art. 1029.8.116.12 à
//   1029.8.116.35 ; le calcul est la formule A + B + C − D de l'art. 1029.8.116.16.
// Sources publiques : pour les montants et le seuil de chaque période de juillet à juin,
//   ministère des Finances du Québec, « Paramètres du régime d'imposition des particuliers » ;
//   la loi (taux de 6 %) ; Revenu Québec verse le crédit.
// Simplifications du modèle : le ménage est réputé admissible aux deux volets
//   (propriétaire ou locataire de son logement), d'où un taux de réduction de
//   6 % ; le volet des villages nordiques (lettre C) n'est pas modélisé ; un
//   ménage d'un seul adulte est réputé vivre seul (avec ses enfants mineurs) ;
//   le plancher de l'art. 1029.8.116.17.1 (au moins le volet TVQ seul, réduit
//   à 3 %) n'est pas appliqué : il n'a d'effet que si le volet logement est
//   inférieur au volet TVQ, ce qui n'arrive pas avec les paramètres de 2025 et 2026.
// Paramètres (parametres.csv, groupe « solidarite ») : tvqBase, tvqConjoint,
//   tvqAdditionnelSeule, logementSeule, logementCouple, logementParEnfant,
//   seuilReduction, tauxReduction. Les montants inscrits dans la loi sont indexés
//   chaque 1er juillet (art. 1029.6.0.6.2).
// ===========================================================================

/**
 * Crédit d'impôt pour la solidarité.
 *
 * @param revenuFamilialNet revenu familial net ($ ; revenu net de l'adulte et de son conjoint)
 * @param nbAdultes 1 ou 2
 * @param nbEnfants nombre d'enfants
 * @param solidarite paramètres du crédit de l'année
 * @param etapes journal du calcul (facultatif ; voir `noter`, calculs/00-outils.js)
 * @returns le crédit de l'année ($), arrondi au cent
 */
function creditSolidarite(revenuFamilialNet, nbAdultes, nbEnfants, solidarite, etapes) {
  const couple = nbAdultes === 2;

  // 1. Volet TVQ (lettre A) : un montant de base, plus un montant pour le conjoint ou, pour
  //    une personne qui vit seule, un montant additionnel (art. 1029.8.116.16, 2e al., par. a).
  let voletTVQ = solidarite.tvqBase;
  if (couple) {
    voletTVQ = voletTVQ + solidarite.tvqConjoint;
  } else {
    voletTVQ = voletTVQ + solidarite.tvqAdditionnelSeule;
  }
  noter(etapes, "voletTVQ", voletTVQ);

  // 2. Volet logement (lettre B) : un montant pour la personne seule ou pour le couple, plus un
  //    montant par enfant (art. 1029.8.116.16, 2e al., par. b).
  let voletLogement = solidarite.logementSeule;
  if (couple) {
    voletLogement = solidarite.logementCouple;
  }
  voletLogement = voletLogement + nbEnfants * solidarite.logementParEnfant;
  noter(etapes, "voletLogement", voletLogement);

  // 3. Réduction (lettre D = E × (F − G)) : un pourcentage du revenu familial qui dépasse le
  //    seuil (art. 1029.8.116.16, 2e al., par. d, et 3e al.).
  noter(etapes, "revenuFamilialNet", revenuFamilialNet);
  const reduction = excedent(revenuFamilialNet, solidarite.seuilReduction) * solidarite.tauxReduction;
  noter(etapes, "reduction", reduction);

  // 4. Crédit : les deux volets, moins la réduction, sans descendre sous zéro.
  const credit = arrondiAuCent(auMoinsZero(voletTVQ + voletLogement - reduction));
  noter(etapes, "credit", credit);
  return credit;
}

/**
 * Crédit d'impôt pour la solidarité du ménage.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param revenuFamilialNet revenu familial net ($)
 * @param solidarite paramètres du crédit de l'année
 * @param etapes journal du calcul (facultatif)
 * @returns le crédit de l'année ($)
 */
function creditSolidariteMenage(menage, revenuFamilialNet, solidarite, etapes) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  return creditSolidarite(revenuFamilialNet, nbAdultes, menage.enfants.length, solidarite, etapes);
}
