# Revenu disponible (MFQ) — volet pédagogique

Ce document explique **en langage clair** chacun des postes du calculateur « Le revenu disponible » du ministère des Finances du Québec : ce qu'est la mesure, à quoi elle sert, et comment elle se calcule. Il accompagne la reconstruction technique — [`revenu-disponible.md`](revenu-disponible.md) — qui contient, pour chaque poste, le traçage du code, les **paramètres vérifiés** et l'**algorithme épuré**.

> Vulgarisation à but pédagogique. Pour les valeurs exactes et leur vérification, se reporter au document technique et aux **sources officielles** citées. Ce texte ne constitue pas un avis juridique ou fiscal.

Les **références** renvoient aux sources officielles (lois, formulaires, paramètres ministériels) listées au §2 du document technique sous les codes S1, S2, … Chaque poste y est aussi détaillé techniquement (mention « → document technique »).

Les **hypothèses et simplifications** du calculateur MFQ (p. ex. le loyer imputé du poste 10) sont regroupées dans [`hypotheses-mfq.md`](hypotheses-mfq.md).

---

## Cotisations (postes 1 à 5)

Les **cotisations** sont des prélèvements obligatoires qui **réduisent** le revenu disponible. Quatre d'entre elles (RRQ, RQAP, AE, FSS) portent sur le revenu de travail ou de retraite ; la cinquième (RAMQ) est une **prime d'assurance** assise sur le revenu familial.

---

### Poste 1 — RRQ (Régime de rentes du Québec)

**Description.** Régime public et obligatoire d'assurance sociale : chaque travailleur de 18 ans et plus cotise sur ses revenus de travail, et l'employeur verse une part égale. En contrepartie, le régime versera plus tard une rente de retraite — et, s'il y a lieu, des prestations d'invalidité ou de survivants.

**Objectif.** Assurer un revenu de remplacement à la retraite. Depuis 2019, un « régime supplémentaire » s'ajoute progressivement au régime de base pour faire passer le taux de remplacement visé d'environ 25 % à 33 % du revenu de travail admissible.

**Règles de calcul.** On ne cotise pas sur la première tranche de revenu (exemption générale de 3 500 $) ni au-delà d'un plafond, le **maximum des gains admissibles** (MGA). Entre les deux s'appliquent le taux du régime de base et une 1ʳᵉ cotisation supplémentaire. Une 2ᵉ cotisation supplémentaire s'ajoute sur une bande supérieure, entre le MGA et un second plafond (le MGAS, fixé à 114 % du MGA). En 2026, le taux de base du salarié baisse de 5,4 % à 5,3 %. Sur le plan fiscal, la cotisation de base donne droit à un **crédit d'impôt** et les cotisations supplémentaires à une **déduction**.

**Références.** *Loi sur le régime de rentes du Québec* (RLRQ, c. R-9) ; paramètres annuels de Retraite Québec (S4) et de Revenu Québec (S5). → document technique, poste 1.

---

### Poste 2 — RQAP (Régime québécois d'assurance parentale)

**Description.** Régime qui verse les prestations de maternité, de paternité, parentales et d'adoption aux parents québécois. Il remplace, au Québec, le volet « parental » de l'assurance-emploi fédérale.

**Objectif.** Soutenir le revenu des parents au moment d'une naissance ou d'une adoption. Il est financé par des cotisations partagées entre les salariés, les employeurs et les travailleurs autonomes.

**Règles de calcul.** La cotisation du salarié est un simple pourcentage du revenu assurable, **sans exemption de base**, jusqu'à un **revenu maximal assurable**. Elle n'est due que si le revenu assurable de l'année dépasse 2 000 $. En 2026, le taux du salarié baisse de 0,494 % à 0,430 % et le maximum assurable passe de 98 000 $ à 103 000 $.

**Références.** *Loi sur l'assurance parentale* (RLRQ, c. A-29.011) ; maximum assurable et taux fixés annuellement (S6). → document technique, poste 2.

---

### Poste 3 — Assurance-emploi (AE)

**Description.** Régime **fédéral** qui verse des prestations temporaires en cas de perte d'emploi (et certaines prestations spéciales). Le salarié cotise sur sa rémunération assurable ; l'employeur verse 1,4 fois la cotisation du salarié.

**Objectif.** Remplacer une partie du revenu pendant une période de chômage. Comme le Québec assume lui-même les prestations parentales (via le RQAP), les travailleurs québécois paient un **taux réduit** : la portion « parentale » du taux fédéral leur est retirée.

