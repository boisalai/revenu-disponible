// @ts-check
// ===========================================================================
// Programme 19 — Impôt sur le revenu des particuliers, fédéral et québécois
//
// Ce que fait le programme : pour chaque adulte, l'impôt calculé sur le revenu
// imposable selon le barème progressif, moins les crédits d'impôt non
// remboursables (montant personnel de base, conjoint, âge, pension,
// cotisations, frais médicaux…). L'impôt fédéral d'un résident du Québec est
// ensuite réduit de l'abattement du Québec.
// Qui le paie : chaque adulte du ménage.
// Base légale :
//   Fédéral — Loi de l'impôt sur le revenu (L.R.C. 1985, ch. 1 (5e suppl.)) :
//     par. 117(2) (barème ; taux de base : art. 248, « taux de base pour
//     l'année »), 118(1) (montant personnel de base, al. c ; conjoint, al. a ;
//     personne à charge admissible, al. b), 118(1.1) (montant personnel de base :
//     un montant minimal et une bonification, qui diminue entre les seuils des
//     al. 117(2)d) et e)), 118(2) (âge), 118(3) (pension), 118(10) (montant
//     canadien pour emploi), art. 118.2 (frais médicaux), 118.7 (cotisations),
//     118.8 (transfert au conjoint), al. 60e.1) (déduction des cotisations
//     supplémentaires au RRQ) ; abattement du Québec : par. 120(2) (3 %), majoré
//     pour le Québec par la Loi sur les arrangements fiscaux entre le
//     gouvernement fédéral et les provinces, art. 27 (16,5 % au total).
//   Québec — Loi sur les impôts (RLRQ, c. I-3) : art. 750 (barème), 750.1
//     (taux des crédits : 14 % depuis 2023), 752.0.0.1 (montant personnel de
//     base), 358.0.3 (déduction pour travailleur), 336 (cotisations
//     supplémentaires au RRQ), 752.0.7.1 (« revenu familial » : le revenu du
//     couple au-delà d'un seuil) et 752.0.7.4 (montants pour personne vivant
//     seule, en raison de l'âge et pour revenus de retraite, réduits de 18,75 %
//     du revenu familial), 752.0.11 (frais médicaux), 776.41.5 (transfert des
//     crédits inutilisés au conjoint).
// Sources publiques : Agence du revenu du Canada (taux, tranches et montants
//   indexés ; déclaration de revenus) ;
//   ministère des Finances du Québec, « Paramètres du régime d'imposition des particuliers »
//   (seuils et montants indexés du Québec).
// Simplifications du modèle : les seuls revenus sont le revenu de travail (ou
//   de retraite), la PSV et, pour le revenu net, le SRG et l'Allocation ; les
//   seuls frais médicaux sont la prime d'assurance médicaments ; au fédéral, le
//   seuil des frais médicaux est 3 % du revenu net, sans le plafond fixe (sans
//   effet : la prime ne l'atteint jamais) ; au Québec, aucun crédit pour les
//   cotisations ; les cotisations supplémentaires au RRQ sont déduites du revenu.
//   Chaque adulte calcule son impôt au cent ; le crédit pour frais médicaux d'un
//   couple est demandé par celui des deux qui peut en utiliser le plus.
// Paramètres : ce programme assemble les autres et reçoit le jeu complet
//   (groupes impotFederal, paliersFederal, impotQuebec, paliersQuebec, rrq,
//   rqap, ae, psv, supplementMedical).
// ===========================================================================

// ═══════════════════════════ IMPÔT FÉDÉRAL ═══════════════════════════

/**
 * Montant personnel de base fédéral (par. 118(1.1)) : un montant minimal (élément A) plus une
 * bonification (élément C), qui diminue en proportion du revenu net compris entre le seuil de
 * la tranche de 29 % (al. 117(2)d)) et celui de la tranche de 33 % (al. 117(2)e)) (élément E).
 *
 * @param revenuNet revenu net de l'adulte ($)
 * @param impotFederal paramètres de l'impôt fédéral de l'année
 * @param paliersFederal barème fédéral de l'année (seuils des tranches)
 * @returns le montant personnel de base ($)
 */
