// @ts-check
// ===========================================================================
// Programme 4 — Cotisation des particuliers au Fonds des services de santé (FSS)
//
// Ce que fait le programme : une cotisation sur le « revenu total » au sens de
// la loi, en deux paliers, qui ne dépasse jamais 1 000 $.
// Qui cotise : tout particulier qui réside au Québec le dernier jour de l'année
// (art. 34.1.1). Le revenu total ne comprend pas le salaire (art. 34.1.4) :
// dans le modèle, seuls les ménages retraités cotisent, sur leur revenu de
// retraite.
// Base légale : Loi sur la Régie de l'assurance maladie du Québec (RLRQ,
//   c. R-5), art. 34.1.1 (qui cotise), 34.1.4 (revenu total), 34.1.6 (calcul)
//   et 34.1.6.1 (indexation des seuils) ; déclaration de revenus du Québec
//   (TP-1), ligne 446 et annexe F.
// Sources publiques : la loi (art. 34.1.6 : taux, 150 $, 1 000 $) ; pour les seuils indexés,
//   ministère des Finances du Québec, « Paramètres du régime d'imposition des particuliers ».
// Paramètres (parametres.csv, groupe « fss ») : seuil1, taux1, plafond1,
//   seuil2, taux2, cotisationMax.
// ===========================================================================

/**
 * Cotisation au FSS d'un particulier.
 *
 * @param revenuTotal revenu total de l'année ($ ; ici, le revenu de retraite)
 * @param fss paramètres du FSS de l'année
 * @returns la cotisation de l'année ($)
 */
function cotisationFSS(revenuTotal, fss, etapes) {
  noter(etapes, "revenuTotal", revenuTotal);
  let cotisation = 0;

  if (revenuTotal <= fss.seuil2) {
    // 1. Revenu total jusqu'au second seuil : 1 % de l'excédent sur le premier seuil,
    //    au plus 150 $ (art. 34.1.6, 1er al., par. a).
    cotisation = plafonner(excedent(revenuTotal, fss.seuil1) * fss.taux1, fss.plafond1);
  } else {
    // 2. Revenu total au-delà du second seuil : 150 $, plus 1 % de l'excédent sur ce
    //    seuil, au plus 1 000 $ (art. 34.1.6, 1er al., par. b : « du moindre de 1 000 $ »).
    cotisation = plafonner(fss.plafond1 + excedent(revenuTotal, fss.seuil2) * fss.taux2, fss.cotisationMax);
  }

  noter(etapes, "cotisation", cotisation);
  return cotisation;
}

/**
 * Cotisation au FSS du ménage : la somme des cotisations de chaque adulte.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param fss paramètres du FSS de l'année
 * @returns la cotisation du ménage ($)
 */
function fssMenage(menage, fss, etapes) {
  // Le revenu total exclut le salaire (art. 34.1.4) : un ménage actif ne cotise pas.
  const retraite = SITUATIONS[menage.situation].retraite;
  if (retraite === false) {
    noter(etapes, "cotisationMenage", 0);
    return 0;
  }

  let total = 0;
  let numeroAdulte = 0;
  for (const revenuRetraite of revenusAdultes(menage)) {
    numeroAdulte = numeroAdulte + 1;
    total = total + cotisationFSS(revenuRetraite, fss, groupe(etapes, "adulte" + numeroAdulte));
  }
  noter(etapes, "cotisationMenage", total);
  return total;
}
