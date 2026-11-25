// @ts-check
// ===========================================================================
// Programme 15 — Crédit pour la taxe sur les produits et services (TPS) /
// Allocation canadienne pour l'épicerie et les besoins essentiels
//
// Ce que fait le programme : un crédit fédéral non imposable, versé chaque
// trimestre par l'Agence du revenu du Canada : un montant par adulte et par
// enfant ; pour la famille monoparentale, le premier enfant au montant d'un
// adulte et un montant supplémentaire ; pour la personne seule sans enfant, un
// montant supplémentaire progressif ; le tout réduit de 5 % du revenu familial
// qui dépasse un seuil.
// Depuis juillet 2026, il devient l'Allocation canadienne pour l'épicerie et
// les besoins essentiels : même formule, montants majorés de 25 % pendant
// cinq ans. En 2026 s'ajoute un versement unique (versé en juin 2026) ; un
// autre, de janvier 2027, est proposé (projet de loi C-42).
// Qui y a droit : le « particulier admissible » (art. 122.5) ; un couple reçoit
// un seul crédit (par. 122.5(5)).
// Base légale : Loi de l'impôt sur le revenu (L.R.C. 1985, ch. 1 (5e suppl.)),
//   art. 122.5 ; le calcul est la formule A − B du par. 122.5(3) ; de juillet
//   2026 à avril 2031, celle du par. 122.5(3.005), qui remplace le montant du
//   par. (3) (par. (4.6)) ; versement unique : formule 0,25 × (A − B) − C du
//   par. 122.5(3.004), pour le mois de janvier 2026 (par. (4.4)). Ces trois
//   paragraphes sont ajoutés par la Loi sur l'allocation canadienne pour
//   l'épicerie et les besoins essentiels (L.C. 2026, ch. 1, art. 3). Versement
//   de janvier 2027 : même formule au par. 122.5(3.006), année d'imposition
//   2025 (par. (4.7)), proposés par le projet de loi C-42 (budget fédéral du
//   5 novembre 2026), pas encore sanctionné.
// Sources publiques : Agence du revenu du Canada, « Montants des versements »
//   de chaque année de prestation (juillet à juin) ; L.C. 2026, ch. 1.
// Simplifications du modèle : montant annuel (la loi en verse le quart chaque
//   trimestre) ; chaque année retient l'année de prestation qui commence en
//   juillet ; le revenu de l'année tient lieu de celui de l'année de base ;
//   le versement unique se calcule, comme le versement ordinaire de janvier
//   2026, sur l'année précédente du modèle (même ménage, même revenu) : son
//   revenu familial net rajusté et son crédit.
// Paramètres (parametres.csv) : groupe « tps » : baseAdulte, parEnfant,
//   supplMonoparental, seuilPhaseIn, tauxPhaseIn, plafondPhaseIn,
//   seuilReduction, tauxReduction, partTrimestrielle ; groupe
//   « tpsVersementUnique » : les huit premiers, avec les montants du
//   par. 122.5(3.004) (2026) ou (3.006) (2027), et fraction (nuls en 2025).
// ===========================================================================

/**
 * Crédit pour la TPS de l'année.
 *
 * @param revenuFamilialNetAjuste revenu familial net rajusté ($)
 * @param nbAdultes 1 ou 2
 * @param nbEnfants nombre d'enfants
 * @param tps paramètres du crédit de l'année
 * @returns le crédit de l'année ($), arrondi au cent
 */
function creditTPS(revenuFamilialNetAjuste, nbAdultes, nbEnfants, tps, etapes) {
  // 1. Un montant par adulte : le particulier et son conjoint (par. 122.5(3), élément A,
  //    al. a et b).
  const montantAdultes = nbAdultes * tps.baseAdulte;
  noter(etapes, "montantAdultes", montantAdultes);

  // 2. Famille monoparentale (aucun conjoint, au moins un enfant) : le premier enfant donne
  //    droit au montant d'un adulte (al. c), plus un montant supplémentaire (al. e).
  const parentSeul = nbAdultes === 1 && nbEnfants > 0;
  let montantPremierEnfant = 0;
  let supplementParentSeul = 0;
  let enfantsAuMontantParEnfant = nbEnfants;
  if (parentSeul) {
    montantPremierEnfant = tps.supplMonoparental;
    supplementParentSeul = tps.plafondPhaseIn;
    enfantsAuMontantParEnfant = nbEnfants - 1;
  }
  noter(etapes, "montantPremierEnfant", montantPremierEnfant);
  noter(etapes, "supplementParentSeul", supplementParentSeul);

  // 3. Un montant par enfant, sauf le premier enfant d'un parent seul, compté à l'al. c
  //    (élément A, al. d).
  const montantEnfants = enfantsAuMontantParEnfant * tps.parEnfant;
  noter(etapes, "montantEnfants", montantEnfants);

  // 4. Personne seule sans enfant : 2 % de la partie de son revenu qui dépasse un seuil, au
  //    plus le montant supplémentaire pour personne seule (al. f).
  let supplementPersonneSeule = 0;
  if (nbAdultes === 1 && nbEnfants === 0) {
    supplementPersonneSeule = auMoinsZero(
      plafonner(tps.tauxPhaseIn * (revenuFamilialNetAjuste - tps.seuilPhaseIn), tps.plafondPhaseIn),
    );
  }
  noter(etapes, "supplementPersonneSeule", supplementPersonneSeule);

  // 5. Montant avant réduction (A).
  const montantAvantReduction =
    montantAdultes + montantPremierEnfant + montantEnfants + supplementParentSeul + supplementPersonneSeule;
  noter(etapes, "montantAvantReduction", montantAvantReduction);

  // 6. Réduction (B) : 5 % du revenu familial rajusté qui dépasse le seuil (élément B).
  noter(etapes, "revenuFamilialNetAjuste", revenuFamilialNetAjuste);
  const reduction = excedent(revenuFamilialNetAjuste, tps.seuilReduction) * tps.tauxReduction;
  noter(etapes, "reduction", reduction);

  // 7. Crédit : A − B, sans descendre sous zéro (art. 257).
  const credit = arrondiAuCent(auMoinsZero(montantAvantReduction - reduction));
  noter(etapes, "credit", credit);
  return credit;
}

