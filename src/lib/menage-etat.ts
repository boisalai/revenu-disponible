// État d'un ménage dans l'interface (formulaire), et conversion vers le type `Menage` du moteur.
// Partagé par le calculateur, la comparaison et la bibliothèque.

import { type Enfant, type Menage, Situation, SITUATIONS, TypeGarde } from "@/index";

/** Un enfant dans le formulaire : âge + frais de garde annuels + service de garde (TypeGarde). */
export type EnfantEtat = Enfant; // { age, fraisGarde, typeGarde }

/** Plafond de saisie des frais de garde par enfant ($) — règle du calculateur MFQ. */
export const FRAIS_GARDE_MAX = 15_000;

export interface MenageEtat {
  situation: Situation;
  revenu1: number;
  age1: number;
  revenu2: number;
  age2: number;
  enfants: EnfantEtat[];
}

/** Enfant ajouté par défaut : 5 ans, sans frais, place subventionnée (comme le MFQ). */
export const ENFANT_DEFAUT: EnfantEtat = { age: 5, fraisGarde: 0, typeGarde: TypeGarde.Subventionne };

export const MENAGE_DEFAUT: MenageEtat = {
  situation: Situation.PersonneSeule,
  revenu1: 50_000,
  age1: 40,
  revenu2: 0,
  age2: 40,
  enfants: [],
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
    enfants: peutAvoirEnfants(e.situation) ? e.enfants : [],
  };
}

/**
 * Normalise un état de ménage venant d'une source non fiable (URL `?s=`, ménage sauvegardé en
 * base). Gère la **nouvelle** forme `enfants[]` ET l'**ancienne** `agesEnfants[]` (rétro-compat),
 * et borne chaque montant de frais à {@link FRAIS_GARDE_MAX}.
 */
export function normaliserMenageEtat(raw: unknown): MenageEtat {
  const o = (raw ?? {}) as Record<string, unknown>;
  const n = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const s = Number(o.situation);

  let enfants: EnfantEtat[] = [];
  if (Array.isArray(o.enfants)) {
    enfants = o.enfants.slice(0, 5).map((e) => {
      const c = (e ?? {}) as Record<string, unknown>;
      return {
        age: n(c.age, 5),
        fraisGarde: Math.min(FRAIS_GARDE_MAX, Math.max(0, n(c.fraisGarde))),
        typeGarde: n(c.typeGarde) === TypeGarde.NonSubventionne ? TypeGarde.NonSubventionne : TypeGarde.Subventionne,
      };
    });
  } else if (Array.isArray(o.agesEnfants)) {
    // ancienne forme : que des âges → frais 0, place subventionnée
    enfants = o.agesEnfants.slice(0, 5).map((a) => ({ age: n(a, 5), fraisGarde: 0, typeGarde: TypeGarde.Subventionne }));
  }

  return {
    situation: (s >= 0 && s <= 4 ? s : 0) as Situation,
    revenu1: n(o.revenu1),
    age1: n(o.age1, 40),
    revenu2: n(o.revenu2),
    age2: n(o.age2, 40),
    enfants,
  };
}
