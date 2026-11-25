// @ts-check
// ===========================================================================
// Programme 16 — Allocation canadienne pour les travailleurs (ACT), version du
// Québec
//
// Ce que fait le programme : un crédit remboursable fédéral pour les
// travailleurs à faible revenu. Il croît avec le revenu de travail du ménage
// au-delà d'un montant exclu, jusqu'à un maximum ; il diminue ensuite de 20 %
// du revenu familial net rajusté qui dépasse un seuil. Une partie du revenu du
// conjoint qui gagne le moins n'est pas comptée dans cette réduction.
// Au Québec, les montants sont ceux d'un accord Canada-Québec, qui remplacent
// ceux de la loi fédérale (art. 122.71).
// Qui y a droit : le « particulier admissible » (par. 122.7(1)) : 19 ans ou
// plus, conjoint, ou parent qui réside avec son enfant ; un couple reçoit une
// seule allocation (par. 122.7(5)).
// Base légale : Loi de l'impôt sur le revenu (L.R.C. 1985, ch. 1 (5e suppl.)),
//   art. 122.7 (formule A − B du par. 122.7(2) ; exemption du second revenu :
//   par. 122.7(1.3)) et 122.71 (accord avec une province).
// Sources publiques : Agence du revenu du Canada, annexe 6 « Allocation
//   canadienne pour les travailleurs » des résidents du Québec (5005-S6) : les
//   montants de l'accord, ligne par ligne. Ceux de 2026 ne sont pas encore
//   publiés (valeurs provisoires dans parametres.csv).
// Simplifications du modèle : « avec enfants » tient lieu de « a une personne à
//   charge admissible » ; le supplément pour personnes handicapées
//   (par. 122.7(3)) n'est pas modélisé ; le revenu net du conjoint qui gagne le
//   moins est son revenu total, moins sa cotisation supplémentaire au RRQ et,
//   s'il la demande, la déduction pour frais de garde.
// Paramètres (parametres.csv, groupe « act ») : exclusionSeul, exclusionCouple,
//   exemptionSecondRevenu, tauxReduction et, pour chacun des quatre types de
//   ménage, tauxPhaseIn, primeMax, seuilReduction. La fonction « ménage » utilise
//   aussi le groupe « rrq » (programme 1).
// ===========================================================================

/**
 * Allocation canadienne pour les travailleurs de l'année.
 *
 * @param revenuTravail revenu de travail du ménage ($ ; celui des deux conjoints)
 * @param revenuExemptable revenu du conjoint qui gagne le moins, pris en compte pour l'exemption ($ ; 0 sans conjoint)
 * @param revenuFamilialNetAjuste revenu familial net rajusté ($)
 * @param nbAdultes 1 ou 2
 * @param aDesEnfants `true` si le ménage a au moins un enfant
 * @param act paramètres de l'allocation de l'année
 * @returns l'allocation de l'année ($), arrondie au cent
 */
