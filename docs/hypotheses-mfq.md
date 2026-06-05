# Hypothèses et simplifications du modèle MFQ

Le calculateur « Le revenu disponible » du ministère des Finances du Québec fait des **choix de modélisation** et des **simplifications** — distincts des *paramètres fiscaux vérifiés* (taux, seuils, montants). Ce document les **catalogue en un seul endroit** : pour chaque hypothèse, ce que le modèle **suppose** par rapport à la **règle réelle**.

But : borner la validité du modèle, et alimenter la future application (volet « hypothèses » présenté à l'utilisateur). Le détail technique de chaque point reste dans [`revenu-disponible.md`](revenu-disponible.md) (drapeaux ⚠️ par poste) ; les explications en langage clair dans [`revenu-disponible-pedagogie.md`](revenu-disponible-pedagogie.md).

> Légende : ⚠️ = valeur ou règle **non confirmée** / à reconfirmer ; 🔧 = simplification de calcul ; 🚫 = composante du programme réel **non modélisée**.

---

## Hypothèses générales

- **Revenu = revenu de travail salarié.** Les cotisations (RRQ, RQAP, AE) portent sur la **part de l'employé**. Le cas du **travailleur autonome** (double cotisation, participation optionnelle à l'AE) n'est pas traité. 🔧
- **5 situations types seulement** : personne vivant seule, famille monoparentale, couple, retraité seul, couple de retraités. Pas de combinaison libre (p. ex. « personne seule » force 0 enfant ; les retraités n'ont pas d'enfant mineur). 🔧
- **Données fictives / cas types** — l'outil sert à comparer des profils, pas à produire une déclaration réelle.
- **Deux années comparées** : 2025 (colonne M) et 2026 (colonne L). Pour certains postes, nuance de **période** : la RAMQ et l'allocation-logement changent en cours d'année (1ᵉʳ juillet / 1ᵉʳ octobre), tandis que l'indexation fiscale est au 1ᵉʳ janvier — le modèle prend un instantané cohérent par année (voir postes 5 et 10).
- **Revenu familial net** (somme des lignes 275) : calculé en interne par le modèle ; dans cette reconstruction, il est **fourni en entrée** aux postes en aval tant que le module d'impôt (poste 19) n'est pas construit.

---

## Hypothèses par poste

### Cotisations

- **Poste 1 — RRQ** : modèle **salarié** (part employé) ; travailleur autonome non traité. 🔧
- **Poste 2 — RQAP** : modèle **salarié**. Seuil de 2 000 $ (revenu assurable minimal) — citation officielle verbatim à reconfirmer. ⚠️
- **Poste 3 — Assurance-emploi** : **taux réduit du Québec** (part employé). Le seuil de 2 000 $ est appliqué comme un **palier abrupt** (prime nulle en deçà, pleine au-delà) ; la **réduction dégressive** de l'art. 96(5) LAE (bande étroite 2 000 → ≈ 2 026 $) n'est pas implémentée. 🔧
- **Poste 4 — FSS** : le `Revenu` des situations « retraité » sert de **proxy** du revenu assujetti (annexe F). Le **revenu d'emploi est exclu** → seuls les ménages **retraités** ont une base ; la PSV (exclue du revenu assujetti réel) est ignorée ici. 🔧
- **Poste 5 — RAMQ** : les **exonérations individuelles** (aide de dernier recours ; aîné touchant ≥ 94 % du SRG maximal) ne sont **pas appliquées** dans la fonction de base (elles dépendent de postes non construits). Seuils d'exonération **2026** extraits du code mais l'Annexe K 2026 n'est **pas encore publiée**. ⚠️

### Transferts et crédits