function bpaFederal(revenuNet, impotFederal, paliersFederal) {
  const debutReduction = paliersFederal[2].plafond; // début de la tranche de 29 %
  const finReduction = paliersFederal[3].plafond; // début de la tranche de 33 %
  const reductionBonification =
    (impotFederal.bpaBonif * excedent(plafonner(revenuNet, finReduction), debutReduction)) / (finReduction - debutReduction);
  return impotFederal.bpaBase + auMoinsZero(impotFederal.bpaBonif - reductionBonification);
}

/**
 * Éléments fédéraux d'un adulte, communs à la personne seule et au couple : revenu imposable,
 * revenu net, impôt selon le barème et montants des crédits.
 *
 * @param revenu revenu de travail (actif) ou de retraite (retraité) de l'adulte ($)
 * @param age âge de l'adulte
 * @param retraite `true` pour un ménage retraité
 * @param parametres jeu complet de paramètres de l'année
 * @param deduction déduction pour frais de garde demandée par cet adulte ($)
 * @param svNonImposable SRG et Allocation de cet adulte ($ ; non imposables, mais comptés dans le revenu net)
 */
function composantesFederales(revenu, age, retraite, parametres, deduction = 0, svNonImposable = 0, etapes = undefined) {
  const impotFederal = parametres.impotFederal;
  noter(etapes, "revenu", revenu);

  // 1. Cotisations de l'adulte actif (programmes 1 à 3).
  let cotisationRRQBase = 0;
  let cotisationRRQSupplementaire = 0;
  let cotisationRQAPAdulte = 0;
  let cotisationAEAdulte = 0;
  if (retraite === false) {
    const rrq = cotisationRRQ(revenu, parametres.rrq);
    cotisationRRQBase = rrq.base;
    cotisationRRQSupplementaire = rrq.supplementaire;
    cotisationRQAPAdulte = cotisationRQAP(revenu, parametres.rqap);
    cotisationAEAdulte = cotisationAE(revenu, parametres.ae);
  }
  noter(etapes, "cotisationRRQSupplementaire", cotisationRRQSupplementaire);

  // 2. Revenu imposable : le revenu, plus la PSV imposable (programme 17), moins la cotisation
  //    supplémentaire au RRQ et la déduction pour frais de garde (programme 6).
  const psv = psvImposable(age, revenu, parametres.psv);
  noter(etapes, "psvImposable", psv);
  noter(etapes, "deductionFraisGarde", deduction);
  const revenuImposable = revenu + psv - cotisationRRQSupplementaire - deduction;
  noter(etapes, "revenuImposable", revenuImposable);

  // 3. Revenu net : le revenu imposable, plus le SRG et l'Allocation (non imposables).
  noter(etapes, "svNonImposable", svNonImposable);
  const revenuNet = revenuImposable + svNonImposable;
  noter(etapes, "revenuNet", revenuNet);

  // 4. Impôt selon le barème (par. 117(2)).
  const impotBareme = impotProgressif(revenuImposable, parametres.paliersFederal);
  noter(etapes, "impotBareme", impotBareme);

  // 5. Montants de base : montant personnel de base (al. 118(1)c)), cotisations au RRQ (base),
  //    au RQAP et à l'assurance-emploi (art. 118.7) et montant canadien pour emploi
  //    (par. 118(10)).
  let montantEmploi = 0;
  if (retraite === false) {
    montantEmploi = plafonner(revenu, impotFederal.emploiCanadaMax);
  }
  const montantPersonnelBase = bpaFederal(revenuNet, impotFederal, parametres.paliersFederal);
  noter(etapes, "montantPersonnelBase", montantPersonnelBase);
  noter(etapes, "cotisationRRQBase", cotisationRRQBase);
  noter(etapes, "cotisationRQAP", cotisationRQAPAdulte);
  noter(etapes, "cotisationAE", cotisationAEAdulte);
  noter(etapes, "montantEmploi", montantEmploi);
  const montantsDeBase = montantPersonnelBase + cotisationRRQBase + cotisationRQAPAdulte + cotisationAEAdulte + montantEmploi;
  noter(etapes, "montantsDeBase", montantsDeBase);

  // 6. Montant en raison de l'âge, dès 65 ans : réduit de 15 % du revenu net au-delà d'un
  //    seuil (par. 118(2)).
  let montantAge = 0;
  if (age >= impotFederal.ageAdmissible) {
    montantAge = auMoinsZero(impotFederal.ageMontant - impotFederal.ageTaux * excedent(revenuNet, impotFederal.ageSeuil));
  }
  noter(etapes, "montantAge", montantAge);

  // 7. Montant pour revenu de pension du retraité, au plus 2 000 $ (par. 118(3)).
  let montantPension = 0;
  if (retraite) {
    montantPension = plafonner(revenu, impotFederal.pensionMax);
  }
  noter(etapes, "montantPension", montantPension);

  return { revenuImposable, revenuNet, impotBareme, montantsDeBase, montantAge, montantPension };
}

