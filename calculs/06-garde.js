// @ts-check
// ===========================================================================
// Programme 6 — Frais de garde d'enfants : crédit du Québec, déduction
// fédérale et coût pour le ménage
//
// Ce que fait le programme : les frais de garde ont trois effets sur le revenu
// disponible.
//   1. Crédit d'impôt remboursable du Québec : un pourcentage, qui décroît avec
//      le revenu familial, des frais de garde admissibles (frais non
//      subventionnés seulement).
//   2. Déduction fédérale : les frais (subventionnés ou non) réduisent le revenu
//      net fédéral, donc l'impôt fédéral et le revenu familial net rajusté
//      (programmes 14, 15, 16 et 19).
//   3. Coût : tous les frais payés sont soustraits du revenu disponible
//      (programme 20).
// Qui y a droit : le parent d'un enfant admissible qui paie des frais de garde.
// Base légale : Loi sur les impôts (RLRQ, c. I-3), art. 1029.8.67 (enfant
//   admissible, frais de garde admissibles), 1029.8.79 et 1029.8.80 (crédit et
//   pourcentage), indexation : art. 1029.6.0.6 ; Loi de l'impôt sur le revenu
//   (L.R.C. 1985, ch. 1 (5e suppl.)), art. 63 (déduction fédérale).
// Sources publiques : ministère des Finances du Québec, « Paramètres du régime d'imposition des particuliers »
//   (seuils de revenu et plafonds indexés) ; les lois elles-mêmes (taux, âges,
//   plafonds fédéraux, 2/3).
// Simplifications du modèle : pas de plafond pour enfant handicapé. L'âge d'un
//   enfant vaut pour toute l'année, donc aussi au 31 décembre.
// Paramètres (parametres.csv, groupe « garde ») : taux (paliers de revenu),
//   plafondJeune, plafondAutre, ageJeune, ageMax, plafondFedJeune,
//   plafondFedAutre, ageJeuneFed, ageMaxFed, fractionRevenuFed.
// ===========================================================================

// ─────────────── 1. Crédit d'impôt remboursable du Québec ───────────────

/**
 * Pourcentage du crédit selon le revenu familial (art. 1029.8.80) : il décroît par paliers.
 *
 * @param revenuFamilialNet revenu familial net ($)
 * @param garde paramètres des frais de garde de l'année
 * @returns le pourcentage applicable (fraction)
 */
function tauxCreditGarde(revenuFamilialNet, garde) {
  // Le premier palier dont le plafond n'est pas dépassé ; au-delà de tous, le dernier palier.
  for (const palier of garde.taux) {
    if (revenuFamilialNet <= palier.plafond) {
      return palier.taux;
    }
  }
  return garde.taux[garde.taux.length - 1].taux;
}

/**
 * Plafond annuel des frais admissibles pour un enfant, selon son âge (art. 1029.8.67,
 * définition de « frais de garde admissibles », par. b).
 *
 * @param age âge de l'enfant
 * @param garde paramètres des frais de garde de l'année
 * @returns le plafond ($)
 */
function plafondFraisEnfant(age, garde) {
  // Enfant « âgé de moins de sept ans le 31 décembre » : le plafond le plus élevé.
  if (age < garde.ageJeune) {
    return garde.plafondJeune;
  }
  // Enfant admissible : moins de 16 ans en 2025, moins de 14 ans à partir de 2026
  // (art. 1029.8.67, définition d'« enfant admissible »).
  if (age < garde.ageMax) {
    return garde.plafondAutre;
  }
  return 0;
}

/**
 * Crédit d'impôt remboursable pour frais de garde d'enfants.
 *
 * @param revenuFamilialNet revenu familial net ($)
 * @param enfants pour chaque enfant : son âge et ses frais admissibles (non subventionnés)
 * @param garde paramètres des frais de garde de l'année
 * @returns le crédit de l'année ($), arrondi au cent
 */
