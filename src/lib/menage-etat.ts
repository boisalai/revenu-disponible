// État d'un ménage dans l'interface (formulaire), et conversion vers le type `Menage` du moteur.
// Partagé par le calculateur et la comparaison.

import { type Menage, Situation, SITUATIONS } from "@/index";

export interface MenageEtat {
  situation: Situation;
  revenu1: number;
  age1: number;
  revenu2: number;
  age2: number;
  agesEnfants: number[];
}

export const MENAGE_DEFAUT: MenageEtat = {
  situation: Situation.PersonneSeule,
  revenu1: 50_000,
  age1: 40,
  revenu2: 0,
  age2: 40,
  agesEnfants: [],
};

export function aDeuxAdultes(situation: Situation): boolean {
  return SITUATIONS[situation].nbAdultes === 2;
}

export function peutAvoirEnfants(situation: Situation): boolean {
  return situation === Situation.FamilleMonoparentale || situation === Situation.Couple;
}

/** Convertit l'état du formulaire en `Menage` pour le moteur (selon la situation choisie). */
export function versMenage(e: MenageEtat): Menage {
  const couple = aDeuxAdultes(e.situation);
  return {
    situation: e.situation,
    revenu1: e.revenu1,
    ageAdulte1: e.age1,
    revenu2: couple ? e.revenu2 : 0,
    ageAdulte2: couple ? e.age2 : 0,
    enfants: peutAvoirEnfants(e.situation) ? e.agesEnfants.map((age) => ({ age, fraisGarde: 0, typeGarde: 0 })) : [],
  };
}
