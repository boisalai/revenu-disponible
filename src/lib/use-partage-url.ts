import { useEffect, useState } from "react";

/**
 * Synchronise l'état d'une page avec le paramètre d'URL `?s=` (partage de scénario).
 * - au montage : lit `?s` et charge l'état (`onCharger`) ;
 * - ensuite : reflète l'état encodé dans l'URL (sans rechargement) → l'adresse reste partageable.
 */
export function usePartageURL(encoded: string, onCharger: (s: string) => void) {
  const [pret, setPret] = useState(false);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("s");
    if (s) onCharger(s);
    setPret(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pret) return;
    const base = window.location.pathname;
    try {
      window.history.replaceState(null, "", encoded ? `${base}?s=${encoded}` : base);
    } catch {
      // Safari iOS plafonne replaceState (~100 appels / 30 s) et lève alors une SecurityError.
      // On l'ignore pour ne pas faire planter l'app ; l'URL se resynchronise au prochain changement.
    }
  }, [pret, encoded]);
}