/**
 * Impôt fédéral d'un adulte seul, après l'abattement du Québec.
 *
 * @param revenu revenu de travail (actif) ou de retraite (retraité) ($)
 * @param age âge de l'adulte
 * @param retraite `true` pour un ménage retraité
 * @param proche `true` s'il demande le montant pour une personne à charge admissible (parent seul)
 * @param parametres jeu complet de paramètres de l'année
 * @param deduction déduction pour frais de garde ($)
 * @param svNonImposable SRG et Allocation ($)
 * @returns l'impôt de l'année ($), arrondi au cent
 */
function impotFederalAdulte(revenu, age, retraite, proche, parametres, deduction = 0, svNonImposable = 0, etapes = undefined) {
  const impotFederal = parametres.impotFederal;
  const elements = composantesFederales(revenu, age, retraite, parametres, deduction, svNonImposable, groupe(etapes, "adulte1"));

  // 1. Total des montants. Parent seul : le montant pour une personne à charge admissible égale
  //    un second montant personnel de base (al. 118(1)b) ; l'enfant n'a pas de revenu).
  let montants = elements.montantsDeBase + elements.montantAge + elements.montantPension;
  if (proche) {
    const montantPersonneACharge = bpaFederal(elements.revenuNet, impotFederal, parametres.paliersFederal);
    noter(etapes, "montantPersonneACharge", montantPersonneACharge);
    montants = montants + montantPersonneACharge;
  }
  noter(etapes, "montants", montants);

  // 2. Impôt : l'impôt selon le barème, moins les crédits (montants × taux de la première
  //    tranche), sans descendre sous zéro.
  noter(etapes, "credits", montants * parametres.paliersFederal[0].taux);
  const impotNet = auMoinsZero(elements.impotBareme - montants * parametres.paliersFederal[0].taux);
  noter(etapes, "impotNet", impotNet);

  // 3. Abattement du Québec : 16,5 % de l'impôt fédéral (par. 120(2) et Loi sur les
  //    arrangements fiscaux, partie VI).
  const impot = arrondiAuCent(impotNet * (1 - impotFederal.abattementQc));
  noter(etapes, "impot", impot);
  return impot;
}

/**
 * Impôt fédéral d'un couple, après l'abattement du Québec.
 *
 * @param revenu1 revenu de l'adulte 1 ($)
 * @param age1 âge de l'adulte 1
 * @param revenu2 revenu de l'adulte 2 ($)
 * @param age2 âge de l'adulte 2
 * @param retraite `true` pour un ménage retraité
 * @param ramqPremium prime d'assurance médicaments du ménage ($ ; seuls frais médicaux du modèle)
 * @param parametres jeu complet de paramètres de l'année
 * @param deduction déduction pour frais de garde du ménage ($)
 * @param svNonImp1 SRG et Allocation de l'adulte 1 ($)
 * @param svNonImp2 SRG et Allocation de l'adulte 2 ($)
 * @param declarantGarde adulte qui demande la déduction pour frais de garde (1 ou 2)
 * @returns l'impôt du couple ($), arrondi au cent
 */