function allocationTravailleurs(revenuTravail, revenuExemptable, revenuFamilialNetAjuste, nbAdultes, aDesEnfants, act, etapes) {
  // 1. Barème du type de ménage : avec ou sans conjoint, avec ou sans enfants.
  let typeDeMenage = "sansEnfants";
  if (aDesEnfants) {
    typeDeMenage = "avecEnfants";
  }
  const bareme = act.parType[nbAdultes][typeDeMenage];
  noter(etapes, "tauxPhaseIn", bareme.tauxPhaseIn);
  noter(etapes, "primeMax", bareme.primeMax);
  noter(etapes, "seuilReduction", bareme.seuilReduction);

  // 2. Montant exclu du revenu de travail : sans ou avec conjoint.
  let montantExclu = act.exclusionSeul;
  if (nbAdultes === 2) {
    montantExclu = act.exclusionCouple;
  }
  noter(etapes, "montantExclu", montantExclu);
  noter(etapes, "revenuTravail", revenuTravail);

  // 3. Montant A : taux × revenu de travail au-delà du montant exclu, jusqu'au maximum
  //    (par. 122.7(2), élément A, montants de l'accord).
  const montantA = plafonner(excedent(revenuTravail, montantExclu) * bareme.tauxPhaseIn, bareme.primeMax);
  noter(etapes, "montantA", montantA);

  // 4. Exemption du second revenu : le revenu du conjoint qui gagne le moins, jusqu'à un
  //    plafond, est retranché du revenu net rajusté (par. 122.7(1.3)).
  noter(etapes, "revenuExemptable", revenuExemptable);
  const exemption = plafonner(revenuExemptable, act.exemptionSecondRevenu);
  noter(etapes, "exemption", exemption);

  // 5. Réduction (B) : 20 % du revenu familial net rajusté, moins l'exemption, qui dépasse
  //    le seuil (par. 122.7(2), élément B, montants de l'accord).
  noter(etapes, "revenuFamilialNetAjuste", revenuFamilialNetAjuste);
  const reduction = excedent(revenuFamilialNetAjuste - exemption, bareme.seuilReduction) * act.tauxReduction;
  noter(etapes, "reduction", reduction);

  // 6. Allocation : A − B, sans descendre sous zéro (art. 257).
  const allocation = arrondiAuCent(auMoinsZero(montantA - reduction));
  noter(etapes, "allocation", allocation);
  return allocation;
}

/**
 * Allocation canadienne pour les travailleurs du ménage.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param revenuFamilialNetAjuste revenu familial net rajusté ($)
 * @param act paramètres de l'allocation de l'année
 * @param rrq paramètres du RRQ de l'année (cotisation supplémentaire, déductible)
 * @param garde déduction fédérale pour frais de garde du ménage et adulte qui la demande (1 ou 2) ;
 *   aucune si on l'omet
 * @param revenusTotaux revenu total de chaque adulte ($ ; travail, PSV, SRG, aide sociale) ;
 *   à défaut, son revenu de travail
 * @returns l'allocation de l'année ($)
 */
function allocationTravailleursMenage(
  menage,
  revenuFamilialNetAjuste,
  act,
  rrq,
  garde = { deduction: 0, declarant: 1 },
  revenusTotaux = undefined,
  etapes = undefined,
) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  const revenu1 = menage.revenu1;
  let revenu2 = 0;
  if (nbAdultes === 2) {
    revenu2 = menage.revenu2;
  }

  // 1. Conjoint qui gagne le moins (à égalité, l'adulte 1) et son revenu de travail. Pour une
  //    personne seule, le « second revenu » est nul : aucune exemption.
  let conjointMoindre = 1;
  if (revenu1 > revenu2) {
    conjointMoindre = 2;
  }
  let revenuTravailMoindre = revenu1;
  if (conjointMoindre === 2) {
    revenuTravailMoindre = revenu2;
  }

  // 2. Son revenu net : son revenu total, moins sa cotisation supplémentaire au RRQ et, s'il
  //    la demande, la déduction pour frais de garde.
  let revenuTotalMoindre = revenuTravailMoindre;
  if (revenusTotaux !== undefined) {
    revenuTotalMoindre = revenusTotaux[conjointMoindre - 1];
  }
  let deductionGarde = 0;
  if (nbAdultes === 2 && garde.declarant === conjointMoindre) {
    deductionGarde = garde.deduction;
  }
  const revenuNetMoindre = revenuTotalMoindre - cotisationRRQ(revenuTravailMoindre, rrq).supplementaire - deductionGarde;

  // 3. L'exemption ne peut dépasser ni son revenu de travail ni son revenu net
  //    (par. 122.7(1.3)).
  const revenuExemptable = plafonner(revenuTravailMoindre, revenuNetMoindre);

  return allocationTravailleurs(
    revenu1 + revenu2,
    revenuExemptable,
    revenuFamilialNetAjuste,
    nbAdultes,
    menage.enfants.length > 0,
    act,
    etapes,
  );
}
