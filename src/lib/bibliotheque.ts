"use server";

// Server Actions de la bibliothèque réutilisable : ménages types et jeux de
// paramètres socio-fiscaux. Chaque action vérifie la session et n'agit que sur
// les blocs de l'utilisateur courant.
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { normaliserMenageEtat, type MenageEtat } from "@/lib/menage-etat";

async function utilisateurCourant() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

const NomSchema = z.string().trim().min(1).max(80);
const json = (v: unknown) => v as Prisma.InputJsonValue;

// ───────────────────────── Ménages types ─────────────────────────
const MenageEtatSchema = z.object({
  situation: z.number().int().min(0).max(4),
  revenu1: z.number().finite(),
  age1: z.number().finite(),
  revenu2: z.number().finite(),
  age2: z.number().finite(),
  enfants: z
    .array(z.object({ age: z.number().finite(), fraisGarde: z.number().finite().min(0).max(15_000), typeGarde: z.number().int() }))
    .max(5),
});

export interface MenageResume {
  id: string;
  name: string;
  data: MenageEtat;
  updatedAt: Date;
}
const SELECT_MENAGE = { id: true, name: true, data: true, updatedAt: true } as const;

export async function listerMenages(): Promise<MenageResume[]> {
  const user = await utilisateurCourant();
  if (!user) return [];
  const rows = await prisma.menage.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: SELECT_MENAGE,
  });
  // normaliserMenageEtat gère la rétro-compat (ménages sauvegardés avant `enfants[]`).
  return rows.map((r) => ({ ...r, data: normaliserMenageEtat(r.data) }));
}

export async function enregistrerMenage(nom: string, etat: unknown): Promise<MenageResume> {
  const user = await utilisateurCourant();
  if (!user) throw new Error("Connexion requise");
  const name = NomSchema.parse(nom);
  const data = MenageEtatSchema.parse(etat);
  const r = await prisma.menage.create({
    data: { name, userId: user.id, data: json(data) },
    select: SELECT_MENAGE,
  });
  return { ...r, data: r.data as unknown as MenageEtat };
}

export async function modifierMenage(id: string, nom: string, etat: unknown): Promise<void> {
  const user = await utilisateurCourant();
  if (!user) throw new Error("Connexion requise");
  const name = NomSchema.parse(nom);
  const data = MenageEtatSchema.parse(etat);
  await prisma.menage.updateMany({ where: { id, userId: user.id }, data: { name, data: json(data) } });
}

export async function supprimerMenage(id: string): Promise<void> {
  const user = await utilisateurCourant();
  if (!user) throw new Error("Connexion requise");
  await prisma.menage.deleteMany({ where: { id, userId: user.id } });
}

// ──────────────────── Jeux de paramètres ────────────────────
// `data` = écarts (diff) vs l'officiel de `anneeBase` (cf. partage.ts).
const AnneeSchema = z.union([z.literal(2025), z.literal(2026)]);
const DiffSchema = z
  .record(z.string(), z.unknown())
  .refine((d) => JSON.stringify(d).length < 20000, "écarts trop volumineux");

export interface JeuResume {
  id: string;
  name: string;
  anneeBase: 2025 | 2026;
  data: Record<string, unknown>;
  updatedAt: Date;
}
const SELECT_JEU = { id: true, name: true, anneeBase: true, data: true, updatedAt: true } as const;

export async function listerJeuxParametres(): Promise<JeuResume[]> {
  const user = await utilisateurCourant();
  if (!user) return [];
  const rows = await prisma.jeuParametres.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: SELECT_JEU,
  });
  return rows.map((r) => ({
    ...r,
    anneeBase: r.anneeBase as 2025 | 2026,
    data: (r.data ?? {}) as Record<string, unknown>,
  }));
}

export async function enregistrerJeuParametres(
  nom: string,
  anneeBase: number,
  diff: unknown,
): Promise<JeuResume> {
  const user = await utilisateurCourant();
  if (!user) throw new Error("Connexion requise");
  const name = NomSchema.parse(nom);
  const an = AnneeSchema.parse(anneeBase);
  const data = DiffSchema.parse(diff);
  const r = await prisma.jeuParametres.create({
    data: { name, userId: user.id, anneeBase: an, data: json(data) },
    select: SELECT_JEU,
  });
  return { ...r, anneeBase: r.anneeBase as 2025 | 2026, data: (r.data ?? {}) as Record<string, unknown> };
}

export async function modifierJeuParametres(
  id: string,
  nom: string,
  anneeBase: number,
  diff: unknown,
): Promise<void> {
  const user = await utilisateurCourant();
  if (!user) throw new Error("Connexion requise");
  const name = NomSchema.parse(nom);
  const an = AnneeSchema.parse(anneeBase);
  const data = DiffSchema.parse(diff);
  await prisma.jeuParametres.updateMany({
    where: { id, userId: user.id },
    data: { name, anneeBase: an, data: json(data) },
  });
}

export async function supprimerJeuParametres(id: string): Promise<void> {
  const user = await utilisateurCourant();
  if (!user) throw new Error("Connexion requise");
  await prisma.jeuParametres.deleteMany({ where: { id, userId: user.id } });
}