function impotFederalCouple(
  revenu1, age1, revenu2, age2,
  retraite, ramqPremium, parametres, deduction = 0,
  svNonImp1 = 0, svNonImp2 = 0, declarantGarde = declarantFraisGarde(revenu1, revenu2, 2), etapes = undefined,
) {
  return calculFederalCouple(
    revenu1, age1, revenu2, age2, retraite, ramqPremium, parametres, deduction, svNonImp1, svNonImp2, declarantGarde, etapes,
  ).impot;
}

/**
 * Calcul de l'impôt fédéral d'un couple, avec le crédit pour frais médicaux que chacun pourrait
 * demander (sert aussi à choisir qui demande le supplément remboursable, programme 18).
 */
function calculFederalCouple(
  revenu1, age1, revenu2, age2,
  retraite, ramqPremium, parametres, deduction,
  svNonImp1, svNonImp2, declarantGarde, etapes = undefined,
) {
  const impotFederal = parametres.impotFederal;
  const taux = parametres.paliersFederal[0].taux;

  // 1. Éléments de chaque adulte ; la déduction pour frais de garde va à celui qui la demande.
  let deduction1 = 0;
  let deduction2 = 0;
  if (declarantGarde === 1) {
    deduction1 = deduction;
  } else if (declarantGarde === 2) {
    deduction2 = deduction;
  }
  const adulte1 = composantesFederales(revenu1, age1, retraite, parametres, deduction1, svNonImp1, groupe(etapes, "adulte1"));
  const adulte2 = composantesFederales(revenu2, age2, retraite, parametres, deduction2, svNonImp2, groupe(etapes, "adulte2"));

  // 2. Montant pour conjoint : le montant personnel de base, moins le revenu net du conjoint
  //    (al. 118(1)a)). Un seul des deux est non nul.
  const montantConjoint1 = auMoinsZero(bpaFederal(adulte1.revenuNet, impotFederal, parametres.paliersFederal) - adulte2.revenuNet);
  const montantConjoint2 = auMoinsZero(bpaFederal(adulte2.revenuNet, impotFederal, parametres.paliersFederal) - adulte1.revenuNet);
  const montantsHorsAgePension1 = adulte1.montantsDeBase + montantConjoint1;
  const montantsHorsAgePension2 = adulte2.montantsDeBase + montantConjoint2;
  noter(etapes, "montantConjoint1", montantConjoint1);
  noter(etapes, "montantConjoint2", montantConjoint2);

  // 3. Transfert au conjoint de la partie inutilisée des montants pour l'âge et pour pension
  //    (art. 118.8) ; le plus grand des deux transferts s'applique.
  const transferable1 = auMoinsZero(adulte1.montantAge + adulte1.montantPension - auMoinsZero(adulte1.revenuImposable - montantsHorsAgePension1));
  const transferable2 = auMoinsZero(adulte2.montantAge + adulte2.montantPension - auMoinsZero(adulte2.revenuImposable - montantsHorsAgePension2));
  let montants1 = montantsHorsAgePension1 + adulte1.montantAge + adulte1.montantPension;
  let montants2 = montantsHorsAgePension2 + adulte2.montantAge + adulte2.montantPension;
  if (transferable2 >= transferable1) {
    montants1 = montants1 + transferable2;
    montants2 = montants2 - transferable2;
  } else {
    montants2 = montants2 + transferable1;
    montants1 = montants1 - transferable1;
  }
  noter(etapes, "transferable1", transferable1);
  noter(etapes, "transferable2", transferable2);
  noter(etapes, "montants1", montants1);
  noter(etapes, "montants2", montants2);

  // 4. Impôt avant le crédit pour frais médicaux.
  const impotAvantMedical1 = auMoinsZero(adulte1.impotBareme - montants1 * taux);
  const impotAvantMedical2 = auMoinsZero(adulte2.impotBareme - montants2 * taux);
  noter(etapes, "impotAvantMedical1", impotAvantMedical1);
  noter(etapes, "impotAvantMedical2", impotAvantMedical2);

  // 5. Crédit pour frais médicaux : les frais au-delà de 3 % du revenu net (art. 118.2), au plus
  //    ce que l'impôt de l'adulte permet d'utiliser ; le plus grand des deux s'applique.
  const medical1 = plafonner(auMoinsZero(ramqPremium - impotFederal.tauxSeuilFraisMedicaux * adulte1.revenuNet), impotAvantMedical1 / taux);
  const medical2 = plafonner(auMoinsZero(ramqPremium - impotFederal.tauxSeuilFraisMedicaux * adulte2.revenuNet), impotAvantMedical2 / taux);
  let creditMedical1 = 0;
  let creditMedical2 = 0;
  if (medical1 >= medical2) {
    creditMedical1 = medical1;
  } else {
    creditMedical2 = medical2;
  }
  noter(etapes, "creditMedical1", creditMedical1);
  noter(etapes, "creditMedical2", creditMedical2);
  const impotFinal1 = impotAvantMedical1 - creditMedical1 * taux;
  const impotFinal2 = impotAvantMedical2 - creditMedical2 * taux;
  noter(etapes, "impotFinal1", impotFinal1);
  noter(etapes, "impotFinal2", impotFinal2);

  // 6. Abattement du Québec (16,5 %, par. 120(2) et Loi sur les arrangements fiscaux, art. 27) ;
  //    l'impôt de chaque adulte au cent, puis leur somme.
  const apresAbattement1 = arrondiAuCent(impotFinal1 * (1 - impotFederal.abattementQc));
  const apresAbattement2 = arrondiAuCent(impotFinal2 * (1 - impotFederal.abattementQc));
  noter(etapes, "apresAbattement1", apresAbattement1);
  noter(etapes, "apresAbattement2", apresAbattement2);
  const impot = arrondiAuCent(apresAbattement1 + apresAbattement2);
  noter(etapes, "impot", impot);
  return { impot, medical1, medical2 };
}

