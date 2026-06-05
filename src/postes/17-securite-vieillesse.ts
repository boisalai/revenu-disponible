// ===========================================================================
// Poste 17 — Sécurité de la vieillesse (PSV) + Supplément de revenu garanti (SRG) + Allocation
// Sortie code : CA_psv (montant annuel du ménage). Aucune sortie _bonif.
// Base légale : Loi sur la sécurité de la vieillesse (LRC 1985, ch. O-9) — PSV, SRG, Allocation ;
//   impôt de récupération de la PSV : Loi de l'impôt sur le revenu, art. 180.2 (ligne 23500).
// Sources : S24 (Emploi et Développement social Canada / ARC / RRQ / RCGT — montants trimestriels et règles).
// Voir docs/revenu-disponible.md §5, Poste 17.
//
// ⚠️ Paramètres TRIMESTRIELS : les montants de la PSV/SRG/Allocation sont révisés tous les 3 mois.
//    Les valeurs annuelles ci-dessous sont la MOYENNE des 4 trimestres (d'où les décimales) — comme le MFQ.
//
// Traçage : CA_psv = round( c2T41 + c2T42 + c2T51 + c2T52 + c2T43 + c2T53 , 2)  (l. 21995, 22028).
//   Par adulte de 65 ans et plus : PSV (c2T41/c2T51) + SRG (c2T42/c2T52) + supplément (c2T43/c2T53).
//   Adulte de 60-64 ans avec conjoint 65+ : Allocation (c2T30, à la place du SRG).
//   Le SRG et l'Allocation se calculent par TRANCHES de revenu (24/48/96 $).
//   Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).
// ===========================================================================

import { Annee, Menage, SITUATIONS } from "../socle";

export interface ParamsPSV {
  // Pension de la sécurité de la vieillesse (PSV)
  oasBase: number; // pension de base (65-74 ans), annuelle ($)
  oas75: number; // supplément pour 75 ans et plus ($)
  seuilRecuperation: number; // seuil de l'impôt de récupération ($)
  tauxRecuperation: number; // taux de récupération
  // Supplément de revenu garanti (SRG) — base
  srgMaxSeul: number; // SRG maximal — personne seule ($)
  srgMaxCouple: number; // SRG maximal par adulte — couple ($)
  srgTauxSeul: number; // taux de réduction — seul
  srgTauxCouple: number; // taux de réduction — couple
  srgTrancheSeul: number; // largeur de tranche — seul ($)
  srgTrancheCouple: number; // largeur de tranche — couple ($)
  // Supplément complémentaire du SRG (top-up)
  topupMaxSeul: number;
  topupMaxCouple: number;
  topupTaux: number;
  topupExemptionSeul: number;
  topupExemptionCouple: number;
  topupTrancheSeul: number;
  topupTrancheCouple: number;
  // Allocation (conjoint de 60-64 ans dont l'autre a 65 ans et plus)
  allocationMax: number; // montant maximal ($)
  allocationSeuil: number; // seuil entre les deux taux de réduction ($)
  allocationTaux1: number; // taux de réduction sous le seuil
  allocationTaux2: number; // taux de réduction au-delà du seuil
  allocationTranche: number; // largeur de tranche ($)
}

export const PSV: Record<Annee, ParamsPSV> = {
  2025: {
    oasBase: 8791.14, oas75: 879.15, seuilRecuperation: 93_454, tauxRecuperation: 0.15,
    srgMaxSeul: 11_096.85, srgMaxCouple: 7327.65, srgTauxSeul: 0.5, srgTauxCouple: 0.25, srgTrancheSeul: 24, srgTrancheCouple: 48,
    topupMaxSeul: 2033.97, topupMaxCouple: 1152.6, topupTaux: 0.25, topupExemptionSeul: 2047.99, topupExemptionCouple: 4095.99, topupTrancheSeul: 48, topupTrancheCouple: 96,
    allocationMax: 16_695.09, allocationSeuil: 11_760, allocationTaux1: 0.75, allocationTaux2: 0.25, allocationTranche: 24,
  },
  2026: {
    oasBase: 8966.96, oas75: 896.696, seuilRecuperation: 95_323, tauxRecuperation: 0.15,
    srgMaxSeul: 11_318.79, srgMaxCouple: 7474.2, srgTauxSeul: 0.5, srgTauxCouple: 0.25, srgTrancheSeul: 24, srgTrancheCouple: 48,
    topupMaxSeul: 2074.65, topupMaxCouple: 1175.65, topupTaux: 0.25, topupExemptionSeul: 2047.99, topupExemptionCouple: 4095.99, topupTrancheSeul: 48, topupTrancheCouple: 96,
    allocationMax: 17_028.99, allocationSeuil: 12_000, allocationTaux1: 0.75, allocationTaux2: 0.25, allocationTranche: 24,
  },
};

const trancheBas = (x: number, b: number) => Math.floor(x / b) * b; // arrondi à la tranche inférieure
const trancheHaut = (x: number, b: number) => Math.ceil(x / b) * b; // arrondi à la tranche supérieure

/** PSV d'un adulte (base + supplément 75 ans et +, moins l'impôt de récupération sur son propre revenu). */
function pensionVieillesse(age: number, revenu: number, p: ParamsPSV): number {
  if (age < 65) return 0;
  const base = p.oasBase + (age >= 75 ? p.oas75 : 0);
  return Math.max(0, base - Math.max(0, revenu + base - p.seuilRecuperation) * p.tauxRecuperation);
}

