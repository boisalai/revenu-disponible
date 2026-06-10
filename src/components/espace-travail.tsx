"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { UI, type Lang } from "@/lib/i18n";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { BoutonFermerPanneau, EnteteVolet, PanneauInfoVolet, usePanneauInfo } from "@/components/panneau-info";
import { BoutonPartage } from "@/components/bouton-partage";
import { BarreCompte } from "@/components/compte/barre-compte";
import { ThemeToggle } from "@/components/theme-toggle";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface ContenuVolet {
  titre: string;
  actions?: ReactNode;
  contenu: ReactNode;
}

/** Bascule de langue FR/EN. */
export function SelecteurLangue({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-md border text-sm">
      {(["fr", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`px-3 py-1.5 font-medium uppercase transition-colors ${
            lang === l ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/** Barre supérieure pleine largeur : titre + sous-titre + navigation, et actions à droite
 *  (les actions propres à la page précèdent les actions communes partage/compte/thème/langue). */
export function BarreSuperieure({
  lang,
  onLang,
  titre,
  sousTitre,
  nav,
  actions,
  avecPartage = true,
}: {
  lang: Lang;
  onLang: (l: Lang) => void;
  titre: string;
  sousTitre: string;
  nav: ReactNode;
  actions?: ReactNode;
  avecPartage?: boolean;
}) {
  return (
    <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b px-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titre}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{sousTitre}</p>
        <nav className="mt-2 flex flex-wrap gap-4 text-sm font-medium text-primary">{nav}</nav>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {actions}
        {avecPartage && <BoutonPartage lang={lang} />}
        <BarreCompte lang={lang} />
        <ThemeToggle />
        <SelecteurLangue lang={lang} onChange={onLang} />
      </div>
    </header>
  );
}

/** Logo GitHub (SVG officiel ; lucide ne fournit plus les icônes de marque). */
function IconeGithub({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/** Pied de page pleine largeur — note technique + crédits (nom · GitHub · année). */
export function PiedPage({ lang }: { lang: Lang }) {
  const annee = new Date().getFullYear();
  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t px-6 py-3 text-xs text-muted-foreground">
      <p className="leading-relaxed">{UI.piedPage[lang]}</p>
      <p className="shrink-0">
        © {annee} <span className="font-medium text-foreground">Alain Boisvert</span>
        {" · "}
        <Link href="/a-propos" className="font-medium text-primary underline-offset-4 hover:underline">
          {UI.aProposLien[lang]}
        </Link>
        {" · "}
        <a
          href="/guide-revenu-disponible.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {UI.guidePdf[lang]}
        </a>
        {" · "}
        <a
          href="https://github.com/boisalai/revenu-disponible"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          <IconeGithub className="mr-1 inline-block size-3.5 align-text-bottom" />
          {UI.codeSource[lang]}
        </a>
      </p>
    </footer>
  );
}

/** Volet à hauteur d'écran : en-tête fixe + corps défilant. */
function VoletScroll({ titre, actions, contenu }: ContenuVolet) {
  return (
    <div className="flex h-full flex-col">
      <EnteteVolet titre={titre}>{actions}</EnteteVolet>
      <div className="min-h-0 flex-1 overflow-y-auto">{contenu}</div>
    </div>
  );
}

/** Espace de travail façon Obsidian : barre supérieure pleine largeur, bande centrale
 *  en trois volets redimensionnables (gauche | central | panneau d'info toujours ouvert),
 *  pied de page pleine largeur. Sur mobile, les volets s'empilent et le panneau devient un
 *  tiroir (géré par le provider). */
export function EspaceTravail({
  lang,
  header,
  gauche,
  central,
  droite,
  assistant,
  tailleGauche = "26%",
}: {
  lang: Lang;
  header: ReactNode;
  gauche: ContenuVolet;
  central: ContenuVolet;
  /** Volet droit personnalisé. Par défaut = panneau d'info des postes (toujours ouvert). */
  droite?: ContenuVolet;
  /** Contenu « assistant » du volet droit (mode alterné avec le détail du poste). */
  assistant?: ReactNode;
  tailleGauche?: string;
}) {
  const estBureau = useMediaQuery("(min-width: 768px)");
  const { mode, setMode } = usePanneauInfo();
  const g = parseFloat(tailleGauche) || 26;
  const central_ = Math.max(28, 100 - g - 24); // le volet droit part à 24 %

  return (
    <div className={cn("flex flex-col", estBureau ? "h-[calc(100dvh-0.25rem)]" : "min-h-[calc(100dvh-0.25rem)]")}>
      {header}

      {estBureau ? (
        <div className="min-h-0 flex-1">
          <ResizablePanelGroup orientation="horizontal" className="h-full items-stretch">
            <ResizablePanel defaultSize={`${g}%`} minSize="16%" maxSize="44%" className="min-w-0">
              <VoletScroll {...gauche} />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={`${central_}%`} minSize="26%" className="min-w-0">
              <VoletScroll {...central} />
            </ResizablePanel>
            <ResizableHandle />
            <PanneauInfoVolet lang={lang} assistant={assistant} primaire={droite} />
          </ResizablePanelGroup>
        </div>
      ) : (
        <div className="flex-1">
          <section>
            <EnteteVolet titre={gauche.titre}>{gauche.actions}</EnteteVolet>
            {gauche.contenu}
          </section>
          <section className="border-t">
            <EnteteVolet titre={central.titre}>{central.actions}</EnteteVolet>
            {central.contenu}
          </section>
          {droite && (
            <section className="border-t">
              <EnteteVolet titre={droite.titre}>{droite.actions}</EnteteVolet>
              {droite.contenu}
            </section>
          )}

          {/* Tiroir assistant mobile : plein écran, glisse de droite. Monté en permanence
              (la conversation est conservée) ; le tiroir détail du provider s'efface en
              mode « assistant ». Fermer = revenir au mode « info ». */}
          {assistant != null && (
            <aside
              aria-hidden={mode !== "assistant"}
              className={cn(
                "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-xl transition-transform duration-300 ease-out",
                mode === "assistant" ? "translate-x-0" : "pointer-events-none translate-x-full",
              )}
            >
              <EnteteVolet titre={UI.assistantTitre[lang]}>
                <BoutonFermerPanneau lang={lang} onClose={() => setMode("info")} />
              </EnteteVolet>
              <div className="min-h-0 flex-1">{assistant}</div>
            </aside>
          )}
        </div>
      )}

      <PiedPage lang={lang} />
    </div>
  );
}
