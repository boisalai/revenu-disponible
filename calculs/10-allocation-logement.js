// @ts-check
// ===========================================================================
// Programme 10 — Allocation-logement (Société d'habitation du Québec)
//
// Ce que fait le programme : une aide mensuelle aux ménages à faible revenu
// qui consacrent une grande part de leur revenu au logement. Le montant
// dépend du taux d'effort au logement (coût du logement / revenu familial),
// puis il diminue d'un dollar par dollar de revenu familial au-delà d'un seuil.
// Qui y a droit : le ménage dont un adulte a 50 ans ou plus, ou qui a au moins
// un enfant à charge (section 5.1 du programme).
// Base légale : programme Allocation-logement de la Société d'habitation du
//   Québec, dont le texte est annexé à un décret pour chaque période de
//   versement, du 1er octobre au 30 septembre : décret 973-2024 (Gazette
//   officielle du Québec, 3 juillet 2024 ; période commencée le 1er octobre
//   2024) et décret 1098-2025 (Gazette officielle du Québec, 17 septembre
//   2025 ; période commencée le 1er octobre 2025) ; Loi sur la Société
//   d'habitation du Québec (RLRQ, c. S-8), art. 3 et 3.1. Le programme est
//   administré par Revenu Québec.
// Sources publiques : les décrets (Gazette officielle du Québec) ; Revenu
//   Québec ; Société d'habitation du Québec (cadre normatif).
// Simplifications du modèle : chaque année retient la période de versement en
//   vigueur au 1er janvier (celle qui commence le 1er octobre de l'année
//   précédente). Le coût du logement est un loyer mensuel imputé selon le type
//   de ménage (paramètres loyerImpute, hypothèse du modèle), le formulaire ne
//   demandant pas le loyer du bail ; les forfaits pour l'électricité et
//   l'assurance habitation ne sont pas ajoutés (section 6.1). Le revenu
//   familial est le revenu net (ligne 275) du particulier et de son conjoint
//   (section 7), mais de l'année même plutôt que de l'année de référence, et
//   sans les pensions alimentaires pour enfants. Le taux d'effort est arrondi
//   à quatre décimales.
// Paramètres (parametres.csv, groupe « allocationLogement ») : ageAdmissible,
//   loyerImpute, tauxEffort30, tauxEffort50, tauxEffort80, montant30,
//   montant50, montant80, seuilSeul0, seuilCouple0, seuilMoyen, seuilHaut,
//   montantMinimalVerse.
// ===========================================================================

/**
 * Allocation-logement de l'année.
 *
 * @param revenuFamilial revenu familial aux fins du programme ($ ; section 7)
 * @param ageMaxAdulte âge le plus élevé parmi les adultes du ménage
 * @param nbAdultes 1 ou 2
 * @param nbEnfants nombre d'enfants à charge
 * @param parametresAllocation paramètres de l'allocation-logement de l'année
 * @returns l'allocation de l'année ($)
 */
function allocationLogement(revenuFamilial, ageMaxAdulte, nbAdultes, nbEnfants, parametresAllocation, etapes) {
  // 1. Admissibilité : un adulte de 50 ans ou plus, ou au moins un enfant à charge
  //    (section 5.1).
  const admissible = ageMaxAdulte >= parametresAllocation.ageAdmissible || nbEnfants > 0;
  if (admissible === false) {
    noter(etapes, "allocation", 0);
    return 0;
  }

  // 2. Coût de logement annuel : le loyer mensuel imputé au ménage, × 12 mois
  //    (section 6.1). La dernière colonne du tableau vaut pour les familles plus nombreuses.
  const loyersDuMenage = parametresAllocation.loyerImpute[nbAdultes];
  const loyerMensuel = loyersDuMenage[plafonner(nbEnfants, loyersDuMenage.length - 1)];
  noter(etapes, "loyerMensuel", loyerMensuel);
  noter(etapes, "revenuFamilial", revenuFamilial);

  // 3. Taux d'effort au logement : coût de logement annuel / revenu familial (section 1),
  //    arrondi à quatre décimales. Un revenu nul donne un taux infini, donc le palier le
  //    plus élevé (section 8.1).
  const tauxEffort = Math.round(((loyerMensuel * 12) / revenuFamilial) * 10_000) / 10_000;
  noter(etapes, "tauxEffort", tauxEffort);

  // 4. Montant mensuel selon le taux d'effort (section 8.1) : rien sous 30 % ; 100 $ de
  //    30 % à moins de 50 % ; 150 $ de 50 % à moins de 80 % ; 170 $ à 80 % et plus.
  let montantMensuel = 0;
  if (tauxEffort >= parametresAllocation.tauxEffort80) {
    montantMensuel = parametresAllocation.montant80;
  } else if (tauxEffort >= parametresAllocation.tauxEffort50) {
    montantMensuel = parametresAllocation.montant50;
  } else if (tauxEffort >= parametresAllocation.tauxEffort30) {
    montantMensuel = parametresAllocation.montant30;
  }
  noter(etapes, "montantMensuel", montantMensuel);

  // 5. Seuil de réduction selon la situation familiale (section 8.2) : personne seule ;
  //    couple sans enfant ; famille monoparentale avec un ou deux enfants ou couple avec
  //    un enfant ; famille plus nombreuse.
  let seuil = parametresAllocation.seuilHaut;
  if (nbEnfants === 0 && nbAdultes === 1) {
    seuil = parametresAllocation.seuilSeul0;
  } else if (nbEnfants === 0) {
    seuil = parametresAllocation.seuilCouple0;
  } else if (nbAdultes === 1 && nbEnfants <= 2) {
    seuil = parametresAllocation.seuilMoyen;
  } else if (nbAdultes === 2 && nbEnfants === 1) {
    seuil = parametresAllocation.seuilMoyen;
  }
  noter(etapes, "seuil", seuil);

  // 6. Montant annuel : 12 × le montant mensuel, moins un dollar par dollar de revenu
  //    familial au-delà du seuil, sans descendre sous zéro (section 8.2). Il s'annule donc
  //    au revenu maximal d'admissibilité de la section 5.3.
  const reduction = excedent(revenuFamilial, seuil);
  noter(etapes, "reduction", reduction);
  const montantAnnuel = auMoinsZero(montantMensuel * 12 - reduction);
  noter(etapes, "montantAnnuel", montantAnnuel);

  // 7. Allocation versée : aucun montant si, après la réduction, le montant annuel est
  //    inférieur à 2 $ (section 9.3). Sans réduction, il vaut au moins 12 × 100 $.
  let allocation = montantAnnuel;
  if (montantAnnuel < parametresAllocation.montantMinimalVerse) {
    allocation = 0;
  }
  noter(etapes, "allocation", allocation);
  return allocation;
}

/**
 * Allocation-logement du ménage.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param revenuFamilial revenu familial aux fins du programme ($)
 * @param parametresAllocation paramètres de l'allocation-logement de l'année
 * @returns l'allocation de l'année ($)
 */
function allocationLogementMenage(menage, revenuFamilial, parametresAllocation, etapes) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  let ageMaxAdulte = menage.ageAdulte1;
  if (nbAdultes === 2 && menage.ageAdulte2 > ageMaxAdulte) {
    ageMaxAdulte = menage.ageAdulte2;
  }
  return allocationLogement(revenuFamilial, ageMaxAdulte, nbAdultes, menage.enfants.length, parametresAllocation, etapes);
}
