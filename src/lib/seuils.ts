// Seuils d'imposition nulle et de contribution nette — couche de présentation.
//
// Trois questions « en niveaux », complémentaires de la vue marginale (taux-marginal.ts) :
//  1. à partir de quel revenu le ménage paie-t-il son premier dollar d'impôt (Québec ; fédéral) ?
//  2. à partir de quel revenu devient-il CONTRIBUTEUR NET (impôts > transferts) ?
//  3. au revenu saisi, quelle est sa position nette (transferts reçus − impôts payés) ?
//
// Convention identique au TEMI : le revenu (travail ou pension) de l'ADULTE 1 varie, le reste
// du ménage est fixe. Solde « impôts contre transferts » seulement : les cotisations
// (assurantielles — elles ouvrent des droits) et les frais de garde (coût privé) en sont exclus.
// Les seuils sont trouvés par balayage du moteur puis dichotomie — exacts au dollar, fidèles
// au moteur par construction (aucune formule parallèle à entretenir).

import { calculerRevenuDisponible, type Annee, type Menage } from "@/index";

export interface PositionNette {
  transferts: number; // transferts reçus (Québec + fédéral)
  impots: number; // impôts payés (Québec + fédéral)
  nette: number; // transferts − impôts (> 0 : bénéficiaire net ; < 0 : contributeur net)
  netteQuebec: number; // transferts QC − impôt QC
  netteFederal: number; // transferts fédéraux − impôt fédéral
}

/** Position nette du ménage au revenu saisi (transferts reçus − impôts payés). */
export function positionNette(menage: Menage, annee: Annee): PositionNette {
  const c = calculerRevenuDisponible(menage, annee).composantes;
  const transferts = c.transfertsQuebec + c.transfertsFederaux;
  const impots = c.impotQuebec + c.impotFederal;
  return {
    transferts,
    impots,
    nette: transferts - impots,
    netteQuebec: c.transfertsQuebec - c.impotQuebec,
    netteFederal: c.transfertsFederaux - c.impotFederal,
  };
}

export interface SeuilsMenage {
  impotQuebec: number | null; // premier dollar d'impôt du Québec
  impotFederal: number | null; // premier dollar d'impôt fédéral
  contributeurNet: number | null; // impôts (QC + féd) > transferts (QC + féd)
  contributeurNetQuebec: number | null; // impôt QC > transferts QC
  contributeurNetFederal: number | null; // impôt fédéral > transferts fédéraux
}

/** Plafond du balayage : au-delà, un seuil est rapporté « non atteint » (null). */
export const SEUIL_MAX = 300_000;
const PAS_BALAYAGE = 2000;

type Composantes = ReturnType<typeof calculerRevenuDisponible>["composantes"];
export type Critere = keyof SeuilsMenage;

/** Fonctions de critère (— exportées pour la revérification des seuils par le générateur du guide). */
export const CRITERES: Record<Critere, (c: Composantes) => number> = {
  impotQuebec: (c) => c.impotQuebec,
  impotFederal: (c) => c.impotFederal,
  contributeurNet: (c) => c.impotQuebec + c.impotFederal - c.transfertsQuebec - c.transfertsFederaux,
  contributeurNetQuebec: (c) => c.impotQuebec - c.transfertsQuebec,
  contributeurNetFederal: (c) => c.impotFederal - c.transfertsFederaux,
};

const NOMS = Object.keys(CRITERES) as Critere[];

/**
 * Seuils du ménage : pour chaque critère, le PREMIER revenu (au dollar près) où il devient
 * strictement positif — balayage commun par pas de 2 000 $ jusqu'à `SEUIL_MAX`, puis
 * dichotomie dans la tranche qui encadre le franchissement.
 */
export function seuilsMenage(menage: Menage, annee: Annee): SeuilsMenage {
  const compAu = (r: number): Composantes => calculerRevenuDisponible({ ...menage, revenu1: r }, annee).composantes;

  const bornes = new Map<Critere, { bas: number; haut: number }>();
  const c0 = compAu(0);
  for (const nom of NOMS) if (CRITERES[nom](c0) > 0) bornes.set(nom, { bas: 0, haut: 0 });
  for (let r = PAS_BALAYAGE; r <= SEUIL_MAX && bornes.size < NOMS.length; r += PAS_BALAYAGE) {
    const c = compAu(r);
    for (const nom of NOMS) {
      if (!bornes.has(nom) && CRITERES[nom](c) > 0) bornes.set(nom, { bas: r - PAS_BALAYAGE, haut: r });
    }
  }

  const affiner = (nom: Critere): number | null => {
    const b = bornes.get(nom);
    if (!b) return null; // jamais positif avant SEUIL_MAX
    let { bas, haut } = b;
    while (haut - bas > 1) {
      const m = Math.round((bas + haut) / 2);
      if (CRITERES[nom](compAu(m)) > 0) haut = m;
      else bas = m;
    }
    return haut;
  };

  return {
    impotQuebec: affiner("impotQuebec"),
    impotFederal: affiner("impotFederal"),
    contributeurNet: affiner("contributeurNet"),
    contributeurNetQuebec: affiner("contributeurNetQuebec"),
    contributeurNetFederal: affiner("contributeurNetFederal"),
  };
}
