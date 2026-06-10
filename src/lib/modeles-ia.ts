// Modèles Claude offerts dans l'assistant (BYOK). Données pures, importables côté client ET serveur.
// IDs de la famille actuelle (cf. système Claude Code) ; le défaut reste Sonnet (équilibre fiabilité/coût).
export const MODELES_IA = [
  { id: "claude-haiku-4-5-20251001", nom: "Haiku 4.5" },
  { id: "claude-sonnet-4-6", nom: "Sonnet 4.6" },
  { id: "claude-opus-4-8", nom: "Opus 4.8" },
] as const;

export const MODELE_DEFAUT = "claude-sonnet-4-6";

const VALIDES = new Set<string>(MODELES_IA.map((m) => m.id));

/** Renvoie le modèle s'il fait partie de la liste blanche, sinon le modèle par défaut (Sonnet). */
export function modeleValide(m: unknown): string {
  return typeof m === "string" && VALIDES.has(m) ? m : MODELE_DEFAUT;
}
