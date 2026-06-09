# Revenu disponible — Québec (2025 · 2026)

**Moteur de calcul vérifié et application web pédagogique** autour du **revenu disponible** d'un ménage québécois : ce qu'il lui reste une fois additionnés ses revenus et ses transferts, puis retranchés ses cotisations sociales et ses impôts. L'outil en montre la **ventilation poste par poste**, pour les années **2025 et 2026**, et la rend **explorable et explicable**.

**▶ En ligne : https://revenu-disponible.vercel.app/**

![Le calculateur : formulaire du ménage (gauche), ventilation poste par poste 2025 vs 2026 (centre) et panneau d'explication (droite)](docs/calculateur.png)

Le projet réunit deux briques :

- **Un moteur** en **TypeScript strict, sans dépendance externe**, qui calcule avec précision la vingtaine de postes socio-fiscaux composant le revenu disponible : cotisations (RRQ, RQAP, assurance-emploi, FSS, assurance médicaments), transferts du Québec (allocation famille, crédit pour la solidarité, prime au travail, frais de garde…), impôt du Québec, transferts fédéraux (Allocation canadienne pour enfants, crédit pour la TPS/TVH, Allocation canadienne pour les travailleurs…), impôt fédéral, et coût des frais de garde.
- **Une application web** bilingue (français / anglais) qui rend ces calculs lisibles, comparables et pédagogiques.

## À qui s'adresse ce projet

**Étudiant·e en fiscalité** — voir concrètement comment s'emboîtent impôts, cotisations et transferts pour un ménage donné ; comprendre les **taux marginaux implicites** et les **trappes à la pauvreté** ; tester « et si ? » en modifiant les paramètres comme l'annonce d'un budget. Chaque poste s'accompagne de sa **règle de calcul**, de ses **références légales** et d'un **lien vers la source officielle**.

**Firme de conseil en intelligence artificielle** — un cas concret de **domaine réglementaire modélisé proprement** : moteur entièrement typé, **vérifié par parité** (suite de centaines d'assertions), **paramétrable**, et donc une **surface d'outils fiable pour une couche d'IA** (*function calling* sur des calculs déterministes plutôt que sur des approximations). Architecture moderne, calcul côté client, déploiement continu. C'est le socle sur lequel se greffe la suite — voir *Feuille de route*.

## Fonctionnalités actuelles

- **Calcul du revenu disponible** pour 5 situations de ménage (personne seule, famille monoparentale, couple, retraité seul, couple de retraités), selon les revenus de travail et de retraite, l'âge, et les enfants (âge, frais de garde, service subventionné ou non).
- **Comparaison 2025 vs 2026**, poste par poste, avec sous-totaux et écarts.
- **Panneau d'explication** par poste : description, objectif, règle de calcul, références, lien vers la source officielle.
- **Taux marginaux implicites** : un graphique montre, à chaque niveau de revenu, la part d'un dollar de travail supplémentaire qui n'aboutit *pas* au revenu disponible, avec repérage des **trappes à la pauvreté** (taux > 80 %).
- **Comparer deux ménages** (à politique constante) ou **deux jeux de paramètres** sur un même ménage (simuler un changement de politique — un « mini-budget »).
- **Bibliothèque** : enregistrer des **ménages types** et des **jeux de paramètres** réutilisables.
- **Partage par URL**, **export CSV / PDF**, **comptes** (courriel ou Google) et **sauvegarde de scénarios**.
- **Interface** : espace de travail à volets redimensionnables, mode clair / sombre, bilingue.

## Architecture

| Couche | Choix |
| --- | --- |
| Moteur | TypeScript strict, **aucune dépendance externe**, ~20 postes + orchestrateur (`calculerRevenuDisponible`) |
| Paramétrage | Les fonctions acceptent une **année** (jeu officiel) **ou un bundle de paramètres** sur mesure → modélisation de changements de politique |
| Tests | **Vitest** — vérification par parité (reproduction des maximums et points de contrôle officiels) |
| Web | **Next.js 16** (App Router), **Tailwind 4**, **shadcn/ui**, react-resizable-panels, Recharts |
| Comptes | **Better Auth** + **Prisma 7** + **PostgreSQL** (Neon) |
| Déploiement | **Vercel**, en continu |

Le **calcul reste 100 % côté client** ; le serveur ne sert qu'aux comptes et à la sauvegarde de scénarios.

## Méthode et validation

Le projet suit une règle stricte : **rien n'est posé « de mémoire ».**

- Chaque paramètre est **confronté à la source officielle** (Revenu Québec, Agence du revenu du Canada, Retraite Québec, Service Canada) et **rattaché à sa disposition légale**.
- **Les calculs ont été validés par parité avec le calculateur du revenu disponible du ministère des Finances du Québec** : la suite de tests reproduit les maximums et points de contrôle officiels, au cent près.
- Tout élément non confirmé reste explicitement marqué à vérifier ; la suite de tests n'est jamais affaiblie pour la « faire passer ».

## Feuille de route

**Couche d'intelligence artificielle** — le prochain grand chantier, et le plus naturel vu le socle déterministe :

- **Assistant (Claude)** : poser des questions sur le modèle (« pourquoi mon taux marginal grimpe-t-il vers 13 000 $ ? »), **faire expliquer un résultat** en langage clair, et **générer des scénarios** à partir d'une description (« un couple, deux enfants, 60 000 $ et 40 000 $ ») via des **appels d'outils** branchés sur le moteur et la bibliothèque.
- **Rapport narratif** : export PDF enrichi d'une analyse rédigée.

**Pédagogie et exploration** — modes débutant / expert, description des paramètres à l'édition, activation / désactivation d'un poste, détail d'un calcul « reproductible à la calculatrice », taux marginaux par tranche fine.

**Diffusion et confort** — page « À propos » et note méthodologique, aperçus de partage (Open Graph), historique de session, finition mobile.

**Couverture** — extensions au-delà du modèle de base.

## Développement

```bash
npm install
npm run dev        # http://localhost:3100
npm test           # Vitest — vérification par parité
npm run typecheck  # tsc --noEmit
npm run build
```

## Avertissement

Prototype **pédagogique** : les valeurs sont **indicatives** et **ne constituent pas un avis fiscal**. Les démonstrations n'utilisent que des **données fictives**.

---

© 2026 Alain Boisvert
