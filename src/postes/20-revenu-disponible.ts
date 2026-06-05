// ===========================================================================
// Poste 20 — Revenu disponible (AGRÉGATION FINALE)
// Sortie code : RD (revenu disponible du ménage, par année).
// Voir docs/revenu-disponible.md §5, Poste 20.
//
// Traçage : RD = c2D85 = c2D83 + c2D63 + c2D72 + c2D80 − c2D84  (l. 23346).
//   c2D83 = revenu de travail/retraite du ménage (c2T432 = revenu1 + revenu2)
//   c2D63 = bloc QUÉBEC  (QC_total : transferts QC − impôt QC)
//   c2D72 = bloc FÉDÉRAL (CA_total : transferts fédéraux − impôt fédéral)
//   c2D80 = cotisations (Cotisation : toutes négatives)
//   c2D84 = 0 dans tous les cas-types observés
//
//   Soit, en montants POSITIFS (signe explicité ici) :
//   RD = revenu − cotisations + transferts QC − impôt QC + transferts fédéraux − impôt fédéral
// ===========================================================================

import { Annee, Menage, SITUATIONS, revenusAdultes } from "../socle";
import { rrqMenage } from "./01-rrq";
import { rqapMenage } from "./02-rqap";
import { aeMenage } from "./03-ae";
import { fssMenage } from "./04-fss";
import { ramqMenage } from "./05-ramq";
import { creditFraisGarde } from "./06-garde";
import { allocationFamilleMenage, supplementFournituresScolaires } from "./07-allocation-famille";
import { primeAuTravailMenage } from "./08-prime-travail";
import { creditSolidariteMenage } from "./09-solidarite";
import { allocationLogementMenage } from "./10-allocation-logement";
import { montantSoutienAinesMenage } from "./11-soutien-aines";
import { aideSocialeMenage } from "./13-aide-sociale";
import { allocationCanadienneEnfantsMenage } from "./14-allocation-canadienne-enfants";
import { creditTPSMenage } from "./15-credit-tps";
import { allocationTravailleursMenage } from "./16-allocation-travailleurs";
import { securiteVieillesseMenage } from "./17-securite-vieillesse";
import { impotFederalMenage, impotQuebecMenage, IMPOT_QUEBEC } from "./19-impot";
import { FACTEUR_AL, type Parametres } from "../parametres";

export interface ComposantesRevenuDisponible {
  revenu: number; // revenu de travail/retraite du ménage (revenu1 + revenu2)
  cotisations: number; // RRQ + RQAP + AE + FSS + RAMQ (montants positifs)
  transfertsQuebec: number; // Allocation famille (+ fournitures), prime au travail, solidarité,
  // allocation-logement, soutien aux aînés, frais de garde, aide de dernier recours, frais médicaux QC
  impotQuebec: number; // impôt du Québec (positif)
  transfertsFederaux: number; // ACE, crédit TPS, ACT, sécurité de la vieillesse, supplément médical
  impotFederal: number; // impôt fédéral (positif)
}

/**
 * Revenu disponible du ménage (= RD) : le revenu de travail/retraite, **moins** les cotisations
 * et les impôts, **plus** l'ensemble des transferts québécois et fédéraux. C'est l'agrégation finale
 * de tous les postes (1 à 19).
 */
export function revenuDisponible(c: ComposantesRevenuDisponible): number {
  const rd =
    c.revenu -
    c.cotisations +
    c.transfertsQuebec -
    c.impotQuebec +
    c.transfertsFederaux -
    c.impotFederal;
  return Math.round(rd * 100) / 100;
}

// ---------------------------------------------------------------------------
// ORCHESTRATEUR de bout en bout : ménage (entrées brutes) → tous les postes → RD
// ---------------------------------------------------------------------------

/** Détail poste par poste (montants positifs ; clés alignées sur les sorties de la référence). */
export interface DetailRevenuDisponible {
  cotisations: {
    rrq: number; // CA_rrq
    rqap: number; // QC_rqap
    assuranceEmploi: number; // CA_ae
    fss: number; // QC_fss
    ramq: number; // QC_ramq
  };
  transfertsQuebec: {
    allocationFamille: number; // QC_sae
    fournituresScolaires: number; // SFS
    primeTravail: number; // QC_pt
    solidarite: number; // QC_sol
    allocationLogement: number; // QC_al
    soutienAines: number; // QC_aines
    fraisGarde: number; // QC_garde
    fraisMedicaux: number; // QC_medic (≡ 0)
    aideSociale: number; // QC_adr
  };
  impotQuebec: number; // QC_impot
  transfertsFederaux: {
    allocationEnfants: number; // CA_ace
    creditTPS: number; // CA_tps
    allocationTravailleurs: number; // CA_pfrt
    securiteVieillesse: number; // CA_psv
    supplementMedical: number; // CA_medic (≡ 0)
  };
  impotFederal: number; // CA_impot
}

export interface ResultatRevenuDisponible {
  revenuDisponible: number;
  composantes: ComposantesRevenuDisponible;
  detail: DetailRevenuDisponible; // ventilation poste par poste (pour l'affichage)
  revenuNetFamilial: number; // base des transferts/cotisations québécois (rfn, = c2T271)
  afni: number; // revenu net rajusté fédéral (base des transferts fédéraux, = c2T124)
  revenuAL: number; // revenu aux fins de l'allocation-logement (= c2T357)
}

