// @ts-check
// ===========================================================================
// Programme 17 — Sécurité de la vieillesse : pension (PSV), Supplément de
// revenu garanti (SRG) et Allocation au conjoint
//
// Ce que fait le programme : trois prestations fédérales pour les aînés.
//   1. Pension de la Sécurité de la vieillesse (PSV), dès 65 ans, majorée de
//      10 % dès 75 ans ; imposable, elle est récupérée à 15 % au-delà d'un seuil
//      de revenu (impôt de récupération).
//   2. Supplément de revenu garanti (SRG), non imposable : un montant maximal,
//      réduit selon le revenu (hors PSV) de la personne ou du couple ; s'y
//      ajoute un supplément complémentaire pour les plus faibles revenus.
//   3. Allocation, non imposable : pour le conjoint de 60 à 64 ans d'un
//      pensionné, réduite selon le revenu du couple.
// Qui y a droit : la personne de 65 ans ou plus (PSV, SRG) ; son conjoint de
// 60 à 64 ans (Allocation). Le modèle suppose 40 ans de résidence au Canada
// (pleine pension).
// Base légale : Loi sur la sécurité de la vieillesse (L.R.C. 1985, ch. O-9),
//   art. 3 (pleine pension dès 65 ans), art. 2 (« trimestre de paiement ») et
//   par. 7(2) et (3) (montant rajusté chaque trimestre, sans jamais diminuer),
//   par. 7(5) (majoration à 75 ans), par. 12(2) et (3) (rajustement du SRG),
//   art. 10 à 12 (SRG : un dollar de moins par tranche de 2 $ de revenu
//   mensuel), art. 12.1 et 22.1 (montant complémentaire du SRG et de
//   l'Allocation), art. 19 et 22 (Allocation) ; Loi de l'impôt sur le revenu,
//   art. 180.2 (impôt de récupération).
// Sources publiques : Emploi et Développement social Canada (montants mensuels
//   maximaux de chaque trimestre, publiés sur canada.ca et dans les données
//   ouvertes du gouvernement du Canada) ; Agence du revenu du Canada.
// Simplifications du modèle : calcul annuel à la place du calcul mensuel de la
//   loi, trimestre par trimestre : les montants maximaux et le seuil de
//   l'Allocation sont la somme des montants mensuels des quatre trimestres, et
//   le revenu est arrondi par tranches annuelles (12 × 2 $ ou 12 × 4 $) ; le
//   revenu de retraite saisi tient lieu du revenu de l'année de référence ; le
//   SRG du pensionné dont le conjoint a moins de 60 ans n'est pas modélisé.
// Paramètres (parametres.csv, groupe « psv ») :
//   - montants mensuels maximaux, tels que publiés pour chaque trimestre (T1 :
//     janvier à mars ; T2 : avril à juin ; T3 : juillet à septembre ; T4 : octobre
//     à décembre) : pension65a74, pension75, srgSeul, srgSeulComplement, srgCouple,
//     srgCoupleComplement, allocation (T1 à T4 pour chacun) ;
//   - les autres : ageMajoration, agePension, seuilRecuperation, tauxRecuperation,
//     srgTauxSeul, srgTauxCouple, srgTrancheSeul, srgTrancheCouple, topupTaux,
//     topupExemptionSeul, topupExemptionCouple, topupTrancheSeul,
//     topupTrancheCouple, ageAllocation, allocationFractionSeuil,
//     multipleValeurPension, multipleSeuilAllocation, allocationTaux1,
//     allocationTaux2, allocationTranche. L'exonération de la prime d'assurance médicaments
//   utilise aussi le groupe « ramq » (programme 5).
// ===========================================================================

/** Montant arrondi au multiple inférieur d'une tranche. Exemple : (1 000, 24) → 984. */
function arrondiTrancheInferieure(montant, tranche) {
  return Math.floor(montant / tranche) * tranche;
}

/** Montant arrondi au multiple supérieur d'une tranche. Exemple : (1 000, 24) → 1 008. */
function arrondiTrancheSuperieure(montant, tranche) {
  return Math.ceil(montant / tranche) * tranche;
}

// ─────────────── 0. Montants annuels maximaux ───────────────

