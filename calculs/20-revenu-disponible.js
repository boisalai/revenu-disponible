// @ts-check
// ===========================================================================
// Programme 20 — Revenu disponible du ménage (assemblage)
//
// Ce que fait le programme : il enchaîne les programmes 1 à 19 et 21 à partir
// des données saisies (situation, âges, revenus, enfants) et calcule le revenu
// disponible :
//   revenu disponible = revenu de travail ou de retraite − cotisations
//                       + transferts du Québec − impôt du Québec
//                       + transferts fédéraux − impôt fédéral
//                       − frais de garde payés.
// En chemin, il construit les bases de revenu dont les autres programmes ont
// besoin : le revenu net familial (Québec), le revenu familial net rajusté
// (fédéral) et le revenu aux fins de l'allocation-logement. Deux versements
// ponctuels de 2026 se calculent sur l'année précédente (voir l'étape 14).
// Base légale : celle de chaque programme (voir leurs fichiers).
// Simplifications du modèle : l'aide sociale du ménage est attribuée à
//   l'adulte 1 ; les cotisations au RRQ, au RQAP et à l'assurance-emploi ainsi
//   que l'ACT ne visent que les ménages actifs (le revenu d'un retraité est une
//   pension). Le revenu aux fins de l'allocation-logement est le revenu net
//   familial de l'année même (voir le programme 10).
// Paramètres : ce programme assemble les autres et reçoit le jeu complet ; il
//   utilise aussi le jeu de l'année précédente (anneePrecedente : la colonne à
//   gauche dans parametres.csv).
// ===========================================================================

/**
 * Revenu disponible à partir de ses composantes.
 *
 * @param composantes revenu, cotisations, transferts, impôts et frais de garde du ménage ($)
 * @returns le revenu disponible ($), arrondi au cent
 */
function revenuDisponible(composantes) {
  const total =
    composantes.revenu -
    composantes.cotisations +
    composantes.transfertsQuebec -
    composantes.impotQuebec +
    composantes.transfertsFederaux -
    composantes.impotFederal -
    composantes.fraisGarde;
  return arrondiAuCent(total);
}

/** Somme des montants d'un groupe de postes, dans l'ordre où ils sont inscrits. */
function sommeDesPostes(postes) {
  let total = 0;
  for (const montant of Object.values(postes)) {
    total = total + montant;
  }
  return total;
}

/**
 * Revenu disponible d'un ménage, à partir des données saisies.
 *
 * @param menage le ménage (situation, revenus, âges, enfants et frais de garde)
 * @param parametres jeu complet de paramètres de l'année (avec, s'il existe, celui de l'année
 *   précédente : `parametres.anneePrecedente`)
 * @param journal journal du calcul (facultatif) : chaque programme y inscrit ses étapes, dans
 *   un groupe à son nom (voir `noter` et `groupe`, calculs/00-outils.js)
 * @returns le revenu disponible, ses composantes, le détail par programme et les bases de revenu
 */
