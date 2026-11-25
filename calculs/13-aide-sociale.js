// @ts-check
// ===========================================================================
// Programme 13 — Aide financière de dernier recours (aide sociale)
//
// Ce que fait le programme : une prestation mensuelle égale au déficit des
// ressources du ménage sur ses besoins. Les besoins sont la prestation de base et
// son ajustement de 45 $, plus une allocation ou un ajustement selon l'âge et la
// situation. Les ressources sont le revenu
// de travail au-delà d'un montant exclu, plus les autres revenus. Un supplément
// de 25 % du revenu de travail au-delà de l'exclusion encourage le travail.
// Qui y a droit : l'adulte seul ou la famille dont les ressources sont
// insuffisantes (Loi sur l'aide aux personnes et aux familles) ; le modèle
// n'en verse plus dès qu'un adulte a 65 ans (la Sécurité de la vieillesse
// prend le relais, programme 17).
// Base légale : Loi sur l'aide aux personnes et aux familles (RLRQ,
//   c. A-13.1.1), art. 53 (allocation pour contraintes) et 55 (déficit et
//   supplément) ; Règlement sur l'aide aux personnes et aux familles (RLRQ,
//   c. A-13.1.1, r. 1), art. 56 (prestation de base), 62 et 63 (allocation pour
//   contraintes temporaires selon un jeune enfant ou l'âge, jusqu'au
//   31 décembre 2025), 64 (montant de l'allocation pour contraintes), 67.3
//   (ajustement pour adulte seul), 67.4 (ajustement de la prestation de base),
//   114 (revenus de travail exclus) et 154.1 (supplément de 25 %, depuis le
//   1er janvier 2025) ; Loi visant à améliorer l'accompagnement des personnes
//   et à simplifier le régime d'assistance sociale (2024, c. 34), art. 78
//   (droit acquis à l'allocation selon l'âge ou un jeune enfant).
// Sources publiques : le règlement (versions de LégisQuébec) ; Gouvernement du
//   Québec (Québec.ca), montants des prestations.
// Simplifications du modèle : ni ajustements pour enfants (le règlement les
//   réduit de l'Allocation famille et de l'ACE), ni avoirs, ni prestations
//   spéciales ; le revenu de travail est net des cotisations (programmes 1 à 3).
//   L'état de santé n'est pas connu : l'allocation pour contraintes n'est
//   accordée que selon l'âge (58 ans ou plus) ou pour un parent seul d'un enfant
//   de moins de 5 ans. Ces cas sont abrogés le 1er janvier 2026 ; le paramètre
//   prestataireContinu dit si le ménage les garde (droit acquis du prestataire
//   sans interruption) ou non (nouvelle demande). L'ajustement pour adulte seul
//   est réduit de l'allocation-logement (art. 67.3) : le modèle ne le verse
//   qu'avant 50 ans, âge d'admissibilité à l'allocation-logement (hypothèse du
//   modèle). Le modèle ne verse plus d'aide dès 65 ans (hypothèse du modèle).
// Paramètres (parametres.csv, groupe « aideSociale ») : baseSeul, baseCouple,
//   ajustementBase, ajust58Seul, ajust58Couple, ajustJeuneSeul, ageContrainte,
//   ageJeuneSeul, ageEnfantContrainte, reglesAgeEnfantEnVigueur,
//   prestataireContinu, ageSortie, exemptionSeul, exemptionCouple,
//   tauxIncitation. La fonction « ménage » utilise aussi les groupes « rrq »,
//   « rqap » et « ae » (programmes 1 à 3).
// ===========================================================================

/**
 * Aide sociale de l'année.
 *
 * @param revenuTravailNet revenu de travail annuel, net des cotisations ($)
 * @param nbAdultes 1 ou 2
 * @param age1 âge de l'adulte 1
 * @param age2 âge de l'adulte 2 (sans effet s'il n'y a qu'un adulte)
 * @param nbEnfants nombre d'enfants
 * @param parametresAide paramètres de l'aide sociale de l'année
 * @param autreRevenu revenu annuel autre que de travail, compté en entier ($ ; p. ex. une pension)
 * @param nbEnfantsMoins5 nombre d'enfants de moins de 5 ans d'un parent seul
 * @returns l'aide de l'année ($)
 */