/**
 * Montant annuel d'une prestation, à partir des montants mensuels maximaux publiés pour les
 * quatre trimestres de paiement de l'année, qui commencent le 1er janvier, le 1er avril, le
 * 1er juillet et le 1er octobre (art. 2) : chaque montant mensuel est versé pendant les 3 mois
 * de son trimestre. Exemple : 3 × (742,31 + 743,05 + 751,97 + 762,50) = 8 999,49.
 */
function montantAnnuel(janvier, avril, juillet, octobre) {
  return arrondiAuCent(3 * (janvier + avril + juillet + octobre));
}

/**
 * Montants annuels maximaux de l'année, tirés des montants mensuels publiés pour chaque trimestre.
 *
 * @param psv paramètres de la Sécurité de la vieillesse de l'année
 * @returns les montants annuels maximaux ($) : pension (65 à 74 ans), majoration (dès 75 ans),
 *   srgSeul et complementSeul (personne seule), srgCouple (chaque conjoint), complementCouple
 *   (le couple) et allocation
 */
function montantsAnnuelsSecuriteVieillesse(psv) {
  const pension = montantAnnuel(psv.pension65a74T1, psv.pension65a74T2, psv.pension65a74T3, psv.pension65a74T4);
  const pension75 = montantAnnuel(psv.pension75T1, psv.pension75T2, psv.pension75T3, psv.pension75T4);
  // Le montant publié du SRG comprend la prestation complémentaire, que le programme calcule
  // à part, avec sa propre réduction (étape 3 de `securiteVieillesse`).
  const srgSeulPublie = montantAnnuel(psv.srgSeulT1, psv.srgSeulT2, psv.srgSeulT3, psv.srgSeulT4);
  const complementSeul = montantAnnuel(psv.srgSeulComplementT1, psv.srgSeulComplementT2, psv.srgSeulComplementT3, psv.srgSeulComplementT4);
  const srgCouplePublie = montantAnnuel(psv.srgCoupleT1, psv.srgCoupleT2, psv.srgCoupleT3, psv.srgCoupleT4);
  const complementConjoint = montantAnnuel(psv.srgCoupleComplementT1, psv.srgCoupleComplementT2, psv.srgCoupleComplementT3, psv.srgCoupleComplementT4);
  return {
    pension: pension,
    // Majoration de 10 % dès 75 ans (par. 7(5)) : l'écart entre les deux montants publiés.
    majoration: arrondiAuCent(pension75 - pension),
    srgSeul: arrondiAuCent(srgSeulPublie - complementSeul),
    complementSeul: complementSeul,
    srgCouple: arrondiAuCent(srgCouplePublie - complementConjoint),
    // Le supplément complémentaire d'un couple se calcule une fois, pour les deux conjoints.
    complementCouple: arrondiAuCent(2 * complementConjoint),
    allocation: montantAnnuel(psv.allocationT1, psv.allocationT2, psv.allocationT3, psv.allocationT4),
  };
}

// ─────────────── 1. Pension de la Sécurité de la vieillesse ───────────────

/**
 * Pension de la Sécurité de la vieillesse d'un adulte, après l'impôt de récupération.
 *
 * @param age âge de l'adulte
 * @param revenu son revenu de retraite ($ ; la pension s'y ajoute pour la récupération)
 * @param psv paramètres de la Sécurité de la vieillesse de l'année
 * @returns la pension nette de l'année ($)
 */
function pensionVieillesse(age, revenu, psv, etapes) {
  // 1. Pension dès 65 ans (art. 3).
  if (age < psv.agePension) {
    return 0;
  }
  noter(etapes, "revenu", revenu);

  // 2. Pension annuelle maximale (étape 0), majorée de 10 % dès 75 ans (par. 7(5)).
  const maximums = montantsAnnuelsSecuriteVieillesse(psv);
  let pension = maximums.pension;
  if (age >= psv.ageMajoration) {
    pension = pension + maximums.majoration;
  }
  noter(etapes, "pension", pension);

  // 3. Impôt de récupération : 15 % du revenu, pension comprise, qui dépasse le seuil
  //    (LIR, art. 180.2) ; il ne peut dépasser la pension.
  const recuperation = excedent(revenu + pension, psv.seuilRecuperation) * psv.tauxRecuperation;
  noter(etapes, "recuperation", recuperation);
  const pensionNette = auMoinsZero(pension - recuperation);
  noter(etapes, "pensionNette", pensionNette);
  return pensionNette;
}

