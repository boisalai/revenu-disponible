// @ts-check
// ===========================================================================
// Programme 3 — Cotisation d'assurance-emploi (AE), au taux réduit du Québec
//
// Ce que fait le programme : chaque salarié verse une cotisation (la
// « cotisation ouvrière ») sur sa rémunération assurable, jusqu'au maximum de
// la rémunération assurable (MRA). Il n'y a pas d'exemption. Au Québec, le
// taux est réduit : le RQAP (programme 2) remplace une partie des prestations
// du régime fédéral.
// Qui cotise : chaque adulte dont le revenu de travail dépasse 2 000 $ (jusqu'à
//   2 000 $, les cotisations retenues sont remboursées, par. 96(4)). Un
// ménage retraité n'en verse pas (voir programme 20).
// Base légale : Loi sur l'assurance-emploi (L.C. 1996, ch. 23), art. 4 (MRA),
//   66 (taux), 67 (cotisation ouvrière), 69(2) (réduction pour un régime
//   provincial), 82(2) (retenue jusqu'au MRA) et 96(4) (remboursement quand la
//   rémunération ne dépasse pas 2 000 $).
// Sources publiques : Agence du revenu du Canada, « Taux de cotisation à l'AE et
//   maximums », tableau du Québec.
// Simplifications du modèle : tout le revenu de travail est une rémunération
//   assurable.
// Paramètres (parametres.csv, groupe « ae ») : seuil, mra, taux.
// ===========================================================================

/**
 * Cotisation d'assurance-emploi d'un salarié.
 *
 * @param revenuTravail revenu de travail de l'année ($)
 * @param ae paramètres de l'assurance-emploi de l'année
 * @returns la cotisation de l'année ($)
 */
function cotisationAE(revenuTravail, ae, etapes) {
  noter(etapes, "revenuTravail", revenuTravail);

  // 1. Rémunération de 2 000 $ ou moins : les cotisations retenues sont remboursées
  //    (par. 96(4)) ; il n'en reste aucune.
  if (revenuTravail <= ae.seuil) {
    noter(etapes, "cotisation", 0);
    return 0;
  }

  // 2. Cotisation : taux de l'employé, réduit au Québec, × rémunération assurable,
  //    plafonnée au MRA (art. 4, 67, par. 69(2) et 82(2)).
  const remunerationAssurable = plafonner(revenuTravail, ae.mra);
  noter(etapes, "remunerationAssurable", remunerationAssurable);
  const cotisation = remunerationAssurable * ae.taux;
  noter(etapes, "cotisation", cotisation);
  return cotisation;
}

/**
 * Cotisation d'assurance-emploi du ménage : la somme des cotisations de chaque adulte.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param ae paramètres de l'assurance-emploi de l'année
 * @returns la cotisation du ménage ($)
 */
function aeMenage(menage, ae, etapes) {
  let total = 0;
  let numeroAdulte = 0;
  for (const revenuTravail of revenusAdultes(menage)) {
    numeroAdulte = numeroAdulte + 1;
    total = total + cotisationAE(revenuTravail, ae, groupe(etapes, "adulte" + numeroAdulte));
  }
  noter(etapes, "cotisationMenage", total);
  return total;
}
