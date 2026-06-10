"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ExternalLink, Info, Sparkles, X } from "lucide-react";
import { UI, type Lang } from "@/lib/i18n";
import { POSTES_INFO } from "@/lib/postes-info";
import { SOURCE_POSTE } from "@/lib/sources-postes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResizablePanel } from "@/components/ui/resizable";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { parametresDuPoste } from "@/lib/parametres-meta";

type ModePanneau = "info" | "assistant";

interface PanneauCtx {
  poste: string | null;
  lang: Lang;
  mode: ModePanneau;
  ouvrir: (cle: string, lang: Lang) => void;
  fermer: () => void;
  setMode: (m: ModePanneau) => void;
}

const Ctx = createContext<PanneauCtx | null>(null);

/** Hook d'accès au panneau d'information (doit être sous PanneauInfoProvider). */
export function usePanneauInfo(): PanneauCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePanneauInfo doit être utilisé sous <PanneauInfoProvider>");
  return c;
}

/** En-tête de volet — hauteur fixe (48 px), titre 16 px, filet inférieur (aligné entre volets). */
export function EnteteVolet({ titre, children }: { titre: string; children?: ReactNode }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b bg-card px-5">
      <h2 className="truncate text-base font-semibold" title={titre}>
        {titre}
      </h2>
      {children}
    </div>
  );
}

/** Bouton × de fermeture du panneau. */
export function BoutonFermerPanneau({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={UI.fermer[lang]}
      className="-mr-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <X className="size-4" />
    </button>
  );
}

/** Corps du panneau d'info (sans en-tête) : description, objectif, règle, références, source. */
export function CorpsPanneau({ poste, lang }: { poste: string; lang: Lang }) {
  const info = POSTES_INFO[poste];
  const source = SOURCE_POSTE[poste];
  if (!info) return null;
  const params = parametresDuPoste(poste, lang);

  const champ = (titre: string, texte: string) => (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titre}</div>
      <p className="mt-1 leading-relaxed">{texte}</p>
    </div>
  );

  return (
    <div className="space-y-4 px-5 py-4 text-sm">
      <p className="leading-relaxed text-muted-foreground">{info.description[lang]}</p>
      {champ(UI.objectif[lang], info.objectif[lang])}
      {champ(UI.regleCalcul[lang], info.regle[lang])}
      {params.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="params" className="border-b-0">
            <AccordionTrigger className="py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:no-underline">
              {UI.parametresTitre[lang]}
            </AccordionTrigger>
            <AccordionContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-1 pr-2 text-left font-medium">{UI.parametre[lang]}</th>
                    <th className="py-1 px-1 text-right font-medium">2025</th>
                    <th className="py-1 pl-1 text-right font-medium">2026</th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((r) => (
                    <tr key={r.label} className="border-b align-top last:border-0">
                      <td className="py-1 pr-2">{r.label}</td>
                      <td className="py-1 px-1 text-right tabular-nums whitespace-nowrap">{r.v2025}</td>
                      <td className="py-1 pl-1 text-right tabular-nums whitespace-nowrap">{r.v2026}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      {champ(UI.references[lang], info.references[lang])}
      {source && (
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
        >
          {UI.enSavoirPlus[lang]}
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}

/** Panneau complet (en-tête + corps) — utilisé par le tiroir mobile. */
function ContenuPanneau({ poste, lang, onClose }: { poste: string; lang: Lang; onClose: () => void }) {
  const info = POSTES_INFO[poste];
  if (!info) return null;
  return (
    <>
      <EnteteVolet titre={info.nom[lang]}>
        <BoutonFermerPanneau lang={lang} onClose={onClose} />
      </EnteteVolet>
      <CorpsPanneau poste={poste} lang={lang} />
    </>
  );
}

/** Contexte global + tiroir mobile. Sur ordinateur, le panneau droit est rendu par
 *  <PanneauInfoVolet> (volet toujours ouvert, modes « info » et « assistant »). */
export function PanneauInfoProvider({ children }: { children: ReactNode }) {
  const [poste, setPoste] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("fr");
  const [mode, setMode] = useState<ModePanneau>("info");

  const ouvrir = (cle: string, l: Lang) => {
    setPoste(cle);
    setLang(l);
    setMode("info");
  };
  const fermer = () => setPoste(null);

  // Le tiroir détail ne s'affiche qu'en mode « info » : en mode « assistant », c'est le
  // tiroir assistant (rendu par EspaceTravail, qui détient le contenu) qui occupe l'écran.
  const actif = poste != null && POSTES_INFO[poste] != null && mode === "info";

  return (
    <Ctx.Provider value={{ poste, lang, mode, ouvrir, fermer, setMode }}>
      {children}

      {/* Tiroir mobile (sous md) : plein écran, glisse de droite. */}
      <div className="md:hidden">
        {actif && <div className="fixed inset-0 z-40 bg-foreground/20" onClick={fermer} aria-hidden />}
        <aside
          aria-hidden={!actif}
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-card shadow-xl transition-transform duration-300 ease-out",
            actif ? "translate-x-0" : "pointer-events-none translate-x-full",
          )}
        >
          {actif && poste && <ContenuPanneau poste={poste} lang={lang} onClose={fermer} />}
        </aside>
      </div>
    </Ctx.Provider>
  );
}

/** Volet droit (toujours ouvert) — à placer en dernier dans un ResizablePanelGroup.
 *  Mode « primaire » par défaut = détail du poste (ⓘ) ; surchargeable par `primaire`
 *  (ex. Aide de la bibliothèque). Si `assistant` est fourni, une bascule alterne primaire ⇄ assistant. */
export function PanneauInfoVolet({
  lang,
  assistant,
  primaire,
}: {
  lang: Lang;
  assistant?: ReactNode;
  primaire?: { titre: string; contenu: ReactNode };
}) {
  const { poste, mode, fermer, setMode } = usePanneauInfo();
  const aPoste = poste != null && POSTES_INFO[poste] != null;
  const estAssistant = assistant != null && mode === "assistant";
  const titrePrimaire = primaire ? primaire.titre : aPoste ? POSTES_INFO[poste].nom[lang] : UI.panneauTitre[lang];
  const libelleRetour = primaire ? primaire.titre : UI.detailVolet[lang];

  return (
    <ResizablePanel id="info" defaultSize="26%" minSize="20%" maxSize="44%" className="min-w-0">
      <div className="flex h-full flex-col">
        <EnteteVolet titre={estAssistant ? UI.assistantTitre[lang] : titrePrimaire}>
          {assistant != null ? (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5"
              onClick={() => setMode(estAssistant ? "info" : "assistant")}
            >
              {estAssistant ? (
                <>
                  <Info className="size-4" />
                  {libelleRetour}
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  {UI.assistant[lang]}
                </>
              )}
            </Button>
          ) : (
            !primaire && aPoste && <BoutonFermerPanneau lang={lang} onClose={fermer} />
          )}
        </EnteteVolet>

        <div className="min-h-0 flex-1">
          {/* Assistant : monté en permanence (la conversation est conservée), masqué hors mode assistant. */}
          {assistant != null && <div className={cn("h-full", !estAssistant && "hidden")}>{assistant}</div>}
          {!estAssistant && (
            <div className="h-full overflow-y-auto">
              {primaire ? (
                primaire.contenu
              ) : aPoste ? (
                <CorpsPanneau poste={poste} lang={lang} />
              ) : (
                <p className="px-5 py-5 text-sm leading-relaxed text-muted-foreground">{UI.panneauVide[lang]}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </ResizablePanel>
  );
}
