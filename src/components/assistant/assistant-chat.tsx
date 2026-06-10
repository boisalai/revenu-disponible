"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SendHorizonal, Sparkles } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSession } from "@/lib/auth-client";
import { useCleApi, useModeleIA } from "@/lib/cle-api";
import { MODELES_IA } from "@/lib/modeles-ia";
import { DEMO_ACTIVE, DEMO_TOURS_MAX } from "@/lib/demo-ia";
import { usePanneauInfo } from "@/components/panneau-info";
import { UI, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthDialog } from "@/components/compte/auth-dialog";

// Rendu markdown compact ; valeurs des tableaux alignées à droite (colonnes ≠ première).
const MD: Components = {
  p: ({ node, ...p }) => <p className="my-1.5 leading-relaxed" {...p} />,
  ul: ({ node, ...p }) => <ul className="my-1.5 list-disc space-y-1 pl-4" {...p} />,
  ol: ({ node, ...p }) => <ol className="my-1.5 list-decimal space-y-1 pl-4" {...p} />,
  li: ({ node, ...p }) => <li className="leading-relaxed" {...p} />,
  strong: ({ node, ...p }) => <strong className="font-semibold" {...p} />,
  h1: ({ node, ...p }) => <h3 className="mb-1 mt-3 text-sm font-semibold" {...p} />,
  h2: ({ node, ...p }) => <h3 className="mb-1 mt-3 text-sm font-semibold" {...p} />,
  h3: ({ node, ...p }) => <h3 className="mb-1 mt-3 text-sm font-semibold" {...p} />,
  a: ({ node, ...p }) => <a className="text-primary underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...p} />,
  code: ({ node, ...p }) => <code className="rounded bg-background/60 px-1 py-0.5 text-xs" {...p} />,
  table: ({ node, ...p }) => (
    <div className="my-2 overflow-x-auto">
      <table
        className="w-full border-collapse text-xs [&_td:not(:first-child)]:text-right [&_td:not(:first-child)]:tabular-nums [&_th:not(:first-child)]:text-right"
        {...p}
      />
    </div>
  ),
  th: ({ node, ...p }) => <th className="border px-2 py-1 font-medium" {...p} />,
  td: ({ node, ...p }) => <td className="border px-2 py-1" {...p} />,
  hr: () => <hr className="my-3" />,
};

/** Bouton « Assistant » (en-tête des résultats) : bascule le volet droit en mode assistant. */
export function BoutonAssistant({ lang }: { lang: Lang }) {
  const { setMode } = usePanneauInfo();
  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMode("assistant")}>
      <Sparkles className="size-4" />
      {UI.assistant[lang]}
    </Button>
  );
}

/** Conversation IA générique, clé API fournie par l'utilisateur (BYOK).
 *  `corps` = données envoyées à chaque message ; `onTermine` est appelé à la fin d'un tour ;
 *  `requiertConnexion` ajoute une porte de connexion (pour la bibliothèque, qui écrit en BD) ;
 *  `demoPossible` autorise le mode démo sans clé (route assistant seulement, si DEMO_ACTIVE). */
