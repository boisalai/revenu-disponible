// ===========================================================================
// Poste 4 — FSS (Fonds des services de santé) — cotisation des particuliers
// Sortie code : QC_fss (total ménage). Aucune sortie _bonif.
// Base légale : Loi sur la Régie de l'assurance maladie du Québec (RLRQ, c. R-5), art. 38 à 40.
//   Ligne 446 ; annexe F (TP-1).
// Sources : S9 (Revenu Québec + R-5), S10 (MFQ Paramètres + Bulletin 2025-8).
// Voir docs/revenu-disponible.md §5, Poste 4.
// ===========================================================================

import { Annee, Menage, SITUATIONS, revenusAdultes } from "../socle";

export interface ParamsFSS {
  seuil1: number; // seuil de la 1ʳᵉ tranche ($)
  taux1: number; // taux 1ʳᵉ tranche
  plafond1: number; // plafond 1ʳᵉ tranche ($)
  seuil2: number; // seuil de la 2ᵉ tranche ($)
  taux2: number; // taux 2ᵉ tranche
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
  return revenusAdultes(menage).reduce((tot, r) => tot + cotisationFSS(r, annee), 0);
}
