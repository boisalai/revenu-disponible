// @ts-check
// ===========================================================================
// Vocabulaire commun des calculs : quelques mots qui reviennent dans tous les
// programmes, pour que chaque fichier se lise comme la règle qu'il applique.
// ===========================================================================

/**
 * Partie d'un montant qui dépasse un seuil ; 0 si le montant ne l'atteint pas.
 * Exemple : excedent(50000, 42325) = 7675 ; excedent(30000, 42325) = 0.
 */
function excedent(montant, seuil) {
  return Math.max(0, montant - seuil);
}

/**
 * Montant limité à un plafond.
 * Exemple : plafonner(80000, 71300) = 71300 ; plafonner(50000, 71300) = 50000.
 */
function plafonner(montant, plafond) {
  return Math.min(montant, plafond);
}

/** Montant ramené à 0 s'il est négatif (un crédit ou une prestation ne peut pas être négatif). */
function auMoinsZero(montant) {
  return Math.max(0, montant);
}

/** Montant arrondi au cent le plus proche. Exemple : arrondiAuCent(1255.996) = 1256. */
function arrondiAuCent(montant) {
  return Math.round(montant * 100) / 100;
}

// ---------------------------------------------------------------------------
// Journal du calcul (facultatif). Pour expliquer un résultat étape par étape,
// l'appelant peut fournir un journal (une liste) où chaque programme inscrit ses
// étapes. Sans journal, ces deux fonctions ne font rien : le calcul est le même.
// ---------------------------------------------------------------------------

/**
 * Inscrit une étape dans le journal, s'il y en a un : le nom de la variable du
 * calcul et son montant. Exemple : noter(etapes, "gainsCotisables", 46500).
 */
function noter(etapes, nom, montant) {
  if (etapes) {
    etapes.push({ nom: nom, montant: montant });
  }
}

/**
 * Ouvre dans le journal un groupe d'étapes (celles d'un programme, ou d'un adulte)
 * et renvoie le journal de ce groupe ; rien s'il n'y a pas de journal.
 * Exemple : cotisationRRQ(revenu, rrq, groupe(etapes, "adulte1")).
 */
function groupe(etapes, nom) {
  if (!etapes) {
    return undefined;
  }
  const etapesDuGroupe = [];
  etapes.push({ nom: nom, etapes: etapesDuGroupe });
  return etapesDuGroupe;
}
