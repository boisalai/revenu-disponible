// @ts-check
// ===========================================================================
// Programme 18 — Supplément remboursable pour frais médicaux (fédéral)
//
// Ce que fait le programme : un crédit remboursable fédéral pour les
// travailleurs qui paient des frais médicaux : 25 % des frais qui dépassent un
// seuil, jusqu'à un maximum, réduit de 5 % du revenu familial qui dépasse un
// autre seuil.
// Qui y a droit : le « particulier admissible » de 18 ans ou plus dont le revenu
// de travail atteint un minimum (par. 122.51(1)).
// Base légale : Loi de l'impôt sur le revenu (L.R.C. 1985, ch. 1 (5e suppl.)),
//   art. 122.51 (formule A − B du par. 122.51(2) : A, le moindre d'un maximum
//   et de (0,25/C) × D, soit 25 % des frais admissibles ; B, 5 % du revenu
//   modifié au-delà d'un seuil) ; frais au-delà du seuil : par. 118.2(1),
//   élément C ; déclaration de revenus fédérale, ligne 45200.
// Sources publiques : Agence du revenu du Canada (montants indexés de chaque
//   année ; feuille de travail fédérale, ligne 45200).
// Simplifications du modèle : les seuls frais médicaux sont la prime
//   d'assurance médicaments du ménage (programme 5) ; l'adulte qui les demande
//   est choisi par le programme 19. Le résultat n'est pas arrondi.
// Paramètres (parametres.csv, groupe « supplementMedical ») : revenuTravailMin,
//   seuilFrais, plafondSeuilFrais, taux, supplementMax, seuilReduction,
//   tauxReduction.
// ===========================================================================

/**
 * Supplément remboursable pour frais médicaux de l'année.
 *
 * @param fraisMedicaux frais médicaux du ménage ($ ; dans le modèle, la prime d'assurance médicaments)
 * @param revenuTravail revenu de travail de l'adulte qui demande le supplément ($)
 * @param revenuNet revenu net de cet adulte ($ ; sert au seuil de 3 %)
 * @param afni revenu familial net rajusté ($ ; le « revenu modifié », base de la réduction)
 * @param supplementMedical paramètres du supplément de l'année
 * @returns le supplément de l'année ($)
 */
function supplementFraisMedicaux(fraisMedicaux, revenuTravail, revenuNet, afni, supplementMedical, etapes) {
  noter(etapes, "revenuTravail", revenuTravail);

  // 1. Admissibilité : un revenu de travail « d'au moins 2 500 $ », montant indexé
  //    (par. 122.51(1), définition de « particulier admissible », al. c).
  if (revenuTravail < supplementMedical.revenuTravailMin) {
    noter(etapes, "supplement", 0);
    return 0;
  }
  noter(etapes, "fraisMedicaux", fraisMedicaux);
  noter(etapes, "revenuNet", revenuNet);

  // 2. Seuil des frais : 3 % du revenu net, au plus un montant fixe (par. 118.2(1),
  //    élément C).
  const seuilDesFrais = plafonner(supplementMedical.seuilFrais * revenuNet, supplementMedical.plafondSeuilFrais);
  noter(etapes, "seuilDesFrais", seuilDesFrais);

  // 3. Frais admissibles : les frais médicaux qui dépassent ce seuil (par. 118.2(1)).
  const fraisAdmissibles = excedent(fraisMedicaux, seuilDesFrais);
  noter(etapes, "fraisAdmissibles", fraisAdmissibles);

  // 4. Montant A : 25 % des frais admissibles, au plus le supplément maximal
  //    (par. 122.51(2), élément A : « (0,25/C) × D », D étant le crédit de l'art. 118.2
  //    au taux de base C).
  const montantA = plafonner(supplementMedical.taux * fraisAdmissibles, supplementMedical.supplementMax);
  noter(etapes, "montantA", montantA);
  noter(etapes, "revenuFamilialNetAjuste", afni);

  // 5. Réduction (B) : 5 % du revenu familial rajusté qui dépasse le seuil (élément B).
  const reduction = supplementMedical.tauxReduction * excedent(afni, supplementMedical.seuilReduction);
  noter(etapes, "reduction", reduction);

  // 6. Supplément : A − B, sans descendre sous zéro (art. 257).
  const supplement = auMoinsZero(montantA - reduction);
  noter(etapes, "supplement", supplement);
  return supplement;
}
