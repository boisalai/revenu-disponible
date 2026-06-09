"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ExternalLink, X } from "lucide-react";
import { UI, type Lang } from "@/lib/i18n";
import { POSTES_INFO } from "@/lib/postes-info";
import { SOURCE_POSTE } from "@/lib/sources-postes";
import { cn } from "@/lib/utils";
import { ResizablePanel } from "@/components/ui/resizable";

interface PanneauCtx {
  poste: string | null;
  lang: Lang;
  ouvrir: (cle: string, lang: Lang) => void;
  fermer: () => void;
}

const Ctx = createContext<PanneauCtx | null>(null);

/** Hook d'accès au panneau d'information (doit être sous PanneauInfoProvider). */
export function usePanneauInfo(): PanneauCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePanneauInfo doit être utilisé sous <PanneauInfoProvider>");
  return c;
}

/** En-tête de volet — hauteur fixe (48 px), titre 16 px, filet inférieur ;
 *  identique pour tous les volets → les filets sont alignés. */
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

/** Contexte global + tiroir mobile. Sur ordinateur, le panneau est rendu par
 *  <PanneauInfoVolet> (volet toujours ouvert dans l'espace de travail). */
export function PanneauInfoProvider({ children }: { children: ReactNode }) {
  const [poste, setPoste] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("fr");
  const ouvrir = (cle: string, l: Lang) => {
    setPoste(cle);
    setLang(l);
  };
  const fermer = () => setPoste(null);

  const actif = poste != null && POSTES_INFO[poste] != null;

  return (
    <Ctx.Provider value={{ poste, lang, ouvrir, fermer }}>
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

/** Volet d'information (toujours ouvert) — à placer en dernier dans un ResizablePanelGroup.
 *  Affiche une invite tant qu'aucun poste n'est sélectionné, sinon le détail du poste. */
export function PanneauInfoVolet({ lang }: { lang: Lang }) {
  const { poste, fermer } = usePanneauInfo();
  const aPoste = poste != null && POSTES_INFO[poste] != null;
  const titre = aPoste ? POSTES_INFO[poste].nom[lang] : UI.panneauTitre[lang];

  return (
    <ResizablePanel id="info" defaultSize="24%" minSize="18%" maxSize="40%" className="min-w-0">
      <div className="flex h-full flex-col">
        <EnteteVolet titre={titre}>{aPoste && <BoutonFermerPanneau lang={lang} onClose={fermer} />}</EnteteVolet>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {aPoste ? (
            <CorpsPanneau poste={poste} lang={lang} />
          ) : (
            <p className="px-5 py-5 text-sm leading-relaxed text-muted-foreground">{UI.panneauVide[lang]}</p>
          )}
        </div>
      </div>
    </ResizablePanel>
  );
}
