// Quota du mode démo : compteur en mémoire par adresse IP et par jour (UTC).
// Volontairement simple (pas de base de données) : sur l'hébergement serverless,
// chaque instance a son propre compteur — le quota est donc « au mieux ». Le
// véritable coupe-circuit est le budget mensuel verrouillé sur la clé démo dans
// la console Anthropic ; ce compteur ne sert qu'à décourager l'usage intensif.

import { DEMO_QUESTIONS_JOUR } from "./demo-ia";

const compteurs = new Map<string, { jour: string; n: number }>();

/** Adresse IP du client (premier saut de x-forwarded-for, posé par Vercel). */
export function ipClient(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";
}

/** Consomme une question du quota du jour ; renvoie faux si la limite est atteinte. */
export function consommerQuotaDemo(ip: string): boolean {
  const jour = new Date().toISOString().slice(0, 10);
  // Purge paresseuse des entrées d'un autre jour (borne la taille de la table).
  if (compteurs.size > 5000) {
    for (const [k, v] of compteurs) if (v.jour !== jour) compteurs.delete(k);
  }
  const e = compteurs.get(ip);
  if (!e || e.jour !== jour) {
    compteurs.set(ip, { jour, n: 1 });
    return true;
  }
  if (e.n >= DEMO_QUESTIONS_JOUR) return false;
  e.n += 1;
  return true;
}