/**
 * Versement unique de janvier 2026 (par. 122.5(3.004)) ou de janvier 2027 (par. 122.5(3.006),
 * proposé) : 0,25 × (A − B) − C.
 *
 * @param revenuReference revenu familial net rajusté de l'année de référence ($)
 * @param nbAdultes 1 ou 2
 * @param nbEnfants nombre d'enfants
 * @param creditReference crédit pour la TPS de l'année de référence ($), dont le quart est le
 *   versement ordinaire du même mois
 * @param partTrimestrielleReference part du crédit annuel versée chaque trimestre, l'année de
 *   référence (le quart, par. 122.5(3))
 * @param tpsVersementUnique paramètres du versement unique de l'année
 * @param etapes journal du calcul (facultatif)
 * @returns le versement unique ($), non arrondi
 */
function versementUniqueTPS(revenuReference, nbAdultes, nbEnfants, creditReference, partTrimestrielleReference, tpsVersementUnique, etapes) {
  // 1. A − B : la formule du crédit (étapes 1 à 7 ci-dessus), avec les montants du versement de
  //    l'année (par. 122.5(3.004) pour janvier 2026 ; par. (3.006), proposé, pour janvier 2027) :
  //    montant par adulte et par enfant, supplément pour personne seule de 6 % au-delà d'un seuil,
  //    réduction de 15 % au-delà d'un seuil ; sur le revenu de l'année de référence, comme le
  //    versement ordinaire du même mois (par. (4.4) et (4.7)).
  noter(etapes, "revenuReference", revenuReference);
  const montantFormule = creditTPS(revenuReference, nbAdultes, nbEnfants, tpsVersementUnique);
  noter(etapes, "montantFormuleVersement", montantFormule);

  // 2. C : le montant réputé payé le même mois en vertu du par. 122.5(3) (janvier 2026) ou du
  //    par. (3.005) (janvier 2027), soit le versement trimestriel ordinaire : « le quart » du
  //    crédit annuel.
  noter(etapes, "creditReference", creditReference);
  const versementOrdinaire = partTrimestrielleReference * creditReference;
  noter(etapes, "versementOrdinaire", versementOrdinaire);

  // 3. Versement unique : 0,25 × (A − B) − C, sans descendre sous zéro (art. 257).
  const versement = auMoinsZero(tpsVersementUnique.fraction * montantFormule - versementOrdinaire);
  noter(etapes, "versementUnique", versement);
  return versement;
}

/**
 * Crédit pour la TPS (ou allocation pour l'épicerie) du ménage, versement unique compris.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param revenuFamilialNetAjuste revenu familial net rajusté ($)
 * @param tps paramètres du crédit de l'année
 * @param tpsVersementUnique paramètres du versement unique de l'année
 * @param reference l'année de référence du versement unique : son revenu familial net rajusté
 *   (`revenu`), son crédit pour la TPS (`credit`) et la part de ce crédit versée chaque
 *   trimestre (`partTrimestrielle`)
 * @param etapes journal du calcul (facultatif)
 * @returns le crédit de l'année et le versement unique ($)
 */
function creditTPSMenage(menage, revenuFamilialNetAjuste, tps, tpsVersementUnique, reference, etapes) {
  const nbAdultes = SITUATIONS[menage.situation].nbAdultes;
  const nbEnfants = menage.enfants.length;
  const credit = creditTPS(revenuFamilialNetAjuste, nbAdultes, nbEnfants, tps, etapes);
  const versement = versementUniqueTPS(
    reference.revenu, nbAdultes, nbEnfants, reference.credit, reference.partTrimestrielle, tpsVersementUnique, etapes,
  );

  // Total du programme : le crédit de l'année et le versement unique.
  const total = credit + versement;
  noter(etapes, "total", total);
  return total;
}