function aideSociale(
  revenuTravailNet, nbAdultes, age1, age2, nbEnfants, parametresAide,
  autreRevenu = 0, nbEnfantsMoins5 = 0, etapes = undefined,
) {
  const couple = nbAdultes === 2;

  // Le modèle ne verse plus d'aide dès qu'un adulte a 65 ans.
  if (age1 >= parametresAide.ageSortie || (couple && age2 >= parametresAide.ageSortie)) {
    noter(etapes, "aideAnnuelle", 0);
    return 0;
  }

  // 1. Prestation de base mensuelle : adulte seul ou famille d'un adulte ; famille de deux
  //    adultes (règlement, art. 56). Elle est ajustée de 45 $ (art. 67.4).
  let prestationDeBase = parametresAide.baseSeul;
  if (couple) {
    prestationDeBase = parametresAide.baseCouple;
  }
  noter(etapes, "prestationDeBase", prestationDeBase);
  const ajustementDeBase = parametresAide.ajustementBase;
  noter(etapes, "ajustementDeBase", ajustementDeBase);

  // 2. Allocation pour contraintes selon l'âge ou un jeune enfant : un adulte de 58 ans ou plus
  //    (règlement, art. 63) ; un parent seul d'un enfant de moins de 5 ans (art. 62). Ces deux
  //    articles s'appliquent à toute demande jusqu'au 31 décembre 2025 ; ensuite, seul le
  //    prestataire sans interruption les garde (loi 2024, c. 34, art. 78).
  const allocationSelonAgeOuEnfant =
    parametresAide.reglesAgeEnfantEnVigueur === 1 || parametresAide.prestataireContinu === 1;
  noter(etapes, "allocationSelonAgeOuEnfant", allocationSelonAgeOuEnfant ? 1 : 0);

  // 3. Allocation ou ajustement mensuel selon l'âge et la situation : allocation pour
  //    contraintes des deux adultes (art. 64, 2e al.) ou d'un seul (1er al.) ; sinon,
  //    ajustement pour adulte seul sans enfant (art. 67.3), avant 50 ans (hypothèse du modèle).
  const deuxAdultesAges = couple && age1 >= parametresAide.ageContrainte && age2 >= parametresAide.ageContrainte;
  const unAdulteAge = age1 >= parametresAide.ageContrainte || (couple && age2 >= parametresAide.ageContrainte);
  const parentSeulJeuneEnfant = nbAdultes === 1 && nbEnfantsMoins5 > 0;
  let ajustement = 0;
  if (allocationSelonAgeOuEnfant && deuxAdultesAges) {
    ajustement = parametresAide.ajust58Couple;
  } else if (allocationSelonAgeOuEnfant && (unAdulteAge || parentSeulJeuneEnfant)) {
    ajustement = parametresAide.ajust58Seul;
  } else if (nbAdultes === 1 && nbEnfants === 0 && age1 < parametresAide.ageJeuneSeul) {
    ajustement = parametresAide.ajustJeuneSeul;
  }
  noter(etapes, "ajustement", ajustement);
  const besoins = prestationDeBase + ajustementDeBase + ajustement;
  noter(etapes, "besoins", besoins);

  // 4. Revenu de travail mensuel compté : la partie qui dépasse l'exclusion, 200 $ pour un
  //    adulte seul, 300 $ pour deux adultes (règlement, art. 114).
  let exclusion = parametresAide.exemptionSeul;
  if (couple) {
    exclusion = parametresAide.exemptionCouple;
  }
  noter(etapes, "exclusion", exclusion);
  const revenuTravailCompte = excedent(revenuTravailNet / 12, exclusion);
  noter(etapes, "revenuTravailCompte", revenuTravailCompte);

  // 5. Ressources du mois : le revenu de travail compté, plus les autres revenus, comptés en
  //    entier (loi, art. 55, 1er al., par. 2°).
  const ressources = revenuTravailCompte + autreRevenu / 12;
  noter(etapes, "ressources", ressources);

  // 6. Prestation : le déficit des ressources sur les besoins, sans descendre sous zéro
  //    (loi, art. 55, 1er al.).
  const prestation = auMoinsZero(besoins - ressources);
  noter(etapes, "prestation", prestation);

  // 7. Supplément aux revenus de travail : 25 % du revenu de travail au-delà de l'exclusion,
  //    seulement si la prestation est positive (loi, art. 55, 2e al. ; règlement, art. 154.1).
  let supplement = 0;
  if (prestation > 0) {
    supplement = parametresAide.tauxIncitation * revenuTravailCompte;
  }
  noter(etapes, "supplement", supplement);

  // 8. Montant annuel : douze mois.
  const aideAnnuelle = (prestation + supplement) * 12;
  noter(etapes, "aideAnnuelle", aideAnnuelle);
  return aideAnnuelle;
}

/**
 * Aide sociale du ménage. Pour un ménage actif, le revenu est un revenu de travail, net des
 * cotisations. Pour un ménage retraité de moins de 65 ans, c'est une pension, comptée en entier.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param parametresAide paramètres de l'aide sociale de l'année
 * @param rrq paramètres du RRQ de l'année
 * @param rqap paramètres du RQAP de l'année
 * @param ae paramètres de l'assurance-emploi de l'année
 * @returns l'aide de l'année ($)
 */
function aideSocialeMenage(menage, parametresAide, rrq, rqap, ae, etapes) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  const retraite = SITUATIONS[menage.situation].retraite;

  // 1. Revenu brut du ménage.
  let revenuBrut = menage.revenu1;
  if (nbAdultes === 2) {
    revenuBrut = revenuBrut + menage.revenu2;
  }

  // 2. Actif : revenu de travail net des cotisations au RRQ, au RQAP et à l'assurance-emploi.
  //    Retraité : pension, comptée en entier comme « autre revenu ».
  let revenuTravailNet = 0;
  let autreRevenu = 0;
  if (retraite) {
    autreRevenu = revenuBrut;
  } else {
    const cotisations = rrqMenage(menage, rrq).total + rqapMenage(menage, rqap) + aeMenage(menage, ae);
    revenuTravailNet = revenuBrut - cotisations;
  }
  noter(etapes, "revenuTravailNet", revenuTravailNet);
  noter(etapes, "autreRevenu", autreRevenu);

  // 3. Enfants de moins de 5 ans, comptés seulement pour la famille monoparentale.
  let nbEnfantsMoins5 = 0;
  if (menage.situation === Situation.FamilleMonoparentale) {
    for (const enfant of menage.enfants) {
      if (enfant.age < parametresAide.ageEnfantContrainte) {
        nbEnfantsMoins5 = nbEnfantsMoins5 + 1;
      }
    }
  }

  let age2 = 0;
  if (nbAdultes === 2) {
    age2 = menage.ageAdulte2;
  }
  return aideSociale(
    revenuTravailNet, nbAdultes, menage.ageAdulte1, age2, menage.enfants.length, parametresAide,
    autreRevenu, nbEnfantsMoins5, etapes,
  );
}
