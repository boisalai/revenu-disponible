// Partage d'un scénario par URL : on encode l'état (ménage + paramètres) dans un paramètre `?s=`.
// Pour garder l'URL courte, on n'encode que les ÉCARTS des paramètres par rapport à l'officiel.

import { PARAMETRES_OFFICIELS, type Annee, type Parametres } from "@/index";
import { MENAGE_DEFAUT, normaliserMenageEtat, type MenageEtat } from "./menage-etat";

// --- base64url (état ASCII : nombres + clés latines) ---
function enc(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function dec<T>(s: string): T | null {
  try {
    let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    b64 += "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(b64)) as T;
  } catch {
    return null;
  }
}

// --- nettoyage défensif d'un ménage décodé (entrée non fiable : URL, base) ---
// Géré par menage-etat (gère aussi l'ancienne forme `agesEnfants`).
const nettoyerMenage = normaliserMenageEtat;

// --- écarts de paramètres (par groupe) ---
export function diffParams(bundle: Parametres, base: Parametres): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  const b = bundle as unknown as Record<string, unknown>;
  const o = base as unknown as Record<string, unknown>;
  for (const k of Object.keys(b)) if (JSON.stringify(b[k]) !== JSON.stringify(o[k])) d[k] = b[k];
  return d;
}

export function appliquerParams(annee: Annee, diff: Record<string, unknown> | undefined): Parametres {
  const base = structuredClone(PARAMETRES_OFFICIELS[annee]) as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(diff ?? {})) {
    if (k in base) {
      if (Array.isArray(v)) base[k] = v;
      else if (v && typeof v === "object") base[k] = { ...(base[k] as object), ...(v as object) };
      else base[k] = v;
    }
  }
  return base as unknown as Parametres;
}

const annee = (v: unknown): Annee => (Number(v) === 2026 ? 2026 : 2025);

// --- Calculateur : ménage seul ---
export function encoderMenage(etat: MenageEtat): string {
  return enc({ m: etat });
}
export function decoderMenage(s: string): MenageEtat | null {
  const o = dec<{ m: unknown }>(s);
  return o?.m ? nettoyerMenage(o.m) : null;
}

// --- Comparaison : deux ménages sur UN même jeu de paramètres ---
export interface PartageComparaison {
  etatA: MenageEtat;
  etatB: MenageEtat;
  anneeJeu: Annee;
  bundleJeu: Parametres;
}
export function encoderComparaison(p: PartageComparaison): string {
  return enc({ a: p.etatA, b: p.etatB, y: p.anneeJeu, d: diffParams(p.bundleJeu, PARAMETRES_OFFICIELS[p.anneeJeu]) });
}
export function decoderComparaison(s: string): PartageComparaison | null {
  const o = dec<{ a?: unknown; b?: unknown; y?: unknown; d?: Record<string, unknown> }>(s);
  if (!o?.a || !o?.b) return null;
  const y = annee(o.y);
  return { etatA: nettoyerMenage(o.a), etatB: nettoyerMenage(o.b), anneeJeu: y, bundleJeu: appliquerParams(y, o.d) };
}

// --- Budget : un ménage + deux jeux de paramètres (écarts) ---
export interface PartageBudget {
  etat: MenageEtat;
  anneeA: Annee;
  bundleA: Parametres;
  anneeB: Annee;
  bundleB: Parametres;
}
export function encoderBudget(p: PartageBudget): string {
  return enc({
    m: p.etat,
    a: { y: p.anneeA, d: diffParams(p.bundleA, PARAMETRES_OFFICIELS[p.anneeA]) },
    b: { y: p.anneeB, d: diffParams(p.bundleB, PARAMETRES_OFFICIELS[p.anneeB]) },
  });
}
export function decoderBudget(s: string): PartageBudget | null {
  const o = dec<{ m?: unknown; a?: { y?: unknown; d?: Record<string, unknown> }; b?: { y?: unknown; d?: Record<string, unknown> } }>(s);
  if (!o?.a || !o?.b) return null;
  const yA = annee(o.a.y);
  const yB = annee(o.b.y);
  return {
    etat: o.m ? nettoyerMenage(o.m) : MENAGE_DEFAUT,
    anneeA: yA,
    bundleA: appliquerParams(yA, o.a.d),
    anneeB: yB,
    bundleB: appliquerParams(yB, o.b.d),
  };
}
