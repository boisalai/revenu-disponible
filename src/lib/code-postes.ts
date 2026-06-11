// Accès (serveur seulement) au code source du moteur, pour l'outil `code_poste`
// de l'assistant : le modèle lit la mécanique exacte d'un poste (étapes, arrondis,
// plafonds, interactions) au lieu de la deviner. Correspondance FIXE clé → fichier :
// le modèle ne fournit jamais de chemin, donc aucune traversée possible. Sur Vercel,
// les sources `.ts` ne sont dans le bundle de la fonction que grâce à
// `outputFileTracingIncludes` (next.config.ts) ; en dev, elles sont lues sur le disque.

import { readFile } from "node:fs/promises";
import path from "node:path";

/** Clé de poste (mêmes clés que `POSTES_INFO` / `detail` du poste 20) → fichier source. */
export const FICHIER_POSTE: Record<string, string> = {
  rrq: "src/postes/01-rrq.ts",
  rqap: "src/postes/02-rqap.ts",
  assuranceEmploi: "src/postes/03-ae.ts",
  fss: "src/postes/04-fss.ts",
  ramq: "src/postes/05-ramq.ts",
  fraisGarde: "src/postes/06-garde.ts",
  allocationFamille: "src/postes/07-allocation-famille.ts",
  fournituresScolaires: "src/postes/07-allocation-famille.ts",
  primeTravail: "src/postes/08-prime-travail.ts",
  solidarite: "src/postes/09-solidarite.ts",
  allocationLogement: "src/postes/10-allocation-logement.ts",
  soutienAines: "src/postes/11-soutien-aines.ts",
  fraisMedicaux: "src/postes/12-frais-medicaux.ts",
  aideSociale: "src/postes/13-aide-sociale.ts",
  allocationEnfants: "src/postes/14-allocation-canadienne-enfants.ts",
  creditTPS: "src/postes/15-credit-tps.ts",
  allocationTravailleurs: "src/postes/16-allocation-travailleurs.ts",
  securiteVieillesse: "src/postes/17-securite-vieillesse.ts",
  supplementMedical: "src/postes/18-supplement-medical-federal.ts",
  impotQuebec: "src/postes/19-impot.ts",
  impotFederal: "src/postes/19-impot.ts",
  // Au-delà des postes : helpers communs et enchaînement complet.
  socle: "src/socle.ts",
  orchestrateur: "src/postes/20-revenu-disponible.ts",
};

/** Lit le code source associé à une clé ; `null` si la clé est inconnue. */
export async function codePoste(cle: string): Promise<{ fichier: string; code: string } | null> {
  const fichier = FICHIER_POSTE[cle];
  if (!fichier) return null;
  const code = await readFile(path.join(process.cwd(), fichier), "utf8");
  return { fichier, code };
}
