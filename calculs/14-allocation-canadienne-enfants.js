// @ts-check
// ===========================================================================
// Programme 14 — Allocation canadienne pour enfants (ACE)
//
// Ce que fait le programme : une prestation fédérale non imposable, versée
// chaque mois par l'Agence du revenu du Canada. Le montant maximal dépend du
// nombre d'enfants et de leur âge ; il diminue avec le revenu familial, en
// deux paliers dont les taux croissent avec le nombre d'enfants.
// Qui y a droit : le « particulier admissible » qui réside avec un enfant de
// moins de 18 ans et assume principalement la responsabilité de son soin et de
// son éducation (art. 122.6) ; le modèle traite tous les enfants du ménage
// comme admissibles.
// Base légale : Loi de l'impôt sur le revenu (L.R.C. 1985, ch. 1 (5e suppl.)),
//   art. 122.6 à 122.64 ; le calcul est la formule (A + M) / 12 du
//   par. 122.61(1), avec A = E − Q ; indexation : par. 122.61(5).
// Sources publiques : Agence du revenu du Canada (montants de chaque année de
//   prestation, de juillet à juin).
// Simplifications du modèle : montants annuels (la loi verse un douzième par
//   mois) ; chaque année retient l'année de prestation qui commence en juillet
//   de cette année ; le revenu de l'année tient lieu de celui de l'année de base
//   (l'année précédente) ; la prestation pour enfants handicapés (élément M) et
//   la garde partagée ne sont pas modélisées.
// Paramètres (parametres.csv, groupe « ace ») : maxJeune, maxAine, seuil1,
//   seuil2, et, pour 1, 2, 3, 4 enfants ou plus : tauxPalier1, tauxPalier2,
//   reductionFixe.
// ===========================================================================

/**
 * Allocation canadienne pour enfants de l'année.
 *
 * @param revenuFamilialNetAjuste revenu familial net rajusté ($ ; le « revenu modifié » de l'art. 122.6)
 * @param nbEnfants nombre d'enfants
 * @param nbEnfantsMoins6 nombre d'enfants de moins de 6 ans
 * @param ace paramètres de l'ACE de l'année
 * @returns l'allocation de l'année ($), arrondie au cent
 */
function allocationCanadienneEnfants(revenuFamilialNetAjuste, nbEnfants, nbEnfantsMoins6, ace, etapes) {
  // Sans enfant, aucune allocation.
  if (nbEnfants <= 0) {
    noter(etapes, "allocation", 0);
    return 0;
  }
  noter(etapes, "nbEnfantsMoins6", nbEnfantsMoins6);
  noter(etapes, "nbEnfants6EtPlus", nbEnfants - nbEnfantsMoins6);

  // 1. Montant maximal (E) : un montant par enfant de moins de 6 ans, un montant moins élevé
  //    par enfant de 6 ans ou plus (par. 122.61(1), élément E, al. a et b).
  const montantMaximal = nbEnfantsMoins6 * ace.maxJeune + (nbEnfants - nbEnfantsMoins6) * ace.maxAine;
  noter(etapes, "montantMaximal", montantMaximal);

  // 2. Les taux de réduction dépendent du nombre d'enfants : 1, 2, 3, ou plus de 3
  //    (élément Q). Les listes de taux du CSV vont dans cet ordre (positions 0 à 3).
  const position = plafonner(nbEnfants, 4) - 1;
  noter(etapes, "tauxPalier1", ace.tauxPalier1[position]);
  noter(etapes, "tauxPalier2", ace.tauxPalier2[position]);
  noter(etapes, "revenuFamilialNetAjuste", revenuFamilialNetAjuste);

  // 3. Revenu de la première tranche : la partie du revenu qui dépasse le premier seuil,
  //    jusqu'au second (élément Q, al. b).
  const revenuTranche1 = auMoinsZero(plafonner(revenuFamilialNetAjuste - ace.seuil1, ace.seuil2 - ace.seuil1));
  noter(etapes, "revenuTranche1", revenuTranche1);

  // 4. Revenu de la seconde tranche : la partie qui dépasse le second seuil (élément Q,
  //    al. c).
  const revenuTranche2 = excedent(revenuFamilialNetAjuste, ace.seuil2);
  noter(etapes, "revenuTranche2", revenuTranche2);

  // 5. Réduction (Q). Jusqu'au second seuil : le premier taux × la première tranche
  //    (al. b). Au-delà : un montant fixe (2 450 $ pour un enfant dans le texte, rajusté et
  //    arrondi à l'unité chaque année, par. 122.61(5) et (7)), plus le second taux × la
  //    seconde tranche (al. c).
  let reductionFixe = 0;
  let reduction = ace.tauxPalier1[position] * revenuTranche1;
  if (revenuTranche2 > 0) {
    reductionFixe = ace.reductionFixe[position];
    reduction = reductionFixe + ace.tauxPalier2[position] * revenuTranche2;
  }
  noter(etapes, "reductionFixe", reductionFixe);
  noter(etapes, "reduction", reduction);

  // 6. Allocation (A = E − Q), sans descendre sous zéro (art. 257).
  const allocation = arrondiAuCent(auMoinsZero(montantMaximal - reduction));
  noter(etapes, "allocation", allocation);
  return allocation;
}

/**
 * Allocation canadienne pour enfants du ménage.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param revenuFamilialNetAjuste revenu familial net rajusté ($)
 * @param ace paramètres de l'ACE de l'année
 * @returns l'allocation de l'année ($)
 */
function allocationCanadienneEnfantsMenage(menage, revenuFamilialNetAjuste, ace, etapes) {
  let nbEnfantsMoins6 = 0;
  for (const enfant of menage.enfants) {
    if (enfant.age < 6) {
      nbEnfantsMoins6 = nbEnfantsMoins6 + 1;
    }
  }
  return allocationCanadienneEnfants(revenuFamilialNetAjuste, menage.enfants.length, nbEnfantsMoins6, ace, etapes);
}
