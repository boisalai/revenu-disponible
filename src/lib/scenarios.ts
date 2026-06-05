"use server";

// Server Actions de persistance des scénarios. Chaque action vérifie la session
// (Better Auth) et n'agit que sur les scénarios de l'utilisateur courant.
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TYPES = ["CALCULATEUR", "COMPARAISON", "BUDGET"] as const;
export type TypeScenario = (typeof TYPES)[number];

/** Résumé renvoyé au client (sans exposer le modèle Prisma complet). */
export interface ScenarioResume {
  id: string;
  name: string;
  type: TypeScenario;
  payload: string;
  updatedAt: Date;
}

const SELECT = { id: true, name: true, type: true, payload: true, updatedAt: true } as const;

const EnregistrerSchema = z.object({
  type: z.enum(TYPES),
  nom: z.string().trim().min(1).max(80),
  payload: z.string().min(1).max(8000), // garde-fou : un code de partage reste court
});

async function utilisateurCourant() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function listerScenarios(): Promise<ScenarioResume[]> {
  const user = await utilisateurCourant();
  if (!user) return [];
  return prisma.scenario.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: SELECT,
  });
}

export async function enregistrerScenario(
  input: z.input<typeof EnregistrerSchema>,
): Promise<ScenarioResume> {
  const user = await utilisateurCourant();
  if (!user) throw new Error("Connexion requise");
  const { type, nom, payload } = EnregistrerSchema.parse(input);
  return prisma.scenario.create({
    data: { type, name: nom, payload, userId: user.id },
    select: SELECT,
  });
}

export async function renommerScenario(id: string, nom: string): Promise<void> {
  const user = await utilisateurCourant();
  if (!user) throw new Error("Connexion requise");
  const n = z.string().trim().min(1).max(80).parse(nom);
  await prisma.scenario.updateMany({ where: { id, userId: user.id }, data: { name: n } });
}

export async function supprimerScenario(id: string): Promise<void> {
  const user = await utilisateurCourant();
  if (!user) throw new Error("Connexion requise");
  await prisma.scenario.deleteMany({ where: { id, userId: user.id } });
}