**Règles de calcul.** Pourcentage de la rémunération assurable, **sans exemption**, jusqu'au **maximum de la rémunération assurable** (MRA). Le taux québécois = taux fédéral − réduction provinciale (0,33 %). Si la rémunération assurable de l'année ne dépasse pas 2 000 $, la cotisation est **entièrement remboursée**.

**Références.** *Loi sur l'assurance-emploi* (LC 1996, ch. 23), art. 4, 66, 69(2), 96(4) ; paramètres annuels de Service Canada (S7) et rapports actuariels du BSIF (S8). → document technique, poste 3.

---

### Poste 4 — FSS (Fonds des services de santé) — cotisation des particuliers

**Description.** Le Fonds des services de santé perçoit, **des particuliers**, une cotisation assise sur certains revenus qui n'ont pas été soumis aux prélèvements sur la paie — notamment les revenus de retraite (mais aussi d'entreprise, de biens, ou les gains en capital). À ne pas confondre avec la cotisation **des employeurs** au FSS, assise sur la masse salariale.

**Objectif.** Faire contribuer ces revenus au financement des services de santé. En pratique, dans ce modèle, seuls les ménages **retraités** ont une base imposable, puisque le revenu d'emploi est exclu.

**Règles de calcul.** La cotisation suit une courbe en **deux tranches plafonnées** : elle croît de 1 % au-dessus d'un premier seuil jusqu'à un plafond de 150 $, forme un **plateau**, puis reprend au-dessus d'un second seuil jusqu'à un **maximum de 1 000 $**.

**Références.** *Loi sur la Régie de l'assurance maladie du Québec* (RLRQ, c. R-5), art. 38 à 40 ; ligne 446 et annexe F du TP-1 ; paramètres MFQ (S9, S10). → document technique, poste 4.

---

### Poste 5 — RAMQ (régime public d'assurance médicaments) — prime annuelle

**Description.** Le régime public d'assurance médicaments couvre les personnes qui n'ont pas accès à une assurance privée (collective). Ses assurés paient une **prime annuelle**, perçue par Revenu Québec dans la déclaration de revenus (annexe K, ligne 447).

**Objectif.** Financer une partie du régime public tout en assurant un accès universel à une couverture médicaments. La prime est **modulée selon la capacité de payer** : nulle sous un seuil de revenu, elle croît ensuite jusqu'à un maximum ; certaines personnes vulnérables en sont **exonérées**.

**Règles de calcul.** La prime ne porte pas sur le revenu de travail individuel, mais sur le **revenu familial net**, au-dessus d'un seuil d'exonération qui augmente avec la taille du ménage. Au-dessus du seuil, deux taux s'appliquent (un taux sur les premiers 5 000 $, un taux plus élevé sur l'excédent) jusqu'à une **prime maximale par adulte**. Chaque adulte paie sa prime : un couple verse donc jusqu'à **deux fois** le maximum, mais à **demi-taux**. Sont notamment exonérés les prestataires d'une aide financière de **dernier recours** et les **aînés** (65 ans et plus) qui touchent le **Supplément de revenu garanti maximal**.

**Références.** *Loi sur l'assurance médicaments* (RLRQ, c. A-29.01), art. 10, 23, 24 ; annexe K (TP-1.D.K) et ligne 447 ; tarifs RAMQ et indexation MFQ (S11, S12). → document technique, poste 5.

---

---

## Transferts et crédits (postes 6 à 18)

À l'inverse des cotisations, les **transferts et crédits augmentent** le revenu disponible. Plusieurs sont **remboursables** : ils sont versés même lorsque la famille n'a aucun impôt à payer.

---

### Poste 6 — Crédit d'impôt remboursable pour frais de garde d'enfants

**Description.** Crédit d'impôt **remboursable** qui rembourse une partie des frais de garde payés par les parents pour faire garder leurs enfants pendant qu'ils travaillent, cherchent un emploi ou étudient. Étant remboursable, il est versé même si la famille n'a aucun impôt à payer (et peut être reçu d'avance, par versements anticipés).

**Objectif.** Réduire le coût net de la garde et soutenir la participation au marché du travail. Il vise surtout les familles qui recourent à une garde **non subventionnée** : les places à contribution réduite (CPE et garderies subventionnées) ne donnent pas droit au crédit, leur tarif étant déjà réduit.

