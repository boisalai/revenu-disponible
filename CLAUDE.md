<!-- Maintainer : garder ce fichier court (< 200 lignes). La connaissance détaillée vit dans
docs/revenu-disponible.md ; ne PAS l'importer ici via @ (un import se charge en entier à chaque
session). Ce bloc de commentaire est retiré du contexte avant injection : coût nul. -->

# CLAUDE.md — Reconstruction « Revenu disponible » (MFQ)

Reconstruction **lisible, vérifiée et testée** du calculateur du ministère des Finances du Québec,
à partir du fichier minifié (dé-minifié dans `reference/`). **Un poste fiscal à la fois.**

## Au début de chaque session
1. Lis `docs/revenu-disponible.md` — la référence : méthode, sources, **§5 tableau d'avancement**, algorithmes commentés.
2. Identifie le **prochain poste non terminé** dans §5 (et le pointeur en fin de fichier, §6).
3. Lance `npm test` pour confirmer l'état de départ (doit être vert).

## Méthode pour chaque poste
1. **Tracer** la sortie dans `calc(data)` de `reference/revenu-disponible_dec2025_beautified.js`, ancré sur les **noms de cellules** (jamais les numéros de ligne, instables). Remonte la chaîne `data['X'] = cY = …` au `grep`.
2. **Extraire** les paramètres : colonne **`M` = 2025**, colonne **`L` = 2026**.
3. **Confronter CHAQUE valeur** à la source officielle (Revenu Québec, ARC, Service Canada, Retraite Québec, MFQ, BSIF) et **citer la disposition de loi**.
4. **Vérifier numériquement** : reproduire les maximums / points de contrôle officiels, puis **ajouter des assertions** dans `tests/maximums.test.ts`.
5. **Écrire l'algorithme épuré** dans `src/postes/NN-nom.ts`, cohérent avec le socle ; **ré-exporter** depuis `src/index.ts`.
6. Marquer **`⚠️ à vérifier`** toute valeur non confirmée.
7. **Mettre à jour `docs/revenu-disponible.md`** : tableau des sources (§2), tableau d'avancement (§5), nouvelle section du poste, pointeur du **prochain poste** (§6).
8. Lancer `npm test` **et** `npm run typecheck` avant de conclure — les deux doivent passer.

## Conventions du code source (fichier MFQ)
- Comparaison **2025** (col. `M`, suffixe sortie `_old`, cellules de calcul col. **`T`**) vs **2026** (col. `L`, `_new`, col. **`S`**).
- Les cotisations sont stockées en **négatif** (elles réduisent le revenu disponible) → les fonctions TS les renvoient en **positif**.
- Table des situations (rangées B5:G9) : col. C = `nbAdultes`, col. G = `retraité` ; le drapeau `c2G11 == 1` ⟺ ménage retraité.
- `reference/` est en **lecture seule** (traçage uniquement). Ne jamais l'éditer, ni exécuter le `.js`.

## Conventions du code TypeScript
- `Annee = 2025 | 2026`. Paramètres par année dans un `Record<Annee, …>` exporté (ex. `RRQ`, `AE`, `FSS`).
- Calcul **par adulte**, puis somme sur le ménage via le helper `revenusAdultes(menage)` du socle.
- Réutiliser `src/socle.ts` (types, `Situation`, `SITUATIONS`, `impotProgressif`, `credit`). **Aucune dépendance externe** dans `src/`.
- En-tête de chaque fichier de poste : sortie(s) du code, base légale, sources (`Sn`) — comme les postes 01 à 04.

## Règles absolues (non négociables)
- **Ne rien présumer.** Aucune valeur ni comportement « de mémoire » : seulement ce qui est **tracé dans le code** *et* **vérifié dans une source officielle**.
- Pour le **texte de loi** : partir de l'**URL officielle précise** (`laws-lois.justice.gc.ca`, `canlii.org`, `legisquebec.gouv.qc.ca`) et citer **verbatim**. `WebFetch` *résume* le contenu — viser la source exacte plutôt qu'une recherche large.
- Tout élément non confirmé reste marqué **`⚠️ à vérifier`** ; ne jamais « combler » par une estimation.
- Ne jamais affaiblir la suite de tests pour la faire passer : un test rouge = un écart réel avec la source officielle, à investiguer.