/**
 * Calcule le **revenu disponible** d'un ménage à partir de ses entrées brutes, en enchaînant tous
 * les postes (1-19) et en reconstruisant les **bases de revenu internes** que les transferts et
 * l'impôt consomment :
 *  - **revenu net familial** (QC) = `revenu + PSV + aide sociale − déduction travailleur − RRQ suppl.` ;
 *  - **AFNI** (fédéral) = idem **sans** la déduction pour travailleur (propre au Québec) ;
 *  - **revenu pour l'allocation-logement** = revenu net familial moins une fraction de la PSV.
 * Cœur de calcul de l'application interactive.
 */
export function calculerRevenuDisponible(menage: Menage, annee: Annee | Parametres): ResultatRevenuDisponible {
  const { nbAdultes, retraite } = SITUATIONS[menage.situation];
  const revenus = revenusAdultes(menage);
  const revenuBrut = revenus.reduce((a, b) => a + b, 0);

  // Cotisations. RRQ/RQAP/AE portent sur le revenu de TRAVAIL : nulles pour un retraité (revenu de
  // pension). Le FSS, lui, vise le revenu des retraités (poste 4) → toujours via fssMenage.
  const rrq = retraite ? { base: 0, supplementaire: 0, total: 0 } : rrqMenage(menage, annee);
  const rqap = retraite ? 0 : rqapMenage(menage, annee);
  const ae = retraite ? 0 : aeMenage(menage, annee);
  const fss = fssMenage(menage, annee);

  // Postes-feuilles (revenu/âge seulement) : PSV et aide de dernier recours.
  const psv = securiteVieillesseMenage(menage, annee);
  const aideSociale = aideSocialeMenage(menage, annee);

  // Bases de revenu internes.
  const p = typeof annee === "number" ? IMPOT_QUEBEC[annee] : annee.impotQuebec;
  const dedTravailleur = retraite ? 0 : revenus.reduce((s, r) => s + Math.min(p.deducTravailleurTaux * r, p.deducTravailleurMax), 0);
  const revenuTotal = revenuBrut + psv + aideSociale;
  const revenuNetFamilial = revenuTotal - dedTravailleur - rrq.supplementaire;
  const afni = revenuTotal - rrq.supplementaire;
  const f = typeof annee === "number" ? FACTEUR_AL[annee] : annee.facteurAL;
  const revenuAL = revenuNetFamilial - psv * (nbAdultes === 1 ? f.seul : f.couple);

  // Cotisation RAMQ (sur le revenu net familial).
  const ramq = ramqMenage(menage, revenuNetFamilial, annee);

  // Impôts (les couples ont besoin de la prime RAMQ pour le crédit médical).
  const impotQuebec = impotQuebecMenage(menage, annee, ramq);
  const impotFederal = impotFederalMenage(menage, annee, ramq);

  // Ventilation poste par poste.
  const enfantsGarde = menage.enfants.map((e) => ({ age: e.age, fraisAdmissibles: e.fraisGarde }));
  const revenuTravail = retraite ? 0 : revenuBrut;
  const detail: DetailRevenuDisponible = {
    cotisations: { rrq: rrq.total, rqap, assuranceEmploi: ae, fss, ramq },
    transfertsQuebec: {
      allocationFamille: allocationFamilleMenage(menage, revenuNetFamilial, annee),
      fournituresScolaires: supplementFournituresScolaires(menage, annee),
      primeTravail: primeAuTravailMenage(menage, revenuTravail, revenuNetFamilial, annee),
      solidarite: creditSolidariteMenage(menage, revenuNetFamilial, annee),
      allocationLogement: allocationLogementMenage(menage, revenuAL, annee),
      soutienAines: montantSoutienAinesMenage(menage, revenuNetFamilial, annee),
      fraisGarde: creditFraisGarde(revenuNetFamilial, enfantsGarde, annee),
      fraisMedicaux: 0, // QC_medic ≡ 0 dans le modèle (voir poste 12)
      aideSociale,
    },
    impotQuebec,
    transfertsFederaux: {
      allocationEnfants: allocationCanadienneEnfantsMenage(menage, afni, annee),
      creditTPS: creditTPSMenage(menage, afni, annee),
      // L'ACT exige un revenu de TRAVAIL → nulle pour un retraité (sinon la pension serait prise pour tel).
      allocationTravailleurs: retraite ? 0 : allocationTravailleursMenage(menage, afni, annee),
      securiteVieillesse: psv,
      supplementMedical: 0, // CA_medic ≡ 0 dans le modèle (voir poste 18)
    },
    impotFederal,
  };

  const somme = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  const composantes: ComposantesRevenuDisponible = {
    revenu: revenuBrut,
    cotisations: somme(detail.cotisations),
    transfertsQuebec: somme(detail.transfertsQuebec),
    impotQuebec,
    transfertsFederaux: somme(detail.transfertsFederaux),
    impotFederal,
  };
  return { revenuDisponible: revenuDisponible(composantes), composantes, detail, revenuNetFamilial, afni, revenuAL };
}