**Règles de calcul.** Le crédit = **taux × frais admissibles**. Le **taux** dépend du revenu familial net : il décroît par paliers de **78 %** (faibles revenus) à **67 %** (revenus élevés). Les **frais admissibles** sont les frais de garde non subventionnés, **plafonnés par enfant** : plafond plus élevé pour un enfant de moins de 7 ans, plafond réduit pour les autres enfants admissibles. Un enfant est admissible s'il a **moins de 16 ans** (ou est handicapé, à tout âge) — seuil qui descend à **moins de 14 ans à compter de 2026**.

**Références.** *Loi sur les impôts* (RLRQ, c. I-3), art. 1029.8.67 et suivants ; annexe C du TP-1 ; paramètres chiffrés (taux, seuils, plafonds) au document du MFQ « Paramètres du régime d'imposition des particuliers » (S10, S13). → document technique, poste 6.

---

### Poste 7 — Allocation famille (ancien « Soutien aux enfants »)

**Description.** Aide financière **remboursable** versée par Retraite Québec à toutes les familles ayant un ou plusieurs enfants de moins de 18 ans. Elle est payée périodiquement, automatiquement à partir de la déclaration de revenus.

**Objectif.** Aider les familles à assumer le coût des enfants. C'est une mesure **quasi universelle** : les familles à faible revenu reçoivent le montant maximal, tandis que les familles à revenu élevé conservent un montant minimal garanti.

**Règles de calcul.** Chaque famille reçoit un **montant maximal** (un montant par enfant, plus un supplément pour les familles monoparentales) tant que son revenu familial net ne dépasse pas un **seuil** (plus bas pour une famille monoparentale que pour un couple). Au-delà du seuil, le montant est **réduit de 4 %** de l'excédent de revenu — mais jamais en deçà d'un **montant minimal** garanti, versé quel que soit le revenu.

**Références.** *Loi sur les impôts* (RLRQ, c. I-3), art. 1029.8.61.8 à 1029.8.61.60 ; Retraite Québec, « L'Allocation famille » ; montants et seuils au document du MFQ « Paramètres du régime d'imposition des particuliers » (S10, S14). → document technique, poste 7.

---

### Poste 8 — Prime au travail (générale)

**Description.** Crédit d'impôt **remboursable** qui bonifie le revenu des personnes et des familles ayant un revenu de travail modeste. Versé par Revenu Québec (par versements anticipés ou au moment de la déclaration), il s'ajoute au salaire.

**Objectif.** **Inciter au travail** et soutenir les travailleurs à faible revenu, en réduisant l'écart financier entre l'aide sociale et l'emploi : la prime « récompense » l'entrée et le maintien en emploi.

**Règles de calcul.** La prime suit une **courbe en cloche** selon le revenu. Elle **croît** (à 11,6 %, 30 % ou 25 % selon le type de ménage) sur le revenu de **travail** excédant un montant exclu (2 400 $ pour une personne seule, 3 600 $ pour un couple), jusqu'à un **maximum** ; puis elle **décroît** de 10 % du revenu **familial net** au-delà d'un seuil, jusqu'à s'éteindre. Les familles avec enfants reçoivent une prime plus généreuse que les ménages sans enfants.

**Références.** *Loi sur les impôts* (RLRQ, c. I-3), art. 1029.8.116.1 à 1029.8.116.11 ; Revenu Québec, « Crédits d'impôt relatifs à la prime au travail » ; montants et seuils au document du MFQ « Paramètres du régime d'imposition des particuliers » (S10, S15). → document technique, poste 8.

---

### Poste 9 — Crédit d'impôt pour la solidarité

**Description.** Crédit d'impôt **remboursable** versé par Revenu Québec, généralement par dépôts mensuels ou trimestriels, qui aide les ménages à revenu faible ou moyen. Il regroupe trois volets : la **TVQ** (compenser la taxe de vente), le **logement**, et un volet pour les habitants d'un **village nordique**.

**Objectif.** Compenser une partie du poids de la taxe de vente et du coût du logement pour les ménages modestes. C'est un crédit très répandu, demandé en s'inscrivant et en remplissant l'annexe D de la déclaration de revenus.