## Style de réponse
- **Français**, bref, précis, pédagogique, en **markdown**.
- Montrer le **traçage** (chaîne de cellules) et la **confrontation aux sources** (tableau) quand c'est utile.

## Commandes
```bash
npm test            # vitest — doit rester vert
npm run typecheck   # tsc --noEmit
```

## État
**Reconstruction complète : postes 1 → 20 + orchestrateur, tous vérifiés par parité.** `calculerRevenuDisponible(menage, annee)` (poste 20) enchaîne tous les postes depuis les entrées brutes, reconstruit les bases de revenu internes (revenu net familial QC + AFNI fédéral + revenu AL) et reproduit `RD` à la cent. L'orchestrateur expose aussi le **détail par poste** (`detail`), vérifié par parité.

**Application Web.** Stack : Next.js 16 (App Router, **webpack** — `dev`/`build` avec `--webpack`), TypeScript strict, Tailwind 4, shadcn/ui sur Radix. Moteur dans `src/postes…` ; app dans `src/app` + `src/components` (`calculateur.tsx`) + `src/lib`, alias `@/* → src/*`. Calcul **100 % client** (aucune DB/auth/tRPC). `npm run dev` (port 3000, ou autre si occupé par le site Docusaurus de l'utilisateur).
- ✅ **Phase 1 (MVP)** : formulaire (5 situations, âges, revenus, enfants) + tableau **2025 vs 2026** ventilé par poste avec sous-totaux et écart.
- ✅ **Phase 2 (pédagogie, bilingue FR/EN)** : i18n léger (`src/lib/i18n.ts`), registre par poste (`src/lib/postes-info.ts` — nom, description, objectif, règle, références en FR+EN), sélecteur de langue, panneaux `Dialog` « En savoir plus » par poste.
- ✅ **Phase 3 (taux marginaux implicites)** : `src/lib/taux-marginal.ts` (TMI = `1 − dRD/dr` par différences finies sur le revenu, décomposé par catégorie) + graphique d'aires empilées Recharts via shadcn (`src/components/graphique-taux-marginal.tsx`), avec courbe cumulative et repère au revenu actuel.
- ✅ **Phase 4a (moteur paramétrable)** : `src/parametres.ts` — type `Parametres` (tous les postes) + `PARAMETRES_OFFICIELS`. Les fonctions acceptent `Annee | Parametres` (numéro ⇒ officiel ; bundle ⇒ sur mesure). Permet de modéliser des changements de paramètres (budget).
- ✅ **Phase 4b (comparaison)** : route `/comparaison` — deux scénarios (ménage + année) côte à côte, écart par poste. Composants réutilisables extraits (`formulaire-menage.tsx`, `tableau-resultats.tsx`, `menage-etat.ts`).
- ✅ **Phase 4c (éditeur de paramètres)** : route `/budget` — comparer **deux jeux de paramètres** (scénarios A et B, onglets) sur un **même ménage** ; chaque scénario a son année de base et ses modifications (montants, taux, seuils, **paliers**), écart par poste. Par défaut A = officiel 2025, B = officiel 2026. `editeur-parametres.tsx` (Accordion générique sur le bundle), `parametres-meta.ts` (libellés). Bundle modifiable = `structuredClone(PARAMETRES_OFFICIELS[base])`. *(`/comparaison` = comparer des **ménages** ; `/budget` = comparer des **paramètres**.)*
- ✅ **Partage par URL** : `src/lib/partage.ts` (encode l'état dans `?s=`, base64url ; pour les paramètres on n'encode que les **écarts** vs officiel → URL courte), `use-partage-url.ts` (hook : charge au montant, synchronise ensuite), `bouton-partage.tsx` (« Copier le lien »). Sur les 3 pages.
- ✅ **Déployé sur Vercel** : **https://revenu-disponible.vercel.app/**, déploiement continu à chaque fusion dans `main`.
- Prochaines phases : **comptes/sauvegarde** de scénarios (Better Auth + Prisma + Postgres/Neon ; variables d'env. à ajouter dans Vercel → Settings) ; extensions hors-MFQ ; couche IA. *(Note : libellés de champs de l'éditeur « humanisés » depuis les noms français des paramètres — pas encore traduits par champ.)*

**Toujours lancer `npm test` + `npm run typecheck` ; le build se vérifie avec `npm run build`.**
