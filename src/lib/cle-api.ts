import { useEffect, useState } from "react";
import { MODELE_DEFAUT, modeleValide } from "./modeles-ia";

const CLE = "anthropic_api_key";
const CLE_MODELE = "anthropic_model";

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

/** Modèle Claude choisi par l'utilisateur (BYOK), stocké dans ce navigateur. Défaut : Sonnet 4.6. */
export function useModeleIA() {
  const [modele, setModele] = useState<string>(MODELE_DEFAUT);

  useEffect(() => {
    setModele(modeleValide(localStorage.getItem(CLE_MODELE)));
  }, []);

  const maj = (m: string) => {
    localStorage.setItem(CLE_MODELE, m);
    setModele(m);
  };

  return { modele, setModele: maj };
}