export function AssistantChat({
  lang,
  api,
  corps,
  intro,
  actionsRapides,
  onTermine,
  requiertConnexion = false,
  demoPossible = false,
}: {
  lang: Lang;
  api: string;
  corps: Record<string, unknown>;
  intro: string;
  actionsRapides: string[];
  onTermine?: () => void;
  requiertConnexion?: boolean;
  demoPossible?: boolean;
}) {
  const { data: session, isPending } = useSession();
  const { cle, setCle, pret } = useCleApi();
  const { modele, setModele } = useModeleIA();
  const [authOuvert, setAuthOuvert] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [saisieCle, setSaisieCle] = useState("");
  const [montrerCle, setMontrerCle] = useState(false); // bascule démo → formulaire de clé
  const transport = useMemo(() => new DefaultChatTransport({ api }), [api]);
  const { messages, sendMessage, status } = useChat({ transport, onFinish: onTermine });
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Mode démo : pas de clé, mais la démo est offerte (clé plafonnée côté serveur).
  const demoDispo = demoPossible && DEMO_ACTIVE;
  const modeDemo = !cle && demoDispo && !montrerCle;
  const toursUtilises = messages.filter((m) => m.role === "user").length;
  const demoEpuisee = modeDemo && toursUtilises >= DEMO_TOURS_MAX;

  const occupe = status === "submitted" || status === "streaming";
  const envoyer = (texte: string) => {
    const t = texte.trim();
    if (!t || occupe || (!cle && !modeDemo) || demoEpuisee) return;
    // En démo, ni clé ni modèle : le serveur impose Haiku sur la clé plafonnée du projet.
    sendMessage({ text: t }, { body: { ...corps, ...(cle ? { apiKey: cle, modele } : {}) } });
    setSaisie("");
  };

  // Porte 1 — connexion (bibliothèque seulement).
  if (requiertConnexion && !isPending && !session) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
        <Sparkles className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{UI.assistantConnexion[lang]}</p>
        <Button onClick={() => setAuthOuvert(true)}>{UI.seConnecter[lang]}</Button>
        <AuthDialog open={authOuvert} onOpenChange={setAuthOuvert} lang={lang} />
      </div>
    );
  }

  // Porte 2 — clé API (BYOK), sauf si le mode démo prend le relais.
  if (!pret) return null;
  if (!cle && !modeDemo) {
    return (
      <div className="flex h-full flex-col justify-center gap-3 px-5 py-6">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="size-4 text-primary" />
          {UI.assistantTitre[lang]}
        </div>
        <p className="text-sm text-muted-foreground">{UI.assistantCleIntro[lang]}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (saisieCle.trim()) setCle(saisieCle.trim());
          }}
          className="flex flex-col gap-2"
        >
          <input
            type="password"
            autoComplete="off"
            value={saisieCle}
            onChange={(e) => setSaisieCle(e.target.value)}
            placeholder="sk-ant-..."
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button type="submit" disabled={!saisieCle.trim()}>
            {UI.enregistrer[lang]}
          </Button>
        </form>
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-primary underline underline-offset-2"
        >
          {UI.assistantCleLien[lang]}
        </a>
        <p className="text-xs leading-relaxed text-muted-foreground">{UI.assistantCleNote[lang]}</p>
        {demoDispo && (
          <button
            type="button"
            onClick={() => setMontrerCle(false)}
            className="text-left text-xs font-medium text-primary underline underline-offset-2"
          >
            {UI.demoEssayer[lang]}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {modeDemo ? (
        <div className="border-b px-4 py-2">
          <p className="text-xs leading-snug text-muted-foreground">{UI.demoBandeau[lang]}</p>
        </div>
      ) : (
        <div className="border-b px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">{UI.modeleLabel[lang]}</span>
            <Select value={modele} onValueChange={setModele}>
              <SelectTrigger size="sm" className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELES_IA.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{UI.modeleNote[lang]}</p>
        </div>
      )}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-muted-foreground">{intro}</p>
            <div className="flex flex-col gap-2">
              {actionsRapides.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => envoyer(q)}
                  className="rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const texte = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          if (!texte) return null;
          return (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 leading-relaxed",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {m.role === "user" ? (
                  <span className="whitespace-pre-wrap">{texte}</span>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
                    {texte}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          );
        })}

        {status === "submitted" && <p className="text-muted-foreground">{UI.assistantReflechit[lang]}</p>}
        {status === "error" && (
          <p className="text-destructive">{modeDemo ? UI.demoErreur[lang] : UI.assistantErreur[lang]}</p>
        )}
        {demoEpuisee && <p className="text-muted-foreground">{UI.demoToursEpuises[lang]}</p>}
        <div ref={finRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          envoyer(saisie);
        }}
        className="flex items-center gap-2 border-t px-4 py-3"
      >
        <input
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder={UI.assistantPlaceholder[lang]}
          disabled={demoEpuisee}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        />
        <Button
          type="submit"
          size="icon"
          disabled={occupe || !saisie.trim() || demoEpuisee}
          aria-label={UI.assistantEnvoyer[lang]}
        >
          <SendHorizonal className="size-4" />
        </Button>
      </form>

      <div className="flex items-center justify-between gap-3 border-t px-4 py-2">
        <p className="text-xs leading-relaxed text-muted-foreground">{UI.assistantAvertissement[lang]}</p>
        <button
          type="button"
          onClick={() => {
            setCle(null);
            setMontrerCle(true); // démo ou BYOK : mène au formulaire de clé
          }}
          className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {modeDemo ? UI.demoUtiliserCle[lang] : UI.assistantChangerCle[lang]}
        </button>
      </div>
    </div>
  );
}
