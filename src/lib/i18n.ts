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
    fr: "Estimez le revenu disponible d'un ménage québécois et sa ventilation par poste, pour 2025 et 2026. Chaque poste est expliqué, vérifié et rattaché à sa source officielle.",
    en: "Estimate the disposable income of a Quebec household and its breakdown by item, for 2025 and 2026. Each item is explained, verified and linked to its official source.",
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
    fr: "Outil pédagogique — valeurs indicatives. Ne constitue pas un avis fiscal.",
    en: "Educational tool — indicative values. Does not constitute tax advice.",
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
  transfertsFederaux: { fr: "Transferts — Fédéral", en: "Transfers — Federal" },
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
  parametresTitre: { fr: "Paramètres", en: "Parameters" },
  parametre: { fr: "Paramètre", en: "Parameter" },

  // Taux marginaux
  tauxMarginalTitre: { fr: "Taux effectif marginal d'imposition (TEMI)", en: "Effective marginal tax rate (EMTR)" },
  tauxMarginalDesc: {
    fr: "Part d'un dollar de revenu de travail supplémentaire qui n'aboutit pas au revenu disponible (impôts et cotisations en plus, transferts récupérés). Calculé en faisant varier le revenu de travail, pour la situation choisie.",
    en: "Share of an additional dollar of employment income that does not reach disposable income (added taxes and contributions, clawed-back transfers). Computed by varying employment income, for the selected situation.",
  },
  tauxAxe: { fr: "Taux marginal", en: "Marginal rate" },
  tauxTotal: { fr: "TEMI total", en: "Total EMTR" },
  revenuActuel: { fr: "Revenu actuel", en: "Current income" },
  decompositionTitre: { fr: "Décomposition au revenu actuel", en: "Breakdown at current income" },

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

  // Frais de garde par enfant
  enfant: { fr: "Enfant", en: "Child" },
  fraisGarde: { fr: "Frais de garde", en: "Childcare fees" },
  serviceGarde: { fr: "Service de garde", en: "Childcare service" },
  subventionne: { fr: "Subventionné", en: "Subsidized" },
  nonSubventionne: { fr: "Non subventionné", en: "Non-subsidized" },

  // Trappes à la pauvreté (graphique de taux marginal)
  trappePauvrete: { fr: "Trappe à la pauvreté", en: "Poverty trap" },
  trappeSeuil: { fr: "Seuil de trappe (> 60 %)", en: "Trap threshold (> 60%)" },
  trappeNote: {
    fr: "zones rouges où le TEMI dépasse 60 % — un dollar de revenu de travail supplémentaire y rapporte moins de 0,40 $ de revenu disponible.",
    en: "red zones where the EMTR exceeds 60% — an extra dollar of employment income yields less than $0.40 of disposable income.",
  },
  axeRevenu: { fr: "Revenu de travail (brut)", en: "Gross employment income" },
  baremeSeul: { fr: "Barème d'imposition seul", en: "Tax tables only" },
  zone100Note: {
    fr: "zones foncées où le TEMI dépasse 100 % : un revenu supplémentaire y réduit le revenu disponible.",
    en: "darker zones where the EMTR exceeds 100%: extra income there reduces disposable income.",
  },
  ferrNote: {
    fr: "Ménage retraité : cette courbe se lit aussi comme le coût marginal d'un retrait FERR (ou d'un revenu de pension) supplémentaire.",
    en: "Retired household: this curve also reads as the marginal cost of an additional RRIF withdrawal (or extra pension income).",
  },

  // Export
  exportCsv: { fr: "Exporter en CSV", en: "Export to CSV" },
  exportPdf: { fr: "Exporter en PDF", en: "Export to PDF" },

  // Panneau d'information
  fermer: { fr: "Fermer", en: "Close" },
  panneauTitre: { fr: "Détail du poste", en: "Line details" },
  panneauVide: {
    fr: "Sélectionnez l'icône ⓘ d'un poste pour afficher ici son explication, sa règle de calcul et sa source officielle.",
    en: "Select a line's ⓘ icon to show its explanation, calculation rule and official source here.",
  },
  piedPage: {
    fr: "Revenu disponible des ménages québécois (2025-2026) — calculs vérifiés, chaque poste expliqué et rattaché à sa source officielle. Moteur en TypeScript, interface Next.js · Tailwind · shadcn/ui. Outil pédagogique — ne constitue pas un avis fiscal.",
    en: "Disposable income of Quebec households (2025-2026) — verified calculations, each item explained and linked to its official source. TypeScript engine, Next.js · Tailwind · shadcn/ui interface. Educational tool — not tax advice.",
  },
  codeSource: { fr: "Code source", en: "Source code" },
  guidePdf: { fr: "Guide (PDF)", en: "Guide (PDF, French)" },
  voletMenagesCompares: { fr: "Ménages comparés", en: "Compared households" },
  voletMenageParametres: { fr: "Ménage et paramètres", en: "Household & parameters" },
  nouveau: { fr: "Nouveau", en: "New" },
  aide: { fr: "Aide", en: "Help" },

  // Assistant IA
  assistant: { fr: "Assistant", en: "Assistant" },
  assistantTitre: { fr: "Assistant IA", en: "AI assistant" },
  assistantIntro: { fr: "Posez une question sur le scénario affiché, ou choisissez :", en: "Ask about the displayed scenario, or pick:" },
  assistantQ1: { fr: "Explique-moi ce résultat.", en: "Explain this result to me." },
  assistantQ2: { fr: "Pourquoi mon taux marginal varie-t-il autant ?", en: "Why does my marginal rate vary so much?" },
  assistantPlaceholder: { fr: "Votre question…", en: "Your question…" },
  assistantEnvoyer: { fr: "Envoyer", en: "Send" },
  assistantReflechit: { fr: "L'assistant réfléchit…", en: "Thinking…" },
  assistantErreur: { fr: "Assistant indisponible. Réessaie plus tard.", en: "Assistant unavailable. Please try again later." },
  assistantAvertissement: {
    fr: "Réponses générées par IA, fondées sur le moteur de calcul — à vérifier. Ne constitue pas un avis fiscal.",
    en: "AI-generated answers, grounded in the calculation engine — please verify. Not tax advice.",
  },
  assistantConnexion: { fr: "Connecte-toi pour utiliser l'assistant.", en: "Sign in to use the assistant." },
  detailVolet: { fr: "Détail", en: "Details" },
  assistantCleIntro: {
    fr: "Entre ta clé API Anthropic pour utiliser l'assistant. Tu n'es facturé que pour ton propre usage.",
    en: "Enter your Anthropic API key to use the assistant. You are billed only for your own usage.",
  },
  assistantCleLien: { fr: "Obtenir une clé sur console.anthropic.com", en: "Get a key at console.anthropic.com" },
  assistantCleNote: {
    fr: "Ta clé est conservée uniquement dans ce navigateur et utilisée seulement pour tes requêtes ; elle n'est jamais stockée sur le serveur.",
    en: "Your key is kept only in this browser and used only for your requests; it is never stored on the server.",
  },
  assistantChangerCle: { fr: "Changer la clé", en: "Change key" },
  demoBandeau: {
    fr: "Mode démo — modèle Haiku, 5 questions par jour. Entrez votre clé API pour tout débloquer.",
    en: "Demo mode — Haiku model, 5 questions per day. Enter your API key to unlock everything.",
  },
  demoUtiliserCle: { fr: "Utiliser ma clé API", en: "Use my API key" },
  demoEssayer: { fr: "← Essayer la démo sans clé", en: "← Try the demo without a key" },
  demoToursEpuises: {
    fr: "Limite de la conversation démo atteinte — entrez votre clé API pour continuer.",
    en: "Demo conversation limit reached — enter your API key to continue.",
  },
  demoErreur: {
    fr: "Limite de la démo atteinte pour aujourd'hui. Réessayez demain, ou entrez votre clé API.",
    en: "Demo limit reached for today. Try again tomorrow, or enter your API key.",
  },
  modeleLabel: { fr: "Modèle", en: "Model" },
  modeleNote: {
    fr: "Sonnet recommandé. Haiku : plus rapide et économique, mais moins fiable pour les calculs. Opus : plus capable, plus coûteux.",
    en: "Sonnet recommended. Haiku: faster and cheaper, but less reliable for calculations. Opus: more capable, pricier.",
  },

  // Page « À propos »
  aProposLien: { fr: "À propos", en: "About" },
  aProposTitre: { fr: "À propos", en: "About" },
  aProposSousTitre: { fr: "Le projet, la méthode et l'auteur.", en: "The project, the method and the author." },
  aProposProjetTitre: { fr: "Le projet", en: "The project" },
  aProposProjet: {
    fr: "« Revenu disponible » calcule, pour un ménage québécois, ce qu'il lui reste une fois additionnés ses revenus et ses transferts, puis retranchés ses cotisations et ses impôts — avec la ventilation poste par poste, pour 2025 et 2026. C'est à la fois un moteur de calcul vérifié et une application web pédagogique. Autrement dit, il vous montre vos prélèvements et ce qui vous reste réellement dans vos poches.",
    en: "“Disposable income” computes, for a Quebec household, what it keeps once incomes and transfers are added and contributions and taxes subtracted — with the item-by-item breakdown, for 2025 and 2026. It is both a verified calculation engine and a pedagogical web app. In other words, it shows you what is deducted from your income and what really stays in your pocket.",
  },
  aProposAuteurTitre: { fr: "L'auteur", en: "The author" },
  aProposAuteur: {
    fr: "Présentement membre du conseil d'administration de la Chambre des notaires du Québec et étudiant en droit, j'expérimente l'IA appliquée au droit et au notariat en développant des prototypes.",
    en: "Currently a member of the board of directors of the Chambre des notaires du Québec and a law student, I experiment with AI applied to law and the notarial profession by developing prototypes.",
  },
  aProposMethodeTitre: { fr: "Méthodologie", en: "Methodology" },
  aProposMethode: {
    fr: "Tous les chiffres — montants, taux et seuils — viennent de sources officielles : Revenu Québec, l'Agence du revenu du Canada, Retraite Québec et Service Canada. Rien n'est inventé. Les calculs suivent les règles de 2025 et de 2026, appliquées à des ménages types. Pour s'assurer qu'ils sont exacts, nous les avons comparés au calculateur officiel du ministère des Finances du Québec : les résultats correspondent au cent près.",
    en: "Every figure — amounts, rates and thresholds — comes from an official source: Revenu Québec, the Canada Revenue Agency, Retraite Québec and Service Canada. Nothing is made up. The calculations follow the 2025 and 2026 rules, applied to typical households. To make sure they're correct, we compared them with the Quebec Ministry of Finance's own calculator — the results match to the penny.",
  },
  aProposTechTitre: { fr: "Technologie", en: "Technology" },
  aProposTech: {
    fr: "Moteur en TypeScript strict, sans dépendance externe. Interface Next.js, Tailwind et shadcn/ui ; graphiques Recharts ; comptes et sauvegarde via Better Auth, Prisma et PostgreSQL ; déploiement continu sur Vercel.",
    en: "Engine in strict TypeScript, with no external dependency. Next.js, Tailwind and shadcn/ui interface; Recharts charts; accounts and storage via Better Auth, Prisma and PostgreSQL; continuous deployment on Vercel.",
  },
  aProposIATitre: { fr: "Intelligence artificielle", en: "Artificial intelligence" },
  aProposIA: {
    fr: "Tout le code de ce calculateur — moteur, interface, tests — a été écrit par Claude (Anthropic), sous ma direction, en quelques jours : je le guidais, lui fournissais les sources officielles, et chaque calcul a été validé au cent près contre l'outil du ministère des Finances. Un assistant (Claude) est aussi intégré à l'application : il explique les résultats, détaille le calcul de chaque poste et crée des ménages types — toujours ancré sur le moteur vérifié, sans inventer de chiffre. Un mode démo permet de l'essayer sans clé (quelques questions par jour) ; pour un usage complet, chaque personne utilise sa propre clé API, conservée uniquement dans son navigateur et jamais sur le serveur.",
    en: "All of this calculator's code — engine, interface, tests — was written by Claude (Anthropic) under my direction, in a matter of days: I guided it, supplied the official sources, and every calculation was validated to the cent against the Ministry of Finance's tool. An assistant (Claude) is also built into the app: it explains results, details how each item is computed, and creates household templates — always grounded in the verified engine, never inventing a figure. A demo mode lets you try it without a key (a few questions per day); for full use, each person uses their own API key, kept only in their browser and never on the server.",
  },
  aProposAvertTitre: { fr: "Avertissement", en: "Disclaimer" },
  aProposAvert: {
    fr: "Prototype pédagogique : les valeurs sont indicatives et ne constituent pas un avis fiscal. Les démonstrations n'utilisent que des données fictives.",
    en: "Educational prototype: values are indicative and do not constitute tax advice. Demos use only fictitious data.",
  },
  assistantBiblioIntro: {
    fr: "Décris un ménage ou un jeu de paramètres à créer, ou choisis :",
    en: "Describe a household or parameter set to create, or pick:",
  },
  assistantBiblioQ1: {
    fr: "Crée un couple avec 2 enfants, 60 000 $ et 40 000 $.",
    en: "Create a couple with 2 children, $60,000 and $40,000.",
  },
  assistantBiblioQ2: {
    fr: "Crée une famille monoparentale, 1 enfant de 4 ans, 35 000 $.",
    en: "Create a single-parent family, one 4-year-old child, $35,000.",
  },
  bibliothequeAideMenages: {
    fr: "Un ménage type fige une situation (type de ménage, revenus, âges, enfants, frais de garde) que tu réutilises sans la ressaisir.",
    en: "A household template captures a situation (type, incomes, ages, children, childcare) you can reuse without re-entering it.",
  },
  bibliothequeAideJeux: {
    fr: "Un jeu de paramètres regroupe des règles socio-fiscales : une année officielle (2025 ou 2026) plus tes modifications (montants, taux, seuils, paliers).",
    en: "A parameter set bundles socio-fiscal rules: an official year (2025 or 2026) plus your changes (amounts, rates, thresholds, brackets).",
  },
  bibliothequeAideUsage: {
    fr: "Réutilise-les ensuite dans « Comparer des ménages » (1 jeu, 2 ménages) et « Comparer des paramètres » (1 ménage, 2 jeux).",
    en: "Reuse them in “Compare households” (1 set, 2 households) and “Compare parameters” (1 household, 2 sets).",
  },
} as const;
