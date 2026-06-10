import { headers } from "next/headers";
import { z } from "zod";
import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { auth } from "@/lib/auth";
import { enregistrerMenage, enregistrerJeuParametres } from "@/lib/bibliotheque";
import { modeleValide } from "@/lib/modeles-ia";

export const maxDuration = 30;

const menageSchema = z.object({
  situation: z
    .number()
    .int()
    .min(0)
    .max(4)
    .describe("0 personne seule, 1 famille monoparentale, 2 couple, 3 retraité seul, 4 couple de retraités"),
  revenu1: z.number().describe("revenu de travail (ou de retraite si retraité) de l'adulte 1, en $"),
  revenu2: z.number().default(0).describe("revenu de l'adulte 2 (couples seulement), en $"),
  age1: z.number().default(40),
  age2: z.number().default(40),
  enfants: z
    .array(
      z.object({
        age: z.number(),
        fraisGarde: z.number().default(0).describe("frais de garde annuels, en $"),
        typeGarde: z.number().int().min(0).max(1).default(0).describe("0 subventionné, 1 non subventionné"),
      }),
    )
    .default([]),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Connexion requise.", { status: 401 });

  const { messages, lang, apiKey, modele } = (await req.json()) as {
    messages: UIMessage[];
    lang: "fr" | "en";
    apiKey?: string;
    modele?: string;
  };
  if (!apiKey) return new Response("Clé API requise.", { status: 401 });
  const ia = createAnthropic({ apiKey });
  const langue = lang === "en" ? "English" : "français";

  const system = [
    "Tu aides à constituer une bibliothèque de ménages types et de jeux de paramètres réutilisables, pour le modèle du revenu disponible des ménages québécois (2025-2026).",
    `Réponds en ${langue}, brièvement.`,
    "Quand l'utilisateur DÉCRIT un ménage (situation, revenus, âges, enfants, frais de garde), appelle creer_menage_type avec un nom court et descriptif (ex. « Couple, 2 enfants, 60k+40k »).",
    "Quand il demande un jeu de paramètres, appelle creer_jeu_parametres (année de base 2025 ou 2026) — il pourra ensuite l'ajuster dans « Comparer des paramètres ».",
    "Ne crée rien tant que la description n'est pas claire : au besoin, pose une brève question. Après une création réussie, confirme en une phrase ce que tu as créé.",
    "Reste dans le sujet (la bibliothèque). Valeurs indicatives, pas un avis fiscal.",
  ].join("\n");

  const result = streamText({
    model: ia(modeleValide(modele)),
    system,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(6),
    tools: {
      creer_menage_type: tool({
        description: "Crée et enregistre un ménage type dans la bibliothèque à partir de la description de l'utilisateur.",
        inputSchema: menageSchema.extend({ nom: z.string().describe("nom court et descriptif du ménage type") }),
        execute: async ({ nom, ...m }) => {
          const r = await enregistrerMenage(nom, m);
          return { ok: true, nom: r.name };
        },
      }),
      creer_jeu_parametres: tool({
        description:
          "Crée un jeu de paramètres basé sur une année officielle (2025 ou 2026), que l'utilisateur ajustera ensuite dans « Comparer des paramètres ».",
        inputSchema: z.object({
          nom: z.string().describe("nom court et descriptif du jeu de paramètres"),
          anneeBase: z.union([z.literal(2025), z.literal(2026)]).default(2025),
        }),
        execute: async ({ nom, anneeBase }) => {
          const r = await enregistrerJeuParametres(nom, anneeBase, {});
          return { ok: true, nom: r.name, anneeBase };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
