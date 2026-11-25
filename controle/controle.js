// ===========================================================================
// Contrôle des calculs : vérifie, d'un double-clic sur controle.html, que les
// formules de calculs/ donnent toujours les résultats attendus.
//
// Pour chaque ménage de controle/cas-attendus.js et chaque année, la page
// recalcule le revenu disponible avec les formules actuelles et compare chaque
// poste, arrondi au cent. Les paramètres sont une copie figée, jointe aux cas :
// modifier parametres.csv n'a donc aucun effet ici ; seules les formules sont
// contrôlées.
//
// Si vous avez modifié une règle volontairement, des écarts sont attendus sur
// ce programme et sur ceux qui en dépendent (p. ex. l'impôt et le revenu
// disponible) ; un écart ailleurs signale une erreur.
// ===========================================================================

/** Nom de chaque programme contrôlé (numéro du fichier de calculs/). */
var PROGRAMMES_CONTROLES = {
  1: "Cotisation au RRQ",
  2: "Cotisation au RQAP",
  3: "Cotisation d'assurance-emploi",
  4: "Cotisation au FSS",
  5: "Prime d'assurance médicaments",
  6: "Frais de garde (crédit et coût)",
  7: "Allocation famille et fournitures scolaires",
  8: "Prime au travail",
  9: "Crédit pour la solidarité",
  10: "Allocation-logement",
  11: "Crédit pour soutien aux aînés",
  12: "Crédit pour frais médicaux (Québec)",
  13: "Aide sociale",
  14: "Allocation canadienne pour enfants",
  15: "Allocation canadienne pour l'épicerie et les besoins essentiels",
  16: "Allocation canadienne pour les travailleurs",
  17: "Sécurité de la vieillesse",
  18: "Supplément médical fédéral",
  19: "Impôts du Québec et fédéral",
  20: "Revenu disponible et bases de revenu",
  21: "Versement pour l'épicerie et l'énergie",
};

/** Postes comparés : où les lire dans le résultat du calcul, et le programme qui les produit. */
var POSTES_CONTROLES = [
  { chemin: "detail.cotisations.rrq", programme: 1, libelle: "Cotisation au RRQ" },
  { chemin: "detail.cotisations.rqap", programme: 2, libelle: "Cotisation au RQAP" },
  { chemin: "detail.cotisations.assuranceEmploi", programme: 3, libelle: "Cotisation d'assurance-emploi" },
  { chemin: "detail.cotisations.fss", programme: 4, libelle: "Cotisation au FSS" },
  { chemin: "detail.cotisations.ramq", programme: 5, libelle: "Prime d'assurance médicaments" },
  { chemin: "detail.transfertsQuebec.fraisGarde", programme: 6, libelle: "Crédit pour frais de garde" },
  { chemin: "detail.fraisGardeCout", programme: 6, libelle: "Coût des frais de garde" },
  { chemin: "detail.transfertsQuebec.allocationFamille", programme: 7, libelle: "Allocation famille" },
  { chemin: "detail.transfertsQuebec.fournituresScolaires", programme: 7, libelle: "Supplément pour fournitures scolaires" },
  { chemin: "detail.transfertsQuebec.primeTravail", programme: 8, libelle: "Prime au travail" },
  { chemin: "detail.transfertsQuebec.solidarite", programme: 9, libelle: "Crédit pour la solidarité" },
  { chemin: "detail.transfertsQuebec.versementEpicerie", programme: 21, libelle: "Versement pour l'épicerie et l'énergie" },
  { chemin: "detail.transfertsQuebec.allocationLogement", programme: 10, libelle: "Allocation-logement" },
  { chemin: "detail.transfertsQuebec.soutienAines", programme: 11, libelle: "Crédit pour soutien aux aînés" },
  { chemin: "detail.transfertsQuebec.fraisMedicaux", programme: 12, libelle: "Crédit pour frais médicaux" },
  { chemin: "detail.transfertsQuebec.aideSociale", programme: 13, libelle: "Aide sociale" },
  { chemin: "detail.transfertsFederaux.allocationEnfants", programme: 14, libelle: "Allocation canadienne pour enfants" },
  { chemin: "detail.transfertsFederaux.creditTPS", programme: 15, libelle: "Allocation canadienne pour l'épicerie et les besoins essentiels" },
  { chemin: "detail.transfertsFederaux.allocationTravailleurs", programme: 16, libelle: "Allocation canadienne pour les travailleurs" },
  { chemin: "detail.transfertsFederaux.securiteVieillesse", programme: 17, libelle: "Sécurité de la vieillesse" },
  { chemin: "detail.transfertsFederaux.supplementMedical", programme: 18, libelle: "Supplément médical fédéral" },
  { chemin: "detail.impotQuebec", programme: 19, libelle: "Impôt du Québec" },
  { chemin: "detail.impotFederal", programme: 19, libelle: "Impôt fédéral" },
  { chemin: "revenuNetFamilial", programme: 20, libelle: "Revenu net familial" },
  { chemin: "afni", programme: 20, libelle: "Revenu familial net rajusté" },
  { chemin: "revenuAL", programme: 20, libelle: "Revenu aux fins de l'allocation-logement" },
  { chemin: "revenuDisponible", programme: 20, libelle: "Revenu disponible" },
];

