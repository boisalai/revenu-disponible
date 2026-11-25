// @ts-check
// ===========================================================================
// Programme 2 — Cotisation au Régime québécois d'assurance parentale (RQAP)
//
// Ce que fait le programme : chaque salarié verse une cotisation sur son
// salaire, jusqu'au maximum de revenus assurables. Il n'y a pas d'exemption :
// la cotisation porte sur tout le salaire, dès le premier dollar.
// Qui cotise : chaque adulte dont le revenu de travail atteint 2 000 $. Un
// ménage retraité n'en verse pas (voir programme 20).
// Base légale : Loi sur l'assurance parentale (RLRQ, c. A-29.011), art. 5
//   (maximum de revenus assurables), 6 (taux fixé par règlement), 54 (revenu
//   de moins de 2 000 $) et 58 (cotisation de l'employé).
//   Taux de 2026 : 0,430 % au lieu de 0,494 %, soit une baisse de 13 % (Règlement sur
//   les taux de cotisation au régime d'assurance parentale).
// Sources publiques : Revenu Québec, « Maximum de revenus assurables et taux de
//   cotisation au Régime québécois d'assurance parentale ».
// Simplifications du modèle : tout le revenu de travail est un salaire gagné
//   au Québec.
// Paramètres (parametres.csv, groupe « rqap ») : seuil, maxAssurable, taux.
// ===========================================================================

/**
 * Cotisation au RQAP d'un salarié.
 *
 * @param revenuTravail revenu de travail de l'année ($)
 * @param rqap paramètres du RQAP de l'année
 * @returns la cotisation de l'année ($)
 */
function cotisationRQAP(revenuTravail, rqap, etapes) {
  noter(etapes, "revenuTravail", revenuTravail);

  // 1. Revenu de travail « inférieur à 2 000 $ » : aucune cotisation (art. 54). Un revenu
  //    d'exactement 2 000 $ cotise.
  if (revenuTravail < rqap.seuil) {
    noter(etapes, "cotisation", 0);
    return 0;
  }

  // 2. Cotisation : taux de l'employé × salaire, plafonné au maximum de revenus
  //    assurables (art. 5 et 58).
  const salaireAssurable = plafonner(revenuTravail, rqap.maxAssurable);
  noter(etapes, "salaireAssurable", salaireAssurable);
  const cotisation = salaireAssurable * rqap.taux;
  noter(etapes, "cotisation", cotisation);
  return cotisation;
}

/**
 * Cotisation au RQAP du ménage : la somme des cotisations de chaque adulte.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param rqap paramètres du RQAP de l'année
 * @returns la cotisation du ménage ($)
 */
function rqapMenage(menage, rqap, etapes) {
  let total = 0;
  let numeroAdulte = 0;
  for (const revenuTravail of revenusAdultes(menage)) {
    numeroAdulte = numeroAdulte + 1;
    total = total + cotisationRQAP(revenuTravail, rqap, groupe(etapes, "adulte" + numeroAdulte));
  }
  noter(etapes, "cotisationMenage", total);
  return total;
}
