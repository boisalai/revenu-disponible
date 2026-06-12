"use client";

import { useMemo } from "react";
import type { Menage } from "@/index";
import { positionNette, seuilsMenage } from "@/lib/seuils";
import { UI, type Lang } from "@/lib/i18n";

// Couleurs alignées sur les catégories du graphique TEMI (impôt QC = chart-3, fédéral = chart-5).
const MARQUEURS = [
  { cle: "impotFederal", libelle: "premierImpotFed", couleur: "var(--chart-5)" },
  { cle: "impotQuebec", libelle: "premierImpotQC", couleur: "var(--chart-3)" },
  { cle: "contributeurNet", libelle: "basculeContributeur", couleur: "var(--primary)" },
] as const;

/**
 * Position nette du ménage (transferts reçus − impôts payés) et seuils de bascule :
 * premier dollar d'impôt (QC, fédéral) et passage à « contributeur net », situés sur
 * une ligne de revenu avec le revenu actuel du ménage.
 */
export function SeuilsBascule({ menage, revenuActuel, lang }: { menage: Menage; revenuActuel: number; lang: Lang }) {
  const pos25 = useMemo(() => positionNette(menage, 2025), [menage]);
  const pos26 = useMemo(() => positionNette(menage, 2026), [menage]);
  const s25 = useMemo(() => seuilsMenage(menage, 2025), [menage]);
  const s26 = useMemo(() => seuilsMenage(menage, 2026), [menage]);

  const fmt = (v: number) => `${Math.round(v).toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")} $`;
  const benef25 = pos25.nette >= 0;
  const benef26 = pos26.nette >= 0;

  // Échelle de la ligne de revenu : couvre le revenu actuel et les seuils atteints, avec une marge.
  const max = useMemo(() => {
    const valeurs = [100_000, revenuActuel, ...MARQUEURS.map((m) => s25[m.cle] ?? 0)];
    return Math.ceil((Math.max(...valeurs) * 1.08) / 20_000) * 20_000;
  }, [revenuActuel, s25]);
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* Position nette au revenu actuel */}
      <p className="text-sm">
        <span className="font-semibold">
          {(benef25 ? UI.beneficiaireNet : UI.contributeurNetTitre)[lang]} 2025 : {fmt(Math.abs(pos25.nette))}
        </span>{" "}
        <span className="text-muted-foreground">
          ({fmt(pos25.transferts)} {UI.transfertsRecus[lang]} − {fmt(pos25.impots)} {UI.impotsPayes[lang]}) ·{" "}
          {(benef26 ? UI.beneficiaireNet : UI.contributeurNetTitre)[lang].toLowerCase()} 2026 :{" "}
          {fmt(Math.abs(pos26.nette))}
        </span>
      </p>

      {/* Ligne de revenu : seuils 2025 + revenu actuel */}
      <div className="px-1 pb-5 pt-3">
        <div className="relative h-1.5 rounded-full bg-muted">
          {MARQUEURS.map(({ cle, couleur }) => {
            const v = s25[cle];
            return v === null ? null : (
              <span
                key={cle}
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
                style={{ left: pct(v), backgroundColor: couleur }}
              />
            );
          })}
          {revenuActuel >= 0 && (
            <span
              className="absolute top-1/2 h-4 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
              style={{ left: pct(revenuActuel) }}
              title={UI.revenuActuel[lang]}
            />
          )}
          <span className="absolute -bottom-5 left-0 text-xs tabular-nums text-muted-foreground">0 $</span>
          <span className="absolute -bottom-5 right-0 text-xs tabular-nums text-muted-foreground">
            {Math.round(max / 1000)} k$
          </span>
          <span
            className="absolute -top-5 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground"
            style={{ left: pct(revenuActuel) }}
          >
            {UI.revenuActuel[lang]}
          </span>
        </div>
      </div>

      {/* Valeurs exactes des seuils (2025, puis 2026 en retrait) */}
      <div className="overflow-hidden rounded-lg border text-sm">
        <table className="w-full">
          <tbody>
            {MARQUEURS.map(({ cle, libelle, couleur }) => (
              <tr key={cle} className="border-b last:border-b-0">
                <td className="px-3 py-1.5">
                  <span
                    className="mr-2 inline-block size-2.5 rounded-full align-middle"
                    style={{ backgroundColor: couleur }}
                  />
                  {UI[libelle][lang]}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {s25[cle] === null ? UI.nonAtteint[lang] : fmt(s25[cle])}
                  <span className="ml-2 text-muted-foreground">
                    (2026 : {s26[cle] === null ? UI.nonAtteint[lang] : fmt(s26[cle])})
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {UI.parGouvPrefixe[lang]} {UI.parGouvQC[lang]}{" "}
        {s25.contributeurNetQuebec === null ? UI.nonAtteint[lang] : fmt(s25.contributeurNetQuebec)} ;{" "}
        {UI.parGouvFed[lang]}{" "}
        {s25.contributeurNetFederal === null ? UI.nonAtteint[lang] : fmt(s25.contributeurNetFederal)} (2025).{" "}
        {UI.seuilsNote[lang]}
      </p>
    </div>
  );
}