/**
 * Pour chaque fichier de calculs/, un nom qu'il définit : s'il manque après le chargement, le
 * fichier contient une erreur (ou n'existe pas). Depuis le disque, le navigateur ne dit pas
 * toujours quel fichier est en cause ; ce relevé permet de le nommer.
 */
var NOM_DEFINI_PAR_FICHIER = {
  "calculs/parametres-attendus.js": "PARAMETRES_ATTENDUS",
  "calculs/00-outils.js": "excedent",
  "calculs/00-socle.js": "impotProgressif",
  "calculs/01-rrq.js": "cotisationRRQ",
  "calculs/02-rqap.js": "cotisationRQAP",
  "calculs/03-ae.js": "cotisationAE",
  "calculs/04-fss.js": "cotisationFSS",
  "calculs/05-ramq.js": "ramqMenage",
  "calculs/06-garde.js": "creditFraisGarde",
  "calculs/07-allocation-famille.js": "allocationFamille",
  "calculs/08-prime-travail.js": "primeAuTravail",
  "calculs/09-solidarite.js": "creditSolidarite",
  "calculs/10-allocation-logement.js": "allocationLogement",
  "calculs/11-soutien-aines.js": "montantSoutienAines",
  "calculs/12-frais-medicaux.js": "creditFraisMedicaux",
  "calculs/13-aide-sociale.js": "aideSociale",
  "calculs/14-allocation-canadienne-enfants.js": "allocationCanadienneEnfants",
  "calculs/15-credit-tps.js": "creditTPS",
  "calculs/16-allocation-travailleurs.js": "allocationTravailleurs",
  "calculs/17-securite-vieillesse.js": "securiteVieillesse",
  "calculs/18-supplement-medical-federal.js": "supplementFraisMedicaux",
  "calculs/19-impot.js": "impotFederalMenage",
  "calculs/20-revenu-disponible.js": "calculerRevenuDisponible",
  "calculs/21-versement-epicerie.js": "versementSpecialEpicerie",
};

/**
 * Fichiers de calculs/ qui n'ont pas pu être chargés : ceux dont le nom attendu est absent.
 *
 * @param globales l'objet qui porte les fonctions des calculs (la page, ou un contexte de test)
 * @returns la liste des fichiers en cause
 */
function fichiersNonCharges(globales) {
  const fichiers = [];
  for (const fichier of Object.keys(NOM_DEFINI_PAR_FICHIER)) {
    if (typeof globales[NOM_DEFINI_PAR_FICHIER[fichier]] === "undefined") {
      fichiers.push(fichier);
    }
  }
  return fichiers;
}

/** Valeur d'un résultat à un chemin comme « detail.cotisations.rrq ». */
function lireChemin(objet, chemin) {
  let valeur = objet;
  for (const partie of chemin.split(".")) {
    valeur = valeur[partie];
  }
  return valeur;
}

/** Montant en cents entiers : la comparaison porte sur les montants arrondis au cent. */
function enCents(montant) {
  return Math.round(montant * 100);
}