- **Poste 6 — Frais de garde** : (a) plafonnement **agrégé** — `min(Σ plafonds, Σ frais)` au lieu d'un plafond **par enfant** (peut surévaluer les frais admissibles) 🔧 ; (b) le fichier compare l'âge à **5 ans** pour le plafond élevé, alors que la règle officielle vise « **moins de 7 ans** » 🔧 ; (c) plafond « **enfant handicapé** » (16 800 $) et revenu maximal de l'enfant non modélisés 🚫 ; (d) `NbEnfants` sert de proxy des « enfants à charge » au sens de l'annexe C.
- **Poste 7 — Allocation famille** : le **supplément pour fournitures scolaires** (124/127 $ par enfant de 4-16 ans) est une **sortie distincte** (`SFS`) — modélisé séparément (`supplementFournituresScolaires`) et agrégé au poste 20, pas inclus dans `QC_sae`. Le supplément pour **enfant handicapé** n'est pas modélisé 🚫 ; tous les `NbEnfants` sont supposés **de moins de 18 ans** (aucun filtre d'âge pour `QC_sae`). 🔧
- **Poste 8 — Prime au travail** : seule la **prime au travail générale** est calculée ; la **prime au travail adaptée** (contraintes sévères à l'emploi) n'est pas modélisée. 🚫
- **Poste 9 — Crédit pour la solidarité** : (a) le volet **village nordique** n'est pas modélisé 🚫 ; (b) réduction toujours à **6 %** — le modèle suppose le droit aux **deux** volets (TVQ + logement), donc le taux de 3 % à une seule composante ne survient pas 🔧 ; (c) le **volet logement** est supposé (condition propriétaire/locataire remplie) 🔧 ; (d) le montant additionnel « personne vivant seule » est accordé à **tout** ménage à 1 adulte (monoparentale comprise).
- **Poste 10 — Allocation-logement** : (a) **loyer imputé** par composition — le programme réel utilise le **loyer réel**, mais l'outil n'a pas d'entrée « loyer » 🔧 ; (b) le revenu aux fins de l'AL est **ajusté** pour les 65 ans et plus (pensions) — fourni en entrée ici 🔧 ; (c) le **plafond d'actifs** (≤ 50 000 $) n'est pas modélisé 🚫 ; (d) seuil « 2 adultes, 0 enfant » 2026 : code **32 100 $** vs guide CFFP **32 200 $**. ⚠️
- **Poste 11 — Soutien aux aînés** : aucune simplification notable — reproduction fidèle, tous les paramètres confirmés (montant 2 000 $/aîné, seuils, taux 5,40 %/5,47 %, admissibilité 70 ans).
- **Poste 12 — Frais médicaux** : (a) la **seule dépense médicale** considérée est la **prime RAMQ** ; comme elle ne dépasse jamais 3 % du revenu, **`QC_medic ≡ 0`** pour toutes les entrées 🔧🚫 ; (b) la formule de réduction du code est **anormale** — `(crédit − excédent) × 5 %` au lieu de `crédit − 5 % × excédent` (plafonnerait à ≈ 73 $) ; jamais exercée, donc non validable. ⚠️
- **Poste 13 — Aide de dernier recours** : (a) l'ajustement « **contraintes temporaires** » (169/291 $) est accordé sur le seul **proxy d'âge ≥ 58 ans** — l'outil ne connaît pas l'état de santé 🔧 ; (b) ajustement « **jeune seul** » de 50 $/mois (adulte seul, sans enfant, < 50 ans) présent dans le modèle mais **non confirmé** sur quebec.ca ⚠️ ; (c) la prestation **n'inclut pas de montant pour enfant** (couvert par l'Allocation famille) ; (d) seuls les **gains de travail** sont saisis comme revenu (autres revenus = 0).


### Transferts fédéraux

