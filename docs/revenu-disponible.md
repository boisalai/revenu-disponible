# Revenu disponible (MFQ) — reconstruction épurée

Reconstruction lisible du calculateur **« Le revenu disponible »** du ministère des Finances du Québec, à partir du fichier `revenu-disponible_dec2025.js` (généré depuis Excel via *SpreadsheetConverter*, puis dé-minifié).

Ce document est **compilé au fur et à mesure**, un poste à la fois. Chaque poste comporte : (1) les **paramètres** extraits du code et confrontés à la source officielle, (2) l'**algorithme épuré en TypeScript**.

---

## 1. Méthode et avertissements

- **Extraction** : les valeurs sont lues dans le bloc de paramètres du fichier (≈ lignes 27–310 de la fonction `calc(data)`), puis chaque valeur est **confrontée à la source officielle** (Revenu Québec, ARC, MFQ).
- **Pas de déroulé brut** : le cône de dépendance d'un poste va de 140 à 736 cellules entrelacées ; on reconstruit donc la *logique fiscale réelle*, pas la plomberie Excel.
- **Aucune valeur n'est ajoutée de mémoire** : si une valeur n'est pas dans le code **ou** pas confirmée par une source, elle est marquée `⚠️ à vérifier`.

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

### État d'avancement

| # | Poste | Sortie code | Paramètres | Algorithme TS |
|---|---|---|---|---|
| — | Impôt — **paramètres** | `QC_impot`, `CA_impot` | ✅ vérifiés (S1, S2) | ⏳ (voir ordre §6) |
| 1 | RRQ (+ bonification) | `CA_rrq`, `CA_rrq_bonif` | ✅ vérifiés (S4, S5) | ✅ |
| 2 | RQAP (+ « bonif ») | `QC_rqap`, `QC_rqap_bonif` | ✅ vérifiés (S6) | ✅ |
| 3 | Assurance-emploi | `CA_ae` | ✅ vérifiés (S7, S8) | ✅ |
| 4 | FSS | `QC_fss` | ✅ vérifiés (S9, S10) | ✅ |
| 5 | RAMQ (assurance médicaments) | `QC_ramq` | ⏳ | ⏳ |
| 6 | Frais de garde | `QC_garde`, `Frais_garde` | ⏳ | ⏳ |
| 7 | Soutien aux enfants / Allocation famille | `QC_sae` | ⏳ | ⏳ |
| 8 | Prime au travail | `QC_pt` | ⏳ | ⏳ |
| 9 | Crédit pour la solidarité | `QC_sol` | ⏳ | ⏳ |
| 10 | Allocation-logement | `QC_al` | ⏳ | ⏳ |
| 11 | Crédits aînés | `QC_aines` | ⏳ | ⏳ |
| 12 | Frais médicaux QC | `QC_medic` | ⏳ | ⏳ |
| 13 | Poste « ADR » (à identifier) | `QC_adr` | ⏳ | ⏳ |
| 14 | Allocation canadienne pour enfants | `CA_ace` | ⏳ | ⏳ |
| 15 | Crédit pour la TPS | `CA_tps` | ⏳ | ⏳ |
| 16 | Allocation canadienne pour les travailleurs | `CA_pfrt` | ⏳ | ⏳ |
| 17 | Sécurité de la vieillesse | `CA_psv` | ⏳ | ⏳ |
| 18 | Frais médicaux fédéral | `CA_medic` | ⏳ | ⏳ |
| 19 | **Impôt — algorithme** (assemblage) | `QC_impot`, `CA_impot` | ✅ | ⏳ |
| 20 | **Revenu disponible** (agrégation) | `RD` | — | ⏳ |

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

## 6. Ordre de construction proposé

L'impôt étant **en aval**, on construit d'abord ses intrants. Ordre recommandé :

1. **Cotisations** (postes 1–5) — autoportantes, paramètres nets : RRQ → RQAP → AE → FSS → RAMQ.
2. **Transferts et crédits** (postes 6–18) — chacun défini par ses propres paramètres.
3. **Impôt** (poste 19) — assemblage : impôt progressif − crédits non remboursables − abattement QC.
4. **Revenu disponible** (poste 20) — agrégation finale : revenus − cotisations − impôts + transferts.

**Prochain poste proposé : RAMQ (régime public d'assurance médicaments)** — sortie `QC_ramq`.
