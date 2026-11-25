// @ts-check
// ===========================================================================
// Programme 7 — Allocation famille (versée par Retraite Québec)
//
// Ce que fait le programme : une prestation par enfant, avec un supplément
// pour la famille monoparentale, réduite de 4 % du revenu familial qui dépasse
// un seuil, mais jamais sous un montant minimal versé à toutes les familles.
// S'y ajoute, chaque juillet, le supplément pour l'achat de fournitures
// scolaires.
// Qui y a droit : le parent qui assume les soins et l'éducation d'un enfant à
// charge admissible (art. 1029.8.61.18, dernier alinéa) ; le modèle traite
// tous les enfants du ménage comme admissibles.
// Base légale : Loi sur les impôts (RLRQ, c. I-3), art. 1029.8.61.8 à
//   1029.8.61.60 ; le calcul est la formule 1/12 A + B + I + J de
//   l'art. 1029.8.61.18 ; seuils de réduction : art. 1029.8.61.22 ;
//   fournitures scolaires : art. 1029.8.61.19.5 ; indexation : art. 1029.8.61.20.
// Sources publiques : ministère des Finances du Québec, « Paramètres du régime d'imposition des particuliers »
//   (montants indexés et seuils de réduction) ; la loi (taux de 4 %, âges) ;
//   Retraite Québec verse l'allocation.
// Simplifications du modèle : montants annuels (la loi verse chaque mois 1/12
//   de A) ; les suppléments pour enfant handicapé (lettres B et I) ne sont pas
//   modélisés ; pour les fournitures scolaires, l'âge de l'enfant dans l'année
//   tient lieu de son âge au 30 septembre.
// Paramètres (parametres.csv, groupe « allocationFamille ») : maxParEnfant,
//   suppMonoMax, minParEnfant, suppMonoMin, seuilCouple, seuilMonoparental,
//   tauxReduction, supplementFournitures, ageMinFournitures, ageMaxFournitures.
// ===========================================================================

/**
 * Allocation famille de l'année.
 *
 * @param revenuFamilialNet revenu familial net ($ ; revenu net du parent et de son conjoint)
 * @param nbEnfants nombre d'enfants à charge
 * @param nbAdultes 1 (famille monoparentale) ou 2 (couple)
 * @param parametresAllocation paramètres de l'Allocation famille de l'année
 * @returns l'allocation de l'année ($), arrondie au cent
 */
function allocationFamille(revenuFamilialNet, nbEnfants, nbAdultes, parametresAllocation, etapes) {
  // Sans enfant à charge, aucune allocation.
  if (nbEnfants <= 0) {
    noter(etapes, "allocation", 0);
    return 0;
  }
  noter(etapes, "nbEnfants", nbEnfants);
  const monoparentale = nbAdultes === 1;

  // 1. Montant maximal (C + D) : un montant par enfant, plus le supplément pour famille
  //    monoparentale (art. 1029.8.61.18, 3e al., par. a et b).
  let montantMaximal = nbEnfants * parametresAllocation.maxParEnfant;
  if (monoparentale) {
    montantMaximal = montantMaximal + parametresAllocation.suppMonoMax;
  }
  noter(etapes, "montantMaximal", montantMaximal);

  // 2. Montant minimal (G + H) : un montant par enfant, plus le supplément minimal pour
  //    famille monoparentale (3e al., par. e et f).
  let montantMinimal = nbEnfants * parametresAllocation.minParEnfant;
  if (monoparentale) {
    montantMinimal = montantMinimal + parametresAllocation.suppMonoMin;
  }
  noter(etapes, "montantMinimal", montantMinimal);

  // 3. Seuil de réduction (F) : selon que le parent a un conjoint ou non (3e al., par. d ;
  //    art. 1029.8.61.22).
  let seuil = parametresAllocation.seuilCouple;
  if (monoparentale) {
    seuil = parametresAllocation.seuilMonoparental;
  }
  noter(etapes, "seuil", seuil);

  // 4. Réduction : 4 % du revenu familial (E) qui dépasse le seuil (2e al., par. a,
  //    sous-par. i).
  noter(etapes, "revenuFamilialNet", revenuFamilialNet);
  const reduction = excedent(revenuFamilialNet, seuil) * parametresAllocation.tauxReduction;
  noter(etapes, "reduction", reduction);

  // 5. Allocation (A) : le plus élevé du montant maximal réduit et du montant minimal
  //    (2e al., par. a).
  let allocation = montantMaximal - reduction;
  if (allocation < montantMinimal) {
    allocation = montantMinimal;
  }
  const allocationArrondie = arrondiAuCent(allocation);
  noter(etapes, "allocation", allocationArrondie);
  return allocationArrondie;
}

/**
 * Allocation famille du ménage.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param revenuFamilialNet revenu familial net ($)
 * @param parametresAllocation paramètres de l'Allocation famille de l'année
 * @returns l'allocation de l'année ($)
 */
function allocationFamilleMenage(menage, revenuFamilialNet, parametresAllocation, etapes) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  return allocationFamille(revenuFamilialNet, menage.enfants.length, nbAdultes, parametresAllocation, etapes);
}

/**
 * Supplément pour l'achat de fournitures scolaires : un montant fixe par enfant admissible,
 * quel que soit le revenu (art. 1029.8.61.18, 2e al., par. d, et art. 1029.8.61.19.5).
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param parametresAllocation paramètres de l'Allocation famille de l'année
 * @returns le supplément de l'année ($)
 */
function supplementFournituresScolaires(menage, parametresAllocation, etapes) {
  let enfantsAdmissibles = 0;
  for (const enfant of menage.enfants) {
    // Enfant « âgé d'au moins 4 ans et d'au plus […] 16 ans » le 30 septembre (art. 1029.8.61.19.5,
    // 1er al. ; 17 ans pour un enfant handicapé, cas non modélisé).
    if (enfant.age >= parametresAllocation.ageMinFournitures && enfant.age <= parametresAllocation.ageMaxFournitures) {
      enfantsAdmissibles = enfantsAdmissibles + 1;
    }
  }
  noter(etapes, "enfantsAdmissibles", enfantsAdmissibles);
  const supplement = enfantsAdmissibles * parametresAllocation.supplementFournitures;
  noter(etapes, "supplement", supplement);
  return supplement;
}
