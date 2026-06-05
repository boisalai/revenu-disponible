// Partage d'un scénario par URL : on encode l'état (ménage + paramètres) dans un paramètre `?s=`.
// Pour garder l'URL courte, on n'encode que les ÉCARTS des paramètres par rapport à l'officiel.

import { PARAMETRES_OFFICIELS, Situation, type Annee, type Parametres } from "@/index";
import { MENAGE_DEFAUT, type MenageEtat } from "./menage-etat";

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

// --- nettoyage défensif d'un ménage décodé (entrée non fiable venant de l'URL) ---
function nettoyerMenage(m: unknown): MenageEtat {
  const o = (m ?? {}) as Record<string, unknown>;
  const s = Number(o.situation);
  const n = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    situation: (s >= 0 && s <= 4 ? s : 0) as Situation,
    revenu1: n(o.revenu1),
    age1: n(o.age1, 40),
    revenu2: n(o.revenu2),
    age2: n(o.age2, 40),
    agesEnfants: Array.isArray(o.agesEnfants) ? o.agesEnfants.slice(0, 5).map((a) => n(a, 5)) : [],
  };
}

// --- écarts de paramètres (par groupe) ---
function diffParams(bundle: Parametres, base: Parametres): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  const b = bundle as unknown as Record<string, unknown>;
  const o = base as unknown as Record<string, unknown>;
  for (const k of Object.keys(b)) if (JSON.stringify(b[k]) !== JSON.stringify(o[k])) d[k] = b[k];
  return d;
}

function appliquerParams(annee: Annee, diff: Record<string, unknown> | undefined): Parametres {
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

// --- Comparaison : deux ménages + deux années ---
export interface PartageComparaison {
  etatA: MenageEtat;
  anneeA: Annee;
  etatB: MenageEtat;
  anneeB: Annee;
}
export function encoderComparaison(p: PartageComparaison): string {
  return enc({ a: { m: p.etatA, y: p.anneeA }, b: { m: p.etatB, y: p.anneeB } });
}
export function decoderComparaison(s: string): PartageComparaison | null {
  const o = dec<{ a?: { m?: unknown; y?: unknown }; b?: { m?: unknown; y?: unknown } }>(s);
  if (!o?.a || !o?.b) return null;
  return { etatA: nettoyerMenage(o.a.m), anneeA: annee(o.a.y), etatB: nettoyerMenage(o.b.m), anneeB: annee(o.b.y) };
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
