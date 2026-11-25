// @ts-check
// ===========================================================================
// Programme 21 — Versement spécial pour l'épicerie et l'énergie
//
// Ce que fait le programme : une aide forfaitaire unique du Québec, versée
// par Revenu Québec à compter du 4 juin 2026 sous la forme d'un crédit
// d'impôt remboursable : un montant pour un particulier sans conjoint ou pour
// un couple, plus un montant par ménage ayant des enfants mineurs, quel que
// soit leur nombre. L'aide n'est pas réduite selon le revenu.
// Qui y a droit : le particulier qui reçoit le crédit d'impôt pour la
//   solidarité (programme 9) pour la période de versement du 1er juillet 2025
//   au 30 juin 2026 ; dans un couple, un seul des conjoints le reçoit.
// Base légale : crédit d'impôt remboursable de l'année d'imposition 2025,
//   annoncé le 25 mai 2026 et versé par Revenu Québec à compter du
//   4 juin 2026. Il n'est pas encore inscrit dans la Loi sur les impôts
//   (RLRQ, c. I-3 ; texte à jour au 15 octobre 2026, lu le 18 novembre 2026) :
//   citer l'article dès son adoption.
// Sources publiques : Revenu Québec, nouvelle fiscale du 25 mai 2026,
//   « Crédit d'impôt remboursable attribuant un versement spécial pour
//   l'épicerie et l'énergie ».
// Simplifications du modèle : le versement compte dans le revenu de l'année
//   où il est versé (2026) ; l'admissibilité se juge sur le crédit pour la
//   solidarité de l'année précédente du modèle (même ménage, même revenu),
//   la période de juillet 2025 à juin 2026 étant la colonne 2025 du
//   programme 9 ; les enfants saisis sont réputés mineurs au 1er avril 2026 ;
//   la garde partagée (50 $ à chacun des parents) n'est pas modélisée.
// Paramètres (parametres.csv, groupe « versementEpicerie ») :
//   montantSansConjoint, montantCouple, montantEnfants (nuls en 2025 : le
//   versement n'existe qu'en 2026).
// ===========================================================================

/**
 * Versement spécial pour l'épicerie et l'énergie.
 *
 * @param creditSolidariteReference crédit pour la solidarité de la période de référence ($)
 * @param nbAdultes 1 ou 2
 * @param nbEnfants nombre d'enfants
 * @param versementEpicerie paramètres du versement de l'année
 * @param etapes journal du calcul (facultatif)
 * @returns le versement ($)
 */
function versementSpecialEpicerie(creditSolidariteReference, nbAdultes, nbEnfants, versementEpicerie, etapes) {
  // 1. Admissibilité : avoir droit au crédit pour la solidarité de la période de référence.
  noter(etapes, "creditSolidariteReference", creditSolidariteReference);
  if (creditSolidariteReference <= 0) {
    noter(etapes, "versement", 0);
    return 0;
  }

  // 2. Montant de base : un montant pour un particulier sans conjoint, un autre pour un couple.
  let montantBase = versementEpicerie.montantSansConjoint;
  if (nbAdultes === 2) {
    montantBase = versementEpicerie.montantCouple;
  }
  noter(etapes, "montantBase", montantBase);

  // 3. Montant additionnel : un seul par ménage ayant un ou plusieurs enfants mineurs.
  let montantEnfants = 0;
  if (nbEnfants > 0) {
    montantEnfants = versementEpicerie.montantEnfants;
  }
  noter(etapes, "montantEnfants", montantEnfants);

  // 4. Versement : le montant de base et le montant additionnel.
  const versement = montantBase + montantEnfants;
  noter(etapes, "versement", versement);
  return versement;
}

/**
 * Versement spécial pour l'épicerie et l'énergie du ménage.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param creditSolidariteReference crédit pour la solidarité de la période de référence ($)
 * @param versementEpicerie paramètres du versement de l'année
 * @param etapes journal du calcul (facultatif)
 * @returns le versement ($)
 */
function versementSpecialEpicerieMenage(menage, creditSolidariteReference, versementEpicerie, etapes) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  return versementSpecialEpicerie(creditSolidariteReference, nbAdultes, menage.enfants.length, versementEpicerie, etapes);
}
