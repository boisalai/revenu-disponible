import { useEffect, useState } from "react";

const CLE = "anthropic_api_key";

/** Clé API Anthropic fournie par l'utilisateur (BYOK), stockée uniquement dans ce navigateur.
 *  `pret` indique que le localStorage a été lu (évite un flash du formulaire au montage). */
export function useCleApi() {
  const [cle, setCle] = useState<string | null>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    setCle(localStorage.getItem(CLE));
    setPret(true);
  }, []);

  const maj = (valeur: string | null) => {
    if (valeur) localStorage.setItem(CLE, valeur);
    else localStorage.removeItem(CLE);
    setCle(valeur);
  };

  return { cle, setCle: maj, pret };
}