/**
 * Recalcule chaque cas et le compare aux résultats attendus.
 *
 * @param casAttendus le contenu de controle/cas-attendus.js
 * @param calculer la fonction de calcul : (ménage, paramètres) → résultat
 * @returns pour chaque programme : nombre de vérifications, nombre d'écarts et premiers écarts ;
 *   et la liste des erreurs survenues pendant le calcul
 */
function verifierCalculs(casAttendus, calculer) {
  const parProgramme = {};
  for (const numero of Object.keys(PROGRAMMES_CONTROLES)) {
    parProgramme[numero] = { verifications: 0, ecarts: 0, exemples: [] };
  }
  const erreurs = [];

  // Les postes du fichier de cas doivent être ceux de cette page, dans le même ordre.
  const chemins = [];
  for (const poste of POSTES_CONTROLES) {
    chemins.push(poste.chemin);
  }
  if (chemins.join(",") !== casAttendus.chemins.join(",")) {
    erreurs.push("Le fichier controle/cas-attendus.js ne correspond pas à cette page : il faut le régénérer.");
    return { parProgramme, erreurs };
  }

  for (const cas of casAttendus.cas) {
    for (const annee of Object.keys(cas.attendus)) {
      // 1. Recalcul avec les formules actuelles et les paramètres figés de l'année.
      let resultat;
      try {
        resultat = calculer(cas.menage, casAttendus.parametres[annee]);
      } catch (erreur) {
        if (erreurs.length < 5) {
          erreurs.push(cas.nom + " (" + annee + ") : " + String(erreur && erreur.message ? erreur.message : erreur));
        }
        continue;
      }

      // 2. Comparaison des montants arrondis au cent, poste par poste ; un cas compte une fois par programme.
      const attendus = cas.attendus[annee];
      const programmesEnEcart = {};
      for (let position = 0; position < POSTES_CONTROLES.length; position = position + 1) {
        const poste = POSTES_CONTROLES[position];
        const obtenu = enCents(lireChemin(resultat, poste.chemin));
        if (obtenu !== attendus[position]) {
          if (programmesEnEcart[poste.programme] === undefined) {
            programmesEnEcart[poste.programme] = [];
          }
          programmesEnEcart[poste.programme].push({ libelle: poste.libelle, attendu: attendus[position], obtenu });
        }
      }

      // 3. Bilan par programme.
      for (const numero of Object.keys(parProgramme)) {
        const bilan = parProgramme[numero];
        bilan.verifications = bilan.verifications + 1;
        const postesEnEcart = programmesEnEcart[numero];
        if (postesEnEcart !== undefined) {
          bilan.ecarts = bilan.ecarts + 1;
          if (bilan.exemples.length < 5) {
            for (const ecart of postesEnEcart) {
              bilan.exemples.push({ cas: cas.nom, description: cas.description, annee, libelle: ecart.libelle, attendu: ecart.attendu, obtenu: ecart.obtenu });
            }
          }
        }
      }
    }
  }
  return { parProgramme, erreurs };
}

// ─────────────── Affichage dans la page (absent quand le fichier est lu par les tests) ───────────────

/** Montant en cents → texte en dollars, à la française (« 1 234,56 $ »). */
function enDollars(cents) {
  if (typeof cents !== "number" || isNaN(cents)) {
    return String(cents);
  }
  return (cents / 100).toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";
}

/** Crée un élément HTML avec son texte. */
function element(balise, texte, classe) {
  const noeud = document.createElement(balise);
  if (texte !== undefined) {
    noeud.textContent = texte;
  }
  if (classe !== undefined) {
    noeud.className = classe;
  }
  return noeud;
}