/**
 * Pension de la Sécurité de la vieillesse imposable d'un adulte (sans le SRG ni l'Allocation,
 * qui ne sont pas imposables). Sert au revenu imposable (programme 19).
 *
 * @param age âge de l'adulte
 * @param revenu son revenu de retraite ($)
 * @param psv paramètres de la Sécurité de la vieillesse de l'année
 * @returns la pension imposable de l'année ($)
 */
function psvImposable(age, revenu, psv) {
  return pensionVieillesse(age, revenu, psv);
}

// ─────────────── 2. Supplément de revenu garanti ───────────────

/**
 * SRG d'une personne seule : le maximum, moins 50 % du revenu arrondi à la tranche de 24 $
 * inférieure (un dollar par tranche de 2 $ de revenu mensuel, art. 12).
 */
function srgPersonneSeule(revenu, maximums, psv) {
  return auMoinsZero(maximums.srgSeul - arrondiTrancheInferieure(revenu, psv.srgTrancheSeul) * psv.srgTauxSeul);
}

/**
 * SRG de chaque conjoint d'un couple de pensionnés : le maximum du couple, moins 25 % du
 * revenu combiné arrondi à la tranche de 48 $ inférieure (un dollar par tranche de 2 $ du
 * vingt-quatrième du revenu combiné, par. 12(6), al. c)).
 */
function srgConjointPensionne(revenuCombine, maximums, psv) {
  return auMoinsZero(maximums.srgCouple - arrondiTrancheInferieure(revenuCombine, psv.srgTrancheCouple) * psv.srgTauxCouple);
}

/**
 * Seuil annuel de l'Allocation (art. 22, par. (1), « revenu conjoint résiduel », élément B ; et
 * par. (3), al. b et c). Chaque mois, les quatre tiers de la pension arrondie au multiple de
 * 3 $ supérieur (« valeur arrondie de la pension »), arrondis au multiple de 4 $ supérieur ;
 * le modèle additionne les seuils mensuels des quatre trimestres (3 mois chacun). Exemple
 * (juillet 2025) : pension 734,95 → 735 → 4/3 × 735 = 980 → 980 $ par mois.
 */
function seuilAllocationAnnuel(psv) {
  const pensions = [psv.pension65a74T1, psv.pension65a74T2, psv.pension65a74T3, psv.pension65a74T4];
  let seuilAnnuel = 0;
  for (const pension of pensions) {
    const valeurArrondie = arrondiTrancheSuperieure(pension, psv.multipleValeurPension);
    // Les quatre tiers, arrondis au cent, puis au multiple de 4 $ supérieur.
    const seuilMensuel = arrondiTrancheSuperieure(arrondiAuCent(psv.allocationFractionSeuil * valeurArrondie), psv.multipleSeuilAllocation);
    seuilAnnuel = seuilAnnuel + 3 * seuilMensuel;
  }
  return seuilAnnuel;
}

/**
 * SRG du pensionné dont le conjoint touche l'Allocation (art. 22, par. (2)) : le maximum du
 * couple, moins un dollar par tranche de 4 $ du « revenu conjoint résiduel », soit le revenu
 * combiné qui dépasse le seuil de l'Allocation, arrondi au multiple inférieur.
 */
function srgConjointAllocataire(revenuCombine, maximums, psv) {
  const revenuResiduel = auMoinsZero(revenuCombine - seuilAllocationAnnuel(psv));
  return auMoinsZero(maximums.srgCouple - arrondiTrancheInferieure(revenuResiduel, psv.srgTrancheCouple) * psv.srgTauxCouple);
}

/**
 * Montant complémentaire du SRG (art. 12.1 ; et 22.1 pour le couple dont un conjoint touche
 * l'Allocation) : un maximum, moins le quart du revenu qui dépasse 2 000 $ (personne seule,
 * un douzième) ou 4 000 $ (couple, un vingt-quatrième), arrondi au multiple de 4 $ inférieur.
 */
