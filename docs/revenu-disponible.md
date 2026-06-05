# Revenu disponible (MFQ) — reconstruction épurée

Reconstruction lisible du calculateur **« Le revenu disponible »** du ministère des Finances du Québec, à partir du fichier `revenu-disponible_dec2025.js` (généré depuis Excel via *SpreadsheetConverter*, puis dé-minifié).

Ce document est **compilé au fur et à mesure**, un poste à la fois. Chaque poste comporte : (1) les **paramètres** extraits du code et confrontés à la source officielle, (2) l'**algorithme épuré en TypeScript**.

---

## 1. Méthode et avertissements

- **Extraction** : les valeurs sont lues dans le bloc de paramètres du fichier (≈ lignes 27–310 de la fonction `calc(data)`), puis chaque valeur est **confrontée à la source officielle** (Revenu Québec, ARC, MFQ).
- **Pas de déroulé brut** : le cône de dépendance d'un poste va de 140 à 736 cellules entrelacées ; on reconstruit donc la *logique fiscale réelle*, pas la plomberie Excel.
- **Aucune valeur n'est ajoutée de mémoire** : si une valeur n'est pas dans le code **ou** pas confirmée par une source, elle est marquée `⚠️ à vérifier`.
- **Hypothèses du modèle** : les choix de modélisation et simplifications du calculateur MFQ (distincts des paramètres vérifiés) sont catalogués en un seul endroit dans [`hypotheses-mfq.md`](hypotheses-mfq.md) ; le détail reste aussi en ⚠️ dans chaque poste.

### Deux niveaux de tests (`tests/`)

1. **Fidélité aux sources officielles** (`maximums.test.ts`) — chaque maximum / paramètre est comparé à une valeur publiée (Revenu Québec, MFQ, Retraite Québec…).
2. **Parité avec la référence** (`reference-parity.test.ts`) — le `calc()` de `revenu-disponible_dec2025.js` est exécuté en Node (chargeur `tests/reference/load-reference.ts` : on n'exécute que la tranche calculatoire du bundle, sans navigateur) et **ses sorties sont comparées aux nôtres** sur une grille de scénarios. Cela attrape les erreurs de *traçage* (qu'un contrôle de paramètre ne verrait pas). Couvre les postes 1 à 9 ; les transferts (modulés sur le revenu familial net interne) sont comparés via la cellule `c2T271` exposée par instrumentation.

### Clé des colonnes (essentiel)
Le fichier stocke deux jeux de paramètres en parallèle :

| Colonne dans le code | Année | Suffixe de sortie |
|---|---|---|
| `M` | **2025** | `_old` |
| `L` | **2026** | `_new` |
| (différence) | — | `_ecart` |

> Le fichier datant de décembre 2025, il compare l'année **2025** (en cours) à l'année **2026** (à venir).

### Mécanisme des sorties `_bonif` (cotisations)

Pour les cotisations, le fichier calcule chaque montant **deux fois** :
- `arr2x…` (cellules `c2…`) : cotisation aux **taux réels de l'année** ;
- `arr4x…` (cellules `c4…`) : même calcul, mais **taux de cotisation de base gelé au niveau de 2025** (les taux supplémentaires restent inchangés).

La sortie `…_bonif` = `c2 − c4`. Elle est donc **nulle en 2025** (taux identiques) et, **en 2026**, isole l'effet des **baisses de taux annoncées pour 2026** (RRQ : base 5,4 %→5,3 % ; RQAP : 0,494 %→0,43 %). La cotisation baissant, l'écart est **négatif** (un gain de revenu disponible).

> ⚠️ Le **calcul** (`c2 − c4`, gel du taux de base à 2025) est vérifié dans le code ; l'intention exacte du libellé « bonif » n'est pas démontrable à partir du seul fichier. À **ne pas confondre** avec la *bonification du RRQ* (régime supplémentaire), qui sert au calcul d'impôt et est traitée séparément (postes cotisations → poste 19).

---

## 2. Sources officielles (liste évolutive)

| Réf. | Source | Usage |
|---|---|---|
| S1 | Revenu Québec — *Taux d'imposition* (revenuquebec.ca) | Paliers et taux d'impôt QC 2025/2026 |
| S2 | ARC / Canada.ca — *Taux d'imposition et tranches de revenu pour les particuliers* | Paliers et taux fédéraux ; baisse du 1ᵉʳ taux |
| S3 | Ministère des Finances du Québec — *Le revenu disponible* | Modèle de référence |
| S4 | Retraite Québec — *Travail et cotisations* / *Régime supplémentaire* (rrq.gouv.qc.ca) | RRQ : MGA, MGAS, exemption, structure |
| S5 | Revenu Québec — *Cotisation du salarié au RRQ* | RRQ : taux employé 2025/2026, maximums |
| S6 | Revenu Québec / RQAP (quebec.ca) — *Cotisation du salarié au RQAP* ; *Revenu maximal assurable* | RQAP : max assurable, taux, maximums 2025/2026 |
| S7 | Emploi et Développement social Canada / Service Canada (canada.ca) — *Assurance-emploi : avis sur le maximum de la rémunération assurable* (2025 et 2026) | AE : MRA, taux employé (taux réduit du Québec), cotisations maximales |
| S8 | *Loi sur l'assurance-emploi* (LC 1996, ch. 23) — art. 4, 66, 69(2), 96(4) ; Rapports actuariels sur le taux de cotisation d'AE (BSIF) | AE : base légale (MRA, taux, réduction provinciale, remboursement ≤ 2 000 $) |
| S9 | Revenu Québec — *Cotisation des particuliers au FSS* ; *Ligne 446* ; *Annexe F* (revenuquebec.ca) ; *Loi sur la Régie de l'assurance maladie du Québec* (RLRQ, c. R-5, art. 38 à 40) | FSS particuliers : base légale, assujettissement, revenu assujetti |
| S10 | Ministère des Finances du Québec — *Paramètres du régime d'imposition des particuliers* (2025 et 2026) ; *Bulletin d'information 2025-8* | FSS : seuils, taux (1 %), plafonds (150/1 000 $), formule |
| S11 | Revenu Québec — *Annexe K (TP-1.D.K), « Cotisation au régime d'assurance médicaments du Québec »* (années d'imposition **2024** et **2025**) ; *Ligne 447* ; *Loi sur l'assurance médicaments* (RLRQ, c. A-29.01, **art. 10, 23, 24**) | RAMQ : base légale, barème (taux, tranches, prime max), seuils d'exonération |
| S12 | RAMQ — *Tarifs en vigueur* / *Prime annuelle* (ramq.gouv.qc.ca) ; quebec.ca / MFQ — *Indexation 2026* (2,05 %) | RAMQ : prime max par période (744 $ dès le 1ᵉʳ juill. 2024 ; 766 $ dès le 1ᵉʳ juill. 2025) ; exonérations (aîné/SRG, aide de dernier recours) |
| S13 | Revenu Québec — *Crédit d'impôt pour frais de garde d'enfants* (revenuquebec.ca) ; *Loi sur les impôts* (RLRQ, c. I-3, **art. 1029.8.67 et s.**) ; *Annexe C* (TP-1.D.C) | Frais de garde : base légale, admissibilité (âge < 16 ; **< 14 dès 2026**), exclusion des places subventionnées. Paramètres chiffrés (taux, seuils, plafonds) : **S10** (MFQ Paramètres, tableau 5) |
| S14 | Retraite Québec — *L'Allocation famille* ; *Montants selon le revenu familial* (retraitequebec.gouv.qc.ca) ; CFFP — *Allocation famille* ; *Loi sur les impôts* (RLRQ, c. I-3, **art. 1029.8.61.8 à 1029.8.61.60**) | Allocation famille : structure (maximum → minimum, plancher universel), taux de réduction (4 %), base légale. Montants et seuils chiffrés : **S10** |
| S15 | Revenu Québec — *Crédits d'impôt relatifs à la prime au travail* (revenuquebec.ca) ; CFFP — *Crédit d'impôt remboursable attribuant une prime au travail* ; *Loi sur les impôts* (RLRQ, c. I-3, **art. 1029.8.116.1 à 1029.8.116.11**) | Prime au travail générale : base légale, taux de croissance (11,6/30/25 %), revenu de travail exclu (2 400/3 600 $), taux de réduction (10 %). Montants max et seuils : **S10** |
| S16 | Revenu Québec — *Crédit d'impôt pour solidarité* (revenuquebec.ca) ; CFFP — *Crédit d'impôt pour solidarité* ; *Loi sur les impôts* (RLRQ, c. I-3, **art. 1029.8.116.12 à 1029.8.116.35**) | Solidarité : base légale, 3 composantes (TVQ, logement, village nordique), taux de réduction (6 % ; 3 % à une seule composante). Montants et seuil : **S10** (tableau 4) |
| S17 | Revenu Québec — *Programme Allocation-logement* (revenuquebec.ca) ; CFFP — *Allocation logement* ; *Loi sur la Société d'habitation du Québec* (RLRQ, c. S-8) — programme établi par décret, administré par Revenu Québec | Allocation-logement : montants (100/150/170 $/mois), paliers d'effort (30/50/80 %), seuils de revenu, admissibilité (50 ans ou enfant), réduction dollar pour dollar |
| S18 | Revenu Québec — *Crédit d'impôt pour soutien aux aînés* (revenuquebec.ca ; **ligne 463**) ; *Loi sur les impôts* (RLRQ, c. I-3) | Soutien aux aînés : montant maximal (2 000 $/aîné de 70 ans et +), admissibilité, base légale. Seuils et taux de réduction : **S10** |
| S19 | Revenu Québec — *Crédit d'impôt remboursable pour frais médicaux* (revenuquebec.ca) ; *Loi sur les impôts* (RLRQ, c. I-3) | Frais médicaux (crédit remboursable) : montant maximal (1 466/1 496 $), revenu de travail minimal, seuil de réduction. Paramètres confirmés au document **S10** (« Crédit d'impôt pour frais médicaux ») |
| S20 | Gouvernement du Québec — *Programme d'aide sociale / solidarité sociale ; Montants des prestations* (quebec.ca) ; CREMIS — *tableau comparatif* ; Éducaloi ; ADDS-QM ; *Loi sur l'aide aux personnes et aux familles* (RLRQ, c. **A-13.1.1**) | Aide de dernier recours : base légale, barème (prestation de base, ajustement contraintes, exemption de travail 200/300 $, incitation 25 %) ; montants 2026 confirmés (845/1 283 $, 169/291 $) |
| S21 | Agence du revenu du Canada — *Allocation canadienne pour enfants : combien vous pouvez recevoir* (canada.ca) ; *Loi de l'impôt sur le revenu* (LRC 1985, ch. 1 (5ᵉ suppl.)), **art. 122.6 à 122.64** | ACE : montants maximaux par enfant et âge (7 997/6 748 $), seuils (37 487/81 222 $) et taux de réduction — année de prestation juillet 2025 |
| S22 | Agence du revenu du Canada — *Crédit pour la TPS/TVH : montant que vous pouvez recevoir* ; *feuille de calcul juillet 2025–juin 2026* (canada.ca) ; *Loi de l'impôt sur le revenu*, **art. 122.5** | TPS/TVH : montants (349/184 $), supplément personne seule (2 % à partir de 11 337 $, plafond 184 $), seuil de réduction (45 521 $, 5 %). Montants 2024-25 (340/179 $) confirmés, 2025 = indexés |
| S23 | Agence du revenu du Canada — *Allocation canadienne pour les travailleurs (ACT) — Montant* ; *Annexe 6, résidents du Québec* (canada.ca) ; *Loi de l'impôt sur le revenu*, **art. 122.7** | ACT **reconfigurée pour le Québec** : taux d'accumulation (37,3/20/23,9 %), primes maximales, seuils et taux de réduction (20 %), exemption du second revenu. Montants exacts validés **par parité** (feuille de calcul canada.ca inaccessible) |
| S24 | Emploi et Développement social Canada — *Sécurité de la vieillesse* ; ARC — *Impôt de récupération de la PSV* (**art. 180.2**, ligne 23500) ; RRQ ; RCGT (*planiguide*) ; CFFP ; *Loi sur la sécurité de la vieillesse* (LRC 1985, ch. **O-9**) ; **données ouvertes — montants maximaux mensuels par trimestre** | PSV/SRG : base légale, montants **trimestriels** (moyennés sur 4 trimestres), supplément 75 ans et +, récupération (15 % dès 93 454 $), tranches du SRG |
| S25 | Agence du revenu du Canada — *Ligne 45200 — Supplément remboursable pour frais médicaux* (canada.ca) ; *Loi de l'impôt sur le revenu* (LRC 1985, ch. 1 (5ᵉ suppl.)), **art. 122.51(1)** ; TaxTips.ca — *Refundable Medical Expense Supplement* (table d'indexation par année) | Supplément médical remboursable fédéral : max (1 504/1 534 $), taux 25 %, revenu de travail min. (4 390/4 478 $), seuil de réduction sur l'AFNI (33 294/33 960 $), réduction 5 %, plancher de 3 % plafonné (2 834/2 890 $) |
| S26 | Agence du revenu du Canada — *Montants personnels fédéraux* (annexe 1 / ligne 30000s) ; *Loi de l'impôt sur le revenu*, **art. 118** (crédits personnels), **art. 118(2)** (âge), **art. 118(3)** (pension), **art. 118(10)** (emploi Canada), **art. 120(2)** (abattement QC 16,5 %) | Crédits non remboursables fédéraux : montant de base (16 129/16 452 $, bonification incluse), montant pour proche admissible (= base), âge (9 028/9 208 $, seuil 45 522/46 432 $), pension (2 000 $), emploi Canada (1 471/1 501 $) — valeurs extraites du code, montants 2025 conformes aux barèmes ARC, **validées par parité** |

*(De nouvelles sources seront ajoutées à chaque poste.)*

---

## 3. Entrées du modèle (saisies par l'usager)

Lues telles quelles dans le code (`data['…']`) :

| Entrée | Cellule code | Sens |
|---|---|---|
| `Situation` | `c1B1` | Type de ménage (voir ci-dessous) |
| `Revenu1`, `Revenu2` | — | Revenus de travail des 2 adultes |
| `AgeAdulte1`, `AgeAdulte2` | — | Âges des adultes |
| `NbEnfants` + `AgeEnfant1…5` | — | Nombre et âges des enfants |
| `Frais1…5`, `type_garde1…5` | — | Frais de garde par enfant et type |

