// ===========================================================================
// Paramètres — Impôt sur le revenu (vérifiés ; algorithme d'assemblage = poste 19, à venir)
// Sources : S1 (Revenu Québec), S2 (ARC). Voir docs/revenu-disponible.md §5, « Paramètres — Impôt ».
// ⚠️ Restant à vérifier pour le poste 19 : montant personnel de base (QC/féd.),
//    abattement du Québec (16,5 %), liste des crédits non remboursables.
// ===========================================================================

import { Annee, Palier } from "../socle";

export const PALIERS_QC: Record<Annee, Palier[]> = {
  2025: [
    { plafond: 53_255, taux: 0.14 },
    { plafond: 106_495, taux: 0.19 },
    { plafond: 129_590, taux: 0.24 },
    { plafond: Infinity, taux: 0.2575 },
  ],
  2026: [
    { plafond: 54_345, taux: 0.14 },
    { plafond: 108_680, taux: 0.19 },
    { plafond: 132_245, taux: 0.24 },
    { plafond: Infinity, taux: 0.2575 },
  ],
};

export const PALIERS_FEDERAL: Record<Annee, Palier[]> = {
  2025: [
    { plafond: 57_375, taux: 0.145 }, // taux de transition (1ᵉʳ juill. 2025)
    { plafond: 114_750, taux: 0.205 },
    { plafond: 177_882, taux: 0.26 },
    { plafond: 253_414, taux: 0.29 },
    { plafond: Infinity, taux: 0.33 },
  ],
  2026: [
    { plafond: 58_523, taux: 0.14 },
    { plafond: 117_045, taux: 0.205 },
    { plafond: 181_440, taux: 0.26 },
    { plafond: 258_482, taux: 0.29 },
    { plafond: Infinity, taux: 0.33 },
  ],
};
