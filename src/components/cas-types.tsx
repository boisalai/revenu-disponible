"use client";

import { useMemo } from "react";
import { MENAGES_TYPES } from "@/lib/menages-types";
import { versMenage, type MenageEtat } from "@/lib/menage-etat";
import { UI, type Lang } from "@/lib/i18n";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Sélecteur des 13 ménages types du guide (M1-M13) : charge l'état complet du
 * cas choisi dans le formulaire. Même source que les tableaux du guide
 * (src/lib/menages-types.ts) — l'app et le PDF ne peuvent pas diverger.
 *
 * Le sélecteur AFFICHE le cas choisi tant que le formulaire y correspond
 * encore (comparaison sur la projection moteur), et revient de lui-même au
 * libellé d'invite dès que l'utilisateur modifie une valeur : il ne prétend
 * jamais montrer « M6 » sur un ménage qui n'est plus M6.
 */
export function CasTypes({
  lang,
  etat,
  onCharger,
}: {
  lang: Lang;
  etat: MenageEtat;
  onCharger: (etat: MenageEtat) => void;
}) {
  // Code du cas type auquel le formulaire correspond exactement ("" sinon).
  const valeur = useMemo(() => {
    const projection = JSON.stringify(versMenage(etat));
    return MENAGES_TYPES.find((m) => JSON.stringify(versMenage(m.etat)) === projection)?.code ?? "";
  }, [etat]);

  return (
    <div className="space-y-1.5">
      <Label>{UI.casTypes[lang]}</Label>
      <Select
        value={valeur}
        onValueChange={(code) => {
          const cas = MENAGES_TYPES.find((m) => m.code === code);
          if (cas) onCharger(structuredClone(cas.etat));
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={UI.casTypesPlaceholder[lang]} />
        </SelectTrigger>
        <SelectContent>
          {MENAGES_TYPES.map((m) => (
            <SelectItem key={m.code} value={m.code}>
              <span className="font-medium">{m.code}</span> — {m.description[lang]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
