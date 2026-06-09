"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void } | null>(null);

/** Langue d'affichage partagée entre les pages et persistée (localStorage),
 *  pour qu'elle ne se réinitialise pas à la navigation. */
export function useLangue() {
  const c = useContext(LangCtx);
  if (!c) throw new Error("useLangue doit être utilisé sous <LangProvider>");
  return c;
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  // Lecture après montage (évite un écart d'hydratation ; bref affichage FR au 1er chargement).
  useEffect(() => {
    const stocke = localStorage.getItem("lang");
    if (stocke === "fr" || stocke === "en") setLangState(stocke);
  }, []);

  const setLang = (l: Lang) => {
    localStorage.setItem("lang", l);
    setLangState(l);
  };

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}
