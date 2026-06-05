// i18n léger : chaînes d'interface bilingues (fr/en). Accès : UI.cle[lang].
// (Le contenu pédagogique par poste est dans postes-info.ts.)

export type Lang = "fr" | "en";
export interface Bilingue {
  fr: string;
  en: string;
}

export const UI = {
  titre: { fr: "Revenu disponible des ménages — Québec", en: "Household Disposable Income — Quebec" },
  sousTitre: {
    fr: "Estimez le revenu disponible d'un ménage québécois et sa ventilation par poste, pour 2025 et 2026. Reconstruction vérifiée du calculateur du ministère des Finances du Québec.",
    en: "Estimate the disposable income of a Quebec household and its breakdown by item, for 2025 and 2026. A verified reconstruction of the Quebec Ministry of Finance calculator.",
  },

  // Formulaire
  situationMenage: { fr: "Situation du ménage", en: "Household situation" },
  typeMenage: { fr: "Type de ménage", en: "Household type" },
  revenuTravail: { fr: "Revenu de travail", en: "Employment income" },
  revenuRetraite: { fr: "Revenu de retraite", en: "Retirement income" },
  revenuTravailConjoint: { fr: "Revenu de travail (conjoint)", en: "Employment income (spouse)" },
  revenuRetraiteConjoint: { fr: "Revenu de retraite (conjoint)", en: "Retirement income (spouse)" },
  age: { fr: "Âge", en: "Age" },
  ageConjoint: { fr: "Âge (conjoint)", en: "Age (spouse)" },
  nbEnfants: { fr: "Nombre d'enfants", en: "Number of children" },
  ageEnfant: { fr: "Âge enf.", en: "Child age" },
  disclaimer: {
    fr: "Outil pédagogique — valeurs indicatives reproduisant le modèle du ministère des Finances du Québec. Ne constitue pas un avis fiscal.",
    en: "Educational tool — indicative values reproducing the Quebec Ministry of Finance model. Does not constitute tax advice.",
  },

  // Libellés des situations (alignés sur l'enum Situation : 0..4)
  situations: [
    { fr: "Personne vivant seule", en: "Single person" },
    { fr: "Famille monoparentale", en: "Single-parent family" },
    { fr: "Couple", en: "Couple" },
    { fr: "Retraité vivant seul", en: "Single retiree" },
    { fr: "Couple de retraités", en: "Retired couple" },
  ] as Bilingue[],

  // Résultats
  revenuDisponible: { fr: "Revenu disponible", en: "Disposable income" },
  poste: { fr: "Poste", en: "Item" },
  ecart: { fr: "Écart", en: "Change" },
  revenu: { fr: "Revenu de travail et de retraite", en: "Employment and retirement income" },
  cotisations: { fr: "Cotisations", en: "Contributions" },
  transfertsQC: { fr: "Transferts — Québec", en: "Transfers — Quebec" },
  impotQC: { fr: "Impôt du Québec", en: "Quebec income tax" },
  transfertsFederaux: { fr: "Transferts — fédéral", en: "Transfers — federal" },
  impotFederal: { fr: "Impôt fédéral", en: "Federal income tax" },
  totalCotisations: { fr: "Total des cotisations", en: "Total contributions" },
  totalTransfertsQC: { fr: "Total des transferts du Québec", en: "Total Quebec transfers" },
  totalTransfertsFederaux: { fr: "Total des transferts fédéraux", en: "Total federal transfers" },

  // Pédagogie
  enSavoirPlus: { fr: "En savoir plus", en: "Learn more" },
  description: { fr: "Description", en: "Description" },
  objectif: { fr: "Objectif", en: "Purpose" },
  regleCalcul: { fr: "Règle de calcul", en: "Calculation rule" },
  references: { fr: "Références", en: "References" },

  // Taux marginaux
  tauxMarginalTitre: { fr: "Taux marginal implicite de taxation", en: "Effective marginal tax rate" },
  tauxMarginalDesc: {
    fr: "Part d'un dollar de revenu de travail supplémentaire qui n'aboutit pas au revenu disponible (impôts et cotisations en plus, transferts récupérés). Calculé en faisant varier le revenu de travail, pour la situation choisie.",
    en: "Share of an additional dollar of employment income that does not reach disposable income (added taxes and contributions, clawed-back transfers). Computed by varying employment income, for the selected situation.",
  },
  tauxAxe: { fr: "Taux marginal", en: "Marginal rate" },
  tauxTotal: { fr: "Taux marginal total", en: "Total marginal rate" },
  revenuActuel: { fr: "Revenu actuel", en: "Current income" },

  // Navigation et comparaison
  navCalculateur: { fr: "Calculateur", en: "Calculator" },
  navComparaison: { fr: "Comparer des ménages", en: "Compare households" },
  comparaisonTitre: { fr: "Comparer deux ménages", en: "Compare two households" },
  comparaisonDesc: {
    fr: "Mettez deux ménages (ou deux années) côte à côte et voyez l'écart de revenu disponible, poste par poste.",
    en: "Place two households (or two years) side by side and see the difference in disposable income, item by item.",
  },
  scenarioA: { fr: "Scénario A", en: "Scenario A" },
  scenarioB: { fr: "Scénario B", en: "Scenario B" },
  annee: { fr: "Année", en: "Year" },

  // Comparaison de paramètres (budget)
  navBudget: { fr: "Comparer des paramètres", en: "Compare parameters" },
  budgetTitre: { fr: "Comparer deux jeux de paramètres", en: "Compare two parameter sets" },
  budgetDesc: {
    fr: "Sur un même ménage, comparez deux ensembles de paramètres socio-fiscaux (impôts, cotisations, transferts). Partez d'une année officielle de chaque côté, modifiez ce que vous voulez (montants, taux, seuils, paliers) et voyez l'écart de revenu disponible, poste par poste — comme l'annonce d'un budget.",
    en: "For the same household, compare two sets of socio-fiscal parameters (taxes, contributions, transfers). Start from an official year on each side, change anything you like (amounts, rates, thresholds, brackets) and see the difference in disposable income, item by item — like a budget announcement.",
  },
  anneeBase: { fr: "Année de base", en: "Base year" },
  parametres: { fr: "Paramètres", en: "Parameters" },
  officiel: { fr: "Officiel", en: "Official" },
  modifie: { fr: "Modifié", en: "Modified" },
  reinitialiser: { fr: "Réinitialiser", en: "Reset" },

  // Partage par URL
  copierLien: { fr: "Copier le lien", en: "Copy link" },
  lienCopie: { fr: "Lien copié", en: "Link copied" },

  // Comptes et scénarios sauvegardés
  seConnecter: { fr: "Se connecter", en: "Sign in" },
  seDeconnecter: { fr: "Se déconnecter", en: "Sign out" },
  connexion: { fr: "Connexion", en: "Sign in" },
  inscription: { fr: "Inscription", en: "Sign up" },
  champNom: { fr: "Nom", en: "Name" },
  champCourriel: { fr: "Courriel", en: "Email" },
  champMotDePasse: { fr: "Mot de passe", en: "Password" },
  continuerGoogle: { fr: "Continuer avec Google", en: "Continue with Google" },
  ou: { fr: "ou", en: "or" },
  erreurAuth: { fr: "Courriel ou mot de passe invalide.", en: "Invalid email or password." },
  erreurGenerique: { fr: "Une erreur est survenue.", en: "Something went wrong." },
  annuler: { fr: "Annuler", en: "Cancel" },
  chargement: { fr: "Chargement…", en: "Loading…" },

  mesScenarios: { fr: "Mes scénarios", en: "My scenarios" },
  enregistrer: { fr: "Enregistrer", en: "Save" },
  enregistrerScenarioTitre: { fr: "Enregistrer le scénario", en: "Save scenario" },
  nomScenario: { fr: "Nom du scénario", en: "Scenario name" },
  scenarioEnregistre: { fr: "Scénario enregistré.", en: "Scenario saved." },
  connexionRequiseSauvegarde: {
    fr: "Connecte-toi pour enregistrer et retrouver tes scénarios.",
    en: "Sign in to save and reopen your scenarios.",
  },
  ouvrir: { fr: "Ouvrir", en: "Open" },
  supprimer: { fr: "Supprimer", en: "Delete" },
  aucunScenario: { fr: "Aucun scénario enregistré pour l'instant.", en: "No saved scenarios yet." },
  typeCalculateur: { fr: "Calculateur", en: "Calculator" },
  typeComparaison: { fr: "Comparaison", en: "Comparison" },
  typeBudget: { fr: "Budget", en: "Budget" },

  // Bibliothèque (ménages types + jeux de paramètres)
  navBibliotheque: { fr: "Bibliothèque", en: "Library" },
  bibliothequeTitre: { fr: "Ma bibliothèque", en: "My library" },
  bibliothequeDesc: {
    fr: "Crée et gère des ménages types et des jeux de paramètres réutilisables, puis combine-les dans les comparaisons.",
    en: "Create and manage reusable household templates and parameter sets, then combine them in the comparisons.",
  },
  mesMenages: { fr: "Mes ménages types", en: "My household templates" },
  mesJeux: { fr: "Mes jeux de paramètres", en: "My parameter sets" },
  nouveauMenage: { fr: "Nouveau ménage type", en: "New household template" },
  nouveauJeu: { fr: "Nouveau jeu de paramètres", en: "New parameter set" },
  modifierMenageTitre: { fr: "Modifier le ménage type", en: "Edit household template" },
  modifierJeuTitre: { fr: "Modifier le jeu de paramètres", en: "Edit parameter set" },
  nomMenage: { fr: "Nom du ménage type", en: "Household template name" },
  nomJeu: { fr: "Nom du jeu de paramètres", en: "Parameter set name" },
  aucunMenage: { fr: "Aucun ménage type enregistré.", en: "No saved household templates." },
  aucunJeu: { fr: "Aucun jeu de paramètres enregistré.", en: "No saved parameter sets." },
  modifier: { fr: "Modifier", en: "Edit" },
  connexionRequiseBibliotheque: {
    fr: "Connecte-toi pour créer et gérer ta bibliothèque.",
    en: "Sign in to create and manage your library.",
  },
  uneModif: { fr: "modification", en: "change" },
  desModifs: { fr: "modifications", en: "changes" },

  // Sélecteurs (budget / comparaison)
  selectMenage: { fr: "Ménage", en: "Household" },
  selectJeu: { fr: "Jeu de paramètres", en: "Parameter set" },
  menagePersonnalise: { fr: "Ménage personnalisé", en: "Custom household" },
  enregistrerCeMenage: { fr: "Enregistrer ce ménage", en: "Save this household" },
  enregistrerCeJeu: { fr: "Enregistrer ce jeu", en: "Save this set" },
} as const;
