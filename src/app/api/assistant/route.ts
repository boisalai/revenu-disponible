import { z } from "zod";
import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { calculerRevenuDisponible, PARAMETRES_OFFICIELS } from "@/index";
import { versMenage, type MenageEtat } from "@/lib/menage-etat";
import { courbeTauxMarginal } from "@/lib/taux-marginal";
import { positionNette, seuilsMenage } from "@/lib/seuils";
import { POSTES_INFO } from "@/lib/postes-info";
import { SOURCE_POSTE } from "@/lib/sources-postes";
import { CLE_VERS_POSTE } from "@/lib/parametres-meta";
import { FICHIER_POSTE, codePoste } from "@/lib/code-postes";
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

/** Position nette et seuils du ménage affiché (2025 et 2026), exacts — à recopier par le modèle. */
function blocSeuils(etat: MenageEtat): string {
  const v = (x: number | null) => (x === null ? "non atteint avant 300 000 $" : dollars(x));
  return ([2025, 2026] as const)
    .map((annee) => {
      const m = versMenage(etat);
      const pos = positionNette(m, annee);
      const s = seuilsMenage(m, annee);
      return (
        `${annee} : position nette = ${pos.nette >= 0 ? "BÉNÉFICIAIRE" : "CONTRIBUTEUR"} net de ${dollars(Math.abs(pos.nette))} ` +
        `(${dollars(pos.transferts)} de transferts reçus ; ${dollars(pos.impots)} d'impôts payés). ` +
        `Seuils : 1er $ d'impôt fédéral à ${v(s.impotFederal)} de revenu ; 1er $ d'impôt du Québec à ${v(s.impotQuebec)} ; ` +
        `devient contributeur net à ${v(s.contributeurNet)} (envers le Québec seul : ${v(s.contributeurNetQuebec)} ; ` +
        `envers le fédéral seul : ${v(s.contributeurNetFederal)}).`
      );
    })
    .join("\n");
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
    "- Pour les montants, paramètres et références d'un poste, appelle l'outil detail_poste.",
    "- Dès que la question porte sur le COMMENT d'un calcul (« comment se calcule… », « précisément », « étape par étape », ordre des étapes, arrondis, cas limites, interactions), appelle AUSSI l'outil code_poste : le code source TypeScript vérifié du moteur, qui fait foi de la mécanique exacte. Explique-le en langage clair, étape par étape ; ne montre des extraits de code que sur demande.",
    "- Ne demande JAMAIS la permission d'appeler un outil (pas de « veux-tu que je consulte… ? ») : consulte d'abord, réponds ensuite.",
    "- Pour un autre scénario (« et si… ? ») ou la courbe du TEMI (taux effectif marginal d'imposition), appelle l'outil correspondant — n'invente aucun chiffre.",
    "- Pour la position nette et les seuils (« à partir de quel revenu… ? », premier dollar d'impôt, contributeur net) : recopie le bloc SEUILS ci-dessous ; pour un AUTRE ménage, appelle l'outil seuils. Définitions : solde = impôts contre transferts seulement (cotisations exclues, car assurantielles ; frais de garde exclus, car coût privé) ; le revenu de l'adulte 1 varie, le reste du ménage est fixe ; chaque seuil est le premier franchissement, exact au dollar.",
    "- Format pour un PANNEAU ÉTROIT : concis, phrases courtes, listes à puces. Pas de grands tableaux markdown (au plus 3 colonnes ; jamais de gras ** à l'intérieur des cellules). Markdown léger.",
    "- Reste dans le sujet (ce modèle fiscal). Rappelle au besoin que ce sont des valeurs indicatives, pas un avis fiscal.",
    "",
    "SCÉNARIO ACTUELLEMENT AFFICHÉ :",
    `- Situation : ${SITUATIONS[menage.situation] ?? "?"}`,
    `- Revenu adulte 1 : ${dollars(menage.revenu1)}${couple ? ` ; adulte 2 : ${dollars(menage.revenu2)}` : ""}`,
    `- Âge : ${menage.age1}${couple ? ` ; ${menage.age2}` : ""}`,
    `- Enfants : ${
      menage.enfants.length === 0
        ? "aucun"
        : menage.enfants
            .map(
              (e) =>
                `${e.age} ans${e.fraisGarde > 0 ? ` (garde ${e.typeGarde === 1 ? "non subventionnée" : "subventionnée"}, ${dollars(e.fraisGarde)}/an)` : ""}`,
            )
            .join(" ; ")
    } — pour les outils, reprends EXACTEMENT ces âges, frais et types de garde.`,
    "",
    "Ventilation EXACTE par poste (à recopier, ne pas recalculer) :",
    ventilationComplete(menage, lang),
    "",
    "SEUILS ET POSITION NETTE du ménage affiché (EXACTS, à recopier — ne jamais recalculer) :",
    blocSeuils(menage),
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
          "Détaille un poste précis : sa règle de calcul en une phrase, ses références légales, son montant exact dans le scénario, et ses paramètres officiels (taux, exemptions, plafonds, paliers) pour 2025 et 2026. À utiliser pour les montants, paramètres chiffrés et références. Si la question porte sur la mécanique du calcul, appelle AUSSI code_poste.",
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
      code_poste: tool({
        description:
          "Renvoie le code source TypeScript du moteur (vérifié, commenté en français, avec base légale) qui calcule un poste : la mécanique exacte — étapes, arrondis, plafonds, réductions, interactions. À appeler DIRECTEMENT (sans demander la permission) dès qu'on demande comment un poste se calcule, ou pour reproduire un calcul à la main. Clés spéciales : « socle » (types et helpers communs : impotProgressif, credit, revenusAdultes) et « orchestrateur » (enchaînement des postes et bases de revenu).",
        inputSchema: z.object({
          cle: z.string().describe(`clé du poste, parmi : ${Object.keys(FICHIER_POSTE).join(", ")}`),
        }),
        execute: async ({ cle }) => (await codePoste(cle)) ?? { erreur: `clé inconnue : ${cle}` },
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
      seuils: tool({
        description:
          "Position nette d'un ménage (transferts reçus − impôts payés) et ses seuils de bascule, au dollar près : revenu où il paie son premier dollar d'impôt (Québec ; fédéral) et revenu où il devient contributeur net (impôts > transferts ; aussi détaillé par gouvernement). Convention : le revenu de l'adulte 1 varie, le reste est fixe ; cotisations et frais de garde exclus du solde. À utiliser pour « à partir de quel revenu… ? » ou « est-ce que je reçois plus que je paie ? ».",
        inputSchema: menageSchema.extend({ annee: z.union([z.literal(2025), z.literal(2026)]).default(2025) }),
        execute: async ({ annee, ...m }) => {
          const menageCalc = versMenage(m as MenageEtat);
          const pos = positionNette(menageCalc, annee);
          const s = seuilsMenage(menageCalc, annee);
          return {
            annee,
            positionNette: {
              transfertsRecus: Math.round(pos.transferts),
              impotsPayes: Math.round(pos.impots),
              solde: Math.round(pos.nette),
              statut: pos.nette >= 0 ? "bénéficiaire net" : "contributeur net",
            },
            seuils: {
              premierDollarImpotQuebec: s.impotQuebec,
              premierDollarImpotFederal: s.impotFederal,
              contributeurNet: s.contributeurNet,
              contributeurNetEnversQuebec: s.contributeurNetQuebec,
              contributeurNetEnversFederal: s.contributeurNetFederal,
              note: "null = non atteint avant 300 000 $ de revenu",
            },
          };
        },
      }),
      taux_marginal: tool({
        description:
          "Calcule la courbe du taux effectif marginal d'imposition (TEMI, %) selon le revenu de travail, de 0 à 100 000 $. Sert à expliquer où le taux grimpe (trappes à la pauvreté).",
        inputSchema: menageSchema.extend({
          annee: z.union([z.literal(2025), z.literal(2026)]).default(2025),
          pas: z.number().default(1000).describe("intervalle de revenu entre deux points, en $ (1000 = même finesse que le graphique de l'app)"),
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
