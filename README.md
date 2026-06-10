# Revenu disponible — Québec (2025 · 2026)

Combien vous reste-t-il **vraiment**, une fois payés vos impôts et vos cotisations, et une fois reçus vos transferts (allocations et crédits) ? Ce calculateur répond à la question pour un **ménage québécois** et vous en montre le **détail, ligne par ligne**, pour **2025 et 2026**.

**▶ Essayez-le : https://revenu-disponible.vercel.app/**

![Le calculateur : la situation du ménage à gauche, le détail poste par poste 2025 vs 2026 au centre, et l'explication d'un poste à droite](docs/calculateur.png)

## En clair

Votre **revenu disponible**, c'est ce qui finit dans vos poches :

> revenus de travail et de retraite **+** transferts (allocations, crédits) **−** cotisations (RRQ, assurance-emploi…) **−** impôts

Le calculateur fait cette addition pour vous, **poste par poste**, et explique chaque montant. Tout repose sur des **cas de ménages types** et des **données fictives** : c'est un outil pour *comprendre*, pas pour remplir votre déclaration.

## À qui ça s'adresse

**Au citoyen curieux** — voir ce qu'il vous reste réellement, et comment ça bouge si votre revenu, votre âge ou votre situation familiale changent. Comprendre pourquoi, à certains revenus, **un dollar de plus ne rapporte presque rien** (les fameuses « trappes »).

**À l'étudiant·e en fiscalité** — voir concrètement comment s'emboîtent impôts, cotisations et transferts. Chaque poste vient avec sa **règle de calcul**, ses **références légales** et un **lien vers la source officielle**, et vous pouvez tester « et si… ? » en modifiant les paramètres, comme l'annonce d'un budget.

## Ce que vous pouvez faire

- **Calculer** le revenu disponible pour 5 situations (personne seule, famille monoparentale, couple, retraité seul, couple de retraités), selon le revenu, l'âge et les enfants.
- **Comparer 2025 et 2026**, poste par poste, avec les écarts.
- **Comprendre chaque poste** : un panneau donne sa description, son objectif, sa règle de calcul, ses **paramètres officiels (2025 / 2026)** et le lien vers la source.
- **Voir le taux effectif marginal d'imposition** : un graphique montre, à chaque niveau de revenu, quelle part d'un dollar gagné en plus vous échappe, et repère les **trappes** (plus de 80 %).
- **Comparer deux ménages**, ou **deux jeux de paramètres** sur un même ménage (simuler un « mini-budget »).
- **Demander à un assistant IA** (Claude) d'expliquer un résultat ou de répondre à vos questions sur le modèle *(vous fournissez votre propre clé Anthropic)*.
- **Enregistrer, partager par lien, exporter en CSV / PDF**, et conserver vos scénarios dans un compte.

L'interface est **bilingue (français / anglais)** et offre un **mode clair / sombre**.

## D'où viennent les chiffres

Tous les chiffres — montants, taux et seuils — viennent de **sources officielles** : Revenu Québec, l'Agence du revenu du Canada, Retraite Québec et Service Canada. Chacun renvoie à la loi qui le fixe ; rien n'est inventé.

Pour s'assurer que les calculs sont exacts, ils ont été **comparés au [calculateur officiel du ministère des Finances du Québec](https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp)** : sur des milliers de cas, les résultats **correspondent au cent près**.

## Sous le capot *(pour les curieux)*

| | |
| --- | --- |
| Moteur de calcul | TypeScript, une vingtaine de postes ; aucune dépendance externe ; vérifié par une suite de tests automatisés |
| Application web | Next.js, Tailwind, shadcn/ui |
| Comptes et sauvegarde | Better Auth + Prisma + PostgreSQL |
| Hébergement | Vercel (mise en ligne continue) |

Le **calcul se fait entièrement dans votre navigateur** ; le serveur ne sert qu'aux comptes et à la sauvegarde des scénarios.

## Développement

```bash
npm install
npm run dev        # http://localhost:3100
npm test           # tests (concordance au cent près)
npm run build
```

## Avertissement

Outil **pédagogique** : les montants sont **indicatifs** et **ne constituent pas un avis fiscal**. Les exemples n'utilisent que des **données fictives**.

---

© 2026 Alain Boisvert
