// ===========================================================================
// Poste 13 — Aide de dernier recours (aide sociale / solidarité sociale)
// Sortie code : QC_adr (montant annuel du ménage). Aucune sortie _bonif.
// Base légale : Loi sur l'aide aux personnes et aux familles (RLRQ, c. A-13.1.1) et son règlement.
//   Programme administré par le ministère de l'Emploi et de la Solidarité sociale.
// Sources : S20 (quebec.ca / CREMIS — barème ; Éducaloi / ADDS-QM — cadre ; loi A-13.1.1).
// Voir docs/revenu-disponible.md §5, Poste 13.
//
// ⚠️ Poste-INTRANT : QC_adr = c2T302 est la cellule qui sert d'EXONÉRATION à la RAMQ (poste 5)
//    et à l'allocation-logement (poste 10). L'aide sociale alimente donc d'autres postes.
//
// Traçage : QC_adr = c2T302 (2025) / c2S302 (2026) = arr2xD53D58[1][0] = arr2xT414T422[1][0] (l. 22014, 21997).
//   c2T302 = (un adulte ≥ 65 ans) ? 0 : (c2T300 + c2T301) × 12
//     c2T300 = max(0, prestationBase − revenuComptéMensuel)            (prestation nette mensuelle)
//     c2T301 = (c2T300 > 0) ? revenuComptéAuDelàExemption × 25 % : 0   (incitation au travail)
//   Revenu compté = gains de travail NETS des cotisations (RRQ+RQAP+AE), au-delà d'une exemption
//   mensuelle (200 $ seul / 300 $ couple) ; 25 % de l'excédent reste exempté.
//   Convention de colonnes : 2025 = T (paramètres M) ; 2026 = S (paramètres L).
// ===========================================================================

import { Annee, Menage, SITUATIONS } from "../socle";
import { rrqMenage } from "./01-rrq";
import { rqapMenage } from "./02-rqap";
import { aeMenage } from "./03-ae";

export interface ParamsAideSociale {
  baseSeul: number; // prestation de base mensuelle — 1 adulte ($)
  baseCouple: number; // prestation de base mensuelle — 2 adultes ($)
  ajust58Seul: number; // ajustement mensuel — un seul adulte de 58 ans et + ($)
  ajust58Couple: number; // ajustement mensuel — les deux adultes de 58 ans et + ($)
  ajustJeuneSeul: number; // ajustement mensuel — adulte seul sans enfant de moins de 50 ans ($)
  exemptionSeul: number; // exemption mensuelle de gains de travail — 1 adulte ($)
  exemptionCouple: number; // exemption mensuelle de gains de travail — 2 adultes ($)
  tauxIncitation: number; // part des gains exemptés au-delà de l'exemption (incitation au travail)
}

export const AIDE_SOCIALE: Record<Annee, ParamsAideSociale> = {
  2025: { baseSeul: 829, baseCouple: 1258, ajust58Seul: 166, ajust58Couple: 285, ajustJeuneSeul: 50, exemptionSeul: 200, exemptionCouple: 300, tauxIncitation: 0.25 },
  2026: { baseSeul: 845, baseCouple: 1283, ajust58Seul: 169, ajust58Couple: 291, ajustJeuneSeul: 50, exemptionSeul: 200, exemptionCouple: 300, tauxIncitation: 0.25 },
};

/** Prestation de base mensuelle, selon la composition et l'âge (ajustements mutuellement exclusifs). */
function prestationBase(
  nbAdultes: 1 | 2,
  age1: number,
  age2: number,
  nbEnfants: number,
  p: ParamsAideSociale,
): number {
  const base = nbAdultes === 2 ? p.baseCouple : p.baseSeul;
  const deux58 = nbAdultes === 2 && age1 >= 58 && age2 >= 58;
  const un58 = age1 >= 58 || (nbAdultes === 2 && age2 >= 58);
  let ajust = 0;
  if (deux58) ajust = p.ajust58Couple;
  else if (un58) ajust = p.ajust58Seul;
  else if (nbAdultes === 1 && nbEnfants === 0 && age1 < 50) ajust = p.ajustJeuneSeul;
  return base + ajust;
}

/**
 * Aide de dernier recours (= QC_adr), montant ANNUEL. Nulle si un adulte a 65 ans ou plus.
 *
 * @param revenuTravailNet revenu de travail ANNUEL net des cotisations (brut − RRQ − RQAP − AE)
 */
export function aideSociale(
  revenuTravailNet: number,
  nbAdultes: 1 | 2,
  age1: number,
  age2: number,
  nbEnfants: number,
  annee: Annee,
): number {
  const p = AIDE_SOCIALE[annee];
  if (age1 >= 65 || (nbAdultes === 2 && age2 >= 65)) return 0; // 65 ans et + : PSV/SRG, pas d'aide sociale
  const base = prestationBase(nbAdultes, age1, age2, nbEnfants, p);
  const exemption = nbAdultes === 2 ? p.exemptionCouple : p.exemptionSeul;
  const compte = Math.max(0, revenuTravailNet / 12 - exemption); // gains de travail mensuels au-delà de l'exemption
  const prestationNette = Math.max(0, base - compte);
  const incitation = prestationNette > 0 ? p.tauxIncitation * compte : 0;
  return (prestationNette + incitation) * 12;
}

/** Aide de dernier recours du ménage (= QC_adr). Le revenu de travail est compté net des cotisations. */
export function aideSocialeMenage(menage: Menage, annee: Annee): number {
  const { nbAdultes } = SITUATIONS[menage.situation];
  const brut = menage.revenu1 + (nbAdultes === 2 ? menage.revenu2 : 0);
  const cotisations = rrqMenage(menage, annee).total + rqapMenage(menage, annee) + aeMenage(menage, annee);
  return aideSociale(
    brut - cotisations,
    nbAdultes,
    menage.ageAdulte1,
    nbAdultes === 2 ? menage.ageAdulte2 : 0,
    menage.enfants.length,
    annee,
  );
}
