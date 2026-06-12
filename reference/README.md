# Référence — calculateur officiel du MFQ (non redistribué)

Ce répertoire accueille le **calculateur « Revenu disponible » du ministère des
Finances du Québec** (édition de décembre 2025), contre lequel toute la
reconstruction de ce dépôt est vérifiée **au cent près** (692 tests de parité).

**Les fichiers `.js` ne sont pas inclus dans le dépôt.** Ce code appartient à
l'État québécois (art. 12, Loi sur le droit d'auteur) et les conditions
d'utilisation des sites du gouvernement du Québec n'en permettent pas la
redistribution sans autorisation (voir [quebec.ca/droit-auteur](https://www.quebec.ca/droit-auteur)).
Chaque personne en fait donc **sa propre copie, pour sa propre étude**,
directement à la source officielle :

```bash
node scripts/telecharger-reference.mjs
```

Le script télécharge l'édition de décembre 2025 depuis
[finances.gouv.qc.ca](https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp),
vérifie son intégrité (SHA-256 épinglé), puis produit la copie dé-minifiée
qu'exécutent les tests (`js-beautify` 1.15.4, indentation 2 — formatage
également vérifié par somme de contrôle, car le chargeur des tests s'ancre sur
le texte exact).

Sans ces fichiers, `npm test` **saute** les tests de parité (le reste de la
suite tourne normalement). Avec eux, la suite complète vérifie la parité.

| Fichier (local seulement) | Rôle | SHA-256 |
| --- | --- | --- |
| `revenu-disponible_dec2025.js` | original minifié, tel que servi par le MFQ | `bdd31cc0bfa3e328…` |
| `revenu-disponible_dec2025_beautified.js` | copie dé-minifiée (lisible), exécutée par les tests | `1c285836a402e96a…` |

Si le script signale une **somme de contrôle différente**, le ministère a
publié une nouvelle édition : la parité de ce dépôt vaut pour décembre 2025 et
doit être retracée poste par poste avant d'adopter la nouvelle édition.

Ce répertoire est en **lecture seule** pour le projet : on y trace les calculs
(noms de cellules), on n'y modifie rien.