/**
 * Adulte qui demande les frais médicaux au fédéral (sert au supplément remboursable,
 * programme 18) : l'adulte seul ; dans un couple, celui qui peut utiliser le plus de frais au
 * crédit non remboursable ; si aucun ne le peut, celui dont le seuil des frais (3 % du revenu
 * net, plafonné) est le plus bas.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param parametres jeu complet de paramètres de l'année
 * @param ramqPremium prime d'assurance médicaments du ménage ($)
 * @param deductionGarde déduction fédérale pour frais de garde ($)
 * @param declarantGarde adulte qui demande cette déduction (1 ou 2)
 * @param revenusNets revenu net de chaque adulte ($)
 * @returns 1 ou 2
 */
function declarantFraisMedicauxFederal(menage, parametres, ramqPremium, deductionGarde, declarantGarde, revenusNets) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  const retraite = SITUATIONS[menage.situation].retraite;
  if (nbAdultes === 1) {
    return 1;
  }
  const sv = svNonImposableParAdulte(menage, parametres.psv);
  const couple = calculFederalCouple(
    menage.revenu1, menage.ageAdulte1, menage.revenu2, menage.ageAdulte2, retraite, ramqPremium, parametres,
    deductionGarde, sv[0], sv[1], declarantGarde,
  );
  if (couple.medical1 >= couple.medical2 && couple.medical1 > 0) {
    return 1;
  }
  if (couple.medical2 > couple.medical1) {
    return 2;
  }
  const supplementMedical = parametres.supplementMedical;
  const seuil1 = plafonner(supplementMedical.seuilFrais * revenusNets[0], supplementMedical.plafondSeuilFrais);
  const seuil2 = plafonner(supplementMedical.seuilFrais * revenusNets[1], supplementMedical.plafondSeuilFrais);
  if (seuil1 < seuil2) {
    return 1;
  }
  return 2;
}

/**
 * Impôt fédéral du ménage : la somme des adultes.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param parametres jeu complet de paramètres de l'année
 * @param ramqPremium prime d'assurance médicaments du ménage ($ ; sert au crédit médical du couple)
 * @param deductionGarde déduction fédérale pour frais de garde ($)
 * @param declarantGarde adulte qui demande cette déduction (1 ou 2)
 * @returns l'impôt de l'année ($)
 */