/** Affiche le bilan du contrôle dans la page. */
function afficherControle() {
  const zone = document.getElementById("resultat");
  if (zone === null) {
    return;
  }
  zone.textContent = "";

  // Erreurs de chargement des fichiers de calculs/ (faute de frappe, fichier manquant…). Depuis
  // le disque, le navigateur ne donne souvent qu'un « Script error. » sans détail : on nomme
  // alors les fichiers dont la fonction attendue manque.
  const erreursDeChargement = window.erreursDeChargement || [];
  const fichiersEnErreur = fichiersNonCharges(window);
  if (erreursDeChargement.length > 0 || fichiersEnErreur.length > 0) {
    zone.appendChild(element("p", "✘ Les calculs n'ont pas pu être chargés.", "echec"));
    const liste = element("ul");
    for (const fichier of fichiersEnErreur) {
      liste.appendChild(element("li", fichier + " : erreur dans le fichier, ou fichier introuvable."));
    }
    for (const message of erreursDeChargement) {
      if (message.indexOf("Script error") === -1) {
        liste.appendChild(element("li", message));
      }
    }
    if (fichiersEnErreur.length === 0) {
      liste.appendChild(element("li", "Un fichier de calculs/ contient une erreur."));
    }
    zone.appendChild(liste);
    zone.appendChild(element("p", "La console du navigateur (touche F12) indique la ligne en cause."));
    return;
  }
  if (typeof CAS_ATTENDUS === "undefined") {
    zone.appendChild(element("p", "✘ Le fichier controle/cas-attendus.js est introuvable.", "echec"));
    return;
  }

  const bilan = verifierCalculs(CAS_ATTENDUS, calculerRevenuDisponible);
  let totalEcarts = 0;
  for (const numero of Object.keys(bilan.parProgramme)) {
    totalEcarts = totalEcarts + bilan.parProgramme[numero].ecarts;
  }

  // 1. Conclusion.
  const annees = Object.keys(CAS_ATTENDUS.parametres).join(" et ");
  const portee = CAS_ATTENDUS.cas.length + " ménages, années " + annees + ".";
  if (bilan.erreurs.length === 0 && totalEcarts === 0) {
    zone.appendChild(element("p", "✔ Aucun écart : les calculs donnent les résultats attendus. " + portee, "succes"));
  } else {
    zone.appendChild(element("p", "✘ Des écarts ont été trouvés. " + portee, "echec"));
  }
  for (const message of bilan.erreurs) {
    zone.appendChild(element("p", "Erreur : " + message, "echec"));
  }

  // 2. Tableau par programme.
  const tableau = element("table");
  const entete = element("tr");
  for (const titre of ["Programme", "Vérifications", "Écarts", "Statut"]) {
    entete.appendChild(element("th", titre));
  }
  tableau.appendChild(entete);
  for (const numero of Object.keys(bilan.parProgramme)) {
    const resultat = bilan.parProgramme[numero];
    const ligne = element("tr");
    ligne.appendChild(element("td", numero + " — " + PROGRAMMES_CONTROLES[numero]));
    ligne.appendChild(element("td", String(resultat.verifications)));
    ligne.appendChild(element("td", String(resultat.ecarts)));
    if (resultat.ecarts === 0) {
      ligne.appendChild(element("td", "✔", "succes"));
    } else {
      ligne.appendChild(element("td", "✘", "echec"));
    }
    tableau.appendChild(ligne);
  }
  zone.appendChild(tableau);

  // 3. Premiers écarts de chaque programme.
  for (const numero of Object.keys(bilan.parProgramme)) {
    const resultat = bilan.parProgramme[numero];
    if (resultat.ecarts === 0) {
      continue;
    }
    zone.appendChild(element("h3", numero + " — " + PROGRAMMES_CONTROLES[numero] + " : premiers écarts"));
    const detail = element("table");
    const titres = element("tr");
    for (const titre of ["Ménage", "Année", "Poste", "Attendu", "Obtenu"]) {
      titres.appendChild(element("th", titre));
    }
    detail.appendChild(titres);
    for (const ecart of resultat.exemples) {
      const ligne = element("tr");
      ligne.appendChild(element("td", ecart.cas + " — " + ecart.description));
      ligne.appendChild(element("td", ecart.annee));
      ligne.appendChild(element("td", ecart.libelle));
      ligne.appendChild(element("td", enDollars(ecart.attendu)));
      ligne.appendChild(element("td", enDollars(ecart.obtenu)));
      detail.appendChild(ligne);
    }
    zone.appendChild(detail);
  }
}

if (typeof document !== "undefined") {
  window.addEventListener("load", afficherControle);
}