**Les 5 situations** (libellés, nb d'adultes et indicateur « retraité » extraits du code) :

| Code | Libellé | Adultes | Retraité |
|---|---|---|---|
| 0 | Personne vivant seule | 1 | non |
| 1 | Famille monoparentale | 1 | non |
| 2 | Couple | 2 | non |
| 3 | Retraité vivant seul | 1 | oui |
| 4 | Couple de retraités | 2 | oui |

---

## 4. Socle TypeScript commun

```typescript
// ===========================================================================
// Socle commun — modèle « Revenu disponible » (MFQ)
// Source : revenu-disponible_dec2025.js (colonne M = 2025, colonne L = 2026)
// ===========================================================================

export type Annee = 2025 | 2026;

/** Les 5 situations du modèle (ordre = code interne du fichier). */
export enum Situation {
  PersonneSeule = 0,
  FamilleMonoparentale = 1,
  Couple = 2,
  RetraiteSeul = 3,
  CoupleRetraites = 4,
}

/** Métadonnées de chaque situation, extraites du code (rangées B5:G9). */
export const SITUATIONS: Record<Situation, { libelle: string; nbAdultes: 1 | 2; retraite: boolean }> = {
  [Situation.PersonneSeule]:        { libelle: "Personne vivant seule",  nbAdultes: 1, retraite: false },
  [Situation.FamilleMonoparentale]: { libelle: "Famille monoparentale",  nbAdultes: 1, retraite: false },
  [Situation.Couple]:               { libelle: "Couple",                 nbAdultes: 2, retraite: false },
  [Situation.RetraiteSeul]:         { libelle: "Retraité vivant seul",   nbAdultes: 1, retraite: true  },
  [Situation.CoupleRetraites]:      { libelle: "Couple de retraités",    nbAdultes: 2, retraite: true  },
};

export interface Enfant {
  age: number;
  fraisGarde: number; // frais de garde annuels payés ($)
  typeGarde: number;  // code du type de garde
}

export interface Menage {
  situation: Situation;
  revenu1: number;    // revenu de travail adulte 1
  revenu2: number;    // revenu de travail adulte 2 (0 si ménage à 1 adulte)
  ageAdulte1: number;
  ageAdulte2: number;
  enfants: Enfant[];  // NbEnfants = enfants.length (max 5)
}

/** Un palier d'imposition : taux marginal jusqu'au plafond (Infinity = dernier). */
export interface Palier {
  plafond: number;
  taux: number;
}

/** Impôt brut par application progressive des paliers. */
export function impotProgressif(revenuImposable: number, paliers: Palier[]): number {
  let impot = 0;
  let borneInf = 0;
  for (const { plafond, taux } of paliers) {
    if (revenuImposable <= borneInf) break;
    const tranche = Math.min(revenuImposable, plafond) - borneInf;
    impot += tranche * taux;
    borneInf = plafond;
  }
  return impot;
}

/** Crédit non remboursable = taux × montant admissible (réducteur d'impôt). */
export function credit(montant: number, taux: number): number {
  return montant * taux;
}
```

---

## 5. Postes

> 📘 **Volet pédagogique** — pour la *description*, l'*objectif* et les *règles de calcul* de chaque poste en langage clair, voir [`revenu-disponible-pedagogie.md`](revenu-disponible-pedagogie.md). Le présent document reste la **référence technique** (traçage du code, paramètres vérifiés, algorithme).

### État d'avancement

| # | Poste | Sortie code | Paramètres | Algorithme TS |
|---|---|---|---|---|
| — | Impôt — **paramètres** | `QC_impot`, `CA_impot` | ✅ vérifiés (S1, S2) | ⏳ (voir ordre §6) |
| 1 | RRQ (+ bonification) | `CA_rrq`, `CA_rrq_bonif` | ✅ vérifiés (S4, S5) | ✅ |
| 2 | RQAP (+ « bonif ») | `QC_rqap`, `QC_rqap_bonif` | ✅ vérifiés (S6) | ✅ |
| 3 | Assurance-emploi | `CA_ae` | ✅ vérifiés (S7, S8) | ✅ |
| 4 | FSS | `QC_fss` | ✅ vérifiés (S9, S10) | ✅ |
| 5 | RAMQ (assurance médicaments) | `QC_ramq` | ✅ vérifiés (S11, S12) | ✅ |
| 6 | Frais de garde (crédit) | `QC_garde`, `Frais_garde` | ✅ vérifiés (S10, S13) | ✅ |
| 7 | Soutien aux enfants / Allocation famille | `QC_sae` | ✅ vérifiés (S10, S14) | ✅ |
| 8 | Prime au travail (générale) | `QC_pt` | ✅ vérifiés (S10, S15) | ✅ |
| 9 | Crédit pour la solidarité | `QC_sol` | ✅ vérifiés (S10, S16) | ✅ |
| 10 | Allocation-logement | `QC_al` | ✅ vérifiés (S17) | ✅ |
| 11 | Soutien aux aînés | `QC_aines` | ✅ vérifiés (S10, S18) | ✅ |
| 12 | Frais médicaux QC | `QC_medic` | ✅ vérifiés (S10, S19) | ✅ (≡ 0 — voir poste) |
| 13 | Aide de dernier recours (aide sociale) | `QC_adr` | ✅ vérifiés (S20) | ✅ |
| 14 | Allocation canadienne pour enfants | `CA_ace` | ✅ vérifiés (S21) | ✅ |
| 15 | Crédit pour la TPS/TVH | `CA_tps` | ✅ vérifiés (S22) | ✅ |
| 16 | Allocation canadienne pour les travailleurs | `CA_pfrt` | ✅ vérifiés (S23) | ✅ |
| 17 | Sécurité de la vieillesse (+ SRG + Allocation) | `CA_psv` | ✅ vérifiés (S24) | ✅ |
| 18 | Supplément médical remboursable (fédéral) | `CA_medic` | ✅ vérifiés (S25) | ✅ (≡ 0) |
| 19 | **Impôt — assemblage** | `QC_impot`, `CA_impot` | ✅ (S1, S2, S26) | ✅ (1 adulte + couples, fédéral + QC) |
| 20 | **Revenu disponible** (agrégation) | `RD` | ✅ | ✅ (formule vérifiée par parité) |

---

### Paramètres — Impôt sur le revenu (vérifiés)

Les **algorithmes** d'impôt sont placés en fin de chaîne (§6), car l'impôt dépend des cotisations et des crédits (d'où son cône de 736 cellules). Les **paramètres**, eux, sont stables et déjà confirmés.

**Québec** — cellules `c2…139/141/143/145`, plafonds `arr2x…140/142/144` :

| Tranche | Taux | Plafond 2025 (M) | Plafond 2026 (L) |
|---|---|---|---|
| 1 | 14 % | 53 255 $ | 54 345 $ |
| 2 | 19 % | 106 495 $ | 108 680 $ |
| 3 | 24 % | 129 590 $ | 132 245 $ |
| 4 | 25,75 % | — | — |

Confirmé par Revenu Québec, qui publie les taux d'imposition applicables pour les années 2025 et 2026 selon le revenu imposable (S1).

**Fédéral** — cellules `c2…5/7/9/11/13`, plafonds `arr2x…6/8/10/12` :

| Tranche | Taux 2025 (M) | Taux 2026 (L) | Plafond 2025 (M) | Plafond 2026 (L) |
|---|---|---|---|---|
| 1 | **14,5 %** | **14 %** | 57 375 $ | 58 523 $ |
| 2 | 20,5 % | 20,5 % | 114 750 $ | 117 045 $ |
| 3 | 26 % | 26 % | 177 882 $ | 181 440 $ |
| 4 | 29 % | 29 % | 253 414 $ | 258 482 $ |
| 5 | 33 % | 33 % | — | — |

La baisse du taux de la 1ʳᵉ tranche est confirmée par l'ARC : le gouvernement a réduit le taux d'imposition de la première tranche, avec entrée en vigueur le 1ᵉʳ juillet 2025 (S2). Le 14,5 % de 2025 correspond au taux combiné de transition de 14,5 % pour 2025, abaissé à 14 % pour 2026.

```typescript
// --- Paramètres : Impôt sur le revenu ---
export const PALIERS_QC: Record<Annee, Palier[]> = {
  2025: [
    { plafond: 53_255,  taux: 0.14 },
    { plafond: 106_495, taux: 0.19 },
    { plafond: 129_590, taux: 0.24 },
    { plafond: Infinity, taux: 0.2575 },
  ],
  2026: [
    { plafond: 54_345,  taux: 0.14 },
    { plafond: 108_680, taux: 0.19 },
    { plafond: 132_245, taux: 0.24 },
    { plafond: Infinity, taux: 0.2575 },
  ],
};

export const PALIERS_FEDERAL: Record<Annee, Palier[]> = {
  2025: [
    { plafond: 57_375,  taux: 0.145 }, // taux de transition (1ᵉʳ juill. 2025)
    { plafond: 114_750, taux: 0.205 },
    { plafond: 177_882, taux: 0.26 },
    { plafond: 253_414, taux: 0.29 },
    { plafond: Infinity, taux: 0.33 },
  ],
  2026: [
    { plafond: 58_523,  taux: 0.14 },
    { plafond: 117_045, taux: 0.205 },
    { plafond: 181_440, taux: 0.26 },
    { plafond: 258_482, taux: 0.29 },
    { plafond: Infinity, taux: 0.33 },
  ],
};
```

> Restant à vérifier pour l'algorithme d'impôt (poste 19) : montant personnel de base (QC ≈ 18 571 $ en 2025, valeur `c2…148`), montant de base fédéral et son supplément, abattement du Québec (16,5 %), et la liste des crédits non remboursables embarqués.

---

### Poste 1 — RRQ (Régime de rentes du Québec) + bonification

**Sorties :** `CA_rrq` (cotisation **totale** du ménage) ; `CA_rrq_bonif` (effet de la baisse de taux 2026 — voir §1, *Mécanisme des sorties `_bonif`*).
**Base légale :** *Loi sur le régime de rentes du Québec* (RLRQ, c. R-9) ; paramètres fixés et publiés annuellement par Retraite Québec / Revenu Québec.

#### Structure (confirmée dans le code)

Traçage : `c1C40 = arr2xD75D79[2][0]` → `arr2xT425T429[2][0]` → `c2T138 = c2T131 + c2T136` (deux bandes) ; et `c1C41 = arr2xD75D79[2][0] − arr4xD75D79[2][0]` (lignes 2378-2380). Donc :

- `CA_rrq` = cotisation **totale** (régime de base + régimes supplémentaires), calculée par adulte puis sommée sur le ménage.
- `CA_rrq_bonif` = `c2 − c4`, où `c4` reprend le **même calcul mais avec le taux de base gelé à 5,4 % (niveau 2025)**. ⚠️ **Correction** : ce n'est donc *pas* la bonification du régime supplémentaire, mais **l'effet de la baisse du taux de base en 2026** — nul en 2025, négatif en 2026 (voir §1).
- Le code stocke ces montants en négatif (ils réduisent le revenu disponible) ; ci-dessous on les calcule en positif.
- Distinction fiscale (utile au poste 19) : le **régime de base** ouvre droit à un crédit, les **régimes supplémentaires** à une déduction. Cette décomposition (`base` / `supplementaire` ci-dessous) est calculée en vue de l'impôt — elle est **distincte** de la sortie `CA_rrq_bonif`.

#### Paramètres vérifiés (`c2…121/124/125/126`, `arr2x…120/123`)

| Paramètre | 2025 (M) | 2026 (L) | Source |
|---|---|---|---|
| Exemption générale | 3 500 $ | 3 500 $ | S4 |
| MGA (maximum des gains admissibles) | 71 300 $ | 74 600 $ | S4 |
| MGAS (max. supplémentaire = 114 % du MGA) | 81 200 $ | 85 000 $ | S4 |
| Taux régime de base (employé) | 5,4 % | **5,3 %** | S5 |
| 1ʳᵉ cotisation supplémentaire (employé) | 1 % | 1 % | S5 |
| 2ᵉ cotisation supplémentaire (bande MGA→MGAS, employé) | 4 % | 4 % | S5 |

**Vérifications :**
- Baisse du taux de base à 5,3 % en 2026 confirmée : le total employé+employeur passe de 10,8 % à 10,6 %, soit 5,3 % côté employé (S5).
- Contrôle des maximums 2026 : base + 1ʳᵉ suppl. = (74 600 − 3 500) × 6,3 % = **4 479,30 $** ; 2ᵉ suppl. = (85 000 − 74 600) × 4 % = **416,00 $** — concordent avec les maximums publiés (S5).
- Contrôle des maximums 2025 : base + 1ʳᵉ suppl. = (71 300 − 3 500) × 6,4 % = **4 339,20 $** ; 2ᵉ suppl. = (81 200 − 71 300) × 4 % = **396,00 $**.

#### Algorithme épuré

```typescript
// --- Paramètres : RRQ ---
export interface ParamsRRQ {
  exemption: number;  // exemption générale ($)
  mga: number;        // maximum des gains admissibles
  mgas: number;       // maximum supplémentaire (114 % du MGA)
  tauxBase: number;   // régime de base (part employé)
  tauxSuppl1: number; // 1ʳᵉ cotisation supplémentaire (part employé)
  tauxSuppl2: number; // 2ᵉ cotisation supplémentaire (bande MGA→MGAS, part employé)
}

export const RRQ: Record<Annee, ParamsRRQ> = {
  2025: { exemption: 3500, mga: 71_300, mgas: 81_200, tauxBase: 0.054, tauxSuppl1: 0.01, tauxSuppl2: 0.04 },
  2026: { exemption: 3500, mga: 74_600, mgas: 85_000, tauxBase: 0.053, tauxSuppl1: 0.01, tauxSuppl2: 0.04 },
};

export interface CotisationRRQ {
  base: number;           // régime de base → ouvre droit à un crédit d'impôt
  supplementaire: number; // régimes supplémentaires (1er + 2e) → déductibles
  total: number;          // base + supplementaire (= CA_rrq)
}

/** Cotisation RRQ d'un adulte sur son revenu de travail. */
export function cotisationRRQ(revenuTravail: number, annee: Annee): CotisationRRQ {
  const p = RRQ[annee];
  // Bande 1 : entre l'exemption et le MGA
  const bande1 = Math.max(0, Math.min(revenuTravail, p.mga) - p.exemption);
  // Bande 2 : entre le MGA et le MGAS (2e cotisation supplémentaire uniquement)
  const bande2 = Math.max(0, Math.min(revenuTravail, p.mgas) - p.mga);

  const base = bande1 * p.tauxBase;
  const supplementaire = bande1 * p.tauxSuppl1 + bande2 * p.tauxSuppl2;
  return { base, supplementaire, total: base + supplementaire };
}

/** Cotisation RRQ du ménage. CA_rrq = `total`. (CA_rrq_bonif : voir §1, mécanisme `_bonif`.) */
export function rrqMenage(menage: Menage, annee: Annee): CotisationRRQ {
  const revenus = [menage.revenu1];
  if (SITUATIONS[menage.situation].nbAdultes === 2) revenus.push(menage.revenu2);
  return revenus
    .map((r) => cotisationRRQ(r, annee))
    .reduce(
      (a, c) => ({ base: a.base + c.base, supplementaire: a.supplementaire + c.supplementaire, total: a.total + c.total }),
      { base: 0, supplementaire: 0, total: 0 },
    );
}
```

> **Réserve** : le modèle s'applique au **revenu de travail salarié** (parts d'employé). Le cas du travailleur autonome (double cotisation) n'est pas traité ici car les entrées du modèle ne le distinguent pas.

---

### Poste 2 — RQAP (Régime québécois d'assurance parentale)

**Sorties :** `QC_rqap` (cotisation **totale** du ménage) ; `QC_rqap_bonif` (effet de la baisse de taux 2026 — voir §1).
**Base légale :** *Loi sur l'assurance parentale* (RLRQ, c. A-29.011) ; revenu maximal assurable ajusté annuellement selon le taux fixé par la CNESST.

#### Structure (confirmée dans le code)

Traçage : `c1C38 = arr2xD75D79[1][0]` → `arr2xT425T429[1][0]` → `c2T158 = c2T153 + c2T156` (lignes 2341-2343). Les deux composantes 153/156 sont les **deux adultes** (`arr2xT15T16[0] = Revenu1`, `[1] = Revenu2`). Par adulte :

`c2T153 = (gains assurables > 2 000 $) ? min(gains, max. assurable) × taux : 0`

Donc :
- `QC_rqap` = somme, sur les adultes, de la prime = `min(revenu, max. assurable) × taux`, **dès que** le revenu assurable dépasse 2 000 $.
- **Aucun régime supplémentaire** : la décomposition base/supplémentaire du RRQ ne s'applique pas.
- `QC_rqap_bonif` = `c2 − c4`, `c4` figeant le taux à 0,494 % (niveau 2025) → effet de la baisse 2026 (nul en 2025).

#### Paramètres vérifiés (`arr2x…268`, `c2…269/270`)

| Paramètre | 2025 (M) | 2026 (L) | Source |
|---|---|---|---|
| Revenu maximal assurable | 98 000 $ | 103 000 $ | S6 |
| Seuil d'admissibilité (revenu assurable min.) | 2 000 $ | 2 000 $ | S6\* |
| Taux de cotisation (employé) | 0,494 % | 0,430 % | S6 |

**Vérifications :**
- Baisse du taux employé de 0,494 % à 0,430 % et hausse du max. assurable de 98 000 $ à 103 000 $ en 2026, confirmées (S6).
- Contrôle des maximums : 2025 → 98 000 × 0,494 % = **484,12 $** ; 2026 → 103 000 × 0,430 % = **442,90 $** — concordent avec les cotisations maximales publiées (S6).
- \* Le seuil de 2 000 $ figure dans le code et correspond au revenu assurable minimal du RQAP ; citation officielle verbatim non capturée ce tour-ci → marqué « à reconfirmer ».

#### Algorithme épuré

```typescript
// --- Paramètres : RQAP ---
export interface ParamsRQAP {
  maxAssurable: number; // revenu maximal assurable ($)
  seuil: number;        // revenu assurable minimal pour cotiser
  taux: number;         // taux de cotisation (part employé)
}

export const RQAP: Record<Annee, ParamsRQAP> = {
  2025: { maxAssurable: 98_000, seuil: 2000, taux: 0.00494 },
  2026: { maxAssurable: 103_000, seuil: 2000, taux: 0.0043 },
};

/** Cotisation RQAP d'un adulte sur son revenu de travail assurable. */
export function cotisationRQAP(revenuAssurable: number, annee: Annee): number {
  const p = RQAP[annee];
  if (revenuAssurable <= p.seuil) return 0;                  // sous le minimum : aucune cotisation
  return Math.min(revenuAssurable, p.maxAssurable) * p.taux; // pas d'exemption : prime sur le plein montant
}

/** Cotisation RQAP du ménage (= QC_rqap). */
export function rqapMenage(menage: Menage, annee: Annee): number {
  const revenus = [menage.revenu1];
  if (SITUATIONS[menage.situation].nbAdultes === 2) revenus.push(menage.revenu2);
  return revenus.reduce((tot, r) => tot + cotisationRQAP(r, annee), 0);
}
```

> **Note** : contrairement au RRQ, le RQAP **n'a pas d'exemption** — la prime porte sur le plein revenu assurable (jusqu'au maximum), dès que le seuil de 2 000 $ est franchi. Modèle salarié (part d'employé).

---

### Poste 3 — Assurance-emploi (AE)

**Sortie :** `CA_ae` (cotisation **totale** du ménage). **Aucune** sortie `_bonif` n'existe pour l'AE dans le code.
**Base légale :** *Loi sur l'assurance-emploi* (loi **fédérale**, LC 1996, ch. 23) — **art. 4** (maximum de la rémunération assurable), **art. 66** (taux de cotisation), **art. 69(2)** (réduction du taux pour les résidents d'une province dotée d'un régime provincial — ici le RQAP), **art. 96(4)** (remboursement de la cotisation ouvrière lorsque la rémunération assurable n'excède pas 2 000 $). Paramètres fixés annuellement par la Commission de l'assurance-emploi du Canada (CAEC) sur avis de l'actuaire principal (BSIF).

#### Structure (confirmée dans le code)

Traçage : `c1C37 = arr2xD75D79[0][0]` → `arr2xT425T429[0][0] = c2T148 × (−1)` ; `c2T148 = c2T143 + c2T146` (les deux adultes). Par adulte (composante 143 = adulte 1) :

`c2T143 = (gains assurables > 2 000 $) ? min(gains, MRA) × taux : 0`

La fonction `min` du fichier renvoie ici `min(gains, MRA)` via `eecm77 = [arr2xT142T142, arr2xM133M133]`. Or `arr2xT142T142[0] = arr2xT15T16[0] = Revenu1` et `arr2xT145T145[0] = arr2xT15T16[1] = Revenu2`. Donc :

- `CA_ae` = somme, sur les adultes, de la prime = `min(revenu, MRA) × taux`, **dès que** le revenu assurable de l'adulte dépasse 2 000 $.
- **Ni régime supplémentaire ni exemption** (la décomposition base/suppl. du RRQ est sans objet).
- Le code stocke le montant en négatif (il réduit le revenu disponible) ; ci-dessous on le calcule en positif.
- Convention de colonnes : **2025 = colonne T** (paramètres colonne M) ; **2026 = colonne S** (paramètres colonne L).

#### Paramètres vérifiés (`c2…133/134/135`, `arr2x…133`)

| Paramètre | 2025 (M) | 2026 (L) | Source |
|---|---|---|---|
| Maximum de la rémunération assurable (MRA) | 65 700 $ | 68 900 $ | S7, S8 |
| Seuil de remboursement (rémunération assurable min.) | 2 000 $ | 2 000 $ | S8 (art. 96(4)) |
| Taux de cotisation (employé, **taux réduit du Québec**) | 1,31 % | 1,30 % | S7, S8 |

**Vérifications :**
- Taux réduit du Québec = taux standard − **réduction provinciale de 0,33 %** (art. 69(2) et règlement) : 2025 → 1,64 % − 0,33 % = **1,31 %** ; 2026 → 1,63 % − 0,33 % = **1,30 %** (S7, S8).
- Contrôle des maximums : 2025 → 65 700 × 1,31 % = **860,67 $** ; 2026 → 68 900 × 1,30 % = **895,70 $** — concordent **exactement** avec les cotisations maximales publiées par Service Canada (S7).
- Le seuil de 2 000 $ correspond verbatim à l'art. 96(4) LAE : « Lorsque la rémunération assurable d'un assuré ne dépasse pas 2 000 $ au cours d'une année, l'ensemble de toutes les retenues faites par un ou plusieurs employeurs sur cette rémunération au titre des cotisations ouvrières de l'année doivent lui être remboursées par le ministre » (S8).