**Règles de calcul.** On additionne les montants des volets auxquels le ménage a droit (montant de base, supplément pour conjoint ou pour personne vivant seule, montant de logement selon la composition et le nombre d'enfants). Ce total est ensuite **réduit de 6 %** du revenu familial net dépassant un seuil (42 325 $ pour juillet 2025), jusqu'à s'annuler.

**Références.** *Loi sur les impôts* (RLRQ, c. I-3), art. 1029.8.116.12 à 1029.8.116.35 ; Revenu Québec, « Crédit d'impôt pour solidarité » ; montants et seuil au document du MFQ « Paramètres du régime d'imposition des particuliers » (S10, S16). → document technique, poste 9.

---

### Poste 10 — Programme Allocation-logement

**Description.** Aide financière **remboursable** versée chaque mois par Revenu Québec (pour la Société d'habitation du Québec) aux ménages à faible revenu qui consacrent une part trop élevée de leur revenu à se loger. Elle vaut 100, 150 ou 170 $ par mois.

**Objectif.** Alléger le fardeau du logement pour des ménages vulnérables — les familles avec enfants et les personnes de 50 ans et plus — dont le loyer (ou les coûts de propriété) gruge une trop grande part du budget.

**Règles de calcul.** Le ménage doit être admissible (un adulte de **50 ans et plus**, ou un **enfant à charge**) et consacrer **plus de 30 %** de son revenu au logement. Le montant mensuel dépend de ce **taux d'effort** : 100 $ (30-50 %), 150 $ (50-80 %), 170 $ (80 % et plus). L'aide diminue **dollar pour dollar** lorsque le revenu dépasse un seuil (variable selon la composition), jusqu'à s'annuler.

**Références.** *Loi sur la Société d'habitation du Québec* (RLRQ, c. S-8) ; programme établi par décret, administré par Revenu Québec ; montants et seuils (Revenu Québec / CFFP, S17). → document technique, poste 10.

---

### Poste 11 — Crédit d'impôt pour soutien aux aînés

**Description.** Crédit d'impôt **remboursable** destiné aux personnes **âgées de 70 ans et plus** à revenu modeste. Il peut atteindre 2 000 $ par aîné admissible (donc 4 000 $ pour un couple dont les deux conjoints ont 70 ans et plus).

**Objectif.** Soutenir le revenu des aînés à faible ou moyen revenu. Comme il est remboursable, il est versé même en l'absence d'impôt à payer.

**Règles de calcul.** Chaque adulte de 70 ans et plus ouvre droit à un montant maximal de 2 000 $. Ce montant est ensuite **réduit** d'un pourcentage (5,40 % en 2025) du revenu familial net qui dépasse un seuil (plus élevé pour un couple que pour une personne seule), jusqu'à s'annuler.

**Références.** *Loi sur les impôts* (RLRQ, c. I-3) ; crédit de la ligne 463 du TP-1 ; montant et admissibilité (Revenu Québec, S18), seuils et taux (MFQ, S10). → document technique, poste 11.

---

### Poste 12 — Crédit d'impôt remboursable pour frais médicaux

**Description.** Crédit d'impôt **remboursable** qui rembourse une partie des frais médicaux des ménages ayant un revenu de travail modeste (en plus du crédit non remboursable pour frais médicaux). Il peut atteindre environ 1 466 $ (2025).

**Objectif.** Alléger le poids des frais médicaux pour les travailleurs à faible revenu.

**Règles de calcul.** Le crédit vaut **25 %** des frais médicaux admissibles — la partie des frais qui dépasse **3 %** du revenu familial net —, jusqu'à un maximum, **réduit** selon le revenu familial et conditionnel à un **revenu de travail minimal**.

**Note importante.** Dans le calculateur du MFQ, **aucun frais médical n'est saisi** (hormis la prime d'assurance médicaments, trop faible pour franchir le seuil de 3 %) : ce crédit y est donc **toujours nul**. Il est reconstruit par fidélité au modèle.

**Références.** *Loi sur les impôts* (RLRQ, c. I-3) ; paramètres (MFQ, S10 ; Revenu Québec, S19). → document technique, poste 12.

---

### Poste 13 — Aide de dernier recours (aide sociale / solidarité sociale)

**Description.** L'aide de dernier recours est le **filet social** du Québec : une prestation mensuelle versée par le ministère de l'Emploi et de la Solidarité sociale aux personnes et familles sans ressources suffisantes. Elle réunit le **Programme d'aide sociale** (sans contraintes sévères à l'emploi) et le **Programme de solidarité sociale** (contraintes sévères).

**Objectif.** Assurer un revenu **minimal de subsistance**, en dernier recours — après les autres programmes et ressources.

