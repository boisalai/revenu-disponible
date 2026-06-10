import { z } from "zod";
import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { calculerRevenuDisponible, PARAMETRES_OFFICIELS } from "@/index";
import { versMenage, type MenageEtat } from "@/lib/menage-etat";
import { courbeTauxMarginal } from "@/lib/taux-marginal";
import { POSTES_INFO } from "@/lib/postes-info";
import { SOURCE_POSTE } from "@/lib/sources-postes";
import { CLE_VERS_POSTE } from "@/lib/parametres-meta";
import { modeleValide } from "@/lib/modeles-ia";
import { DEMO_MODELE, DEMO_TOURS_MAX, DEMO_MAX_TOKENS } from "@/lib/demo-ia";
import { consommerQuotaDemo, ipClient } from "@/lib/demo-quota";

export const maxDuration = 30;

const SITUATIONS = ["personne seule", "famille monoparentale", "couple", "retraité seul", "couple de retraités"];

// poste (clé POSTES_INFO/detail) → clé du bundle Parametres (inverse de CLE_VERS_POSTE).
const POSTE_VERS_PARAM: Record<string, string> = Object.fromEntries(
  Object.entries(CLE_VERS_POSTE).map(([param, poste]) => [poste, param]),
);

type Detail = ReturnType<typeof calculerRevenuDisponible>["detail"];

/** Montant SIGNÉ d'un poste dans la ventilation (cotisations/impôts négatifs, transferts positifs). */
function montantPoste(d: Detail, cle: string): number | null {
  const co = d.cotisations as Record<string, number>;
  const tq = d.transfertsQuebec as Record<string, number>;
  const tf = d.transfertsFederaux as Record<string, number>;
  if (cle in co) return -co[cle];
  if (cle in tq) return tq[cle];
  if (cle === "impotQuebec") return -d.impotQuebec;
  if (cle in tf) return tf[cle];
  if (cle === "impotFederal") return -d.impotFederal;
  return null;
}

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

const dollars = (n: number) => `${Math.round(n).toLocaleString("fr-CA")} $`;
const signe = (n: number) => `${n >= 0 ? "+" : "−"}${Math.round(Math.abs(n)).toLocaleString("fr-CA")} $`;

/** Ventilation complète par poste (2025 et 2026), montants signés — à recopier, jamais recalculer. */
function ventilationComplete(menage: MenageEtat, lang: "fr" | "en"): string {
  const r25 = calculerRevenuDisponible(versMenage(menage), 2025);
  const r26 = calculerRevenuDisponible(versMenage(menage), 2026);
  const nom = (cle: string) => POSTES_INFO[cle]?.nom[lang] ?? cle;
  const cles = <T extends object>(o: T) => Object.keys(o) as (keyof T & string)[];
  const ligne = (label: string, v25: number, v26: number) => `  ${label} : ${signe(v25)} (2025) / ${signe(v26)} (2026)`;

  const out: string[] = [ligne("Revenu de travail et de retraite", r25.composantes.revenu, r26.composantes.revenu)];
  out.push("  — Cotisations —");
  for (const k of cles(r25.detail.cotisations)) out.push(ligne(nom(k), -r25.detail.cotisations[k], -r26.detail.cotisations[k]));
  out.push(ligne("Total des cotisations", -r25.composantes.cotisations, -r26.composantes.cotisations));
  out.push("  — Transferts du Québec —");
  for (const k of cles(r25.detail.transfertsQuebec)) out.push(ligne(nom(k), r25.detail.transfertsQuebec[k], r26.detail.transfertsQuebec[k]));
  out.push(ligne("Total des transferts du Québec", r25.composantes.transfertsQuebec, r26.composantes.transfertsQuebec));
  out.push(ligne("Impôt du Québec", -r25.detail.impotQuebec, -r26.detail.impotQuebec));
  out.push("  — Transferts fédéraux —");
  for (const k of cles(r25.detail.transfertsFederaux)) out.push(ligne(nom(k), r25.detail.transfertsFederaux[k], r26.detail.transfertsFederaux[k]));
  out.push(ligne("Total des transferts fédéraux", r25.composantes.transfertsFederaux, r26.composantes.transfertsFederaux));
  out.push(ligne("Impôt du revenu fédéral", -r25.detail.impotFederal, -r26.detail.impotFederal));
  if (r25.detail.fraisGardeCout > 0 || r26.detail.fraisGardeCout > 0)
    out.push(ligne("Coût des frais de garde", -r25.detail.fraisGardeCout, -r26.detail.fraisGardeCout));
  out.push(`  = REVENU DISPONIBLE : ${dollars(r25.revenuDisponible)} (2025) / ${dollars(r26.revenuDisponible)} (2026)`);
  return out.join("\n");
}