function impotFederalMenage(menage, parametres, ramqPremium = 0, deductionGarde = 0, declarantGarde = undefined, etapes = undefined) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  const retraite = SITUATIONS[menage.situation].retraite;
  const sv = svNonImposableParAdulte(menage, parametres.psv);
  if (nbAdultes === 2) {
    return impotFederalCouple(
      menage.revenu1, menage.ageAdulte1, menage.revenu2, menage.ageAdulte2, retraite, ramqPremium, parametres,
      deductionGarde, sv[0], sv[1], declarantGarde, etapes,
    );
  }
  // Parent seul avec au moins un enfant de moins de 18 ans : montant pour une personne à
  // charge admissible (al. 118(1)b), division (ii)(D)).
  let proche = false;
  if (menage.situation === Situation.FamilleMonoparentale) {
    for (const enfant of menage.enfants) {
      if (enfant.age < parametres.impotFederal.ageProcheAdmissible) {
        proche = true;
      }
    }
  }
  return impotFederalAdulte(menage.revenu1, menage.ageAdulte1, retraite, proche, parametres, deductionGarde, sv[0], etapes);
}

// ═══════════════════════════ IMPÔT DU QUÉBEC ═══════════════════════════

/**
 * Déduction pour travailleur : 6 % du revenu de travail, au plus un maximum (art. 358.0.3).
 */
function deductionTravailleur(revenu, retraite, impotQuebec) {
  if (retraite) {
    return 0;
  }
  return plafonner(impotQuebec.deducTravailleurTaux * revenu, impotQuebec.deducTravailleurMax);
}

/**
 * Montants d'un adulte pour l'âge (dès 65 ans) et pour revenus de retraite (125 % du revenu
 * de retraite, au plus un maximum) (art. 752.0.7.4, 1er al., par. a, sous-par. ii et iii).
 */
function montantsAgeEtRetraite(revenu, age, retraite, impotQuebec) {
  let montant = 0;
  if (age >= impotQuebec.ageAdmissible) {
    montant = montant + impotQuebec.ageMontant;
  }
  if (retraite) {
    montant = montant + plafonner(impotQuebec.pensionTaux * revenu, impotQuebec.pensionMax);
  }
  return montant;
}

/**
 * Impôt du Québec d'un adulte seul.
 *
 * @param revenu revenu de travail (actif) ou de retraite (retraité) ($)
 * @param age âge de l'adulte
 * @param retraite `true` pour un ménage retraité
 * @param vivantSeul `true` s'il vit seul (montant pour personne vivant seule)
 * @param parametres jeu complet de paramètres de l'année
 * @returns l'impôt de l'année ($), arrondi au cent
 */
function impotQuebecAdulte(revenu, age, retraite, vivantSeul, parametres, etapes) {
  const impotQuebec = parametres.impotQuebec;
  const tauxCredit = impotQuebec.tauxCredits; // taux des crédits (art. 750.1)

  // 1. Revenu net et revenu imposable : le revenu, moins la déduction pour travailleur et la
  //    cotisation supplémentaire au RRQ ; plus, pour le revenu net, toute la Sécurité de la
  //    vieillesse (SRG compris) et, pour le revenu imposable, la seule PSV imposable.
  let cotisationRRQSupplementaire = 0;
  if (retraite === false) {
    cotisationRRQSupplementaire = cotisationRRQ(revenu, parametres.rrq).supplementaire;
  }
  const psv = psvImposable(age, revenu, parametres.psv);
  const securiteVieillesseTotale = securiteVieillesse(age, 0, revenu, 0, 1, parametres.psv);
  const deduction = deductionTravailleur(revenu, retraite, impotQuebec);
  const revenuNet = revenu + securiteVieillesseTotale - deduction - cotisationRRQSupplementaire;
  const revenuImposable = revenu + psv - deduction - cotisationRRQSupplementaire;
  const etapesAdulte = groupe(etapes, "adulte1");
  noter(etapesAdulte, "revenu", revenu);
  noter(etapesAdulte, "deductionTravailleur", deduction);
  noter(etapesAdulte, "cotisationRRQSupplementaire", cotisationRRQSupplementaire);
  noter(etapesAdulte, "securiteVieillesse", securiteVieillesseTotale);
  noter(etapesAdulte, "revenuNet", revenuNet);
  noter(etapesAdulte, "psvImposable", psv);
  noter(etapesAdulte, "revenuImposable", revenuImposable);

  // 2. Impôt selon le barème (art. 750).
  const impotBareme = impotProgressif(revenuImposable, parametres.paliersQuebec);
  noter(etapesAdulte, "impotBareme", impotBareme);

  // 3. Montant combiné : personne vivant seule, âge et revenus de retraite, réduit de 18,75 %
  //    du revenu net au-delà du seuil (art. 752.0.7.1 et 752.0.7.4).
  let montantCombine = 0;
  if (vivantSeul) {
    montantCombine = montantCombine + impotQuebec.montantSeul;
  }
  if (age >= impotQuebec.ageAdmissible) {
    montantCombine = montantCombine + impotQuebec.ageMontant;
  }
  if (retraite) {
    montantCombine = montantCombine + plafonner(impotQuebec.pensionTaux * revenu, impotQuebec.pensionMax);
  }
  noter(etapes, "montantCombine", montantCombine);
  const montantCombineReduit = auMoinsZero(montantCombine - impotQuebec.reductionTaux * excedent(revenuNet, impotQuebec.reductionSeuil));
  noter(etapes, "montantCombineReduit", montantCombineReduit);

  // 4. Crédits : montant personnel de base (art. 752.0.0.1) et montant combiné, au taux des
  //    crédits.
  const credits = (impotQuebec.bpa + montantCombineReduit) * tauxCredit;
  noter(etapes, "credits", credits);

  // 5. Impôt : l'impôt selon le barème moins les crédits, sans descendre sous zéro.
  const impot = arrondiAuCent(auMoinsZero(impotBareme - credits));
  noter(etapes, "impot", impot);
  return impot;
}