function calculerRevenuDisponible(menage, parametres, journal) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  const couple = nbAdultes === 2;
  const retraite = SITUATIONS[menage.situation].retraite;

  // 1. Revenu de travail (ou de retraite) du ménage.
  const revenus = revenusAdultes(menage);
  let revenuBrut = 0;
  for (const revenu of revenus) {
    revenuBrut = revenuBrut + revenu;
  }

  // 2. Cotisations (programmes 1 à 4). Le RRQ, le RQAP et l'assurance-emploi visent le revenu
  //    de travail : rien pour un ménage retraité. Le FSS vise le revenu des retraités.
  let rrq = { base: 0, supplementaire: 0, total: 0 };
  let rqap = 0;
  let ae = 0;
  if (retraite === false) {
    rrq = rrqMenage(menage, parametres.rrq, groupe(journal, "rrq"));
    rqap = rqapMenage(menage, parametres.rqap, groupe(journal, "rqap"));
    ae = aeMenage(menage, parametres.ae, groupe(journal, "assuranceEmploi"));
  }
  const fss = fssMenage(menage, parametres.fss, groupe(journal, "fss"));

  // 3. Prestations qui ne dépendent que du revenu saisi et des âges : Sécurité de la vieillesse
  //    (programme 17) et aide sociale (programme 13).
  const securiteVieillesseMenageTotal = securiteVieillesseMenage(menage, parametres.psv, groupe(journal, "securiteVieillesse"));
  const aideSociale = aideSocialeMenage(
    menage, parametres.aideSociale, parametres.rrq, parametres.rqap, parametres.ae, groupe(journal, "aideSociale"),
  );

  // 4. Revenu total de chaque adulte : son revenu, sa PSV imposable, son SRG et son Allocation
  //    (montants non arrondis) ; l'aide sociale est attribuée à l'adulte 1.
  const svNonImposable = svNonImposableParAdulte(menage, parametres.psv);
  const revenuTotal1 = menage.revenu1 + psvImposable(menage.ageAdulte1, menage.revenu1, parametres.psv) + aideSociale + svNonImposable[0];
  let revenuTotal2 = 0;
  if (couple) {
    revenuTotal2 = menage.revenu2 + psvImposable(menage.ageAdulte2, menage.revenu2, parametres.psv) + svNonImposable[1];
  }
  const revenusTotaux = [revenuTotal1, revenuTotal2];

  // 5. Revenu net familial (Québec) : pour chaque adulte, son revenu total, moins la déduction
  //    pour travailleur et la cotisation supplémentaire au RRQ.
  function revenuNetQuebec(position) {
    let revenu = 0;
    if (position < revenus.length) {
      revenu = revenus[position];
    }
    let deduction = 0;
    let cotisationRRQSupplementaire = 0;
    if (retraite === false) {
      deduction = plafonner(parametres.impotQuebec.deducTravailleurTaux * revenu, parametres.impotQuebec.deducTravailleurMax);
      cotisationRRQSupplementaire = cotisationRRQ(revenu, parametres.rrq).supplementaire;
    }
    return revenusTotaux[position] - deduction - cotisationRRQSupplementaire;
  }
  const revenuTotal = revenusTotaux[0] + revenusTotaux[1];
  let revenuNetFamilial = revenuNetQuebec(0);
  if (couple) {
    revenuNetFamilial = revenuNetFamilial + revenuNetQuebec(1);
  }

  // 6. Déduction fédérale pour frais de garde (programme 6) : demandée par l'adulte dont le revenu
  //    total est le moins élevé, au plus les deux tiers de son revenu de travail.
  const declarantGarde = declarantFraisGarde(revenusTotaux[0], revenusTotaux[1], nbAdultes);
  let revenuTravailAdmissible = 0;
  if (retraite === false && declarantGarde === 1) {
    revenuTravailAdmissible = menage.revenu1;
  } else if (retraite === false) {
    revenuTravailAdmissible = menage.revenu2;
  }
  const deductionGardeFederale = deductionFraisGardeFederale(menage.enfants, revenuTravailAdmissible, parametres.garde);

  // 7. Revenu familial net rajusté (fédéral) : le revenu total, moins la cotisation
  //    supplémentaire au RRQ et la déduction pour frais de garde.
  const afni = revenuTotal - rrq.supplementaire - deductionGardeFederale;

  // 8. Revenu aux fins de l'allocation-logement (programme 10) : le revenu net du particulier
  //    et de son conjoint (section 7 du programme), soit le revenu net familial.
  const revenuAL = revenuNetFamilial;

  // 9. Prime d'assurance médicaments (programme 5) : un adulte en est exonéré s'il reçoit l'aide
  //    sociale, ou s'il a 65 ans ou plus et reçoit au moins 94 % du SRG maximal (programme 17).
  const exonerationSRG = exonerationRamqSRG(menage, parametres.psv, parametres.ramq);
  const exonerationAide = aideSociale > 0;
  const ramq = ramqMenage(
    menage, revenuNetFamilial, parametres.ramq,
    [exonerationAide || exonerationSRG[0], exonerationAide || exonerationSRG[1]], groupe(journal, "ramq"),
  );

  // 10. Impôts (programme 19) ; la prime d'assurance médicaments sert au crédit médical.
  const impotQuebec = impotQuebecMenage(menage, parametres, ramq, groupe(journal, "impotQuebec"));
  const impotFederal = impotFederalMenage(
    menage, parametres, ramq, deductionGardeFederale, declarantGarde, groupe(journal, "impotFederal"),
  );

  // 11. Supplément remboursable fédéral pour frais médicaux (programme 18) : demandé par un seul
  //     adulte ; le seuil des frais porte sur SON revenu net (revenu total, moins la cotisation
  //     supplémentaire au RRQ et, s'il la demande, la déduction pour frais de garde).
  function revenuNetFederal(adulte) {
    if (adulte === 2 && nbAdultes === 1) {
      return 0;
    }
    let revenu = menage.revenu1;
    if (adulte === 2) {
      revenu = menage.revenu2;
    }
    let cotisationRRQSupplementaire = 0;
    if (retraite === false) {
      cotisationRRQSupplementaire = cotisationRRQ(revenu, parametres.rrq).supplementaire;
    }
    let deduction = 0;
    if (declarantGarde === adulte) {
      deduction = deductionGardeFederale;
    }
    return revenusTotaux[adulte - 1] - cotisationRRQSupplementaire - deduction;
  }
  const revenusNets = [revenuNetFederal(1), revenuNetFederal(2)];
  const declarantMedical = declarantFraisMedicauxFederal(menage, parametres, ramq, deductionGardeFederale, declarantGarde, revenusNets);
  let revenuTravailMedical = 0;
  if (retraite === false && declarantMedical === 1) {
    revenuTravailMedical = menage.revenu1;
  } else if (retraite === false) {
    revenuTravailMedical = menage.revenu2;
  }
  const supplementMedical = supplementFraisMedicaux(
    ramq, revenuTravailMedical, revenusNets[declarantMedical - 1], afni, parametres.supplementMedical,
    groupe(journal, "supplementMedical"),
  );

  // 12. Frais de garde (programme 6) : seuls les frais non subventionnés ouvrent droit au crédit du
  //     Québec ; tous les frais payés sont un coût pour le ménage.
  const enfantsGarde = [];
  for (const enfant of menage.enfants) {
    let fraisAdmissibles = 0;
    if (enfant.typeGarde === TypeGarde.NonSubventionne) {
      fraisAdmissibles = enfant.fraisGarde;
    }
    enfantsGarde.push({ age: enfant.age, fraisAdmissibles });
  }
  const coutGarde = fraisGardeTotal(menage.enfants);

  // 13. Transferts : la prime au travail et l'ACT exigent un revenu de travail, nul pour un
  //     ménage retraité.
  let revenuTravail = revenuBrut;
  if (retraite) {
    revenuTravail = 0;
  }
  let allocationTravailleursMenageTotal = 0;
  if (retraite === false) {
    allocationTravailleursMenageTotal = allocationTravailleursMenage(
      menage, afni, parametres.act, parametres.rrq,
      { deduction: deductionGardeFederale, declarant: declarantGarde }, revenusTotaux,
      groupe(journal, "allocationTravailleurs"),
    );
  }

  // 14. Année de référence de deux versements ponctuels de 2026 : le versement unique de
  //     l'allocation pour l'épicerie (programme 15) et le versement spécial pour l'épicerie et
  //     l'énergie (programme 21) dépendent des crédits de l'année précédente (crédit pour la TPS,
  //     crédit pour la solidarité), calculés avec ses paramètres pour le même ménage. Sans année
  //     précédente (première colonne de parametres.csv), l'année même en tient lieu.
  const nbEnfants = menage.enfants.length;
  const solidarite = creditSolidariteMenage(menage, revenuNetFamilial, parametres.solidarite, groupe(journal, "solidarite"));
  let solidariteReference = solidarite;
  let referenceTPS = {
    revenu: afni,
    credit: creditTPS(afni, nbAdultes, nbEnfants, parametres.tps),
    partTrimestrielle: parametres.tps.partTrimestrielle,
  };
  if (parametres.anneePrecedente !== undefined) {
    const anneePrecedente = calculerRevenuDisponible(menage, parametres.anneePrecedente);
    solidariteReference = anneePrecedente.detail.transfertsQuebec.solidarite;
    referenceTPS = {
      revenu: anneePrecedente.afni,
      credit: creditTPS(anneePrecedente.afni, nbAdultes, nbEnfants, parametres.anneePrecedente.tps),
      partTrimestrielle: parametres.anneePrecedente.tps.partTrimestrielle,
    };
  }

  // 15. Détail par programme (montants positifs).
  const detail = {
    cotisations: { rrq: rrq.total, rqap, assuranceEmploi: ae, fss, ramq },
    transfertsQuebec: {
      allocationFamille: allocationFamilleMenage(menage, revenuNetFamilial, parametres.allocationFamille, groupe(journal, "allocationFamille")),
      fournituresScolaires: supplementFournituresScolaires(menage, parametres.allocationFamille, groupe(journal, "fournituresScolaires")),
      primeTravail: primeAuTravailMenage(menage, revenuTravail, revenuNetFamilial, parametres.primeTravail, groupe(journal, "primeTravail")),
      solidarite,
      versementEpicerie: versementSpecialEpicerieMenage(
        menage, solidariteReference, parametres.versementEpicerie, groupe(journal, "versementEpicerie"),
      ),
      allocationLogement: allocationLogementMenage(menage, revenuAL, parametres.allocationLogement, groupe(journal, "allocationLogement")),
      soutienAines: montantSoutienAinesMenage(menage, revenuNetFamilial, parametres.soutienAines, groupe(journal, "soutienAines")),
      fraisGarde: creditFraisGarde(revenuNetFamilial, enfantsGarde, parametres.garde, groupe(journal, "fraisGarde")),
      fraisMedicaux: creditFraisMedicauxMenage(menage, ramq, revenuNetFamilial, parametres.fraisMedicaux, groupe(journal, "fraisMedicaux")),
      aideSociale,
    },
    impotQuebec,
    transfertsFederaux: {
      allocationEnfants: allocationCanadienneEnfantsMenage(menage, afni, parametres.ace, groupe(journal, "allocationEnfants")),
      creditTPS: creditTPSMenage(
        menage, afni, parametres.tps, parametres.tpsVersementUnique, referenceTPS, groupe(journal, "creditTPS"),
      ),
      allocationTravailleurs: allocationTravailleursMenageTotal,
      securiteVieillesse: securiteVieillesseMenageTotal,
      supplementMedical,
    },
    impotFederal,
    fraisGardeCout: coutGarde,
  };

  // 16. Composantes et revenu disponible.
  const composantes = {
    revenu: revenuBrut,
    cotisations: sommeDesPostes(detail.cotisations),
    transfertsQuebec: sommeDesPostes(detail.transfertsQuebec),
    impotQuebec,
    transfertsFederaux: sommeDesPostes(detail.transfertsFederaux),
    impotFederal,
    fraisGarde: coutGarde,
  };
  return { revenuDisponible: revenuDisponible(composantes), composantes, detail, revenuNetFamilial, afni, revenuAL };
}