function creditFraisGarde(revenuFamilialNet, enfants, garde, etapes) {
  noter(etapes, "revenuFamilialNet", revenuFamilialNet);

  // 1. Pourcentage du crédit selon le revenu familial (art. 1029.8.80).
  const taux = tauxCreditGarde(revenuFamilialNet, garde);
  noter(etapes, "taux", taux);

  // 2. Total des plafonds des enfants qui font l'objet de frais, et total des frais
  //    (art. 1029.8.67, définition de « frais de garde admissibles »).
  let totalDesPlafonds = 0;
  let totalDesFrais = 0;
  for (const enfant of enfants) {
    if (enfant.fraisAdmissibles > 0) {
      totalDesPlafonds = totalDesPlafonds + plafondFraisEnfant(enfant.age, garde);
    }
    totalDesFrais = totalDesFrais + enfant.fraisAdmissibles;
  }
  noter(etapes, "totalDesFrais", totalDesFrais);
  noter(etapes, "totalDesPlafonds", totalDesPlafonds);

  // 3. Frais de garde admissibles : le moins élevé des deux totaux (même définition,
  //    par. a et b). Le plafond s'applique au total, pas enfant par enfant.
  const fraisAdmissibles = plafonner(totalDesFrais, totalDesPlafonds);
  noter(etapes, "fraisAdmissibles", fraisAdmissibles);

  // 4. Crédit : le pourcentage × les frais admissibles (art. 1029.8.79).
  const credit = arrondiAuCent(taux * fraisAdmissibles);
  noter(etapes, "credit", credit);
  return credit;
}

// ─────────────── 2. Déduction fédérale pour frais de garde ───────────────

/**
 * Plafond annuel de la déduction fédérale pour un enfant, selon son âge (par. 63(3),
 * définition de « montant annuel de frais de garde d'enfants »).
 *
 * @param age âge de l'enfant
 * @param garde paramètres des frais de garde de l'année
 * @returns le plafond ($)
 */
function plafondFederalEnfant(age, garde) {
  // Enfant « âgé de moins de 7 ans à la fin de l'année » : le plafond le plus élevé.
  if (age < garde.ageJeuneFed) {
    return garde.plafondFedJeune;
  }
  // Enfant admissible : moins de 16 ans (par. 63(3), définition d'« enfant admissible »).
  if (age < garde.ageMaxFed) {
    return garde.plafondFedAutre;
  }
  return 0;
}

/**
 * Déduction fédérale pour frais de garde d'enfants : elle réduit le revenu net fédéral.
 *
 * @param enfants pour chaque enfant : son âge et tous ses frais de garde (subventionnés ou non)
 * @param revenuTravailAdmissible revenu de travail de l'adulte qui demande la déduction ($)
 * @param garde paramètres des frais de garde de l'année
 * @returns la déduction de l'année ($)
 */
function deductionFraisGardeFederale(enfants, revenuTravailAdmissible, garde) {
  // 1. Total des frais payés et total des plafonds de TOUS les enfants admissibles, qu'ils
  //    fassent l'objet de frais ou non (al. 63(1)e), sous-al. (ii)) : les frais d'un enfant
  //    peuvent utiliser le plafond d'un frère ou d'une sœur.
  let totalDesFrais = 0;
  let totalDesPlafonds = 0;
  for (const enfant of enfants) {
    totalDesPlafonds = totalDesPlafonds + plafondFederalEnfant(enfant.age, garde);
    totalDesFrais = totalDesFrais + enfant.fraisGarde;
  }

  // 2. Déduction : le moins élevé des frais, du total des plafonds et des deux tiers du
  //    revenu de travail de l'adulte qui la demande (al. 63(1)e), sous-al. (i) et (ii)).
  const deuxTiersDuRevenu = garde.fractionRevenuFed * revenuTravailAdmissible;
  return plafonner(plafonner(totalDesFrais, totalDesPlafonds), deuxTiersDuRevenu);
}

/**
 * Adulte qui demande la déduction fédérale : dans un couple, celui dont le revenu est le
 * moins élevé (par. 63(1) et (2)) ; à revenus égaux, l'adulte 2 (convention du modèle).
 *
 * @param revenu1 revenu de l'adulte 1 ($)
 * @param revenu2 revenu de l'adulte 2 ($)
 * @param nbAdultes 1 ou 2
 * @returns 1 ou 2
 */
function declarantFraisGarde(revenu1, revenu2, nbAdultes) {
  if (nbAdultes === 1) {
    return 1;
  }
  if (revenu1 < revenu2) {
    return 1;
  }
  return 2;
}

// ─────────────── 3. Coût des frais de garde ───────────────

/**
 * Coût total des frais de garde payés par le ménage (tous services), soustrait du revenu
 * disponible.
 *
 * @param enfants pour chaque enfant : ses frais de garde
 * @returns le coût de l'année ($)
 */
function fraisGardeTotal(enfants) {
  let total = 0;
  for (const enfant of enfants) {
    total = total + enfant.fraisGarde;
  }
  return total;
}