/**
 * Revenu imposable québécois d'un adulte : le revenu, plus la PSV imposable, moins la
 * déduction pour travailleur et la cotisation supplémentaire au RRQ.
 */
function imposableQuebec(revenu, age, retraite, impotQuebec, parametres, etapes) {
  let cotisationRRQSupplementaire = 0;
  if (retraite === false) {
    cotisationRRQSupplementaire = cotisationRRQ(revenu, parametres.rrq).supplementaire;
  }
  const deduction = deductionTravailleur(revenu, retraite, impotQuebec);
  const psv = psvImposable(age, revenu, parametres.psv);
  const revenuImposable = revenu + psv - deduction - cotisationRRQSupplementaire;
  noter(etapes, "revenu", revenu);
  noter(etapes, "deductionTravailleur", deduction);
  noter(etapes, "cotisationRRQSupplementaire", cotisationRRQSupplementaire);
  noter(etapes, "psvImposable", psv);
  noter(etapes, "revenuImposable", revenuImposable);
  return revenuImposable;
}

/**
 * Impôt du Québec d'un couple.
 *
 * @param revenu1 revenu de l'adulte 1 ($)
 * @param age1 âge de l'adulte 1
 * @param revenu2 revenu de l'adulte 2 ($)
 * @param age2 âge de l'adulte 2
 * @param retraite `true` pour un ménage retraité
 * @param ramqPremium prime d'assurance médicaments du ménage ($)
 * @param parametres jeu complet de paramètres de l'année
 * @param svNonImp1 SRG et Allocation de l'adulte 1 ($)
 * @param svNonImp2 SRG et Allocation de l'adulte 2 ($)
 * @returns l'impôt du couple ($), arrondi au cent
 */