export async function POST(req: Request) {
  const { messages, menage, lang, apiKey, modele } = (await req.json()) as {
    messages: UIMessage[];
    menage: MenageEtat;
    lang: "fr" | "en";
    apiKey?: string;
    modele?: string;
  };
  // BYOK (clé de l'utilisateur, modèle au choix) ou mode DÉMO (clé dédiée du
  // projet, plafonnée dans la console Anthropic : Haiku imposé, quota par IP,
  // conversation et sortie bornées — voir src/lib/demo-ia.ts).
  const cleDemo = process.env.ANTHROPIC_DEMO_API_KEY;
  let model: ReturnType<ReturnType<typeof createAnthropic>>;
  let maxOutputTokens: number | undefined;
  if (apiKey) {
    model = createAnthropic({ apiKey })(modeleValide(modele));
  } else if (cleDemo) {
    const tours = messages.filter((m) => m.role === "user").length;
    if (tours > DEMO_TOURS_MAX) return new Response("Limite de conversation de la démo atteinte.", { status: 429 });
    if (!consommerQuotaDemo(ipClient(req))) return new Response("Quota quotidien de la démo atteint.", { status: 429 });
    model = createAnthropic({ apiKey: cleDemo })(DEMO_MODELE);
    maxOutputTokens = DEMO_MAX_TOKENS;
  } else {
    return new Response("Clé API requise.", { status: 401 });
  }

  const langue = lang === "en" ? "English" : "français";
  const couple = menage.situation === 2 || menage.situation === 4;

  const system = [
    "Tu es un assistant pédagogique du modèle « revenu disponible » des ménages québécois, pour 2025 et 2026.",
    "Revenu disponible = revenus + transferts − cotisations − impôts − coût des frais de garde, ventilé par poste.",
    "",
    "RÈGLES IMPÉRATIVES :",
    `- Réponds en ${langue}.`,
    "- Les chiffres du SCÉNARIO ci-dessous et ceux des outils sont EXACTS et FONT AUTORITÉ. Recopie-les tels quels.",
    "- NE RECALCULE JAMAIS un total, un écart ou le revenu disponible toi-même : utilise les valeurs fournies (tu fais souvent des erreurs d'arithmétique).",
    "- Pour DÉTAILLER le calcul d'un poste (règle, taux, exemption, plafond, paliers, références), appelle l'outil detail_poste.",
    "- Pour un autre scénario (« et si… ? ») ou la courbe du TEMI (taux effectif marginal d'imposition), appelle l'outil correspondant — n'invente aucun chiffre.",
    "- Format pour un PANNEAU ÉTROIT : concis, phrases courtes, listes à puces. Pas de grands tableaux markdown. Markdown léger.",
    "- Reste dans le sujet (ce modèle fiscal). Rappelle au besoin que ce sont des valeurs indicatives, pas un avis fiscal.",
    "",
    "SCÉNARIO ACTUELLEMENT AFFICHÉ :",
    `- Situation : ${SITUATIONS[menage.situation] ?? "?"}`,
    `- Revenu adulte 1 : ${dollars(menage.revenu1)}${couple ? ` ; adulte 2 : ${dollars(menage.revenu2)}` : ""}`,
    `- Âge : ${menage.age1}${couple ? ` ; ${menage.age2}` : ""} ; enfants : ${menage.enfants.length}`,
    "",
    "Ventilation EXACTE par poste (à recopier, ne pas recalculer) :",
    ventilationComplete(menage, lang),
  ].join("\n");

  const result = streamText({
    model,
    maxOutputTokens,
    system,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(6),
    tools: {
      detail_poste: tool({
        description:
          "Détaille un poste précis : sa règle de calcul, ses références légales, son montant exact dans le scénario, et ses paramètres officiels (taux, exemptions, plafonds, paliers) pour 2025 et 2026. À utiliser dès qu'on demande « comment se calcule X » ou le détail d'un poste.",
        inputSchema: z.object({
          cle: z.string().describe(`clé du poste, parmi : ${Object.keys(POSTES_INFO).join(", ")}`),
        }),
        execute: async ({ cle }) => {
          const info = POSTES_INFO[cle];
          if (!info) return { erreur: `poste inconnu : ${cle}` };
          const d25 = calculerRevenuDisponible(versMenage(menage), 2025).detail;
          const d26 = calculerRevenuDisponible(versMenage(menage), 2026).detail;
          const pk = POSTE_VERS_PARAM[cle];
          const params = (an: 2025 | 2026) =>
            pk ? (PARAMETRES_OFFICIELS[an] as unknown as Record<string, unknown>)[pk] : undefined;
          const m25 = montantPoste(d25, cle);
          const m26 = montantPoste(d26, cle);
          return {
            poste: info.nom[lang],
            regleDeCalcul: info.regle[lang],
            references: info.references[lang],
            source: SOURCE_POSTE[cle],
            montantScenario2025: m25 != null ? Math.round(m25) : null,
            montantScenario2026: m26 != null ? Math.round(m26) : null,
            parametresOfficiels2025: params(2025),
            parametresOfficiels2026: params(2026),
          };
        },
      }),
      calculer_revenu_disponible: tool({
        description:
          "Calcule le revenu disponible d'un AUTRE ménage (scénario « et si… ? ») pour une année. Retourne des montants signés exacts.",
        inputSchema: menageSchema.extend({ annee: z.union([z.literal(2025), z.literal(2026)]).default(2025) }),
        execute: async ({ annee, ...m }) => {
          const r = calculerRevenuDisponible(versMenage(m as MenageEtat), annee);
          const c = r.composantes;
          return {
            annee,
            revenuDisponible: Math.round(r.revenuDisponible),
            revenuTravailEtRetraite: Math.round(c.revenu),
            cotisations: -Math.round(c.cotisations),
            transfertsQuebec: Math.round(c.transfertsQuebec),
            impotQuebec: -Math.round(c.impotQuebec),
            transfertsFederaux: Math.round(c.transfertsFederaux),
            impotFederal: -Math.round(c.impotFederal),
            coutFraisGarde: -Math.round(c.fraisGarde),
          };
        },
      }),
      taux_marginal: tool({
        description:
          "Calcule la courbe du taux effectif marginal d'imposition (TEMI, %) selon le revenu de travail, de 0 à 100 000 $. Sert à expliquer où le taux grimpe (trappes à la pauvreté).",
        inputSchema: menageSchema.extend({
          annee: z.union([z.literal(2025), z.literal(2026)]).default(2025),
          pas: z.number().default(5000).describe("intervalle de revenu entre deux points, en $"),
        }),
        execute: async ({ annee, pas, ...m }) => {
          const points = courbeTauxMarginal(versMenage(m as MenageEtat), annee, { max: 100000, pas });
          return { points: points.map((p) => ({ revenu: p.revenu, temiPct: Math.round(p.total) })) };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
