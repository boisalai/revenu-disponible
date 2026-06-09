"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SendHorizonal, Sparkles } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSession } from "@/lib/auth-client";
import { useCleApi } from "@/lib/cle-api";
import { usePanneauInfo } from "@/components/panneau-info";
import { UI, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
 *  `requiertConnexion` ajoute une porte de connexion (pour la bibliothèque, qui écrit en BD). */
export function AssistantChat({
  lang,
  api,
  corps,
  intro,
  actionsRapides,
  onTermine,
  requiertConnexion = false,
}: {
  lang: Lang;
  api: string;
  corps: Record<string, unknown>;
  intro: string;
  actionsRapides: string[];
  onTermine?: () => void;
  requiertConnexion?: boolean;
}) {
  const { data: session, isPending } = useSession();
  const { cle, setCle, pret } = useCleApi();
  const [authOuvert, setAuthOuvert] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [saisieCle, setSaisieCle] = useState("");
  const transport = useMemo(() => new DefaultChatTransport({ api }), [api]);
  const { messages, sendMessage, status } = useChat({ transport, onFinish: onTermine });
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const occupe = status === "submitted" || status === "streaming";
  const envoyer = (texte: string) => {
    const t = texte.trim();
    if (!t || occupe || !cle) return;
    sendMessage({ text: t }, { body: { ...corps, apiKey: cle } });
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

  // Porte 2 — clé API (BYOK).
  if (!pret) return null;
  if (!cle) {
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
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
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
        {status === "error" && <p className="text-destructive">{UI.assistantErreur[lang]}</p>}
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
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button type="submit" size="icon" disabled={occupe || !saisie.trim()} aria-label={UI.assistantEnvoyer[lang]}>
          <SendHorizonal className="size-4" />
        </Button>
      </form>

      <div className="flex items-center justify-between gap-3 border-t px-4 py-2">
        <p className="text-xs leading-relaxed text-muted-foreground">{UI.assistantAvertissement[lang]}</p>
        <button
          type="button"
          onClick={() => setCle(null)}
          className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {UI.assistantChangerCle[lang]}
        </button>
      </div>
    </div>
  );
}