**Règles de calcul.** Le ménage reçoit une **prestation de base** mensuelle (adulte seul ou couple), majorée d'**ajustements** (notamment pour contraintes à l'emploi). On en soustrait le **revenu** du ménage ; mais les **gains de travail** sont exemptés jusqu'à 200 $/mois (seul) ou 300 $ (couple), et **25 %** des gains au-delà restent exemptés — pour **encourager le travail**. L'aide n'est pas versée aux **65 ans et plus** (qui touchent la Sécurité de la vieillesse et le Supplément de revenu garanti).

**Références.** *Loi sur l'aide aux personnes et aux familles* (RLRQ, c. A-13.1.1) ; barème et montants (quebec.ca, S20). → document technique, poste 13.

---

## Transferts fédéraux

Le gouvernement **fédéral** verse aussi des prestations et crédits qui s'ajoutent au revenu disponible. Ils sont modulés selon le revenu familial net **rajusté fédéral** (qui peut différer du revenu net québécois).

---

### Poste 14 — Allocation canadienne pour enfants (ACE)

**Description.** Prestation fédérale **non imposable**, versée chaque mois par l'Agence du revenu du Canada aux familles ayant des enfants de moins de 18 ans. Elle peut atteindre près de 8 000 $ par jeune enfant par année.

**Objectif.** Aider les familles à assumer le coût des enfants. C'est le principal soutien fédéral aux familles, ciblé selon le revenu (plus généreux pour les revenus faibles et moyens).

**Règles de calcul.** Chaque famille reçoit un montant maximal par enfant (plus élevé pour les **moins de 6 ans** que pour les **6-17 ans**). Ce maximum est ensuite **réduit** selon le revenu familial net rajusté, à **deux paliers** (au-delà d'environ 37 500 $, puis d'environ 81 000 $), à des taux qui **augmentent avec le nombre d'enfants**.

**Références.** *Loi de l'impôt sur le revenu* (art. 122.6 à 122.64) ; montants et seuils (Agence du revenu du Canada, S21). → document technique, poste 14.

---

### Poste 15 — Crédit pour la TPS/TVH

**Description.** Crédit fédéral **remboursable** versé tous les trois mois par l'Agence du revenu du Canada pour **compenser** la taxe sur les produits et services (TPS/TVH) payée par les ménages à revenu faible ou moyen.

**Objectif.** Atténuer le caractère **régressif** de la taxe de vente : comme tout le monde paie la TPS sur ses achats, ce crédit en rembourse une partie aux ménages les moins fortunés.

