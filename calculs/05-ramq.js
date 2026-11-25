// @ts-check
// ===========================================================================
// Programme 5 — Prime du régime public d'assurance médicaments
//
// Ce que fait le programme : chaque adulte couvert par le régime public paie
// une prime annuelle avec sa déclaration de revenus du Québec. Elle dépend du
// revenu familial au-delà d'une exemption, en deux tranches, et ne dépasse pas
// la prime maximale.
// Qui la paie : chaque adulte du ménage, sauf exonération ; les enfants n'en
// paient pas (art. 24, par. 1°, de la Loi sur l'assurance médicaments).
// Base légale : Loi sur la Régie de l'assurance maladie du Québec (RLRQ,
//   c. R-5), art. 37.1 (revenu familial), 37.4 (exemption) et 37.6 (calcul) ;
//   Loi sur l'assurance médicaments (RLRQ, c. A-29.01), art. 10 (obligation),
//   23 (prime maximale), 24 et 24.1 (exonérations) et 28.1 (ajustement annuel au
//   1er juillet, publié à la Gazette officielle) ; la loi R-5 inscrit les exemptions
//   d'une année quand elle est modifiée, après coup (l'annexe K donne celles de l'année) ;
//   déclaration de revenus du Québec (TP-1), annexe K et ligne 447.
// Sources publiques : Revenu Québec, annexe K (taux moyens et exemptions de l'année) ;
//   Régie de l'assurance maladie du Québec (prime annuelle maximale de chaque période de
//   juillet à juin).
// Simplifications du modèle : tous les adultes sont couverts par le régime
//   public toute l'année (aucune assurance collective).
// Paramètres (parametres.csv, groupe « ramq ») : primeMaxJanvierJuin,
//   primeMaxJuilletDecembre, largeurTranche1,
//   taux (selon 1 ou 2 adultes : tranche1, tranche2), exemption (selon 1 ou
//   2 adultes : 0, 1, 2 enfants ou plus).
// ===========================================================================

/**
 * Prime d'assurance médicaments d'un adulte.
 *
 * @param revenuFamilialNet revenu familial net du ménage ($ ; revenu net de l'adulte et de son conjoint)
 * @param nbAdultes 1 (sans conjoint) ou 2 (avec conjoint)
 * @param nbEnfants nombre d'enfants à charge
 * @param ramq paramètres de la prime de l'année
 * @returns la prime de l'année ($)
 */
function primeRAMQparAdulte(revenuFamilialNet, nbAdultes, nbEnfants, ramq, etapes) {
  noter(etapes, "revenuFamilialNet", revenuFamilialNet);

  // 1. Exemption selon la situation familiale : avec ou sans conjoint ; aucun enfant à
  //    charge, un seul ou plusieurs (art. 37.4, par. a).
  const enfantsComptes = plafonner(nbEnfants, 2);
  const exemption = ramq.exemption[nbAdultes][enfantsComptes];
  noter(etapes, "exemption", exemption);

  // 2. Revenu familial : le revenu net de l'adulte et de son conjoint, moins l'exemption
  //    (art. 37.1).
  const revenuFamilial = excedent(revenuFamilialNet, exemption);
  noter(etapes, "revenuFamilial", revenuFamilial);

  // 3. Prime : un taux sur la première tranche de 5 000 $ du revenu familial, un taux
  //    plus élevé sur l'excédent (art. 37.6, 1er al., par. b). Ce sont les « taux moyens de
  //    cotisation » de l'année : la moyenne des taux fixés le 1er juillet de l'année et de
  //    l'année précédente (art. 37.1). Les taux d'un adulte avec conjoint sont environ la
  //    moitié de ceux d'un adulte sans conjoint.
  const taux = ramq.taux[nbAdultes];
  noter(etapes, "tauxTranche1", taux.tranche1);
  noter(etapes, "tauxTranche2", taux.tranche2);
  const prime =
    taux.tranche1 * plafonner(revenuFamilial, ramq.largeurTranche1) +
    taux.tranche2 * excedent(revenuFamilial, ramq.largeurTranche1);
  noter(etapes, "primeCalculee", prime);

  // 4. Cotisation maximale de l'année : pour chaque mois, 1/12 de la prime annuelle
  //    maximale de la période en cours, celle fixée le 1er juillet de l'année précédente
  //    pour janvier à juin, celle fixée le 1er juillet de l'année pour juillet à décembre
  //    (art. 37.6, 1er al., par. a ; art. 23 et 28.1 de la Loi sur l'assurance médicaments).
  //    Le modèle présume une couverture de toute l'année : six mois à chacune.
  const cotisationMaximale = arrondiAuCent(ramq.primeMaxJanvierJuin / 2 + ramq.primeMaxJuilletDecembre / 2);
  noter(etapes, "cotisationMaximale", cotisationMaximale);

  // 5. La prime est la moins élevée des deux (art. 37.6, 1er al.).
  const primeParAdulte = plafonner(prime, cotisationMaximale);
  noter(etapes, "primeParAdulte", primeParAdulte);
  return primeParAdulte;
}

/**
 * Prime d'assurance médicaments du ménage.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param revenuFamilialNet revenu familial net du ménage ($)
 * @param ramq paramètres de la prime de l'année
 * @param exoneres pour chaque adulte, `true` s'il est exonéré : [adulte 1, adulte 2] ;
 *   aucun adulte exonéré si on l'omet
 * @returns la prime du ménage ($), arrondie au cent
 */
function ramqMenage(menage, revenuFamilialNet, ramq, exoneres = [false, false], etapes = undefined) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;

  // 1. Chaque adulte paie la prime calculée sur le revenu familial commun : un couple la
  //    paie deux fois (art. 37.6).
  const primeParAdulte = primeRAMQparAdulte(revenuFamilialNet, nbAdultes, menage.enfants.length, ramq, etapes);

  // 2. Un adulte exonéré ne paie rien : le prestataire de l'aide sociale (art. 24,
  //    par. 3°, et 15, par. 2°, de la Loi sur l'assurance médicaments) ou la personne
  //    de 65 ans et plus qui reçoit au moins 94 % du SRG maximal (art. 24.1). Ces
  //    conditions sont établies par le programme 20.
  let total = 0;
  if (exoneres[0] !== true) {
    total = total + primeParAdulte;
  }
  if (nbAdultes === 2 && exoneres[1] !== true) {
    total = total + primeParAdulte;
  }

  // 3. Prime du ménage arrondie au cent.
  const primeMenage = arrondiAuCent(total);
  noter(etapes, "primeMenage", primeMenage);
  return primeMenage;
}