function supplementComplementaire(revenu, maximum, exemption, tranche, psv) {
  return auMoinsZero(maximum - arrondiTrancheInferieure(excedent(revenu, exemption), tranche) * psv.topupTaux);
}

/**
 * Parts du montant complémentaire d'un couple dont un conjoint touche l'Allocation : le
 * pensionné (art. 22.1, par. (1)) et son conjoint allocataire (par. (2)) reçoivent chacun le
 * même montant, la moitié de celui du couple.
 *
 * @returns [part de l'adulte 1, part de l'adulte 2] ($)
 */
function partsSupplementAllocataire(supplement, age1, age2, psv) {
  return [supplement / 2, supplement / 2];
}

// ─────────────── 3. Allocation au conjoint ───────────────

/**
 * Allocation au conjoint de 60 à 64 ans d'un pensionné (art. 19 et 22, par. (3)), sans le
 * montant complémentaire (art. 22.1, par. (2), compté avec le SRG). Jusqu'au seuil : la
 * « valeur du supplément » (SRG maximal de base d'un conjoint), plus la pension moins les
 * trois quarts du revenu combiné arrondi au multiple de 4 $ inférieur (al. b). Au-delà : la
 * valeur du supplément, moins le quart du revenu qui dépasse le seuil, arrondi de même (al. c).
 */
function allocationAuConjoint(revenuCombine, maximums, psv) {
  const seuil = seuilAllocationAnnuel(psv);
  if (revenuCombine <= seuil) {
    const partPension = auMoinsZero(maximums.pension - arrondiTrancheInferieure(revenuCombine, psv.allocationTranche) * psv.allocationTaux1);
    return maximums.srgCouple + partPension;
  }
  const reduction = arrondiTrancheInferieure(revenuCombine - seuil, psv.allocationTranche) * psv.allocationTaux2;
  return auMoinsZero(maximums.srgCouple - reduction);
}

// ─────────────── 4. Total pour le ménage ───────────────

/**
 * Situation du ménage au regard du SRG et de l'Allocation.
 *
 * @returns "seul" (personne seule de 65 ans ou plus), "deuxPensionnes" (couple, les deux de
 *   65 ans ou plus), "allocataire" (un conjoint de 65 ans ou plus, l'autre de 60 à 64 ans) ou
 *   "aucune"
 */
function situationSecuriteVieillesse(age1, age2, couple, psv) {
  if (couple === false && age1 >= psv.agePension) {
    return "seul";
  }
  if (couple && age1 >= psv.agePension && age2 >= psv.agePension) {
    return "deuxPensionnes";
  }
  const adulte1Allocataire = age1 >= psv.ageAllocation && age1 < psv.agePension && age2 >= psv.agePension;
  const adulte2Allocataire = age2 >= psv.ageAllocation && age2 < psv.agePension && age1 >= psv.agePension;
  if (couple && (adulte1Allocataire || adulte2Allocataire)) {
    return "allocataire";
  }
  return "aucune";
}

/**
 * Sécurité de la vieillesse du ménage : pension, SRG, supplément complémentaire et Allocation.
 *
 * @param age1 âge de l'adulte 1
 * @param age2 âge de l'adulte 2 (sans effet s'il n'y a qu'un adulte)
 * @param revenu1 revenu de retraite de l'adulte 1 ($)
 * @param revenu2 revenu de retraite de l'adulte 2 ($)
 * @param nbAdultes 1 ou 2
 * @param psv paramètres de la Sécurité de la vieillesse de l'année
 * @returns le total de l'année ($), arrondi au cent
 */