**Règles de calcul.** Le ménage reçoit un montant de base **par adulte** et **par enfant**, plus un supplément (pour une famille monoparentale, ou pour une personne seule — celui-ci s'accumule progressivement avec le revenu). Le total est **réduit de 5 %** du revenu familial net rajusté qui dépasse un seuil (environ 45 500 $), jusqu'à s'annuler.

**Références.** *Loi de l'impôt sur le revenu* (art. 122.5) ; montants et seuils (Agence du revenu du Canada, S22). → document technique, poste 15.

---

### Poste 16 — Allocation canadienne pour les travailleurs (ACT)

**Description.** Crédit fédéral **remboursable** qui bonifie le revenu des travailleurs à faible revenu — l'équivalent fédéral de la prime au travail du Québec. Au Québec, ses montants sont **reconfigurés** par entente avec le fédéral.

**Objectif.** **Inciter au travail** et soutenir les travailleurs à faible revenu, comme la prime au travail québécoise (les deux se cumulent).

**Règles de calcul.** Même forme en cloche que la prime au travail : la prime **croît** sur le revenu de travail au-delà d'un montant exclu, jusqu'à un **maximum**, puis **décroît de 20 %** du revenu familial net rajusté au-delà d'un seuil. Une **exemption du second revenu** avantage les couples où les deux conjoints travaillent. Les taux et montants diffèrent selon le type de ménage.

**Références.** *Loi de l'impôt sur le revenu* (art. 122.7) ; version québécoise (annexe 6, Agence du revenu du Canada, S23). → document technique, poste 16.

---

### Poste 17 — Sécurité de la vieillesse (PSV) + Supplément de revenu garanti (SRG)

**Description.** Le principal soutien du revenu des **personnes âgées de 65 ans et plus** au fédéral. La **PSV** est une pension de base versée à presque tous les aînés ; le **SRG** s'y ajoute pour les aînés à faible revenu ; l'**Allocation** vise les 60-64 ans dont le conjoint reçoit déjà ces prestations.

**Objectif.** Garantir un revenu de base à la retraite et protéger les aînés à faible revenu de la pauvreté. La PSV est quasi universelle ; le SRG est ciblé selon le revenu.

**Règles de calcul.** La **PSV** est un montant fixe (bonifié de 10 % à 75 ans), **récupéré** à 15 % au-delà d'un revenu élevé (environ 93 500 $). Le **SRG** part d'un maximum et **diminue** selon le revenu de retraite (50 % pour une personne seule, 25 % par conjoint pour un couple), calculé par paliers de revenu. Un **supplément complémentaire** s'ajoute pour les plus faibles revenus. L'**Allocation** est destinée à la personne de **60 à 64 ans** dont le conjoint touche déjà la PSV et le SRG : elle équivaut à ce que serait la PSV + le SRG du couple pour ce conjoint plus jeune, et **diminue** selon le revenu du couple (75 % sur la première tranche, puis 25 %). Les montants sont révisés **chaque trimestre** (indexés à l'inflation).

**Références.** *Loi sur la sécurité de la vieillesse* (LRC 1985, ch. O-9) ; impôt de récupération (*Loi de l'impôt sur le revenu*, art. 180.2) ; montants trimestriels (Emploi et Développement social Canada, S24). → document technique, poste 17.

---

### Poste 18 — Supplément remboursable pour frais médicaux (fédéral)

**Description.** Un montant **remboursable** versé par le fédéral aux travailleurs à faible revenu qui ont des frais médicaux élevés. C'est le pendant fédéral du crédit québécois (poste 12), réclamé à la ligne 45200 de la déclaration.

**Objectif.** Aider les personnes qui travaillent malgré des frais médicaux importants — en remboursant une partie de ces frais même lorsqu'elles paient peu ou pas d'impôt (d'où « remboursable »).

**Règles de calcul.** Le supplément vaut **25 %** des frais médicaux admissibles (les frais au-delà de 3 % du revenu net), jusqu'à un **maximum** (1 504 $ en 2025). Il faut un **revenu de travail minimal** (4 390 $ en 2025) pour y avoir droit. Le supplément **diminue** ensuite de 5 % du revenu familial qui dépasse un seuil (33 294 $), et s'éteint complètement vers 63 000 $.

**Le saviez-vous ?** Dans le calculateur du Ministère, ce supplément vaut **toujours zéro** : la seule dépense médicale prise en compte est la prime du régime public d'assurance médicaments (RAMQ), qui reste sous le plancher de 3 %. La règle est néanmoins reproduite fidèlement pour expliquer le programme.

**Références.** *Loi de l'impôt sur le revenu* (LRC 1985, ch. 1 (5ᵉ suppl.)), art. 122.51 ; ARC, « Ligne 45200 — Supplément remboursable pour frais médicaux » (S25). → document technique, poste 18.

---

### Poste 19 — Impôt sur le revenu (Québec et fédéral)

**Description.** L'impôt à payer sur le revenu, calculé séparément au **Québec** et au **fédéral**, puis soustrait du revenu disponible.

**Objectif.** Financer les services publics selon la capacité de payer (barèmes **progressifs** : le taux augmente avec le revenu).

**Règles de calcul.** Sur le **revenu imposable** (revenu moins certaines déductions) on applique le **barème progressif**, puis on soustrait les **crédits non remboursables** (montant personnel de base, cotisations, âge, pension, etc.). Au fédéral, l'impôt est réduit de l'**abattement du Québec** (16,5 %). Pour les **couples**, certains montants se transfèrent entre conjoints, et un conjoint sans revenu donne droit à un **montant pour conjoint**.

**Références.** *Loi de l'impôt sur le revenu* (fédéral) ; *Loi sur les impôts* (RLRQ, c. I-3, Québec) ; abattement du Québec, art. 120(2) LIR (S2, S26). → document technique, poste 19.

---

### Poste 20 — Revenu disponible

**Description.** Le résultat final : ce qu'il **reste** au ménage une fois tout pris en compte.

**Objectif.** Mesurer le revenu réellement à la disposition du ménage, après l'État (impôts et cotisations versés, transferts reçus). C'est l'indicateur que compare le calculateur entre deux années.

**Règles de calcul.** `Revenu disponible = revenu de travail/retraite − cotisations (RRQ, RQAP, AE, FSS, RAMQ) − impôts (Québec + fédéral) + tous les transferts (Allocation famille, crédits, prestations, Sécurité de la vieillesse, etc.).`

**Références.** Synthèse de tous les postes précédents. → document technique, poste 20.