> ⚠️ **Simplification du modèle** : le code applique le seuil de 2 000 $ comme un **palier abrupt** (prime nulle jusqu'à 2 000 $, prime pleine au-delà). Il **n'implémente pas** la réduction *dégressive* de l'art. 96(5) (remboursement partiel dans l'étroite bande 2 000 $ → ≈ 2 026 $). L'effet sur le revenu disponible est négligeable.

#### Algorithme épuré

```typescript
// --- Paramètres : Assurance-emploi (AE) — taux réduit du Québec ---
export interface ParamsAE {
  mra: number;   // maximum de la rémunération assurable ($)
  seuil: number; // rémunération assurable min. ; en deçà, cotisation remboursée (art. 96(4) LAE)
  taux: number;  // taux de cotisation (part employé, taux réduit du Québec)
}

export const AE: Record<Annee, ParamsAE> = {
  2025: { mra: 65_700, seuil: 2000, taux: 0.0131 },
  2026: { mra: 68_900, seuil: 2000, taux: 0.0130 },
};

/** Cotisation AE d'un adulte sur son revenu de travail assurable. */
export function cotisationAE(revenuAssurable: number, annee: Annee): number {
  const p = AE[annee];
  if (revenuAssurable <= p.seuil) return 0;          // ≤ 2 000 $ : cotisation remboursée (art. 96(4))
  return Math.min(revenuAssurable, p.mra) * p.taux;  // pas d'exemption : prime sur le plein montant, plafonné au MRA
}

/** Cotisation AE du ménage (= CA_ae). */
export function aeMenage(menage: Menage, annee: Annee): number {
  const revenus = [menage.revenu1];
  if (SITUATIONS[menage.situation].nbAdultes === 2) revenus.push(menage.revenu2);
  return revenus.reduce((tot, r) => tot + cotisationAE(r, annee), 0);
}
```