function securiteVieillesse(age1, age2, revenu1, revenu2, nbAdultes, psv, etapes) {
  const couple = nbAdultes === 2;

  // 1. Revenu combiné du ménage, hors PSV.
  let revenuCombine = revenu1;
  if (couple) {
    revenuCombine = revenuCombine + revenu2;
  }

  // 2. Pension de chaque adulte de 65 ans ou plus, sur son propre revenu.
  let total = pensionVieillesse(age1, revenu1, psv, groupe(etapes, "adulte1"));
  if (couple) {
    total = total + pensionVieillesse(age2, revenu2, psv, groupe(etapes, "adulte2"));
  }
  noter(etapes, "pensions", total);
  noter(etapes, "revenuCombine", revenuCombine);

  // 3. SRG et supplément complémentaire, ou Allocation, selon la situation ; leurs maximums
  //    annuels viennent de l'étape 0.
  const maximums = montantsAnnuelsSecuriteVieillesse(psv);
  const situation = situationSecuriteVieillesse(age1, age2, couple, psv);
  if (situation === "seul") {
    noter(etapes, "srgMaximalSeul", maximums.srgSeul);
    noter(etapes, "complementMaximalSeul", maximums.complementSeul);
    const srg = srgPersonneSeule(revenuCombine, maximums, psv);
    noter(etapes, "srgPersonneSeule", srg);
    total = total + srg;
    const supplement = supplementComplementaire(revenuCombine, maximums.complementSeul, psv.topupExemptionSeul, psv.topupTrancheSeul, psv);
    noter(etapes, "supplementComplementaire", supplement);
    total = total + supplement;
  } else if (situation === "deuxPensionnes") {
    noter(etapes, "srgMaximalCouple", maximums.srgCouple);
    noter(etapes, "complementMaximalCouple", maximums.complementCouple);
    const srgParConjoint = srgConjointPensionne(revenuCombine, maximums, psv);
    noter(etapes, "srgParConjoint", srgParConjoint);
    total = total + srgParConjoint * 2;
    const supplement = supplementComplementaire(revenuCombine, maximums.complementCouple, psv.topupExemptionCouple, psv.topupTrancheCouple, psv);
    noter(etapes, "supplementComplementaire", supplement);
    total = total + supplement;
  } else if (situation === "allocataire") {
    noter(etapes, "srgMaximalCouple", maximums.srgCouple);
    noter(etapes, "complementMaximalCouple", maximums.complementCouple);
    noter(etapes, "allocationMaximale", maximums.allocation);
    const srg = srgConjointAllocataire(revenuCombine, maximums, psv);
    noter(etapes, "srgPensionne", srg);
    total = total + srg;

    // 4. Montant complémentaire : le pensionné et son conjoint allocataire en reçoivent chacun
    //    la moitié de celui du couple (art. 22.1, par. (1) et (2)).
    const supplement = supplementComplementaire(revenuCombine, maximums.complementCouple, psv.topupExemptionCouple, psv.topupTrancheCouple, psv);
    noter(etapes, "supplementComplementaire", supplement);
    const parts = partsSupplementAllocataire(supplement, age1, age2, psv);
    const supplementVerse = parts[0] + parts[1];
    noter(etapes, "supplementVerse", supplementVerse);
    total = total + supplementVerse;

    const allocation = allocationAuConjoint(revenuCombine, maximums, psv);
    noter(etapes, "allocationAuConjoint", allocation);
    total = total + allocation;
  }

  const totalArrondi = arrondiAuCent(total);
  noter(etapes, "total", totalArrondi);
  return totalArrondi;
}

/**
 * Sécurité de la vieillesse du ménage, à partir du ménage (revenu de retraite saisi).
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param psv paramètres de la Sécurité de la vieillesse de l'année
 * @returns le total de l'année ($)
 */
function securiteVieillesseMenage(menage, psv, etapes) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  let age2 = 0;
  let revenu2 = 0;
  if (nbAdultes === 2) {
    age2 = menage.ageAdulte2;
    revenu2 = menage.revenu2;
  }
  return securiteVieillesse(menage.ageAdulte1, age2, menage.revenu1, revenu2, nbAdultes, psv, etapes);
}

/**
 * SRG, supplément complémentaire et Allocation de chaque adulte. Bien que non imposables, ces
 * prestations entrent dans le revenu net qui réduit certains crédits d'impôt (programme 19).
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param psv paramètres de la Sécurité de la vieillesse de l'année
 * @returns [adulte 1, adulte 2] ($)
 */
