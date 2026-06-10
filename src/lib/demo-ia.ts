// Mode démo de l'assistant : quelques questions par jour sur une clé Anthropic
// DÉDIÉE fournie par le projet (variable serveur ANTHROPIC_DEMO_API_KEY), pour
// que les visiteurs sans clé puissent essayer. Garde-fous empilés :
//  1. budget mensuel verrouillé sur la clé dans la console Anthropic (coupe-circuit dur) ;
//  2. quota serveur par adresse IP et par jour (demo-quota.ts) ;
//  3. limite de tours par conversation, modèle Haiku imposé, sortie bornée.
// Ce module ne contient que des constantes pures, importables côté client ET serveur.

/** Modèle imposé en mode démo (le plus économique). */
export const DEMO_MODELE = "claude-haiku-4-5-20251001";

/** Questions par adresse IP et par jour. */
export const DEMO_QUESTIONS_JOUR = 5;

/** Messages de l'utilisateur au maximum dans une même conversation démo. */
export const DEMO_TOURS_MAX = 6;

/** Longueur maximale d'une réponse démo (jetons de sortie). */
export const DEMO_MAX_TOKENS = 1024;

/** Drapeau PUBLIC inliné au build (même patron que GOOGLE_ACTIVE) : l'interface
 *  ne propose la démo que s'il vaut "true" — à activer avec la variable serveur. */
export const DEMO_ACTIVE = process.env.NEXT_PUBLIC_DEMO_ENABLED === "true";