function impotQuebecCouple(
  revenu1, age1, revenu2, age2,
  retraite, ramqPremium, parametres,
  svNonImp1 = 0, svNonImp2 = 0, etapes = undefined,
) {
  const impotQuebec = parametres.impotQuebec;
  const taux = impotQuebec.tauxCredits; // taux des crédits (art. 750.1)

  // 1. Revenu imposable et impôt selon le barème de chaque conjoint (art. 750).
  const etapes1 = groupe(etapes, "adulte1");
  const etapes2 = groupe(etapes, "adulte2");
  const revenuImposable1 = imposableQuebec(revenu1, age1, retraite, impotQuebec, parametres, etapes1);
  const revenuImposable2 = imposableQuebec(revenu2, age2, retraite, impotQuebec, parametres, etapes2);
  const impotBareme1 = impotProgressif(revenuImposable1, parametres.paliersQuebec);
  const impotBareme2 = impotProgressif(revenuImposable2, parametres.paliersQuebec);
  noter(etapes1, "impotBareme", impotBareme1);
  noter(etapes2, "impotBareme", impotBareme2);

  // 2. Revenu net familial : les deux revenus imposables, plus le SRG et l'Allocation.
  const revenuNetFamilial = revenuImposable1 + revenuImposable2 + svNonImp1 + svNonImp2;
  noter(etapes, "svNonImposable", svNonImp1 + svNonImp2);
  noter(etapes, "revenuNetFamilial", revenuNetFamilial);

  // 3. Montant combiné des deux conjoints (âge et revenus de retraite), demandé par
  //    l'adulte 1, réduit de 18,75 % du revenu familial au-delà du seuil (art. 752.0.7.4,
  //    par. a et b).
  const montantCombine = auMoinsZero(
    montantsAgeEtRetraite(revenu1, age1, retraite, impotQuebec) + montantsAgeEtRetraite(revenu2, age2, retraite, impotQuebec) -
      impotQuebec.reductionTaux * excedent(revenuNetFamilial, impotQuebec.reductionSeuil),
  );
  noter(etapes, "montantCombineReduit", montantCombine);

  // 4. Crédit pour frais médicaux du couple, demandé par l'adulte 1 : 20 % des frais qui
  //    dépassent 3 % du revenu familial (art. 752.0.11).
  noter(etapes, "fraisMedicaux", ramqPremium);
  const creditMedical = auMoinsZero(ramqPremium - impotQuebec.tauxSeuilFraisMedicaux * revenuNetFamilial) * impotQuebec.medicalTaux;
  noter(etapes, "creditMedical", creditMedical);

  // 5. Impôt de chaque conjoint avant transfert.
  const credits1 = (impotQuebec.bpa + montantCombine) * taux + creditMedical;
  const credits2 = impotQuebec.bpa * taux;
  const impotAvantTransfert1 = impotBareme1 - credits1;
  const impotAvantTransfert2 = impotBareme2 - credits2;
  noter(etapes, "credits1", credits1);
  noter(etapes, "credits2", credits2);
  noter(etapes, "impotAvantTransfert1", impotAvantTransfert1);
  noter(etapes, "impotAvantTransfert2", impotAvantTransfert2);

  // 6. Transfert : la partie inutilisée des crédits d'un conjoint réduit l'impôt de l'autre
  //    (art. 776.41.5).
  const creditsInutilises1 = auMoinsZero(-impotAvantTransfert1);
  const creditsInutilises2 = auMoinsZero(-impotAvantTransfert2);
  const impot1 = arrondiAuCent(auMoinsZero(impotAvantTransfert1 - creditsInutilises2));
  const impot2 = arrondiAuCent(auMoinsZero(impotAvantTransfert2 - creditsInutilises1));
  noter(etapes, "creditsInutilises1", creditsInutilises1);
  noter(etapes, "creditsInutilises2", creditsInutilises2);
  noter(etapes, "impot1", impot1);
  noter(etapes, "impot2", impot2);
  const impot = arrondiAuCent(impot1 + impot2);
  noter(etapes, "impot", impot);
  return impot;
}

/**
 * Impôt du Québec du ménage : la somme des adultes.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param parametres jeu complet de paramètres de l'année
 * @param ramqPremium prime d'assurance médicaments du ménage ($ ; sert au crédit médical du couple)
 * @returns l'impôt de l'année ($)
 */
function impotQuebecMenage(menage, parametres, ramqPremium = 0, etapes = undefined) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  const retraite = SITUATIONS[menage.situation].retraite;
  if (nbAdultes === 2) {
    const sv = svNonImposableParAdulte(menage, parametres.psv);
    return impotQuebecCouple(
      menage.revenu1, menage.ageAdulte1, menage.revenu2, menage.ageAdulte2, retraite, ramqPremium, parametres,
      sv[0], sv[1], etapes,
    );
  }
  return impotQuebecAdulte(menage.revenu1, menage.ageAdulte1, retraite, true, parametres, etapes);
}