function svNonImposableParAdulte(menage, psv) {
  const couple = SITUATIONS[menage.situation].nbAdultes === 2;
  const age1 = menage.ageAdulte1;
  let age2 = 0;
  let revenuCombine = menage.revenu1;
  if (couple) {
    age2 = menage.ageAdulte2;
    revenuCombine = revenuCombine + menage.revenu2;
  }

  const maximums = montantsAnnuelsSecuriteVieillesse(psv);
  const situation = situationSecuriteVieillesse(age1, age2, couple, psv);
  if (situation === "seul") {
    const srg = srgPersonneSeule(revenuCombine, maximums, psv);
    return [srg + supplementComplementaire(revenuCombine, maximums.complementSeul, psv.topupExemptionSeul, psv.topupTrancheSeul, psv), 0];
  }
  if (situation === "deuxPensionnes") {
    const srg = srgConjointPensionne(revenuCombine, maximums, psv);
    const demiSupplement = supplementComplementaire(revenuCombine, maximums.complementCouple, psv.topupExemptionCouple, psv.topupTrancheCouple, psv) / 2;
    return [srg + demiSupplement, srg + demiSupplement];
  }
  if (situation === "allocataire") {
    // Le pensionné touche le SRG ; son conjoint de 60 à 64 ans, l'Allocation ; chacun reçoit sa
    // part du montant complémentaire (art. 22.1).
    const srg = srgConjointAllocataire(revenuCombine, maximums, psv);
    const allocation = allocationAuConjoint(revenuCombine, maximums, psv);
    const supplement = supplementComplementaire(revenuCombine, maximums.complementCouple, psv.topupExemptionCouple, psv.topupTrancheCouple, psv);
    const parts = partsSupplementAllocataire(supplement, age1, age2, psv);

    let adulte1 = allocation;
    if (age1 >= psv.agePension) {
      adulte1 = srg;
    }
    let adulte2 = allocation;
    if (age2 >= psv.agePension) {
      adulte2 = srg;
    }
    return [adulte1 + parts[0], adulte2 + parts[1]];
  }
  return [0, 0];
}

/**
 * Exonération de la prime d'assurance médicaments liée au SRG, par adulte : l'adulte a 65 ans
 * ou plus et reçoit au moins 94 % du SRG maximal (Loi sur l'assurance médicaments, art. 24.1 ;
 * SRG de base, sans le supplément complémentaire). L'autre motif d'exonération, l'aide sociale,
 * est appliqué par le programme 20.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param psv paramètres de la Sécurité de la vieillesse de l'année
 * @param ramq paramètres de la prime d'assurance médicaments de l'année
 * @returns [adulte 1 exonéré, adulte 2 exonéré]
 */
function exonerationRamqSRG(menage, psv, ramq) {
  const couple = SITUATIONS[menage.situation].nbAdultes === 2;
  const age1 = menage.ageAdulte1;
  let age2 = 0;
  let revenuCombine = menage.revenu1;
  if (couple) {
    age2 = menage.ageAdulte2;
    revenuCombine = revenuCombine + menage.revenu2;
  }

  const maximums = montantsAnnuelsSecuriteVieillesse(psv);

  /** L'adulte est exonéré s'il a 65 ans ou plus et reçoit au moins 94 % du SRG maximal. */
  function estExonere(age, srg, srgMaximal) {
    return age >= psv.agePension && srg > 0 && srg >= ramq.partSrgExoneration * srgMaximal;
  }

  if (couple === false) {
    let srg = 0;
    if (age1 >= psv.agePension) {
      srg = srgPersonneSeule(revenuCombine, maximums, psv);
    }
    return [estExonere(age1, srg, maximums.srgSeul), false];
  }
  if (age1 >= psv.agePension && age2 >= psv.agePension) {
    const srg = srgConjointPensionne(revenuCombine, maximums, psv);
    return [estExonere(age1, srg, maximums.srgCouple), estExonere(age2, srg, maximums.srgCouple)];
  }
  // Un seul conjoint de 65 ans ou plus : son SRG est calculé comme si l'autre touchait l'Allocation.
  const srg = srgConjointAllocataire(revenuCombine, maximums, psv);
  let srg1 = 0;
  if (age1 >= psv.agePension) {
    srg1 = srg;
  }
  let srg2 = 0;
  if (age2 >= psv.agePension) {
    srg2 = srg;
  }
  return [estExonere(age1, srg1, maximums.srgCouple), estExonere(age2, srg2, maximums.srgCouple)];
}