> **Note** : modèle **salarié** (part d'employé), au **taux réduit du Québec** — le résident du Québec cotise moins que le reste du Canada parce que le RQAP couvre les prestations de maternité/paternité/parentales/adoption (art. 69(2) LAE). Comme le RQAP, l'AE **n'a pas d'exemption** : la prime porte sur le plein revenu assurable jusqu'au MRA, dès le seuil de 2 000 $ franchi. Le cas du travailleur autonome (participation optionnelle au régime) n'est pas traité.

---

### Poste 4 — FSS (Fonds des services de santé) — cotisation des particuliers

**Sortie :** `QC_fss` (cotisation **totale** du ménage). Aucune sortie `_bonif`.
**Base légale :** *Loi sur la Régie de l'assurance maladie du Québec* (RLRQ, c. R-5), **art. 38 à 40**. Cotisation reportée à la **ligne 446** de la déclaration de revenus, calculée à l'**annexe F** (TP-1) ; les seuils sont indexés annuellement avec le régime d'imposition des particuliers. **Distincte** de la cotisation **de l'employeur** au FSS (assise sur la masse salariale) — sans objet ici.

#### Structure (confirmée dans le code)

Traçage : `c1C42 = arr2xD75D79[3][0]` → (remappage interne) `arr2xT425T429[4][0] = c2T389 × (−1)` ; `c2T389 = round(c2T383 + c2T388, 2)`, avec `c2T383 = c2T381 + c2T382` (adulte 1) et `c2T388 = c2T386 + c2T387` (adulte 2). Chaque adulte : **deux tranches additives**, chacune plafonnée. Pour l'adulte 1 (base `c2T380`) :

`c2T381 = min( max(0, base − seuil₁) × taux₁ , plafond₁ )`  (1ʳᵉ tranche)
`c2T382 = min( max(0, base − seuil₂) × taux₂ , plafond₂ )`  (2ᵉ tranche)

**Base de revenu** (déterminante) : `c2T380 = arr2xT38T38[0] = arr2xT18T19[0] = (retraité) ? Revenu1 : 0`. Le drapeau vient de la **colonne G** de la table des situations (`c2G11 = 1` ⟺ retraité ; voir §4). Donc :

- Le revenu n'est assujetti au FSS **que pour les ménages retraités** (situations 3 et 4). Pour les actifs (0, 1, 2), la base est nulle → `QC_fss = 0`. Cela reflète la règle légale : le **revenu d'emploi est exclu** du revenu assujetti des particuliers ; sont visés les revenus de retraite, d'entreprise, de biens et les gains en capital (S9).
- Cotisation **individuelle** : calculée par adulte (`c2T383` = adulte 1, `c2T388` = adulte 2) puis sommée sur le ménage.
- Stockée en négatif (réduit le revenu disponible) ; calculée en positif ci-dessous.
- Convention de colonnes : **2025 = colonne T** (paramètres colonne M) ; **2026 = colonne S** (paramètres colonne L).

> ⚠️ **Approximation du modèle** : le code assimile l'intégralité du `Revenu` d'un retraité à du « revenu assujetti » au FSS. La base statutaire réelle (« revenu total » de l'annexe F) **exclut** notamment le revenu d'emploi et la pension de la Sécurité de la vieillesse (PSV), et tient compte de certaines déductions (S9). La PSV est traitée séparément en aval (poste 17, `CA_psv`).

#### Paramètres vérifiés (`c2…260/261/263/264`, `arr2x…262/265`)

| Paramètre | 2025 (M) | 2026 (L) | Source |
|---|---|---|---|
| Seuil — 1ʳᵉ tranche (`…260`) | 18 130 $ | 18 500 $ | S10 |
| Taux — 1ʳᵉ tranche (`…261`) | 1 % | 1 % | S10 |
| Plafond — 1ʳᵉ tranche (`…262`) | 150 $ | 150 $ | S10 |
| Seuil — 2ᵉ tranche (`…263`) | 63 060 $ | 64 355 $ | S10 |
| Taux — 2ᵉ tranche (`…264`) | 1 % | 1 % | S10 |
| Plafond — 2ᵉ tranche (`…265`) | 850 $ | 850 $ | S10 (= max 1 000 − 150) |
| **Cotisation maximale** | 1 000 $ | 1 000 $ | S9, S10 |

**Vérifications :**
- Formule officielle 1ʳᵉ tranche (MFQ, *Bulletin 2025-8*, pour 2026) : cotisation = « le moins élevé de 150 $ et de 1 % de l'excédent du revenu total […] sur 18 500 $ » — identique à `min(max(0, base − 18 500) × 1 %, 150)` (S10).
- Profil 2025 reproduit (S10) : nul jusqu'à 18 130 $ ; atteint 150 $ à 33 130 $ (= 18 130 + 15 000) ; **plateau** de 150 $ jusqu'à 63 060 $ ; croît ensuite jusqu'au maximum de **1 000 $** à 148 060 $ (= 63 060 + 85 000).
- Maximum = plafond₁ + plafond₂ = 150 + 850 = **1 000 $** — concorde avec le maximum publié (S9, S10).

#### Algorithme épuré

```typescript
// --- Paramètres : FSS (cotisation des particuliers) ---
export interface ParamsFSS {
  seuil1: number;   // seuil de la 1ʳᵉ tranche ($)
  taux1: number;    // taux 1ʳᵉ tranche
  plafond1: number; // plafond 1ʳᵉ tranche ($)
  seuil2: number;   // seuil de la 2ᵉ tranche ($)
  taux2: number;    // taux 2ᵉ tranche
  plafond2: number; // plafond 2ᵉ tranche ($)
}

export const FSS: Record<Annee, ParamsFSS> = {
  2025: { seuil1: 18_130, taux1: 0.01, plafond1: 150, seuil2: 63_060, taux2: 0.01, plafond2: 850 },
  2026: { seuil1: 18_500, taux1: 0.01, plafond1: 150, seuil2: 64_355, taux2: 0.01, plafond2: 850 },
};

/** Cotisation FSS d'un particulier sur son revenu assujetti (deux tranches additives, chacune plafonnée). */
export function cotisationFSS(revenuAssujetti: number, annee: Annee): number {
  const p = FSS[annee];
  const t1 = Math.min(Math.max(0, revenuAssujetti - p.seuil1) * p.taux1, p.plafond1);
  const t2 = Math.min(Math.max(0, revenuAssujetti - p.seuil2) * p.taux2, p.plafond2);
  return t1 + t2; // maximum = plafond1 + plafond2 = 1 000 $
}

/** Cotisation FSS du ménage (= QC_fss). */
export function fssMenage(menage: Menage, annee: Annee): number {
  // Le revenu d'emploi est exclu du revenu assujetti (art. 38-40 R-5) : dans ce modèle,
  // seuls les ménages retraités ont une base FSS (revenu de retraite).
  if (!SITUATIONS[menage.situation].retraite) return 0;
  const revenus = [menage.revenu1];
  if (SITUATIONS[menage.situation].nbAdultes === 2) revenus.push(menage.revenu2);
  return revenus.reduce((tot, r) => tot + cotisationFSS(r, annee), 0);
}
```

> **Note** : la cotisation est **individuelle** (par adulte, puis sommée). Le `Revenu` des situations « retraité » sert ici de proxy au revenu assujetti de l'annexe F. Le crédit d'impôt de 20 % autrefois rattaché au FSS n'existe plus (S9).

---

### Poste 5 — RAMQ (régime public d'assurance médicaments) — prime annuelle

**Sortie :** `QC_ramq` (prime **totale** du ménage). Aucune sortie `_bonif`.
**Base légale :** *Loi sur l'assurance médicaments* (RLRQ, c. A-29.01), **art. 10, 23, 24**. Prime calculée à l'**annexe K** (TP-1.D.K) et reportée à la **ligne 447** du TP-1. Les taux et la prime maximale sont révisés le **1ᵉʳ juillet** de chaque année ; les seuils d'exonération sont indexés le **1ᵉʳ janvier** avec le régime d'imposition des particuliers.

#### Structure (confirmée dans le code)

Traçage : `c1C43 = arr2xD75D79[4][0] = arr2xT425T429[3][0] = c2T376 × (−1)` (2025) ; `c1D43 = … = c2S376 × (−1)` (2026) — lignes 23142-23143, 23125-23126, 23238-23239. Par adulte (`c2T375`) :

`base = max(0, revenuFamilialNet − exonération[nbAdultes][nbEnfants])`
`c2T375 = min( taux₁ × min(5000, base) + taux₂ × max(0, base − 5000) , primeMax )`

et le total du ménage `c2T376 = round( (exonéré₁ ? 0 : c2T375) + (couple ? (exonéré₂ ? 0 : c2T375) : 0) , 2)`. Donc :

- `QC_ramq` = prime calculée sur le **revenu familial net** (`c2T271 = c2T223 + c2T249` = somme des **lignes 275** des adultes), **plafonnée par adulte** ; un **couple paie 2 ×** la prime (le barème « avec conjoint » est à **demi-taux**, et la même prime `c2T375` s'applique aux deux conjoints).
- **Deux tranches** au-dessus de l'exonération : 1ʳᵉ tranche sur les premiers **5 000 $** (`arr2x…278`), 2ᵉ tranche sur l'excédent ; le total est plafonné à la **prime maximale** (`arr2x…273`).
- L'**exonération** dépend de la composition : `c2C11` (= nb d'adultes, 1 ou 2) et `c2C38` (= nb d'enfants, regroupés 0 / 1 / 2+). Les 6 seuils sont sélectionnés par les indices `arr2x…366-371` (lignes 20902-20965).
- **Exonérations individuelles** (prime forcée à 0 pour un adulte) : aide financière de **dernier recours** (`c2T302 > 0`) ; ou **65 ans ou plus** touchant le **SRG maximal** — ou ≥ 94 % de celui-ci (`âge ≥ 65 ET c2T31 ≥ 0,94 × c2T24`), lignes 22897-22934. Confirmées par RAMQ/Revenu Québec (S11, S12).
- Le code stocke le total en négatif (réduit le revenu disponible) ; calculé en positif ci-dessous.
- Convention de colonnes : **2025 = colonne T** (paramètres col. M) ; **2026 = colonne S** (paramètres col. L).

> ⚠️ **Convention temporelle du modèle.** Pour l'année civile *Y*, le modèle combine le **barème** (taux + prime max) de la **période tarifaire en cours au 1ᵉʳ janvier** (débutée en juillet *Y−1*) avec les **seuils d'exonération indexés pour *Y*** (1ᵉʳ janvier). Concrètement : la colonne « 2025 » prend le barème de l'**Annexe K 2024** (période juill. 2024–juin 2025) et les seuils de l'**Annexe K 2025** ; la colonne « 2026 » prend le barème de l'**Annexe K 2025** (période juill. 2025–juin 2026) et les seuils indexés 2026. Chaque colonne est donc un instantané cohérent « au 1ᵉʳ janvier », mais le barème y est décalé d'une année-formulaire par rapport aux seuils.

#### Paramètres vérifiés (`arr2x…273/278`, `c2…274-277`, `c2…279-284`)

| Paramètre | 2025 (M) | 2026 (L) | Source |
|---|---|---|---|
| Prime maximale par adulte (`…273`) | 744 $ | 766 $ | S11, S12 |
| Largeur de la 1ʳᵉ tranche (`…278`) | 5 000 $ | 5 000 $ | S11 |
| Taux **sans conjoint** — tr. 1 / tr. 2 (`…274/275`) | 7,65 % / 11,48 % | 7,84 % / 11,76 % | S11 |
| Taux **avec conjoint** — tr. 1 / tr. 2 (`…276/277`) | 3,84 % / 5,75 % | 3,93 % / 5,89 % | S11 |
| Exonération 1 adulte — 0 / 1 / 2+ enf. (`…279/280/281`) | 19 890 / 32 240 / 36 460 $ | 20 290 / 32 890 / 37 195 $ | S11\* |
| Exonération 2 adultes — 0 / 1 / 2+ enf. (`…282/283/284`) | 32 240 / 36 460 / 40 360 $ | 32 890 / 37 195 / 41 175 $ | S11\* |

**Vérifications (contre l'Annexe K officielle) :**
- Barème **2025** (= modèle col. M) confirmé à l'**Annexe K 2024**, ligne 80 : sans conjoint **7,65 % / 11,48 %**, avec conjoint **3,84 % / 5,75 %**, prime max **744 $** (ligne 83) — la période juill. 2024–juin 2025.
- Barème **2026** (= modèle col. L) confirmé à l'**Annexe K 2025**, ligne 80 : **7,84 % / 11,76 %** et **3,93 % / 5,89 %**, prime max **766 $** — la période juill. 2025–juin 2026.
- Seuils **2025** confirmés à l'**Annexe K 2025** (lignes 41-44) : base sans conjoint 19 890 $, avec conjoint 32 240 $ ; suppléments enfants — avec conjoint +4 220 $ (1 enf.) / +8 120 $ (2+) ; sans conjoint +12 350 $ / +16 570 $. D'où exactement 19 890 / 32 240 / 36 460 (1 ad.) et 32 240 / 36 460 / 40 360 (2 ad.). Noter l'équivalence « 1 adulte + 1 enfant = 2 adultes + 0 enfant » (32 240 $).
- Contrôle des **maximums** : prime/adulte plafonnée → 744 $ (2025) / 766 $ (2026) ; **ménage couple = 2 ×** → 1 488 $ / 1 532 $. Les bornes de colonne B de l'Annexe K (14 600 $ en 2024, 14 669 $ en 2025) sont des **conséquences** du barème « avec conjoint » (revenu où la prime du conjoint plafonne), non des paramètres — elles confirment la cohérence interne.
- \* **2026 — seuils d'exonération** : extraits du code et cohérents avec l'indexation officielle 2026 (≈ 2 %), mais l'**Annexe K 2026 n'est pas encore publiée** (fichier daté de déc. 2025) → marqués **⚠️ à confirmer** dès parution. Le **barème** 2026 (taux + prime max), lui, est confirmé car il provient de l'Annexe K **2025** déjà publiée.

#### Algorithme épuré

```typescript
// --- Paramètres : RAMQ (assurance médicaments) ---
export interface BaremeRAMQ {
  tranche1: number; // taux sur la 1ʳᵉ tranche (les premiers 5 000 $ au-dessus de l'exonération)
  tranche2: number; // taux sur l'excédent
}

export interface ParamsRAMQ {
  primeMax: number;        // prime maximale par adulte ($)
  largeurTranche1: number; // largeur de la 1ʳᵉ tranche de revenu ($)
  taux: Record<1 | 2, BaremeRAMQ>;                    // selon le nombre d'adultes (1 = sans conjoint ; 2 = avec conjoint, à demi-taux)
  exemption: Record<1 | 2, [number, number, number]>; // seuil [0, 1, 2+ enfants] selon le nombre d'adultes
}

export const RAMQ: Record<Annee, ParamsRAMQ> = {
  // Barème : Annexe K 2024 (période juill. 2024–juin 2025). Seuils : Annexe K 2025.
  2025: {
    primeMax: 744, largeurTranche1: 5000,
    taux: { 1: { tranche1: 0.0765, tranche2: 0.1148 }, 2: { tranche1: 0.0384, tranche2: 0.0575 } },
    exemption: { 1: [19_890, 32_240, 36_460], 2: [32_240, 36_460, 40_360] },
  },
  // Barème : Annexe K 2025 (période juill. 2025–juin 2026). Seuils : indexés 2026 (⚠️ Annexe K 2026 non publiée).
  2026: {
    primeMax: 766, largeurTranche1: 5000,
    taux: { 1: { tranche1: 0.0784, tranche2: 0.1176 }, 2: { tranche1: 0.0393, tranche2: 0.0589 } },
    exemption: { 1: [20_290, 32_890, 37_195], 2: [32_890, 37_195, 41_175] },
  },
};

/** Prime RAMQ d'un adulte, fonction du revenu familial net (somme des lignes 275 des adultes). */
export function primeRAMQparAdulte(revenuFamilialNet: number, nbAdultes: 1 | 2, nbEnfants: number, annee: Annee): number {
  const p = RAMQ[annee];
  const exemption = p.exemption[nbAdultes][Math.min(Math.max(nbEnfants, 0), 2)];
  const base = Math.max(0, revenuFamilialNet - exemption);
  const { tranche1, tranche2 } = p.taux[nbAdultes];
  const prime = tranche1 * Math.min(p.largeurTranche1, base) + tranche2 * Math.max(0, base - p.largeurTranche1);
  return Math.min(prime, p.primeMax); // plafonnée à la prime maximale par adulte
}

/** Prime RAMQ du ménage (= QC_ramq). Couple : 2 × la prime (barème « avec conjoint », à demi-taux). */
export function ramqMenage(menage: Menage, revenuFamilialNet: number, annee: Annee): number {
  const { nbAdultes } = SITUATIONS[menage.situation];
  const parAdulte = primeRAMQparAdulte(revenuFamilialNet, nbAdultes, menage.enfants.length, annee);
  return parAdulte * nbAdultes;
}
```

> **Notes** : (1) La prime porte sur le **revenu familial net** (commun aux conjoints), pas sur le revenu de travail individuel — il faut donc le **fournir** en entrée (produit par le calcul d'impôt en aval, non encore construit). (2) Les **exonérations individuelles** (aide de dernier recours ; aîné touchant le SRG maximal) ne sont **pas appliquées** ici : elles dépendent de postes non encore construits (aide sociale ; PSV/SRG, poste 17). (3) Le modèle utilise `NbEnfants` comme proxy des « enfants à charge » au sens de l'annexe K.

---

### Poste 6 — Frais de garde : crédit d'impôt remboursable pour frais de garde d'enfants

**Sorties :** `QC_garde` (crédit **remboursable**, ménage) ; `Frais_garde` (coût total de garde — voir notes). Aucune sortie `_bonif`.
**Base légale :** *Loi sur les impôts* (RLRQ, c. I-3), **art. 1029.8.67 et suivants** ; crédit demandé à l'**annexe C** (TP-1.D.C). Le revenu déterminant est le **revenu familial net** (somme des lignes 275 des adultes — même base que la RAMQ).

#### Structure (confirmée dans le code)

Traçage : `QC_garde` = `c2T332` (2025) / `c2S332` (2026) = `arr2xT414T422[5][0]` = `arr2xD59D62[0][0]` (lignes 23226-23227, 23242-23243, 23308-23309). Et :

`c2T332 = round( c2M327 × c2M322 , 2 )` — soit **taux × frais admissibles**.

- **Taux** `c2M322 = max(arr2xM314M321[0..7])`, où `arr2xM314M321[i] = (revenuFamilialNet ≤ seuil_i) ? taux_i : 0`. Les taux (colonne **K**, constants) décroissent de 78 % à 67 % ; les seuils (colonnes M/L) sont indexés. Le `max` sélectionne le taux du palier applicable.
- **Frais admissibles** `c2M327 = min(arr2xM324M324, arr2xE46E46)` :
  - `arr2xE46E46` = Σ des frais de garde **non subventionnés** des enfants (`type_garde ≠ « Subventionnée »`) ;
  - `arr2xM324M324` = Σ, sur les enfants ayant des frais non subventionnés > 0, du **plafond par enfant** (`c2M307` si moins de 7 ans, sinon `c2M308`).
- L'**admissibilité** d'un enfant tient à l'âge : `< 16 ans` en 2025 (drapeau `G33G37`), `< 14 ans` dès 2026 (drapeau `F33F37`).
- Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).

> ⚠️ **Plafonnement agrégé.** Le fichier borne la **somme** des frais par la **somme** des plafonds (`min(Σplafond, Σfrais)`) au lieu de plafonner enfant par enfant. Cela peut surévaluer les frais admissibles si un enfant dépasse son plafond pendant qu'un autre est en deçà.

> ⚠️ **Seuil « moins de 7 ans ».** La règle officielle accorde le plafond élevé à l'enfant **de moins de 7 ans** (âge ≤ 6). Le fichier compare l'âge à 5 (`c2D33 = (âge > 5) ? 0 : 1`) : un enfant de 6 ans reçoit le plafond réduit. Divergence d'un an, reproduite par fidélité au modèle.

#### Paramètres vérifiés (`c2K297..K304`, `c2M/L297..303`, `c2M/L307/308`)

Barème du taux (taux constants ; seuils de revenu familial net indexés) — *MFQ, Paramètres 2026, tableau 5* (S10) :

| Revenu familial net | Taux | Seuil 2025 (M) | Seuil 2026 (L) |
| --- | --- | --- | --- |
| ≤ seuil 0 | 78 % | 24 795 | 25 305 |
| ≤ seuil 1 | 75 % | 43 725 | 44 620 |
| ≤ seuil 2 | 74 % | 45 340 | 46 270 |
| ≤ seuil 3 | 73 % | 46 970 | 47 935 |
| ≤ seuil 4 | 72 % | 48 570 | 49 565 |
| ≤ seuil 5 | 71 % | 50 195 | 51 225 |
| ≤ seuil 6 | 70 % | 119 835 | 122 290 |
| au-delà | 67 % | — | — |

Plafonds annuels des frais admissibles par enfant — *MFQ, Paramètres 2026* (S10) :

| Plafond | 2025 (M) | 2026 (L) |
| --- | --- | --- |
| Enfant de moins de 7 ans (`…307`) | 12 275 $ | 12 525 $ |
| Autre enfant admissible (`…308`) | 6 180 $ | 6 305 $ |
| Enfant handicapé (**non modélisé**) | 16 800 $ | 17 145 $ |

**Vérifications :**
- Barème de taux et plafonds confirmés **exactement** au document officiel MFQ (S10), années 2025 **et** 2026 côte à côte (tableau 5 + tableau des plafonds).
- Indexation 2026 ≈ 2,05 % cohérente (ex. 12 275 × 1,0205 ≈ 12 525 ; 24 795 × 1,0205 ≈ 25 305).
- Admissibilité : enfant **de moins de 16 ans** (ou handicapé, tout âge), confirmé par Revenu Québec (S13). **Dès 2026**, l'âge maximal passe à **moins de 14 ans** (S13) — reflété dans le code par le passage du drapeau `G33G37` (< 16) à `F33F37` (< 14).
- Le plafond « enfant handicapé » (16 800/17 145 $) et le revenu maximal de l'enfant admissible (13 658/13 938 $) figurent à la source mais **ne sont pas modélisés** (aucune entrée handicap ni revenu d'enfant).

#### Algorithme épuré

```typescript
// --- Paramètres : crédit pour frais de garde ---
export interface PalierTauxGarde { plafond: number; taux: number; } // revenu familial net ≤ plafond → taux

export interface ParamsGarde {
  taux: PalierTauxGarde[]; // paliers ascendants ; dernier = plancher (plafond Infinity)
  plafondJeune: number;    // moins de 7 ans ($)
  plafondAutre: number;    // autre enfant admissible ($)
  ageMax: number;          // âge d'admissibilité (exclusif) : 16 (2025) ; 14 (2026 et suiv.)
}

export const GARDE: Record<Annee, ParamsGarde> = {
  2025: {
    taux: [
      { plafond: 24_795, taux: 0.78 }, { plafond: 43_725, taux: 0.75 }, { plafond: 45_340, taux: 0.74 },
      { plafond: 46_970, taux: 0.73 }, { plafond: 48_570, taux: 0.72 }, { plafond: 50_195, taux: 0.71 },
      { plafond: 119_835, taux: 0.7 }, { plafond: Infinity, taux: 0.67 },
    ],
    plafondJeune: 12_275, plafondAutre: 6_180, ageMax: 16,
  },
  2026: {
    taux: [
      { plafond: 25_305, taux: 0.78 }, { plafond: 44_620, taux: 0.75 }, { plafond: 46_270, taux: 0.74 },
      { plafond: 47_935, taux: 0.73 }, { plafond: 49_565, taux: 0.72 }, { plafond: 51_225, taux: 0.71 },
      { plafond: 122_290, taux: 0.7 }, { plafond: Infinity, taux: 0.67 },
    ],
    plafondJeune: 12_525, plafondAutre: 6_305, ageMax: 14,
  },
};

/** Taux du crédit selon le revenu familial net (décroît de 78 % à 67 %). */
export function tauxCreditGarde(revenuFamilialNet: number, annee: Annee): number {
  const paliers = GARDE[annee].taux;
  const palier = paliers.find((p) => revenuFamilialNet <= p.plafond);
  return (palier ?? paliers[paliers.length - 1]).taux;
}

/** Plafond des frais admissibles d'un enfant selon l'âge (⚠️ fichier : « jeune » = âge ≤ 5 ; handicap non modélisé). */
export function plafondFraisEnfant(age: number, annee: Annee): number {
  const p = GARDE[annee];
  if (age <= 5) return p.plafondJeune;
  if (age < p.ageMax) return p.plafondAutre;
  return 0;
}

export interface EnfantGarde { age: number; fraisAdmissibles: number; } // frais NON subventionnés

/** Crédit pour frais de garde (= QC_garde) = taux × min(Σ plafonds, Σ frais admissibles). */
export function creditFraisGarde(revenuFamilialNet: number, enfants: EnfantGarde[], annee: Annee): number {
  const taux = tauxCreditGarde(revenuFamilialNet, annee);
  const plafondTotal = enfants.reduce((s, e) => s + (e.fraisAdmissibles > 0 ? plafondFraisEnfant(e.age, annee) : 0), 0);
  const fraisTotal = enfants.reduce((s, e) => s + e.fraisAdmissibles, 0);
  return Math.round(taux * Math.min(plafondTotal, fraisTotal) * 100) / 100; // plafonnement agrégé (⚠️)
}
```

> **Notes** : (1) `Frais_garde` (= `c2C46 + arr2xE46E46`) est le **coût total** de garde — contribution des places subventionnées **plus** frais non subventionnés —, c.-à-d. un report des saisies sans paramètre fiscal ; seuls les frais **non subventionnés** alimentent le crédit. (2) Le revenu familial net doit être **fourni** (produit par le calcul d'impôt en aval, non encore construit). (3) Le crédit étant **remboursable**, il accroît le revenu disponible même en l'absence d'impôt à payer.

---

### Poste 7 — Allocation famille (ancien « Soutien aux enfants »)

**Sortie :** `QC_sae` (allocation **remboursable** totale du ménage). Aucune sortie `_bonif`.
**Base légale :** *Loi sur les impôts* (RLRQ, c. I-3), **art. 1029.8.61.8 à 1029.8.61.60**. Prestation versée par **Retraite Québec**, modulée selon le **revenu familial net** (somme des lignes 275).

#### Structure (confirmée dans le code)

Traçage : `QC_sae` = `c2T326` (2025) / `c2S326` (2026) = `arr2xD53D58[2][0]` (lignes 22761-22762, 23013-23014). Et :

`c2T326 = round( max(0, max( minimum , maximum − réduction )) , 2 )`

- **maximum** = Σ_enfant montant max par enfant (`c2M188-191`, identiques quel que soit le rang) + **supplément monoparental** (`c2M192`, si 1 adulte).
- **minimum** = Σ_enfant montant min par enfant (`c2M197-200`) + supplément monoparental min (`c2M201`, si 1 adulte).
- **réduction** = `max(0, revenuFamilialNet − seuil) × 4 %` — `c2T319` (1 adulte, seuil `c2M193`) ou `c2T320` (2 adultes, seuil `c2M195`).
- Le **minimum** est un **plancher** versé à toute famille admissible quel que soit le revenu : la réduction ne peut l'entamer.
- Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).

> ⚠️ Le modèle traite tous les `NbEnfants` saisis comme **admissibles** (enfants de moins de 18 ans) — aucun filtre d'âge n'est appliqué à l'allocation de base.

#### Paramètres vérifiés (`c2M/L188-201`, `c2M/L193-196`)

*MFQ, Paramètres 2026* (S10), confirmés par Retraite Québec / CFFP (S14) :

| Paramètre | 2025 (M) | 2026 (L) |
| --- | --- | --- |
| Montant **maximal** par enfant (`…188-191`) | 3 006 $ | 3 068 $ |
| Montant **minimal** par enfant (`…197-200`) | 1 196 $ | 1 221 $ |
| Supplément monoparental — max (`…192`) | 1 055 $ | 1 077 $ |
| Supplément monoparental — min (`…201`) | 421 $ | 430 $ |
| Seuil de réduction — monoparentale (`…193`) | 43 280 $ | 44 032 $ |
| Seuil de réduction — couple (`…195`) | 59 369 $ | 60 398 $ |
| Taux de réduction (`…194/196`) | 4 % | 4 % |

**Vérifications :**
- Montants et seuils confirmés **exactement** au document MFQ (S10), années 2025 et 2026 côte à côte (rubrique « Allocation famille »).
- Taux de réduction de **4 %** et structure (maximum réduit jusqu'au minimum, plancher versé à tous) confirmés par Retraite Québec / CFFP (S14).
- Le montant **maximal par enfant est uniforme** (rangs 1 à 4+ identiques) depuis la réforme de 2019.
- **Non inclus dans `QC_sae`** (composantes distinctes figurant à la source mais hors de ce calcul) : supplément pour l'achat de **fournitures scolaires** (124/127 $ par enfant) et suppléments pour **enfant handicapé** (236/241 $ par mois ; soins exceptionnels). Le modèle n'a pas d'entrée « handicap ».

#### Algorithme épuré

```typescript
// --- Paramètres : Allocation famille ---
export interface ParamsAllocationFamille {
  maxParEnfant: number;      // montant maximal par enfant ($)
  minParEnfant: number;      // montant minimal par enfant — versé à toutes les familles ($)
  suppMonoMax: number;       // supplément famille monoparentale — max ($)
  suppMonoMin: number;       // supplément famille monoparentale — min ($)
  seuilMonoparental: number; // seuil de réduction — 1 adulte ($)
  seuilCouple: number;       // seuil de réduction — 2 adultes ($)
  tauxReduction: number;     // taux de réduction au-delà du seuil
}

export const ALLOCATION_FAMILLE: Record<Annee, ParamsAllocationFamille> = {
  2025: { maxParEnfant: 3006, minParEnfant: 1196, suppMonoMax: 1055, suppMonoMin: 421, seuilMonoparental: 43_280, seuilCouple: 59_369, tauxReduction: 0.04 },
  2026: { maxParEnfant: 3068, minParEnfant: 1221, suppMonoMax: 1077, suppMonoMin: 430, seuilMonoparental: 44_032, seuilCouple: 60_398, tauxReduction: 0.04 },
};

/** Allocation famille (= QC_sae) : maximum réduit de 4 % au-delà du seuil, plancher = minimum versé à tous. */
export function allocationFamille(revenuFamilialNet: number, nbEnfants: number, nbAdultes: 1 | 2, annee: Annee): number {
  if (nbEnfants <= 0) return 0;
  const p = ALLOCATION_FAMILLE[annee];
  const monoparental = nbAdultes === 1;
  const maximum = nbEnfants * p.maxParEnfant + (monoparental ? p.suppMonoMax : 0);
  const minimum = nbEnfants * p.minParEnfant + (monoparental ? p.suppMonoMin : 0);
  const seuil = monoparental ? p.seuilMonoparental : p.seuilCouple;
  const reduction = Math.max(0, revenuFamilialNet - seuil) * p.tauxReduction;
  return Math.round(Math.max(minimum, maximum - reduction) * 100) / 100;
}

/** Allocation famille du ménage (= QC_sae). */
export function allocationFamilleMenage(menage: Menage, revenuFamilialNet: number, annee: Annee): number {
  const { nbAdultes } = SITUATIONS[menage.situation];
  return allocationFamille(revenuFamilialNet, menage.enfants.length, nbAdultes, annee);
}
```

> **Notes** : (1) Le revenu familial net doit être **fourni** (produit par le calcul d'impôt en aval, non encore construit). (2) Allocation **remboursable** : elle accroît le revenu disponible indépendamment de l'impôt à payer. (3) « Monoparentale » = ménage à **1 adulte** avec enfants ; il bénéficie du supplément **et** d'un seuil de réduction plus bas que le couple.

---

### Poste 8 — Prime au travail (générale)

**Sortie :** `QC_pt` (prime **remboursable** du ménage). Aucune sortie `_bonif`.
**Base légale :** *Loi sur les impôts* (RLRQ, c. I-3), **art. 1029.8.116.1 à 1029.8.116.11**. Crédit remboursable ; la **croissance** porte sur le **revenu de travail**, la **réduction** sur le **revenu familial net**.

#### Structure (confirmée dans le code)

Traçage : `QC_pt` = `c2T343` (2025) / `c2S343` (2026) = `arr2xD53D58[4][0]` (lignes 23015-23016, 23128-23129). Et :

`c2T343 = round( max(0, croissance − réduction) , 2 )`

- **croissance** = `min( max(0, revenuTravail − exclu) × tauxCroissance , primeMax )` (composantes `c2T335-338`).
- **réduction** = `max(0, revenuFamilialNet − seuilRéduction) × 10 %` (composantes `c2T339-342`).
- **Quatre types de ménage** = (1 ou 2 adultes) × (sans / avec enfants), sélectionnés par `c2T6` (= 0 si 1 adulte) et `c2T7` (nb d'enfants) ; une seule paire croissance/réduction est active.
- Particularité : `primeMax = (seuilRéduction − exclu) × tauxCroissance` — la prime plafonne lorsque le revenu de travail atteint le seuil de réduction.
- Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).

> ⚠️ Seule la **prime au travail générale** est calculée. La **prime au travail adaptée** (personnes présentant des contraintes sévères à l'emploi ; montants plus élevés) figure à la source mais n'est **pas modélisée** (aucune entrée « contraintes sévères »).

#### Paramètres vérifiés (`c2M/L205-224`, `arr2xM/L213-216`)

*MFQ, Paramètres 2026* (S10), confirmés par Revenu Québec / CFFP (S15). Taux de réduction : **10 %** (tous types, les deux années).

| Type de ménage | Travail exclu | Croissance | Prime max 2025 | Prime max 2026 | Seuil réduc. 2025 / 2026 |
| --- | --- | --- | --- | --- | --- |
| Personne seule | 2 400 $ | 11,6 % | 1 185,52 $ | 1 207,33 $ | 12 620 / 12 808 $ |
| Couple sans enfants | 3 600 $ | 11,6 % | 1 848,34 $ | 1 882,45 $ | 19 534 / 19 828 $ |
| Famille monoparentale | 2 400 $ | 30 % | 3 066,00 $ | 3 122,40 $ | 12 620 / 12 808 $ |
| Couple avec enfants | 3 600 $ | 25 % | 3 983,50 $ | 4 057,00 $ | 19 534 / 19 828 $ |

**Vérifications :**
- Montants maximaux et seuils de réduction confirmés **exactement** au document MFQ (S10), 2025 et 2026 (« Prime au travail générale »).
- Taux de croissance (11,6 / 30 / 25 %), revenu de travail exclu (2 400 / 3 600 $) et taux de réduction (10 %) confirmés par Revenu Québec / CFFP (S15).
- Cohérence interne : `primeMax = (seuilRéduction − exclu) × tauxCroissance` pour les 4 types (ex. personne seule : (12 620 − 2 400) × 11,6 % = 1 185,52 ; couple avec enfants : (19 534 − 3 600) × 25 % = 3 983,50).
- Le code stocke la prime max du couple sans enfants à `1 848,344` (produit exact) ; le MFQ l'affiche arrondie à `1 848,34`.

#### Algorithme épuré

```typescript
// --- Paramètres : Prime au travail générale ---
export interface ParamsTypePT {
  revenuTravailExclu: number; // revenu de travail exclu / minimum ($)
  tauxCroissance: number;     // taux de croissance sur le revenu de travail excédentaire
  primeMax: number;           // prime maximale ($)
  seuilReduction: number;     // seuil de réduction (revenu familial net) ($)
}

export interface ParamsPrimeTravail {
  tauxReduction: number; // taux de réduction au-delà du seuil (commun)
  parType: Record<1 | 2, { sansEnfants: ParamsTypePT; avecEnfants: ParamsTypePT }>;
}

export const PRIME_TRAVAIL: Record<Annee, ParamsPrimeTravail> = {
  2025: { tauxReduction: 0.1, parType: {
    1: { sansEnfants: { revenuTravailExclu: 2400, tauxCroissance: 0.116, primeMax: 1185.52, seuilReduction: 12_620 },
         avecEnfants: { revenuTravailExclu: 2400, tauxCroissance: 0.3,   primeMax: 3066,    seuilReduction: 12_620 } },
    2: { sansEnfants: { revenuTravailExclu: 3600, tauxCroissance: 0.116, primeMax: 1848.344, seuilReduction: 19_534 },
         avecEnfants: { revenuTravailExclu: 3600, tauxCroissance: 0.25,  primeMax: 3983.5,  seuilReduction: 19_534 } } } },
  2026: { tauxReduction: 0.1, parType: {
    1: { sansEnfants: { revenuTravailExclu: 2400, tauxCroissance: 0.116, primeMax: 1207.328, seuilReduction: 12_808 },
         avecEnfants: { revenuTravailExclu: 2400, tauxCroissance: 0.3,   primeMax: 3122.4,  seuilReduction: 12_808 } },
    2: { sansEnfants: { revenuTravailExclu: 3600, tauxCroissance: 0.116, primeMax: 1882.448, seuilReduction: 19_828 },
         avecEnfants: { revenuTravailExclu: 3600, tauxCroissance: 0.25,  primeMax: 4057,    seuilReduction: 19_828 } } } },
};

/** Prime au travail générale (= QC_pt) : croissance sur le revenu de travail, réduction de 10 % sur le revenu familial net. */
export function primeAuTravail(revenuTravail: number, revenuFamilialNet: number, nbAdultes: 1 | 2, aDesEnfants: boolean, annee: Annee): number {
  const p = PRIME_TRAVAIL[annee];
  const t = p.parType[nbAdultes][aDesEnfants ? "avecEnfants" : "sansEnfants"];
  const croissance = Math.min(Math.max(0, revenuTravail - t.revenuTravailExclu) * t.tauxCroissance, t.primeMax);
  const reduction = Math.max(0, revenuFamilialNet - t.seuilReduction) * p.tauxReduction;
  return Math.round(Math.max(0, croissance - reduction) * 100) / 100;
}
```

> **Notes** : (1) Deux bases distinctes — **revenu de travail** (croissance) et **revenu familial net** (réduction) —, toutes deux fournies par le calcul amont. (2) Prime **remboursable**. (3) Pour un ménage retraité, le revenu de travail est généralement nul → prime nulle.

---

### Poste 9 — Crédit d'impôt pour la solidarité

**Sortie :** `QC_sol` (crédit **remboursable** du ménage). Aucune sortie `_bonif`.
**Base légale :** *Loi sur les impôts* (RLRQ, c. I-3), **art. 1029.8.116.12 à 1029.8.116.35**. Crédit versé par Revenu Québec, modulé selon le **revenu familial net**. Versé sur la période **juillet → juin** ; col. 2025 = juillet 2025–juin 2026, col. 2026 = juillet 2026–juin 2027.

#### Structure (confirmée dans le code)

Traçage : `QC_sol` = `c2T350` (2025) / `c2S350` (2026) = `arr2xD53D58[5][0]` (lignes 23017-23018, 23130). Et :

`c2T350 = round( max(0, (voletTVQ + voletLogement) − réduction) , 2 )`

- **volet TVQ** (`c2T347`) = base + (couple ? conjoint : additionnel « personne vivant seule »).
- **volet logement** (`c2T348`) = (couple ? montant couple : montant seule/mono) + nbEnfants × montant par enfant.
- **réduction** (`c2T349`) = `max(0, revenuFamilialNet − seuil) × 6 %`, plafonnée au total des volets.
- Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).

> ⚠️ **Hypothèses du modèle** : (1) le ménage a droit aux **deux** volets (TVQ + logement) → réduction toujours à **6 %** (le taux de 3 % à une seule composante ne survient pas) ; (2) le volet **village nordique** (2 091/2 134 $ par adulte) n'est **pas** modélisé ; (3) le montant additionnel « vivant seule » s'applique à tout ménage à 1 adulte (la monoparentale est réputée vivre seule avec ses enfants).

#### Paramètres vérifiés (`c2M/L228-236`)

*MFQ, Paramètres 2026, tableau 4* (S10), confirmés par Revenu Québec / CFFP (S16) :

| Paramètre | 2025 (M) | 2026 (L) |
| --- | --- | --- |
| TVQ — base (`…228`) | 356 $ | 363 $ |
| TVQ — conjoint (`…229`) | 356 $ | 363 $ |
| TVQ — additionnel personne vivant seule (`…230`) | 169 $ | 172 $ |
| Logement — couple (`…233`) | 888 $ | 906 $ |
| Logement — personne seule ou monoparentale (`…232`) | 731 $ | 746 $ |
| Logement — par enfant à charge (`…234`) | 155 $ | 158 $ |
| Seuil de réduction (`…235`) | 42 325 $ | 43 195 $ |
| Taux de réduction (`…236`) | 6 % | 6 % |

**Vérifications :** montants et seuil confirmés **exactement** au document MFQ (S10) ; taux de réduction (6 % ; 3 % à une seule composante), structure et base légale confirmés par Revenu Québec / CFFP (S16).

#### Algorithme épuré

```typescript
// --- Paramètres : Crédit pour la solidarité ---
export interface ParamsSolidarite {
  tvqBase: number; tvqConjoint: number; tvqAdditionnelSeule: number; // volet TVQ
  logementCouple: number; logementSeule: number; logementParEnfant: number; // volet logement
  seuilReduction: number; tauxReduction: number; // réduction (≥ 2 composantes)
}

export const SOLIDARITE: Record<Annee, ParamsSolidarite> = {
  2025: { tvqBase: 356, tvqConjoint: 356, tvqAdditionnelSeule: 169, logementCouple: 888, logementSeule: 731, logementParEnfant: 155, seuilReduction: 42_325, tauxReduction: 0.06 },
  2026: { tvqBase: 363, tvqConjoint: 363, tvqAdditionnelSeule: 172, logementCouple: 906, logementSeule: 746, logementParEnfant: 158, seuilReduction: 43_195, tauxReduction: 0.06 },
};

/** Crédit pour la solidarité (= QC_sol) : volets TVQ + logement, réduits de 6 % au-delà du seuil. */
export function creditSolidarite(revenuFamilialNet: number, nbAdultes: 1 | 2, nbEnfants: number, annee: Annee): number {
  const p = SOLIDARITE[annee];
  const couple = nbAdultes === 2;
  const voletTVQ = p.tvqBase + (couple ? p.tvqConjoint : p.tvqAdditionnelSeule);
  const voletLogement = (couple ? p.logementCouple : p.logementSeule) + nbEnfants * p.logementParEnfant;
  const reduction = Math.max(0, revenuFamilialNet - p.seuilReduction) * p.tauxReduction;
  return Math.round(Math.max(0, voletTVQ + voletLogement - reduction) * 100) / 100;
}
```

> **Notes** : (1) Le revenu familial net est **fourni** par le calcul amont. (2) Crédit **remboursable**, versé d'avance (mensuellement ou trimestriellement selon le montant). (3) Le crédit réel exige d'être propriétaire/locataire (volet logement) et inscrit ; le modèle suppose ces conditions remplies.

---

### Poste 10 — Programme Allocation-logement

**Sortie :** `QC_al` (allocation **remboursable** du ménage). Aucune sortie `_bonif`.
**Base légale :** programme de la **Société d'habitation du Québec** (*Loi sur la SHQ*, RLRQ, c. S-8), établi par décret et administré par Revenu Québec. Période **octobre → septembre**.

#### Structure (confirmée dans le code)

Traçage : `QC_al` = `c2T362` (2025) / `c2S362` (2026) = `arr2xD59D62[1][0]` (lignes 23019-23020, 23132). Et :

`c2T362 = max(0, c2T359 − c2T361)`

- **Montant** `c2T359` = admissible ? (montant mensuel selon l'effort logement × 12) : 0.
  - effort logement = `round((loyer × 12) / revenuAL, 4)` ; paliers : `< 30 %` → 0 ; `[30 %, 50 %)` → 100 $/mois ; `[50 %, 80 %)` → 150 $ ; `≥ 80 %` → 170 $.
- **Réduction** `c2T361` = `max(0, revenuAL − seuil) × 1` — **dollar pour dollar** au-delà du seuil.
- **Admissibilité** `c2T353` = (un adulte **≥ 50 ans**) **ou** (≥ 1 enfant à charge).
- Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).

> ⚠️ **Loyer imputé.** Le programme réel utilise le **loyer réel** ; faute d'entrée « loyer », le modèle l'**impute** selon la composition (table ci-dessous). C'est un **choix de modélisation** du MFQ, non un paramètre réglementaire.
> ⚠️ **Revenu aux fins de l'AL** (`c2T357`) = revenu familial net pour les **non-aînés** ; pour les **65 ans et plus**, un ajustement s'applique (revenu net − pensions × facteur ≈ 5 %, impliquant PSV/SRG — hors périmètre). Dans l'algorithme, il est **fourni en entrée** (`revenuAL`).

#### Paramètres vérifiés (`c2M/L244-257`)

*Revenu Québec / CFFP* (S17). Montants mensuels et paliers d'effort identiques les deux années :

| Paramètre | 2025 (M) | 2026 (L) |
| --- | --- | --- |
| Montant — effort 30 % à < 50 % | 100 $/mois | 100 $/mois |
| Montant — effort 50 % à < 80 % | 150 $/mois | 150 $/mois |
| Montant — effort ≥ 80 % | 170 $/mois | 170 $/mois |
| Seuil — 1 adulte, 0 enfant | 22 400 $ | 22 900 $ |
| Seuil — 2 adultes, 0 enfant | 31 500 $ | ⚠️ 32 100 $ |
| Seuil — 1 ad. 1-2 enf. / 2 ad. 1 enf. | 38 700 $ | 39 500 $ |
| Seuil — 1 ad. 3+ enf. / 2 ad. 2+ enf. | 44 600 $ | 45 500 $ |
| Réduction au-delà du seuil | 100 % | 100 % |

Loyer mensuel **imputé** (choix du modèle, non indexé) — `c2M/L250-253` :

| Composition | Loyer imputé |
| --- | --- |
| 1 adulte — 0 / 1 / 2 / 3+ enfants | 856 / 1 002 / 1 131 / 1 380 $ |
| 2 adultes — 0 / 1 / 2+ enfants | 1 002 / 1 131 / 1 380 $ |

**Vérifications :**
- Montants (100/150/170 $), paliers d'effort (30/50/80 %), admissibilité (50 ans ou enfant) et réduction dollar pour dollar confirmés par Revenu Québec / CFFP (S17).
- Seuils 2026 confirmés au guide CFFP : 22 900 (1 ad.), 39 500 (+1 enf.), 45 500 (2+ enf.). **⚠️ Exception** : le code donne **32 100 $** pour « 2 adultes, 0 enfant » (2026), alors que CFFP affiche **32 200 $** (écart de 100 $) → à reconfirmer. Les seuils 2025 (col. M) viennent du code (période antérieure, sans contre-vérification directe).
- Le **loyer imputé** n'est pas rattachable à un paramètre réglementaire → extrait du code seulement.
- **Parité** : reproduit exactement `calc()` sur la grille (`reference-parity.test.ts`), y compris les retraités (revenu AL ajusté).

#### Algorithme épuré

```typescript
// --- Paramètres : Allocation-logement ---
export interface ParamsAllocationLogement {
  loyerImpute: Record<1 | 2, number[]>; // loyer mensuel imputé, par nb d'adultes puis tranche d'enfants (0,1,2,3+)
  seuilSeul0: number; seuilCouple0: number; seuilMoyen: number; seuilHaut: number; // seuils de réduction ($)
  montant30: number; montant50: number; montant80: number; // montants mensuels par palier d'effort ($)
  ageAdmissible: number; // âge ouvrant droit (sans enfant)
}

export const ALLOCATION_LOGEMENT: Record<Annee, ParamsAllocationLogement> = {
  2025: { loyerImpute: { 1: [856, 1002, 1131, 1380], 2: [1002, 1131, 1380] },
    seuilSeul0: 22_400, seuilCouple0: 31_500, seuilMoyen: 38_700, seuilHaut: 44_600,
    montant30: 100, montant50: 150, montant80: 170, ageAdmissible: 50 },
  2026: { loyerImpute: { 1: [856, 1002, 1131, 1380], 2: [1002, 1131, 1380] },
    seuilSeul0: 22_900, seuilCouple0: 32_100 /* ⚠️ CFFP : 32 200 */, seuilMoyen: 39_500, seuilHaut: 45_500,
    montant30: 100, montant50: 150, montant80: 170, ageAdmissible: 50 },
};

/** Allocation-logement (= QC_al). revenuAL = revenu net pour les non-aînés (voir ⚠️). */
export function allocationLogement(revenuAL: number, ageMaxAdulte: number, nbAdultes: 1 | 2, nbEnfants: number, annee: Annee): number {
  const p = ALLOCATION_LOGEMENT[annee];
  if (!(ageMaxAdulte >= p.ageAdmissible || nbEnfants > 0)) return 0; // admissibilité
  const t = p.loyerImpute[nbAdultes];
  const loyer = t[Math.min(nbEnfants, t.length - 1)];
  const effort = Math.round(((loyer * 12) / revenuAL) * 10_000) / 10_000;
  const mensuel = effort < 0.3 ? 0 : effort < 0.5 ? p.montant30 : effort < 0.8 ? p.montant50 : p.montant80;
  const seuil = nbEnfants === 0 ? (nbAdultes === 1 ? p.seuilSeul0 : p.seuilCouple0)
    : nbAdultes === 1 ? (nbEnfants <= 2 ? p.seuilMoyen : p.seuilHaut)
    : nbEnfants === 1 ? p.seuilMoyen : p.seuilHaut;
  return Math.max(0, mensuel * 12 - Math.max(0, revenuAL - seuil)); // réduction 100 % au-delà du seuil
}
```

> **Notes** : (1) Allocation **remboursable** versée mensuellement. (2) Le programme réel exige aussi un plafond d'actifs (≤ 50 000 $) — non modélisé. (3) Le loyer imputé fait que, dans ce modèle, l'allocation ne dépend que du revenu et de la composition (pas d'un loyer saisi).

---

### Poste 11 — Crédit d'impôt pour soutien aux aînés

**Sortie :** `QC_aines` (crédit **remboursable** du ménage). Aucune sortie `_bonif`.
**Base légale :** *Loi sur les impôts* (RLRQ, c. I-3) ; crédit remboursable de la **ligne 463** du TP-1. Modulé selon le **revenu familial net**.

#### Structure (confirmée dans le code)

Traçage : `QC_aines` = `c2T399` (2025) / `c2S399` (2026) = `arr2xD59D62[3][0]` (lignes 23123-23124, 23140-23141, 23233). Et :

`c2T399 = (1 adulte) ? c2T397 : c2T398`, où chaque branche vaut `admissible ? max(0, montantMax − réduction) : 0`.

- **Admissibilité** : au moins un adulte **≥ 70 ans** (`c2T5` ou `c2T6 ≥ 70`).
- **montantMax** = `2 000 $` par aîné admissible ⇒ **4 000 $** pour un couple dont **les deux** conjoints ont 70 ans et plus (`c2T393`).
- **réduction** = `max(0, revenuFamilialNet − seuil) × taux` ; seuil = `c2M289` (1 adulte) ou `c2M290` (2 adultes).
- Base de revenu : `c2T392 = c2T271` = revenu familial net.
- Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).

#### Paramètres vérifiés (`c2M/L287/289-292`)

| Paramètre | 2025 (M) | 2026 (L) | Source |
| --- | --- | --- | --- |
| Montant maximal par aîné (`…287`) | 2 000 $ | 2 000 $ | S18 |
| Seuil de réduction — 1 adulte (`…289`) | 27 835 $ | 28 405 $ | S10 |
| Seuil de réduction — 2 adultes (`…290`) | 45 270 $ | 46 200 $ | S10 |
| Taux de réduction (`…291`) | 5,40 % | 5,47 % | S10 |
| Âge d'admissibilité (`…292`) | 70 ans | 70 ans | S18 |

**Vérifications :**
- Seuils de réduction et taux (5,40 % / 5,47 %) confirmés **exactement** au document MFQ (S10, « Montant pour le soutien des aînés »), 2025 et 2026.
- Montant maximal de **2 000 $ par aîné** (depuis 2022, **non indexé**), admissibilité à **70 ans**, et **4 000 $** pour un couple dont les deux conjoints sont admissibles : confirmés par Revenu Québec (S18).
- **Parité** : reproduit exactement `calc()` (`reference-parity.test.ts`), y compris les couples où un seul conjoint a 70 ans et plus.

#### Algorithme épuré

```typescript
// --- Paramètres : Crédit pour soutien aux aînés ---
export interface ParamsSoutienAines {
  montantParAine: number; // montant maximal par aîné admissible ($)
  seuilSeul: number; seuilCouple: number; // seuils de réduction (1 / 2 adultes) ($)
  tauxReduction: number; ageAdmissible: number;
}

export const SOUTIEN_AINES: Record<Annee, ParamsSoutienAines> = {
  2025: { montantParAine: 2000, seuilSeul: 27_835, seuilCouple: 45_270, tauxReduction: 0.054, ageAdmissible: 70 },
  2026: { montantParAine: 2000, seuilSeul: 28_405, seuilCouple: 46_200, tauxReduction: 0.0547, ageAdmissible: 70 },
};

/** Crédit pour soutien aux aînés (= QC_aines) : 2 000 $ par aîné de 70 ans et +, réduit selon le revenu familial net. */
export function montantSoutienAines(revenuFamilialNet: number, nbAdultes: 1 | 2, age1: number, age2: number, annee: Annee): number {
  const p = SOUTIEN_AINES[annee];
  const nbAines = (age1 >= p.ageAdmissible ? 1 : 0) + (nbAdultes === 2 && age2 >= p.ageAdmissible ? 1 : 0);
  if (nbAines === 0) return 0;
  const seuil = nbAdultes === 2 ? p.seuilCouple : p.seuilSeul;
  const reduction = Math.max(0, revenuFamilialNet - seuil) * p.tauxReduction;
  return Math.max(0, nbAines * p.montantParAine - reduction);
}
```

> **Notes** : (1) Crédit **remboursable** versé même sans impôt à payer. (2) Le montant maximal (2 000 $) n'est **pas indexé** depuis 2022 ; seuls les seuils et le taux de réduction le sont. (3) Le seuil de réduction dépend du **nombre d'adultes** (1 ou 2), pas du nombre d'aînés admissibles.

---

### Poste 12 — Crédit d'impôt remboursable pour frais médicaux

**Sortie :** `QC_medic` (crédit **remboursable** du ménage). Aucune sortie `_bonif`.
**Base légale :** *Loi sur les impôts* (RLRQ, c. I-3) ; crédit remboursable pour frais médicaux du TP-1.

> 🟰 **Constat majeur : `QC_medic ≡ 0` pour toutes les entrées du modèle** (vérifié empiriquement sur 165 scénarios et par parité). Raison : la **seule dépense médicale** que le calculateur considère est la **prime RAMQ** (`c2T305 = c2T376`), qui ne dépasse **jamais** le seuil de 3 % du revenu familial net → frais admissibles nuls → crédit nul. Le poste est donc présent dans le modèle mais **inactif**.

#### Structure (confirmée dans le code)

Traçage : `QC_medic` = `c2T311` (2025) / `c2S311` (2026) = `arr2xD59D62[2][0]` = `arr2xT414T422[7][0]` (lignes 23244, 23229). Et :

- `c2T305 = c2T376` = **prime RAMQ** (seule dépense médicale du modèle).
- `c2T306 = 0,03 × c2T271` (3 % du revenu familial net).
- `c2T307 = max(0, c2T305 − c2T306)` → frais admissibles.
- `c2T309 = min(0,25 × c2T307 , creditMax)` → crédit (25 %, plafonné).
- `c2T310 = max(0, c2T271 − seuilRéduction)` → excédent de revenu.
- `c2T311 = (revenuTravail ≥ min) ? round(max(0, (c2T309 − c2T310) × 0,05), 2) : 0`.
- Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).

> ⚠️ **Formule de réduction anormale.** Le code calcule `(crédit − excédent) × 5 %`, alors que la règle réelle est `crédit − 5 % × excédent`. Conséquence (jamais observée puisque le crédit est nul) : la formule du code **plafonnerait** le crédit à `creditMax × 5 % ≈ 73 $` au lieu de 1 466 $. On reproduit le code **tel quel** ; l'anomalie n'est pas validable par parité (branche jamais exercée).

#### Paramètres vérifiés (`c2M/L181-185`, `arr2xM/L183`)

*MFQ, Paramètres 2026* (S10), section « Crédit d'impôt pour frais médicaux » :

| Paramètre | 2025 (M) | 2026 (L) |
| --- | --- | --- |
| Taux du crédit (`…182`) | 25 % | 25 % |
| Montant maximal (`…183`) | 1 466 $ | 1 496 $ |
| Revenu de travail minimal (`…181`) | 3 750 $ | 3 825 $ |
| Seuil de réduction (`…184`) | 28 335 $ | 28 915 $ |
| Taux de réduction (`…185`) | 5 % | 5 % |
| Part du revenu non couverte (frais) | 3 % | 3 % |

**Vérifications :** montant maximal, revenu de travail minimal et seuil de réduction confirmés **exactement** au document MFQ (S10). Le taux (25 %), la réduction (5 %) et le seuil de 3 % sont les paramètres standard de ce crédit. **Parité** : `QC_medic = 0` reproduit sur toute la grille.

#### Algorithme épuré

```typescript
// --- Paramètres : Crédit remboursable pour frais médicaux ---
export interface ParamsFraisMedicaux {
  taux: number; creditMax: number; revenuTravailMin: number;
  seuilReduction: number; tauxReduction: number; seuilFrais: number; // seuilFrais = 3 %
}

export const FRAIS_MEDICAUX: Record<Annee, ParamsFraisMedicaux> = {
  2025: { taux: 0.25, creditMax: 1466, revenuTravailMin: 3750, seuilReduction: 28_335, tauxReduction: 0.05, seuilFrais: 0.03 },
  2026: { taux: 0.25, creditMax: 1496, revenuTravailMin: 3825, seuilReduction: 28_915, tauxReduction: 0.05, seuilFrais: 0.03 },
};

/** Crédit remboursable pour frais médicaux (= QC_medic). ⚠️ Forme anomale du code ; ≡ 0 dans le modèle. */
export function creditFraisMedicaux(fraisMedicaux: number, revenuTravailMax: number, revenuFamilialNet: number, annee: Annee): number {
  const p = FRAIS_MEDICAUX[annee];
  if (revenuTravailMax < p.revenuTravailMin) return 0;
  const fraisAdmissibles = Math.max(0, fraisMedicaux - p.seuilFrais * revenuFamilialNet);
  const credit = Math.min(p.taux * fraisAdmissibles, p.creditMax);
  const excedent = Math.max(0, revenuFamilialNet - p.seuilReduction);
  return Math.round(Math.max(0, (credit - excedent) * p.tauxReduction) * 100) / 100; // ⚠️ (crédit − excédent) × 5 %
}
```

> **Notes** : (1) Le **vrai** crédit remboursable pour frais médicaux porte sur l'**ensemble** des frais médicaux ; le modèle n'en saisit aucun (hormis la prime RAMQ) → crédit nul. (2) `fraisMedicaux` est fourni en entrée (la prime RAMQ dans le modèle). (3) Poste conservé pour la fidélité au calculateur, bien qu'inactif.

---

### Poste 13 — Aide de dernier recours (aide sociale / solidarité sociale)

**Sortie :** `QC_adr` (montant **annuel** du ménage). Aucune sortie `_bonif`.
**Base légale :** *Loi sur l'aide aux personnes et aux familles* (RLRQ, c. **A-13.1.1**) et son règlement. Programme administré par le **ministère de l'Emploi et de la Solidarité sociale**.

> 🔗 **Poste-intrant.** `QC_adr = c2T302` est la **cellule même** qui sert d'exonération à la **RAMQ** (poste 5) et à l'**allocation-logement** (poste 10) : l'aide sociale alimente d'autres postes. C'est aussi le premier poste à **dépendre d'autres postes** (cotisations RRQ/RQAP/AE, déduites du revenu compté).

#### Structure (confirmée dans le code)

Traçage : `QC_adr` = `c2T302` (2025) / `c2S302` (2026) = `arr2xD53D58[1][0]` = `arr2xT414T422[1][0]` (lignes 22014, 21997). Et :

`c2T302 = (un adulte ≥ 65 ans) ? 0 : (c2T300 + c2T301) × 12`

- `c2T300 = max(0, prestationBase − revenuComptéMensuel)` — prestation nette mensuelle.
- `c2T301 = (c2T300 > 0) ? revenuComptéAuDelàExemption × 25 % : 0` — **incitation au travail**.
- **Revenu compté** = gains de travail **nets des cotisations** (RRQ + RQAP + AE), au-delà d'une **exemption mensuelle** (200 $ seul / 300 $ couple) ; 25 % de l'excédent reste exempté.
- **Nul pour les 65 ans et plus** (l'un ou l'autre des conjoints → PSV/SRG).
- Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).

> ⚠️ **Proxy d'âge pour les contraintes.** L'ajustement « contraintes temporaires à l'emploi » (169/291 $) est accordé par le modèle sur le seul critère **âge ≥ 58 ans** (l'outil ne connaît pas l'état de santé). C'est une **modélisation** : dans la réalité, ce montant vise les personnes présentant des contraintes, pas tous les 58 ans et plus.
> ⚠️ **Ajustement « jeune seul » (50 $).** Le modèle ajoute 50 $/mois à un adulte **seul, sans enfant, de moins de 50 ans** ; ce montant n'a **pas été confirmé** sur quebec.ca → à reconfirmer.

#### Paramètres vérifiés (`c2M/L171-178`)

| Paramètre (mensuel) | 2025 (M) | 2026 (L) | Source |
| --- | --- | --- | --- |
| Prestation de base — seul (`…171`) | 829 $ | 845 $ | S20 (2026 confirmé) |
| Prestation de base — couple (`…172`) | 1 258 $ | 1 283 $ | S20 (2026 confirmé) |
| Ajustement — un adulte 58+ (`…173`) | 166 $ | 169 $ | S20 (« contraintes », 2026 confirmé) |
| Ajustement — deux adultes 58+ (`…174`) | 285 $ | 291 $ | S20 (« contraintes », 2026 confirmé) |
| Ajustement — jeune seul sans enfant (`…175`) | 50 $ | 50 $ | ⚠️ non confirmé |
| Exemption gains de travail — seul (`…177`) | 200 $ | 200 $ | S20 |
| Exemption gains de travail — couple (`…178`) | 300 $ | 300 $ | S20 |
| Taux d'incitation au travail (`…176`) | 25 % | 25 % | S20 |

**Vérifications :** prestation de base (845/1 283 $), ajustement contraintes (169/291 $), exemptions (200/300 $) et incitation (25 %) confirmés au barème **quebec.ca** (au 1ᵉʳ avril 2026). Base légale **A-13.1.1**. La prestation **n'inclut pas de montant pour enfant** (couvert par l'Allocation famille, poste 7). **Parité** : reproduit exactement `calc()` sur 147 scénarios (toutes les bandes d'âge, monoparentales, couples à âges mixtes, décroissance du revenu).

#### Algorithme épuré

```typescript
// --- Paramètres : Aide de dernier recours (mensuels) ---
export interface ParamsAideSociale {
  baseSeul: number; baseCouple: number;
  ajust58Seul: number; ajust58Couple: number; ajustJeuneSeul: number;
  exemptionSeul: number; exemptionCouple: number; tauxIncitation: number;
}

export const AIDE_SOCIALE: Record<Annee, ParamsAideSociale> = {
  2025: { baseSeul: 829, baseCouple: 1258, ajust58Seul: 166, ajust58Couple: 285, ajustJeuneSeul: 50, exemptionSeul: 200, exemptionCouple: 300, tauxIncitation: 0.25 },
  2026: { baseSeul: 845, baseCouple: 1283, ajust58Seul: 169, ajust58Couple: 291, ajustJeuneSeul: 50, exemptionSeul: 200, exemptionCouple: 300, tauxIncitation: 0.25 },
};

/** Aide de dernier recours (= QC_adr), annuelle. revenuTravailNet = brut − cotisations (RRQ+RQAP+AE). */
export function aideSociale(revenuTravailNet: number, nbAdultes: 1 | 2, age1: number, age2: number, nbEnfants: number, annee: Annee): number {
  const p = AIDE_SOCIALE[annee];
  if (age1 >= 65 || (nbAdultes === 2 && age2 >= 65)) return 0;
  const base = (nbAdultes === 2 ? p.baseCouple : p.baseSeul)
    + (nbAdultes === 2 && age1 >= 58 && age2 >= 58 ? p.ajust58Couple
      : age1 >= 58 || (nbAdultes === 2 && age2 >= 58) ? p.ajust58Seul
      : nbAdultes === 1 && nbEnfants === 0 && age1 < 50 ? p.ajustJeuneSeul : 0);
  const exemption = nbAdultes === 2 ? p.exemptionCouple : p.exemptionSeul;
  const compte = Math.max(0, revenuTravailNet / 12 - exemption);
  const prestationNette = Math.max(0, base - compte);
  const incitation = prestationNette > 0 ? p.tauxIncitation * compte : 0;
  return (prestationNette + incitation) * 12;
}
```

> **Notes** : (1) `aideSocialeMenage(menage, annee)` calcule le revenu net en déduisant les cotisations (postes 1-3) — d'où la **dépendance** entre postes. (2) Les autres revenus (non-travail) réduisent l'aide dollar pour dollar ; dans le modèle (revenu de travail seulement), ils sont nuls. (3) Montant **annualisé** (× 12).

---

### Poste 14 — Allocation canadienne pour enfants (ACE)

**Sortie :** `CA_ace` (prestation **annuelle** du ménage). Aucune sortie `_bonif`. **Premier transfert fédéral.**
**Base légale :** *Loi de l'impôt sur le revenu* (LRC 1985, ch. 1 (5ᵉ suppl.)), **art. 122.6 à 122.64**. Prestation **non imposable** versée mensuellement par l'**Agence du revenu du Canada**.

#### Structure (confirmée dans le code)

Traçage : `CA_ace` = `c2T180` (2025) / `c2S180` (2026) = `arr2xD66D71[1][0]` = `arr2xT406T411[1][0]` (lignes 23021, 23003). Et :

`c2T180 = round( max(0, prestationMax − taux1 × bande1 − taux2 × bande2) , 2)`

- **prestationMax** (`c2T177`) = (enfants **< 6 ans** × maxJeune) + (enfants **6-17** × maxAîné).
- **bande1** = `max(0, min(AFNI − seuil1, seuil2 − seuil1))` — revenu entre les deux seuils.
- **bande2** = `max(0, AFNI − seuil2)` — revenu au-delà du second seuil.
- Les **taux** (palier 1 et palier 2) dépendent du **nombre d'enfants** (1 / 2 / 3 / 4+).
- **AFNI** (`c2T124`) = revenu familial net **rajusté fédéral** (distinct du revenu net québécois).
- Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L). « Moins de 6 ans » = âge ≤ 5.

#### Paramètres vérifiés (`c2M/L94-107`)

*ARC* (S21). Année de prestation **juillet 2025 – juin 2026** (col. M) ; **juillet 2026 – juin 2027** (col. L) :

| Paramètre | 2025 (M) | 2026 (L) |
| --- | --- | --- |
| Maximum par enfant de moins de 6 ans (`…94`) | 7 997 $ | 8 157 $ |
| Maximum par enfant de 6 à 17 ans (`…95`) | 6 748 $ | 6 883 $ |
| 1ᵉʳ seuil de réduction (`…97`) | 37 487 $ | 38 237 $ |
| 2ᵉ seuil de réduction (`…103`) | 81 222 $ | 82 847 $ |
| Taux palier 1 — 1/2/3/4+ enfants (`…98-101`) | 7 / 13,5 / 19 / 23 % | idem |
| Taux palier 2 — 1/2/3/4+ enfants (`…104-107`) | 3,2 / 5,7 / 8 / 9,5 % | idem |

**Vérifications :** montants maximaux (7 997 / 6 748 $) et 1ᵉʳ seuil (37 487 $) confirmés **exactement** à l'ARC pour l'année de prestation juillet 2025 (S21). Les taux de réduction sont les taux standard de l'ACE. **Parité** : reproduit exactement `calc()` sur 40 scénarios (1 à 3 enfants, jeunes/aînés, monoparentale/couple, revenus couvrant les deux paliers).

#### Algorithme épuré

```typescript
// --- Paramètres : Allocation canadienne pour enfants ---
export interface ParamsACE {
  maxJeune: number; maxAine: number; seuil1: number; seuil2: number;
  tauxPalier1: [number, number, number, number]; // par nb d'enfants (1, 2, 3, 4+)
  tauxPalier2: [number, number, number, number];
}

export const ACE: Record<Annee, ParamsACE> = {
  2025: { maxJeune: 7997, maxAine: 6748, seuil1: 37_487, seuil2: 81_222, tauxPalier1: [0.07, 0.135, 0.19, 0.23], tauxPalier2: [0.032, 0.057, 0.08, 0.095] },
  2026: { maxJeune: 8157, maxAine: 6883, seuil1: 38_237, seuil2: 82_847, tauxPalier1: [0.07, 0.135, 0.19, 0.23], tauxPalier2: [0.032, 0.057, 0.08, 0.095] },
};

/** Allocation canadienne pour enfants (= CA_ace), annuelle. revenuFamilialNetAjuste = AFNI fédéral. */
export function allocationCanadienneEnfants(revenuFamilialNetAjuste: number, nbEnfants: number, nbEnfantsMoins6: number, annee: Annee): number {
  if (nbEnfants <= 0) return 0;
  const p = ACE[annee];
  const maxBenefit = nbEnfantsMoins6 * p.maxJeune + (nbEnfants - nbEnfantsMoins6) * p.maxAine;
  const i = Math.min(nbEnfants, 4) - 1;
  const bande1 = Math.max(0, Math.min(revenuFamilialNetAjuste - p.seuil1, p.seuil2 - p.seuil1));
  const bande2 = Math.max(0, revenuFamilialNetAjuste - p.seuil2);
  return Math.round(Math.max(0, maxBenefit - (p.tauxPalier1[i] * bande1 + p.tauxPalier2[i] * bande2)) * 100) / 100;
}
```

> **Notes** : (1) Prestation **non imposable** (n'entre pas dans le revenu imposable). (2) L'AFNI est **fourni en entrée** (produit par le calcul d'impôt fédéral en aval). (3) L'année de prestation court de **juillet à juin**, sur le revenu de l'année antérieure.

---

### Poste 15 — Crédit pour la TPS/TVH

**Sortie :** `CA_tps` (crédit **annuel** du ménage). Aucune sortie `_bonif`.
**Base légale :** *Loi de l'impôt sur le revenu* (LRC 1985, ch. 1 (5ᵉ suppl.)), **art. 122.5**. Crédit fédéral **remboursable**, versé trimestriellement par l'ARC (non imposable).

#### Structure (confirmée dans le code)

Traçage : `CA_tps` = `c2T194` (2025) / `c2S194` (2026) = `arr2xD66D71[2][0]` = `arr2xT406T411[2][0]` (lignes 23023, 23006). Et :

`c2T194 = round( max(0, (base + supplMonoparental + supplSeul) − réduction) , 2)`

- **base** (`c2T190`) = nbAdultes × baseAdulte + nbEnfants × parEnfant.
- **supplMonoparental** (`c2T191`) = (1 adulte **avec** enfants) → 349 $ (équivalent conjoint).
- **supplSeul** (`c2T192`) = (1 adulte **sans** enfant) → `max(0, min(2 % × (AFNI − 11 337), 184))` (accumulation progressive).
- **réduction** (`c2T193`) = `max(0, AFNI − seuilRéduction) × 5 %`, plafonnée au total.
- **AFNI** = `c2T124` (revenu familial net rajusté fédéral). Convention : 2025 = T (param. M) ; 2026 = S (param. L).

#### Paramètres vérifiés (`c2M/L110-117`, `arr2xM/L115`)

*ARC* (S22). Année de prestation juillet 2025 (col. M) / juillet 2026 (col. L) :

| Paramètre | 2025 (M) | 2026 (L) |
| --- | --- | --- |
| Base par adulte (`…110`) | 349 $ | 356 $ |
| Par enfant (`…111`) | 184 $ | 187 $ |
| Supplément monoparental (`…112`) | 349 $ | 356 $ |
| Supplément personne seule — seuil / taux / plafond (`…113/114/115`) | 11 337 $ / 2 % / 184 $ | 11 564 $ / 2 % / 187 $ |
| Seuil de réduction (`…116`) | 45 521 $ | 46 432 $ |
| Taux de réduction (`…117`) | 5 % | 5 % |

**Vérifications :** structure confirmée à l'ARC ; les montants 2024-25 (340/179 $, seuil 44 324 $) sont confirmés et les valeurs 2025 (349/184 $, 45 521 $) en sont l'**indexation** (≈ +2,7 %). La feuille de calcul ARC juillet 2025 n'a pu être ouverte (403) → valeurs **parité-validées** contre `calc()`. **Parité** : reproduit exactement `calc()` sur 20 scénarios (personne seule avec phase-in, monoparentale, couple, avec/sans enfants).

#### Algorithme épuré

```typescript
// --- Paramètres : Crédit pour la TPS/TVH ---
export const TPS: Record<Annee, ParamsTPS> = {
  2025: { baseAdulte: 349, parEnfant: 184, supplMonoparental: 349, seuilPhaseIn: 11_337, tauxPhaseIn: 0.02, plafondPhaseIn: 184, seuilReduction: 45_521, tauxReduction: 0.05 },
  2026: { baseAdulte: 356, parEnfant: 187, supplMonoparental: 356, seuilPhaseIn: 11_564, tauxPhaseIn: 0.02, plafondPhaseIn: 187, seuilReduction: 46_432, tauxReduction: 0.05 },
};

/** Crédit pour la TPS/TVH (= CA_tps), annuel. revenuFamilialNetAjuste = AFNI fédéral. */
export function creditTPS(revenuFamilialNetAjuste: number, nbAdultes: 1 | 2, nbEnfants: number, annee: Annee): number {
  const p = TPS[annee];
  const base = nbAdultes * p.baseAdulte + nbEnfants * p.parEnfant;
  const supplMono = nbAdultes === 1 && nbEnfants > 0 ? p.supplMonoparental : 0;
  const supplSeul = nbAdultes === 1 && nbEnfants === 0
    ? Math.max(0, Math.min(p.tauxPhaseIn * (revenuFamilialNetAjuste - p.seuilPhaseIn), p.plafondPhaseIn)) : 0;
  const total = base + supplMono + supplSeul;
  const reduction = Math.max(0, revenuFamilialNetAjuste - p.seuilReduction) * p.tauxReduction;
  return Math.round(Math.max(0, total - reduction) * 100) / 100;
}
```

> **Notes** : (1) Crédit **non imposable**, versé en 4 versements (juillet, octobre, janvier, avril). (2) AFNI **fourni en entrée**. (3) Le supplément « personne seule » et le supplément « monoparental » sont mutuellement exclusifs (selon la présence d'enfants).

---

### Poste 16 — Allocation canadienne pour les travailleurs (ACT)

**Sortie :** `CA_pfrt` (montant **annuel** du ménage). Aucune sortie `_bonif`.
**Base légale :** *Loi de l'impôt sur le revenu* (LRC 1985, ch. 1 (5ᵉ suppl.)), **art. 122.7** ; **reconfigurée pour le Québec** par entente Canada-Québec (annexe 6). Crédit fédéral remboursable.

> 🔗 **Poste-intrant inverse.** Le revenu déterminant de l'ACT (AFNI, `c2T124`) **inclut l'aide sociale** (poste 13) : `CA_pfrt` **dépend** donc de `QC_adr`. C'est l'équivalent fédéral de la prime au travail (poste 8) — une courbe en cloche.

#### Structure (confirmée dans le code)

Traçage : `CA_pfrt` = `c2T188` (2025) / `c2S188` (2026) = `arr2xD66D71[3][0]` = `arr2xT406T411[3][0]` (lignes 23025, 23008). Et :

`c2T188 = round( max(0, accumulation − réduction) , 2)`

- **accumulation** = `min( tauxPhaseIn × max(0, revenuTravail − exclusion) , primeMax )`.
- **réduction** = `max(0, (AFNI − exemption2eRevenu) − seuilRéduction) × 20 %`.
- **exemption2eRevenu** = `min(16 386 $, revenu de travail du conjoint à plus faible revenu)` — avantage les couples à deux revenus.
- **Quatre types** = (1 ou 2 adultes) × (sans / avec enfants). AFNI = revenu net rajusté fédéral.
- Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).

#### Paramètres vérifiés (`c2M/L76-91`, `arr2xM/L82-85`, `arr2xM/L91`)

*ARC, version Québec* (S23). Exclusion : 2 400 $ (seul) / 3 600 $ (couple) ; réduction : **20 %** ; exemption 2ᵉ revenu : 16 386 $ (2025) / 16 714 $ (2026) :

| Type | Taux accumulation | Prime max 2025 | Prime max 2026 | Seuil réduc. 2025 / 2026 |
| --- | --- | --- | --- | --- |
| Personne seule | 37,3 % | 3 812,06 $ | 3 882,18 $ | 14 170,05 / 14 484,06 $ |
| Famille monoparentale | 20 % | 2 044,00 $ | 2 081,60 $ | 14 341,56 / 14 644,79 $ |
| Couple sans enfants | 37,3 % | 5 943,38 $ | 6 053,04 $ | 21 787,19 / 22 268,97 $ |
| Couple avec enfants | 23,9 % | 3 808,23 $ | 3 878,49 $ | 22 007,75 / 22 477,43 $ |

**Vérifications :** la **reconfiguration québécoise** de l'ACT (annexe 6, montants distincts) est confirmée par l'ARC (S23) ; la feuille de calcul canada.ca étant inaccessible (403), les montants exacts sont **validés par parité**. **Parité** : reproduit exactement `calc()` sur 30 scénarios (4 types, accumulation/plateau/réduction, **couples à deux revenus** avec l'exemption du second revenu).

#### Algorithme épuré

```typescript
// --- Paramètres : Allocation canadienne pour les travailleurs (version Québec) ---
export interface ParamsTypeACT { tauxPhaseIn: number; primeMax: number; seuilReduction: number; }
export interface ParamsACT {
  exclusionSeul: number; exclusionCouple: number; tauxReduction: number; exemptionSecondRevenu: number;
  parType: Record<1 | 2, { sansEnfants: ParamsTypeACT; avecEnfants: ParamsTypeACT }>;
}

export const ACT: Record<Annee, ParamsACT> = {
  2025: { exclusionSeul: 2400, exclusionCouple: 3600, tauxReduction: 0.2, exemptionSecondRevenu: 16_386, parType: {
    1: { sansEnfants: { tauxPhaseIn: 0.373, primeMax: 3812.06, seuilReduction: 14_170.05 }, avecEnfants: { tauxPhaseIn: 0.2, primeMax: 2044, seuilReduction: 14_341.56 } },
    2: { sansEnfants: { tauxPhaseIn: 0.373, primeMax: 5943.38, seuilReduction: 21_787.19 }, avecEnfants: { tauxPhaseIn: 0.239, primeMax: 3808.23, seuilReduction: 22_007.75 } } } },
  2026: { exclusionSeul: 2400, exclusionCouple: 3600, tauxReduction: 0.2, exemptionSecondRevenu: 16_714, parType: {
    1: { sansEnfants: { tauxPhaseIn: 0.373, primeMax: 3882.18, seuilReduction: 14_484.06 }, avecEnfants: { tauxPhaseIn: 0.2, primeMax: 2081.6, seuilReduction: 14_644.79 } },
    2: { sansEnfants: { tauxPhaseIn: 0.373, primeMax: 6053.04, seuilReduction: 22_268.97 }, avecEnfants: { tauxPhaseIn: 0.239, primeMax: 3878.49, seuilReduction: 22_477.43 } } } },
};

/** Allocation canadienne pour les travailleurs (= CA_pfrt). AFNI = revenu net rajusté fédéral (inclut l'aide sociale). */
export function allocationTravailleurs(revenuTravail: number, revenuTravailMoindre: number, revenuFamilialNetAjuste: number, nbAdultes: 1 | 2, aDesEnfants: boolean, annee: Annee): number {
  const p = ACT[annee];
  const t = p.parType[nbAdultes][aDesEnfants ? "avecEnfants" : "sansEnfants"];
  const exclusion = nbAdultes === 2 ? p.exclusionCouple : p.exclusionSeul;
  const accumulation = Math.min(Math.max(0, revenuTravail - exclusion) * t.tauxPhaseIn, t.primeMax);
  const exemption = Math.min(p.exemptionSecondRevenu, revenuTravailMoindre);
  const reduction = Math.max(0, revenuFamilialNetAjuste - exemption - t.seuilReduction) * p.tauxReduction;
  return Math.round(Math.max(0, accumulation - reduction) * 100) / 100;
}
```

> **Notes** : (1) Crédit **remboursable**. (2) Le revenu de travail (accumulation) et l'AFNI (réduction) sont **fournis en entrée**. (3) Le **supplément pour invalidité** de l'ACT n'est pas modélisé (aucune entrée). (4) L'AFNI incluant l'aide sociale, un ménage sans travail mais avec aide sociale voit son ACT réduite.

---

### Poste 17 — Sécurité de la vieillesse (PSV) + Supplément de revenu garanti (SRG)

**Sortie :** `CA_psv` (montant **annuel** du ménage). Aucune sortie `_bonif`.
**Base légale :** *Loi sur la sécurité de la vieillesse* (LRC 1985, ch. **O-9**) — PSV, SRG, Allocation. **Impôt de récupération** de la PSV : *Loi de l'impôt sur le revenu*, **art. 180.2** (ligne 23500).

> ⏱️ **Paramètres trimestriels.** Les montants de la PSV/SRG sont révisés **tous les 3 mois**. Les valeurs annuelles du modèle (8 791,14 $, 11 096,85 $…) sont la **moyenne des 4 trimestres** — d'où leurs décimales. (Merci à l'utilisateur pour cette précision et les sources.)

#### Structure (confirmée dans le code)

Traçage : `CA_psv` = `round(c2T41 + c2T42 + c2T51 + c2T52 + c2T43 + c2T53, 2)` (lignes 21995, 22028) — soit, **par adulte de 65 ans et plus** :

- **PSV** (`c2T41`/`c2T51`) = `max(0, base − récupération)` ; base = 8 791,14 $ + (75 ans et + : 879,15 $) ; récupération = `max(0, (revenu + base) − 93 454 $) × 15 %`.
- **SRG** (`c2T42`/`c2T52`) = `max(0, SRG_max − revenuArrondi × taux)`. `SRG_max` = 11 096,85 $ (seul) / 7 327,65 $ par adulte (couple) ; taux = 50 % (seul) / 25 % (couple). Le revenu est **arrondi à la tranche inférieure** (24 $ seul / 48 $ couple — le SRG se calcule par paliers).
- **Supplément complémentaire** du SRG (`c2T43`/`c2T53`, « top-up ») = `max(0, max − revenuArrondi × 25 %)` ; max = 2 033,97 $ (seul) / 1 152,60 $ (couple) ; revenu arrondi à la tranche **supérieure** (48/96 $) au-delà d'une exemption (2 047,99 / 4 095,99 $).
- **Allocation** (`c2T30`, à la place du SRG pour le conjoint de **60-64 ans** dont l'autre a 65 ans et plus) = `max(0, alloc_max − min(revenuArrondi₂₄, seuil) × 75 % − (revenu au-delà du seuil, arrondi) × 25 %)` ; `alloc_max` = 16 695,09 $ (2025) / 17 028,99 $ (2026) ; seuil = 11 760 $ / 12 000 $.
- Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).

**Couple mixte (un conjoint 60-64, l'autre 65 ans et plus)** — désormais modélisé : le conjoint 65+ touche sa PSV + un **SRG calculé sur le revenu combiné au-delà du seuil de l'Allocation** (arrondi **supérieur**, tranche 48 $), et le conjoint 60-64 touche l'**Allocation**.

> ⚠️ **Deux artefacts du fichier reproduits pour la parité.** (1) Le seuil du SRG du conjoint 65+ est diminué d'**un cent** dans le fichier (`c2T25` = 11 759,99 $, soit seuil − 0,01) ; sans ce cent, l'arrondi supérieur divergerait aux multiples exacts. (2) **Asymétrie** : le supplément complémentaire est **entier** lorsque le conjoint de 65 ans et plus est l'**adulte 1** (`c2T43`), mais **réduit de moitié** lorsqu'il est l'**adulte 2** (`c2T53`) — les deux cellules n'ont pas le même multiplicateur. Vraisemblablement un défaut du modèle MFQ, sans portée pratique (cas-types symétriques). PSV, SRG et Allocation, eux, sont symétriques.

#### Paramètres vérifiés (`c2M/L34-73`)

*ESDC / ARC / données ouvertes* (S24). Montants **annuels = moyenne des 4 trimestres** :

| Paramètre | 2025 (M) | 2026 (L) |
| --- | --- | --- |
| PSV — base 65-74 ans (`…34`) | 8 791,14 $ | 8 966,96 $ |
| PSV — supplément 75 ans et + (`…37`) | 879,15 $ | 896,70 $ |
| PSV — seuil de récupération (`…35`) / taux (`…36`) | 93 454 $ / 15 % | 95 323 $ / 15 % |
| SRG max — seul (`…41`) / couple par adulte (`…46`) | 11 096,85 / 7 327,65 $ | 11 318,79 / 7 474,20 $ |
| SRG — taux seul / couple ; tranche seul / couple | 50 / 25 % ; 24 / 48 $ | (idem) |
| Supplément SRG max — seul (`…67`) / couple (`…68`) | 2 033,97 / 1 152,60 $ | 2 074,65 / 1 175,65 $ |
| Allocation max (`…55`) / seuil (`…56`) | 16 695,09 / 11 760 $ | 17 028,99 / 12 000 $ |

**Vérifications :** la structure (PSV + SRG + supplément + Allocation, récupération 15 %, calcul par tranches) est confirmée par ESDC / ARC / RCGT (S24) ; les montants annuels sont la moyenne des montants trimestriels publiés (données ouvertes). **Parité** : reproduit exactement `calc()` sur 52 scénarios — personnes seules (âges 65/70/75, revenus jusqu'à la récupération), couples tous 65+, et **couples mixtes** (un conjoint 60-64, l'autre 65+ ; les deux ordres d'adultes).

#### Algorithme épuré

```typescript
// (paramètres + version complète commentée : voir src/postes/17-securite-vieillesse.ts)
const trancheBas = (x, b) => Math.floor(x / b) * b;   // arrondi à la tranche inférieure
const trancheHaut = (x, b) => Math.ceil(x / b) * b;   // arrondi à la tranche supérieure

export function securiteVieillesse(age1, age2, revenu1, revenu2, nbAdultes, annee): number {
  const p = PSV[annee]; const couple = nbAdultes === 2;
  const revenu = revenu1 + (couple ? revenu2 : 0); // revenu de retraite combiné
  let total = pensionVieillesse(age1, revenu1, p) + (couple ? pensionVieillesse(age2, revenu2, p) : 0);
  const nb65 = (age1 >= 65 ? 1 : 0) + (couple && age2 >= 65 ? 1 : 0);
  const allocataire = couple && ((age1 >= 60 && age1 <= 64 && age2 >= 65) || (age2 >= 60 && age2 <= 64 && age1 >= 65));

  if (!couple && age1 >= 65) {                        // personne seule 65+
    total += Math.max(0, p.srgMaxSeul - trancheBas(revenu, p.srgTrancheSeul) * p.srgTauxSeul);
    total += topup(revenu, p.topupMaxSeul, p.topupExemptionSeul, p.topupTrancheSeul, p);
  } else if (couple && nb65 === 2) {                  // couple, les deux 65+
    total += Math.max(0, p.srgMaxCouple - trancheBas(revenu, p.srgTrancheCouple) * p.srgTauxCouple) * 2;
    total += topup(revenu, p.topupMaxCouple, p.topupExemptionCouple, p.topupTrancheCouple, p);
  } else if (allocataire) {                            // couple mixte : 65+ → SRG ; 60-64 → Allocation
    const revenuSRG = trancheHaut(Math.max(0, revenu - (p.allocationSeuil - 0.01)), p.srgTrancheCouple);
    total += Math.max(0, p.srgMaxCouple - revenuSRG * p.srgTauxCouple);
    const supplement = topup(revenu, p.topupMaxCouple, p.topupExemptionCouple, p.topupTrancheCouple, p);
    total += age1 >= 65 ? supplement : supplement / 2; // ⚠️ asymétrie du fichier (voir ci-dessus)
    total += allocation(revenu, p);
  }
  return Math.round(total * 100) / 100;
}
```

> **Notes** : (1) PSV/SRG/Allocation **non imposables** pour le revenu disponible (la PSV est toutefois sujette à la récupération de 15 %). (2) Le revenu utilisé est le **revenu de retraite** saisi (`revenu1`/`revenu2`). (3) Poste-**fondation** : ces montants (`c2T41-43`) alimentent l'aide sociale, la RAMQ et le FSS.

---

### Poste 18 — Supplément remboursable pour frais médicaux (fédéral)

**Sortie :** `CA_medic` (supplément **annuel** du ménage). Aucune sortie `_bonif`.
**Base légale :** *Loi de l'impôt sur le revenu* (LRC 1985, ch. 1 (5ᵉ suppl.)), **art. 122.51** — ligne **45200** de la déclaration fédérale.

L'équivalent fédéral du poste 12 québécois, avec **deux différences notables** : (1) la forme de réduction est **correcte** ici (`supplément − 5 % × excédent`, et non l'anomalie `(crédit − excédent) × 5 %` du poste 12) ; (2) la réduction porte sur le **revenu familial net rajusté fédéral** (AFNI, `c2T124`), la même base que l'ACE, le crédit TPS et l'ACT (postes 14-16).

#### Structure (confirmée dans le code)

Traçage : `CA_medic` = `c2T174` (2025) / `c2S174` (2026) → `arr2x…66/71[5][0]` → `c1C34`/`c1D34` (sortie).

- `c2T161` = `c2T376` = **prime RAMQ** (la SEULE dépense médicale fournie par le modèle, comme au poste 12).
- `c2T162` = `min(3 % × revenuNet, 2 834 $)` → **plancher de 3 %** plafonné (frais admissibles = ligne 33200).
- `c2T171` = `(revenu de travail > 4 390 $) ? min(25 % × (c2T161 − c2T162), 1 504 $) : 0` → supplément avant réduction.
- `c2T169` = `max(0, c2T124 − 33 294 $)` → excédent de l'**AFNI fédéral** ; `c2T173` = `5 % × c2T169` → réduction.
- `c2T174` = `max(0, c2T171 − c2T173)`.

#### Paramètres vérifiés (`c2M/L22-31`, `arr2xM/L29`)

*ARC — ligne 45200 ; art. 122.51(1) LIR ; TaxTips (table d'indexation)* (S25) :

| Paramètre | 2025 (M) | 2026 (L) | Cellule |
| --- | --- | --- | --- |
| Supplément maximal | 1 504 $ | 1 534 $ | `arr2xM/L29` |
| Taux sur les frais admissibles | 25 % | 25 % | `c2M/L28` |
| Revenu de travail minimal | 4 390 $ | 4 478 $ | `c2M/L27` |
| Seuil de réduction (sur l'AFNI) | 33 294 $ | 33 960 $ | `c2M/L30` |
| Taux de réduction | 5 % | 5 % | `c2M/L31` |
| Plancher de frais (% / plafond) | 3 % / 2 834 $ | 3 % / 2 890 $ | `c2M/L23`, `arr2xM/L22` |

**Vérifications :** les six paramètres concordent **exactement** avec la table d'indexation de TaxTips.ca (citant l'art. 122.51(1) LIR) — y compris les bornes d'élimination dérivées : 63 374 $ (2025) et 64 640 $ (2026) = `seuil + max / 5 %`. **Parité** : reproduit exactement `calc()` (`CA_medic ≡ 0`) sur 30 scénarios (5 situations × 6 revenus).

> ⚠️ **`CA_medic ≡ 0` dans le modèle.** Comme au poste 12, la seule dépense médicale est la **prime RAMQ** (`c2T376`), qui ne dépasse jamais le plancher de 3 % du revenu → frais admissibles = 0 → supplément nul **pour toute entrée** (vérifié sur 450 scénarios). La fonction reproduit néanmoins la **formule réelle** (art. 122.51) pour documenter le programme et alimenter la future application.

#### Algorithme épuré

```typescript
// (paramètres : voir src/postes/18-supplement-medical-federal.ts — SUPPLEMENT_MEDICAL[2025/2026])
export function supplementFraisMedicaux(fraisMedicaux, revenuTravailMax, revenuNet, afni, annee): number {
  const p = SUPPLEMENT_MEDICAL[annee];
  if (revenuTravailMax < p.revenuTravailMin) return 0;                       // admissibilité
  const plancher = Math.min(p.seuilFrais * revenuNet, p.plafondSeuilFrais);  // 3 %, plafonné
  const fraisAdmissibles = Math.max(0, fraisMedicaux - plancher);            // ligne 33200
  const supplement = Math.min(p.taux * fraisAdmissibles, p.supplementMax);   // 25 %, plafonné
  const reduction = p.tauxReduction * Math.max(0, afni - p.seuilReduction);  // 5 % de l'excédent d'AFNI
  return Math.round(Math.max(0, supplement - reduction) * 100) / 100;        // forme CORRECTE (≠ poste 12)
}
```

> **Notes** : (1) Supplément **remboursable** (s'ajoute au revenu disponible). (2) La réduction utilise l'**AFNI fédéral** (`c2T124`), pas le revenu net québécois — d'où la dépendance au calcul fédéral en amont. (3) Identité avec le poste 12 sur le constat `≡ 0`, mais formule de réduction différente (correcte ici).

---

### Poste 19 — Impôt sur le revenu (assemblage)

**Sorties :** `QC_impot` (impôt du Québec) et `CA_impot` (impôt fédéral), montants **annuels** du ménage.
**Base légale :** *Loi de l'impôt sur le revenu* (LRC 1985, ch. 1 (5ᵉ suppl.)) — fédéral ; *Loi sur les impôts* (RLRQ, c. I-3) — Québec ; **abattement du Québec** (16,5 % de l'impôt fédéral), art. 120(2) LIR.

Premier poste **d'assemblage** : il consomme les cotisations (postes 1-3, déductibles ou créditées) et la PSV (poste 17, imposable). Construit **par couches**, chacune validée par parité.

> 🔨 **Couche 1 (faite) — impôt FÉDÉRAL, ménages à 1 adulte** (actifs + retraités). **Couche 2 (à venir)** — crédits du Québec. **Couche 3 (à venir)** — couples (montant pour conjoint, transferts, PSV conjointe).

#### Structure (confirmée dans le code, vérifiée au cent)

Par adulte (fédéral, cellules `c2T…` ; Québec analogue) :

| Étape | Cellule | Formule |
| --- | --- | --- |
| Revenu net (ligne 23600) | `arr2xT62T62` | `revenu + CA_psv − RRQ supplémentaire` |
| Revenu imposable (ligne 26000) | `c2T65` | `revenu net − (SRG + supplément non imposables)` = `revenu + PSV − RRQ suppl.` |
| Impôt brut | `c2T71` | `progressif(revenu imposable, paliers fédéraux)` |
| Crédits (montants) | `c2T85` | Σ des montants admissibles (voir ci-dessous) |
| Impôt net | `c2T87` | `max(0, brut − crédits × 14,5 %)` |
| Après abattement | `c2T89` | `impôt net × (1 − 16,5 %)` |
| **`CA_impot`** | `c2T122` | `round(Σ adultes, 2)` |

**Crédits non remboursables fédéraux** (au taux du 1ᵉʳ palier) — vérifiés à la cent :

- **Montant personnel de base** : 14 538 $ + bonification 1 591 $ = **16 129 $** (2025) ; la bonification décroît linéairement de 177 882 $ à 253 414 $ de revenu net (nulle au-delà).
- **Montant pour un proche admissible** (parent seul) : un **second** montant de base (même réduction) — explique l'impôt fédéral nul des familles monoparentales à faible/moyen revenu.
- **Montant en raison de l'âge** (65 ans et +) : 9 028 $, réduit de 15 % du revenu net au-delà de 45 522 $.
- **Montant pour revenu de pension** : `min(2 000 $, revenu de pension)`.
- **Cotisations** : RRQ de **base** (poste 1), RQAP (poste 2), AE (poste 3).
- **Montant canadien pour emploi** : `min(1 471 $, revenu de travail)`.

> ⚠️ **Revenu imposable.** Le revenu de retraite saisi **inclut la PSV imposable** (`c2T41`) mais **exclut** le SRG et le supplément (`c2T42 + c2T43`, non imposables, retranchés). La cotisation RRQ **supplémentaire** (1 % + 4 %) est **déduite** (régime supplémentaire) ; la cotisation de **base** ouvre plutôt droit à un **crédit**.

#### Points de contrôle (parité `calc()`, 2025)

| Cas | `CA_impot` |
| --- | --- |
| Personne seule active, 25 000 $ | 674,75 $ |
| Personne seule active, 50 000 $ | 3 453,30 $ |
| Famille monoparentale, 50 000 $ | 1 500,48 $ (proche admissible) |
| Retraité seul, 72 ans, pension 30 000 $ | 1 408,60 $ |

**Parité** : 28 scénarios à 1 adulte (personne seule + monoparentale de 0 à 300 000 $ ; retraité seul de 0 à 120 000 $, âges 68/72), reproduits exactement pour 2025 **et** 2026.

#### Algorithme épuré (couche 1)

```typescript
// (paramètres : voir src/postes/19-impot.ts — IMPOT_FEDERAL[2025/2026])
export function impotFederalAdulte(revenu, age, retraite, proche, annee): number {
  const p = IMPOT_FEDERAL[annee]; const tauxCredit = PALIERS_FEDERAL[annee][0].taux;
  const rrq = retraite ? { base: 0, supplementaire: 0 } : cotisationRRQ(revenu, annee);
  const rqap = retraite ? 0 : cotisationRQAP(revenu, annee);
  const ae = retraite ? 0 : cotisationAE(revenu, annee);
  const psvImpos = psvImposable(age, revenu, annee);
  const caPsv = securiteVieillesse(age, 0, revenu, 0, 1, annee);
  const revenuNet = revenu + caPsv - rrq.supplementaire;          // ligne 23600
  const revenuImposable = revenu + psvImpos - rrq.supplementaire;  // ligne 26000
  const brut = impotProgressif(revenuImposable, PALIERS_FEDERAL[annee]);
  const credits = bpaFederal(revenuNet, p) + (proche ? bpaFederal(revenuNet, p) : 0)
    + (retraite ? Math.min(p.pensionMax, revenu) : 0)
    + (age >= 65 ? Math.max(0, p.ageMontant - p.ageTaux * Math.max(0, revenuNet - p.ageSeuil)) : 0)
    + rrq.base + rqap + ae + (retraite ? 0 : Math.min(p.emploiCanadaMax, revenu));
  const net = Math.max(0, brut - credits * tauxCredit);
  return Math.round(net * (1 - p.abattementQc) * 100) / 100;       // abattement du Québec
}
```

#### Couche 2 — impôt du Québec (`QC_impot`)

Même squelette, **sans abattement**. Le revenu imposable retranche en plus la **déduction pour travailleur** (`min(6 % × revenu, 1 420 $)`). Crédits non remboursables (au taux de 14 %) :

- **Montant personnel de base** : 18 571 $ (2025) / 18 952 $ (2026).
- **Montant combiné** « personne vivant seule (2 128 $) + âge 65 ans et + (3 906 $) + revenus de retraite (max 3 470 $) », **réduit de 18,75 %** du revenu net au-delà de **42 090 $** (`c2T235`).

```typescript
export function impotQuebecAdulte(revenu, age, retraite, vivantSeul, annee): number {
  const p = IMPOT_QUEBEC[annee]; const tauxCredit = PALIERS_QC[annee][0].taux; // 0,14
  const rrqSuppl = retraite ? 0 : cotisationRRQ(revenu, annee).supplementaire;
  const psvImpos = psvImposable(age, revenu, annee);
  const caPsv = securiteVieillesse(age, 0, revenu, 0, 1, annee);
  const deducTravailleur = retraite ? 0 : Math.min(p.deducTravailleurTaux * revenu, p.deducTravailleurMax);
  const revenuNet = revenu + caPsv - deducTravailleur - rrqSuppl;
  const revenuImposable = revenu + psvImpos - deducTravailleur - rrqSuppl;
  const brut = impotProgressif(revenuImposable, PALIERS_QC[annee]);
  const combine = (vivantSeul ? p.montantSeul : 0) + (age >= 65 ? p.ageMontant : 0)
    + (retraite ? Math.min(revenu, p.pensionMax) : 0);
  const combineReduit = Math.max(0, combine - p.reductionTaux * Math.max(0, revenuNet - p.reductionSeuil));
  const credits = (p.bpa + combineReduit) * tauxCredit;
  return Math.round(Math.max(0, brut - credits) * 100) / 100;   // pas d'abattement
}
```

> ⚠️ **Particularités du Québec dans le modèle.** (1) La famille **monoparentale** paie le **même** impôt québécois que la personne seule — pas de crédit pour proche admissible (les enfants relèvent de l'Allocation famille). (2) Les **cotisations** (RRQ base, RQAP, AE) ne sont **pas créditées** dans l'impôt québécois du modèle : la **déduction pour travailleur** (1 420 $) en tient lieu. (3) Le **montant pour revenus de retraite** (max 3 470 $) ne porte que sur le revenu de pension privé saisi, pas sur la PSV.

**Points de contrôle QC** (parité, 2025) : personne seule 50 000 $ → 3 996,40 $ ; 25 000 $ → 373,24 $ ; retraité 72 ans/30 000 $ → 1 500,26 $. **28 scénarios** (mêmes profils que le fédéral) reproduits exactement, 2025 et 2026.

#### Couche 3a — couples FÉDÉRAUX (`CA_impot`)

Trois mécanismes propres aux couples, vérifiés à la cent :

1. **Montant pour conjoint** = `max(0, BPA − revenu imposable du conjoint)` (un seul des deux est non nul) — ex. retraités 30 000/0 : `16 129 − 8 791,14 = 7 337,86 $`.
2. **Transfert de la partie inutilisée de l'âge + pension** vers le conjoint (le plus grand transfert l'emporte) — ex. retraités 30 000/0 : l'âge de 9 028 $ du conjoint sans revenu passe à l'autre ⇒ impôt fédéral **nul**.
3. **Crédit médical du couple** = `max(0, prime RAMQ − 3 % × revenu net)`, réclamé par celui qui en tire le plus, **plafonné à son impôt résiduel** et appliqué **en dernier** — ex. 50 000/30 000 : `max(0, 1 488 − 892,05) = 595,95 $` sur le 2ᵉ revenu (nul pour une personne seule, car la prime ne dépasse pas le plancher de 3 %).

**Points de contrôle couple** (parité, 2025) : deux revenus 50 000/30 000 → 4 611,61 $ ; retraités 30 000/0 → 0 $. **24 scénarios** (couples actifs un/deux revenus + couples de retraités) reproduits exactement, 2025 et 2026. *(Crédit médical : la prime RAMQ du couple est fournie en entrée, comme aux postes 12/18.)*

#### Couche 3b — couples QUÉBEC (`QC_impot`)

Particularités québécoises des couples (vérifiées à la cent) :

1. **Adulte 1** réclame le **montant combiné des DEUX conjoints** (âge + revenus de retraite), réduit de 18,75 % du **revenu net familial** au-delà de 42 090 $ ; **adulte 2** n'a que le BPA — ex. retraités 25 000/25 000 : `(3 906 + 3 470) × 2 − 18,75 % × (67 582 − 42 090) = 9 972,20` sur l'adulte 1.
2. **Crédit médical non remboursable** du couple = `max(0, prime RAMQ − 3 % × revenu net familial) × 20 %` — non nul pour les couples (prime plus élevée), nul pour les personnes seules.
3. **Transfert général** : la partie inutilisée des crédits d'un conjoint réduit l'impôt de l'autre (ligne 431) — ex. retraités 30 000/0 : le BPA + crédits inutilisés du conjoint sans revenu (1 369,18 $) passent à l'adulte 1.

**Points de contrôle couple QC** (parité, 2025) : actif 50 000/0 → 1 527,31 $ ; retraités 30 000/0 → 14,23 $ ; retraités 25 000/25 000 → 2 865,53 $. **20 scénarios** (couples actifs + retraités) reproduits exactement, 2025 et 2026.

> ✅ **Poste 19 terminé** : `CA_impot` et `QC_impot` exacts pour **tous** les ménages du modèle (1 adulte et couples, actifs et retraités), les deux années.

---

### Poste 20 — Revenu disponible (agrégation finale)

**Sortie :** `RD` (revenu disponible du ménage, par année). **Dernier poste** : la somme de tout ce qui précède.

Traçage : `RD = c2D85 = c2D83 + c2D63 + c2D72 + c2D80 − c2D84` (l. 23346). En montants **positifs** (signes explicités) :

```
RD = revenu − cotisations + transferts QC − impôt QC + transferts fédéraux − impôt fédéral
```

| Bloc | Cellule | Contenu |
| --- | --- | --- |
| Revenu | `c2D83` (`c2T432`) | revenu de travail/retraite (`revenu1 + revenu2`) |
| Cotisations | `c2D80` | RRQ + RQAP + AE + FSS + RAMQ (négatives) |
| Bloc Québec | `c2D63` | transferts QC − impôt QC (= `QC_total`) |
| Bloc fédéral | `c2D72` | transferts fédéraux − impôt fédéral (= `CA_total`) |
| (`c2D84` = 0 pour tous les cas-types) | | |

Les **transferts québécois** comptent **10** composantes — les 9 postes QC (Allocation famille, prime au travail, solidarité, allocation-logement, soutien aux aînés, frais de garde, aide de dernier recours, frais médicaux, − impôt QC) **plus le supplément pour fournitures scolaires** (`SFS`), montant fixe de **124 $/127 $ par enfant de 4-16 ans** (ajouté au poste 7).

> ✅ **Parité** : l'agrégation reproduit exactement `RD` sur 9 profils (personne seule, monoparentale avec enfants, couples actifs/un revenu, retraités), 2025 et 2026 — ex. personne seule 50 000 $ → **39 169,20 $** ; couple 50 000/30 000 → 62 284,87 $ ; retraités 30 000/0 → 51 715,99 $.

#### Orchestrateur de bout en bout (`calculerRevenuDisponible`)

`calculerRevenuDisponible(menage, annee)` calcule `RD` à partir des **entrées brutes** en enchaînant tous les postes et en **reconstruisant les bases de revenu internes** :

- **Revenu net familial** (QC, `c2T271`) = `revenu + PSV + aide sociale − déduction travailleur − RRQ supplémentaire`.
- **AFNI** (fédéral, `c2T124`) = idem **sans** la déduction pour travailleur (propre au Québec).
- **Revenu pour l'allocation-logement** (`c2T357`) = revenu net familial − `PSV × facteur` (≈ 5 % en 2025).

Ordre : cotisations + PSV + aide sociale (feuilles) → bases de revenu → RAMQ → transferts QC/fédéraux → impôts → agrégation. **Deux pièges traités** : les cotisations **RRQ/RQAP/AE** et l'**ACT** portent sur le revenu de **travail** — mises à zéro pour les retraités (sinon la pension serait prise pour un revenu de travail). **Parité** : `RD` reproduit à la cent sur 24 scénarios (personnes seules, monoparentales avec enfants, couples actifs/un revenu, retraités seuls/couples), 2025 et 2026.

> 🔭 **Vers l'application** : ce cœur de calcul est prêt. Reste, côté produit, l'interface de simulation et quelques raffinements (frais de garde subventionnés / types de garde, profils hors des 5 cas-types). Le `RD` de la référence n'étant pas arrondi, on le compare **au cent**.

---

## 6. Ordre de construction proposé

L'impôt étant **en aval**, on construit d'abord ses intrants. Ordre recommandé :

1. **Cotisations** (postes 1–5) — autoportantes, paramètres nets : RRQ → RQAP → AE → FSS → RAMQ. ✅ **terminées.**
2. **Transferts et crédits** (postes 6–18) — chacun défini par ses propres paramètres. *(Postes 6 à 18 : ✅ faits.)*
3. **Impôt** (poste 19) — assemblage : impôt progressif − crédits non remboursables − abattement QC. ✅ **fait.**
4. **Revenu disponible** (poste 20) — agrégation finale : revenus − cotisations − impôts + transferts. ✅ **fait.**

**✅ Tous les postes (1-20) sont construits et vérifiés par parité.** Prochaine étape (hors « postes ») : l'**orchestrateur** de bout en bout (`ménage` → tous les postes → `RD`), en branchant les bases de revenu internes (revenu net familial QC, AFNI fédéral) — le cœur de calcul de l'application interactive (voir la note « Vers l'application » au poste 20).
