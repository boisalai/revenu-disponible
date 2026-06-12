// Les 13 ménages types du guide (M1-M13) — SOURCE UNIQUE.
//
// Consommée par :
//  • l'application (sélecteur « Cas types du guide » du calculateur) ;
//  • le générateur des exemples du guide (scripts/exemples-guide.ts), qui en
//    dérive les en-têtes LaTeX et tous les tableaux (bases, seuils, TEMI).
// Modifier un ménage ici fait échouer le test de fraîcheur des exemples tant
// que le guide n'est pas régénéré (npm run exemples) : app et PDF ne peuvent
// pas diverger.

import { Situation, TypeGarde } from "@/index";
import type { MenageEtat } from "@/lib/menage-etat";
import type { Bilingue } from "@/lib/i18n";

export interface MenageType {
  /** Code du guide : « M1 » … « M13 ». */
  code: string;
  /** Description courte pour le sélecteur de l'application. */
  description: Bilingue;
  /** État de formulaire complet (chargeable tel quel dans le calculateur). */
  etat: MenageEtat;
}

const etat = (
  situation: Situation,
  revenu1: number,
  age1: number,
  revenu2 = 0,
  age2 = 0,
  enfants: MenageEtat["enfants"] = [],
): MenageEtat => ({ situation, revenu1, age1, revenu2, age2, enfants });

export const MENAGES_TYPES: MenageType[] = [
  {
    code: "M1",
    description: { fr: "Personne seule, 25 ans, aucun revenu", en: "Single, 25, no income" },
    etat: etat(Situation.PersonneSeule, 0, 25),
  },
  {
    code: "M2",
    description: { fr: "Personne seule, 30 ans, 9 000 $", en: "Single, 30, $9,000" },
    etat: etat(Situation.PersonneSeule, 9000, 30),
  },
  {
    code: "M3",
    description: { fr: "Personne seule, 30 ans, 15 000 $", en: "Single, 30, $15,000" },
    etat: etat(Situation.PersonneSeule, 15_000, 30),
  },
  {
    code: "M4",
    description: { fr: "Personne seule, 40 ans, 50 000 $", en: "Single, 40, $50,000" },
    etat: etat(Situation.PersonneSeule, 50_000, 40),
  },
  {
    code: "M5",
    description: { fr: "Personne seule, 45 ans, 100 000 $", en: "Single, 45, $100,000" },
    etat: etat(Situation.PersonneSeule, 100_000, 45),
  },
  {
    code: "M6",
    description: {
      fr: "Monoparentale, 35 ans, 35 000 $ — 1 enfant (3 ans, garde subv. 2 000 $)",
      en: "Single parent, 35, $35,000 — 1 child (3, subsidized care $2,000)",
    },
    etat: etat(Situation.FamilleMonoparentale, 35_000, 35, 0, 0, [
      { age: 3, fraisGarde: 2000, typeGarde: TypeGarde.Subventionne },
    ]),
  },
  {
    code: "M7",
    description: { fr: "Couple, 45 et 44 ans, 30 000 $ + 0 $", en: "Couple, 45 & 44, $30,000 + $0" },
    etat: etat(Situation.Couple, 30_000, 45, 0, 44),
  },
  {
    code: "M8",
    description: {
      fr: "Couple, 38 et 36 ans, 60 000 $ + 40 000 $ — 2 enfants (4 et 8 ans, garde non subv.)",
      en: "Couple, 38 & 36, $60,000 + $40,000 — 2 children (4 & 8, non-subsidized care)",
    },
    etat: etat(Situation.Couple, 60_000, 38, 40_000, 36, [
      { age: 4, fraisGarde: 13_000, typeGarde: TypeGarde.NonSubventionne },
      { age: 8, fraisGarde: 3000, typeGarde: TypeGarde.NonSubventionne },
    ]),
  },
  {
    code: "M9",
    description: {
      fr: "Couple, 45 et 45 ans, 120 000 $ + 60 000 $ — 1 enfant (5 ans, garde non subv. 15 000 $)",
      en: "Couple, 45 & 45, $120,000 + $60,000 — 1 child (5, non-subsidized care $15,000)",
    },
    etat: etat(Situation.Couple, 120_000, 45, 60_000, 45, [
      { age: 5, fraisGarde: 15_000, typeGarde: TypeGarde.NonSubventionne },
    ]),
  },
  {
    code: "M10",
    description: { fr: "Retraité seul, 70 ans, pension de 20 000 $", en: "Retired single, 70, $20,000 pension" },
    etat: etat(Situation.RetraiteSeul, 20_000, 70),
  },
  {
    code: "M11",
    description: {
      fr: "Couple de retraités, 72 et 70 ans, pensions de 30 000 $ + 10 000 $",
      en: "Retired couple, 72 & 70, $30,000 + $10,000 pensions",
    },
    etat: etat(Situation.CoupleRetraites, 30_000, 72, 10_000, 70),
  },
  {
    code: "M12",
    description: { fr: "Retraité seul, 76 ans, pension de 110 000 $", en: "Retired single, 76, $110,000 pension" },
    etat: etat(Situation.RetraiteSeul, 110_000, 76),
  },
  {
    code: "M13",
    description: {
      fr: "Couple de retraités, 68 et 66 ans, pensions de 12 000 $ + 6 000 $",
      en: "Retired couple, 68 & 66, $12,000 + $6,000 pensions",
    },
    etat: etat(Situation.CoupleRetraites, 12_000, 68, 6000, 66),
  },
];