/**
 * Pension de la sécurité de la vieillesse (PSV) **imposable** d'un adulte — sans le SRG ni le
 * supplément, qui ne sont pas imposables. Sert au revenu imposable de l'impôt (poste 19).
 */
export function psvImposable(age: number, revenu: number, annee: Annee): number {
  return pensionVieillesse(age, revenu, PSV[annee]);
}

/** Allocation pour un conjoint de 60-64 ans (réduction à deux taux : 75 % sous le seuil, 25 % au-delà). */
function allocation(revenu: number, p: ParamsPSV): number {
  const red1 = Math.min(trancheBas(revenu, p.allocationTranche), p.allocationSeuil) * p.allocationTaux1;
  const red2 =
    Math.max(0, Math.floor((revenu - p.allocationSeuil) / p.allocationTranche - 1) * p.allocationTranche) *
    p.allocationTaux2;
  return Math.max(0, p.allocationMax - red1 - red2);
}

/**
 * Sécurité de la vieillesse du ménage (= CA_psv), montant annuel : PSV + SRG + supplément
 * complémentaire pour les adultes de 65 ans et plus, et Allocation pour un conjoint de 60-64 ans
 * dont l'autre a 65 ans et plus. Le revenu est le revenu de retraite saisi.
 */
export function securiteVieillesse(
  age1: number,
  age2: number,
  revenu1: number,
  revenu2: number,
  nbAdultes: 1 | 2,
  annee: Annee,
): number {
  const p = PSV[annee];
  const couple = nbAdultes === 2;
  const revenu = revenu1 + (couple ? revenu2 : 0); // revenu de retraite combiné (la PSV est exclue)

  // PSV : par adulte de 65 ans et plus, sur son propre revenu.
  let total = pensionVieillesse(age1, revenu1, p) + (couple ? pensionVieillesse(age2, revenu2, p) : 0);

  const nb65 = (age1 >= 65 ? 1 : 0) + (couple && age2 >= 65 ? 1 : 0);
  const allocataire = couple && ((age1 >= 60 && age1 <= 64 && age2 >= 65) || (age2 >= 60 && age2 <= 64 && age1 >= 65));

  if (!couple && age1 >= 65) {
    // Personne seule de 65 ans et plus : SRG + supplément complémentaire.
    total += Math.max(0, p.srgMaxSeul - trancheBas(revenu, p.srgTrancheSeul) * p.srgTauxSeul);
    total += topup(revenu, p.topupMaxSeul, p.topupExemptionSeul, p.topupTrancheSeul, p);
  } else if (couple && nb65 === 2) {
    // Couple, les deux de 65 ans et plus : SRG × 2 + supplément complémentaire du couple.
    total += Math.max(0, p.srgMaxCouple - trancheBas(revenu, p.srgTrancheCouple) * p.srgTauxCouple) * 2;
    total += topup(revenu, p.topupMaxCouple, p.topupExemptionCouple, p.topupTrancheCouple, p);
  } else if (allocataire) {
    // Couple mixte : conjoint 65+ → SRG (sur le revenu au-delà du seuil de l'Allocation) ;
    // conjoint 60-64 → Allocation. (Le seuil du SRG est diminué d'un cent dans le fichier — voir doc.)
    const revenuSRG = trancheHaut(Math.max(0, revenu - (p.allocationSeuil - 0.01)), p.srgTrancheCouple);
    total += Math.max(0, p.srgMaxCouple - revenuSRG * p.srgTauxCouple);
    // ⚠️ Asymétrie du fichier MFQ (reproduite pour la parité) : le supplément complémentaire est
    // ENTIER lorsque le conjoint de 65 ans et plus est l'adulte 1, mais réduit de MOITIÉ lorsqu'il
    // est l'adulte 2 (les cellules c2T43 et c2T53 n'ont pas le même multiplicateur). Vraisemblablement
    // un défaut du modèle, sans portée pratique (cas-types symétriques).
    const supplement = topup(revenu, p.topupMaxCouple, p.topupExemptionCouple, p.topupTrancheCouple, p);
    total += age1 >= 65 ? supplement : supplement / 2;
    total += allocation(revenu, p);
  }
  // Autres cas (conjoint de moins de 60 ans, aucun adulte de 65+) : PSV seule (ou 0).
  return Math.round(total * 100) / 100;
}

/** Supplément complémentaire du SRG (top-up) : max − revenu (arrondi sup., au-delà d'une exemption) × 25 %. */
function topup(revenu: number, max: number, exemption: number, tranche: number, p: ParamsPSV): number {
  return Math.max(0, max - trancheHaut(Math.max(0, revenu - exemption), tranche) * p.topupTaux);
}

/** Sécurité de la vieillesse du ménage (= CA_psv). Le revenu de retraite = revenu1/revenu2 du ménage. */
export function securiteVieillesseMenage(menage: Menage, annee: Annee): number {
  const { nbAdultes } = SITUATIONS[menage.situation];
  return securiteVieillesse(
    menage.ageAdulte1,
    nbAdultes === 2 ? menage.ageAdulte2 : 0,
    menage.revenu1,
    nbAdultes === 2 ? menage.revenu2 : 0,
    nbAdultes,
    annee,
  );
}