- **Poste 14 — Allocation canadienne pour enfants** : aucune simplification notable — reproduction fidèle, montants et seuils confirmés à l'ARC. Le revenu déterminant (AFNI) est le revenu net rajusté **fédéral**, distinct du revenu net québécois.
- **Poste 15 — Crédit pour la TPS/TVH** : aucune simplification notable — reproduction fidèle. Montants 2025 non lisibles directement à l'ARC (feuille de calcul juillet 2025 inaccessible) mais cohérents avec l'indexation des valeurs 2024-25 et **validés par parité**. ⚠️ (vérification indirecte)
- **Poste 16 — Allocation canadienne pour les travailleurs** : (a) version **reconfigurée pour le Québec** (montants distincts du fédéral) ; feuille de calcul canada.ca inaccessible (403) → montants exacts **validés par parité** seulement ⚠️ ; (b) le **supplément pour invalidité** n'est pas modélisé 🚫 ; (c) l'AFNI déterminant **inclut l'aide sociale** (poste 13) — l'ACT en dépend.
- **Poste 17 — Sécurité de la vieillesse (PSV/SRG/Allocation)** : (a) montants **trimestriels** → le modèle (et notre code) utilise la **moyenne des 4 trimestres** 🔧 ; (b) l'**Allocation** (conjoint de 60-64 ans dont l'autre a 65 ans et plus) **est modélisée** : le conjoint 65+ touche PSV + SRG (calculé sur le revenu au-delà du seuil de l'Allocation, ≈ 11 760 $) et le conjoint 60-64 touche l'Allocation ; **asymétrie reproduite du fichier** : le supplément complémentaire du SRG est **entier** si le conjoint de 65+ est l'adulte 1, mais **réduit de moitié** s'il est l'adulte 2 — vraisemblablement un défaut du modèle (cellules `c2T43`/`c2T53` au multiplicateur différent), sans portée pratique pour des cas-types symétriques ⚠️ ; (c) le seuil du SRG du conjoint 65+ est diminué d'**un cent** (11 759,99 $) dans le fichier — artefact reproduit pour la parité ⚠️ ; (d) le revenu déterminant est le revenu de retraite saisi (pas de décomposition fine des sources).

---

- **Poste 19 — Impôt sur le revenu (assemblage, en construction)** : (a) le revenu de travail/pension saisi est la **seule** source ; pas de revenus de placement, gains en capital, dividendes (les cellules existent mais sont nulles dans le modèle) 🔧 ; (b) **couches 1-2 faites** = impôt fédéral + québécois, 1 adulte ; couples à venir ; (c) le revenu imposable **inclut la PSV** mais **exclut** SRG/supplément ; la cotisation RRQ **supplémentaire** est déduite, la **base** est créditée (au fédéral) ; (d) montant fédéral pour **proche admissible** accordé au parent seul (= 2ᵉ montant de base) — explique l'impôt fédéral nul des monoparentales à revenu faible/moyen ; (e) côté **Québec** : la monoparentale paie le **même** impôt que la personne seule (pas de crédit pour proche), et les **cotisations ne sont pas créditées** (la déduction pour travailleur de 1 420 $ en tient lieu) 🔧 ; (f) **couples faits** (fédéral : montant conjoint, transfert âge/pension, crédit médical du couple ; québécois : montant combiné des deux conjoints sur l'adulte 1, transfert général des crédits inutilisés, crédit médical non remboursable à 20 %) — le crédit médical, nul pour les personnes seules, est non nul pour les couples car la prime RAMQ du couple dépasse le plancher de 3 %. **Poste 19 terminé** : `CA_impot`/`QC_impot` exacts pour tous les ménages.

- **Poste 18 — Supplément médical remboursable (fédéral)** : (a) comme le poste 12, la **seule dépense médicale** est la **prime RAMQ** ; elle ne dépasse jamais le plancher de 3 % du revenu net → **`CA_medic ≡ 0`** pour toutes les entrées 🔧🚫 ; (b) contrairement au poste 12, la **forme de réduction est correcte** (`supplément − 5 % × excédent`) ; (c) la réduction porte sur le **revenu familial net rajusté fédéral** (AFNI), distinct du revenu net québécois — dépendance au calcul fédéral en amont. Tous les paramètres sont **confirmés** (art. 122.51(1) LIR).

- **Poste 20 — Revenu disponible** : agrégation `revenu − cotisations + transferts QC − impôt QC + transferts fédéraux − impôt fédéral`. Le terme `c2D84` (soustrait) est **nul** pour tous les cas-types du modèle. Le **revenu** agrégé est le seul revenu de travail/retraite saisi (la PSV figure dans les transferts fédéraux, pas dans le revenu). **Orchestrateur** (`calculerRevenuDisponible`) : reconstruit les bases de revenu internes ; les cotisations **RRQ/RQAP/AE** et l'**ACT** sont mises à **zéro pour les retraités** (elles portent sur le revenu de travail, pas la pension) 🔧 ; le **`RD` de la référence n'est pas arrondi** → comparé au cent ; frais de garde **subventionnés / types de garde** non distingués (mappés tels quels) 🔧.

---

*Mis à jour au fur et à mesure de la construction des postes (1 à 20 — tous faits).*
