"use client";

import { MENAGES_TYPES } from "@/lib/menages-types";
import type { MenageEtat } from "@/lib/menage-etat";
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
 * La valeur reste vide (placeholder) : le sélecteur agit comme une commande.
 */
export function CasTypes({ lang, onCharger }: { lang: Lang; onCharger: (etat: MenageEtat) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{UI.casTypes[lang]}</Label>
      <Select
        value=""
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
