# Revenu disponible (MFQ) — reconstruction épurée

Reconstruction **lisible, vérifiée et testée** du calculateur « Le revenu disponible » du
ministère des Finances du Québec, à partir du fichier minifié `revenu-disponible_dec2025.js`
(dé-minifié dans `reference/`).

Méthode complète, paramètres et avancement : **`docs/revenu-disponible.md`**.

## Principe

Un poste fiscal à la fois. Pour chaque poste :

1. **Tracer** la sortie dans le code (ancrage sur les *noms* de cellules, pas les numéros de ligne).
2. **Extraire** les paramètres (colonne `M` = 2025, colonne `L` = 2026).
3. **Confronter** chaque valeur à la source officielle (Revenu Québec / ARC / Service Canada /
   MFQ / BSIF) ; citer la disposition de loi.
4. **Vérifier numériquement** (reproduire les maximums officiels) → un **test**.
5. **Écrire** l'algorithme épuré en TypeScript.
6. Marquer `⚠️ à vérifier` toute valeur non confirmée. Ne rien présumer.

## Structure

```
src/
  socle.ts              Types communs, situations, helpers (impotProgressif, credit)
  postes/
    01-rrq.ts           RRQ            (CA_rrq)
    02-rqap.ts          RQAP           (QC_rqap)
    03-ae.ts            Assurance-emploi (CA_ae)
    04-fss.ts           FSS particuliers (QC_fss)
  impot/
    parametres.ts       Paliers d'impôt QC/féd. (paramètres vérifiés ; assemblage = poste 19)
  index.ts              Ré-exports
tests/
  maximums.test.ts      Assertions reproduisant les maximums/points de contrôle officiels
docs/
  revenu-disponible.md  Méthode, sources, avancement, algorithmes commentés
reference/
  revenu-disponible_dec2025_beautified.js   Source dé-minifiée (lecture/traçage)
  revenu-disponible_dec2025.js              Source minifiée d'origine
```

## Commandes

```bash
npm install        # une fois
npm test           # exécute la suite de tests (vitest)
npm run typecheck  # vérification de types (tsc --noEmit)
```

## État d'avancement

Cotisations **1 → 4 faites** (RRQ, RQAP, AE, FSS). **Prochain : poste 5 — RAMQ** (`QC_ramq`).
Voir le tableau complet dans `docs/revenu-disponible.md §5`.

## Convention clé

Le fichier compare **2025** (colonne `M`, suffixe `_old`, colonne de calcul `T`) à
**2026** (colonne `L`, suffixe `_new`, colonne de calcul `S`). Les cotisations sont stockées
en **négatif** dans le code (elles réduisent le revenu disponible) ; les fonctions ici les
renvoient en **positif**.
