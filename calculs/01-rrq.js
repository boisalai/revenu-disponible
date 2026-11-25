// @ts-check
// ===========================================================================
// Programme 1 — Cotisation au Régime de rentes du Québec (RRQ)
//
// Ce que fait le programme : chaque travailleur verse, sur son revenu de
// travail, une cotisation de base et deux cotisations supplémentaires (part de
// l'employé, soit la moitié des taux fixés par la loi).
// Qui cotise : chaque adulte qui a un revenu de travail. Un ménage retraité
// n'en verse pas : son revenu est un revenu de retraite (voir programme 20).
// Base légale : Loi sur le régime de rentes du Québec (RLRQ, c. R-9),
//   art. 40 (maximum des gains admissibles, MGA), 40.4 (maximum supplémentaire,
//   MSGA), 42 et 43 (exemption), 44 (maximums des gains cotisables), 44.1 à 44.3
//   (taux) et 50 (cotisations du salarié). En 2026, le taux de base est de 10,6 %
//   au lieu de 10,8 % : baisse annoncée le 25 nov. 2025, qui suspend pour 2026 la
//   règle de l'art. 44.1 (modification absente du texte à jour au 15 oct. 2026).
// Sources publiques : Retraite Québec, « Le Régime de rentes du Québec en chiffres »
//   (données de base et cotisation maximale de la personne salariée).
// Paramètres (parametres.csv, groupe « rrq ») : exemption, mga, mgas,
//   tauxBase, tauxSuppl1, tauxSuppl2.
// ===========================================================================

/**
 * Cotisation au RRQ d'un travailleur.
 *
 * @param revenuTravail revenu de travail de l'année ($)
 * @param rrq paramètres du RRQ de l'année
 * @param etapes journal du calcul (facultatif ; voir `noter`, calculs/00-outils.js)
 * @returns les cotisations de l'année ($) : `base`, `supplementaire` (1re et 2e) et `total`
 */
function cotisationRRQ(revenuTravail, rrq, etapes) {
  noter(etapes, "revenuTravail", revenuTravail);

  // 1. Gains cotisables : la partie du revenu de travail, plafonné au maximum des gains
  //    admissibles (MGA), qui dépasse l'exemption générale (art. 43, 44 et 50, 1er al.).
  const gainsCotisables = excedent(plafonner(revenuTravail, rrq.mga), rrq.exemption);
  noter(etapes, "gainsCotisables", gainsCotisables);

  // 2. Gains supplémentaires : la partie du revenu de travail, plafonné au maximum
  //    supplémentaire des gains admissibles (MSGA), qui dépasse le MGA (art. 44 et 50, 3e al.).
  const gainsSupplementaires = excedent(plafonner(revenuTravail, rrq.mgas), rrq.mga);
  noter(etapes, "gainsSupplementaires", gainsSupplementaires);

  // 3. Cotisation de base : taux de base de l'employé (la moitié du taux de l'art. 44.1,
  //    soit 10,8 % en 2025 et 10,6 % en 2026, voir l'en-tête) × gains cotisables
  //    (art. 50, 1er al.). Elle entre dans les crédits d'impôt non
  //    remboursables fédéraux (voir programme 19).
  const cotisationDeBase = gainsCotisables * rrq.tauxBase;
  noter(etapes, "cotisationDeBase", cotisationDeBase);

  // 4. Cotisations supplémentaires : la première sur les gains cotisables (art. 44.2 et
  //    50, 2e al.), la deuxième sur les gains supplémentaires (art. 44.3 et 50, 3e al.).
  //    Elles sont déductibles du revenu (voir programmes 19 et 20).
  const cotisationSupplementaire = gainsCotisables * rrq.tauxSuppl1 + gainsSupplementaires * rrq.tauxSuppl2;
  noter(etapes, "cotisationSupplementaire", cotisationSupplementaire);

  // 5. Cotisation totale du travailleur.
  const cotisation = cotisationDeBase + cotisationSupplementaire;
  noter(etapes, "cotisation", cotisation);

  return {
    base: cotisationDeBase,
    supplementaire: cotisationSupplementaire,
    total: cotisation,
  };
}

/**
 * Cotisation au RRQ du ménage : la somme des cotisations de chaque adulte.
 *
 * @param menage le ménage (situation, revenus, âges, enfants)
 * @param rrq paramètres du RRQ de l'année
 * @param etapes journal du calcul (facultatif) : un groupe d'étapes par adulte
 * @returns les cotisations du ménage ($) : `base`, `supplementaire` et `total`
 */
function rrqMenage(menage, rrq, etapes) {
  let base = 0;
  let supplementaire = 0;
  let total = 0;
  let numeroAdulte = 0;
  for (const revenuTravail of revenusAdultes(menage)) {
    numeroAdulte = numeroAdulte + 1;
    const cotisation = cotisationRRQ(revenuTravail, rrq, groupe(etapes, "adulte" + numeroAdulte));
    base = base + cotisation.base;
    supplementaire = supplementaire + cotisation.supplementaire;
    total = total + cotisation.total;
  }
  noter(etapes, "cotisationMenage", total);
  return { base, supplementaire, total };
}
