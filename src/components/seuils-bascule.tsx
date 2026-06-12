"use client";

import { useMemo } from "react";
import type { Menage } from "@/index";
import { positionNette, seuilsMenage, type PositionNette } from "@/lib/seuils";
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
 * une ligne de revenu divisée en deux zones (bénéficiaire net | contributeur net).
 */
export function SeuilsBascule({ menage, revenuActuel, lang }: { menage: Menage; revenuActuel: number; lang: Lang }) {
  const pos25 = useMemo(() => positionNette(menage, 2025), [menage]);
  const pos26 = useMemo(() => positionNette(menage, 2026), [menage]);
  const s25 = useMemo(() => seuilsMenage(menage, 2025), [menage]);
  const s26 = useMemo(() => seuilsMenage(menage, 2026), [menage]);

  const fmt = (v: number) => `${Math.round(v).toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")} $`;

  // Échelle de la ligne de revenu : couvre le revenu actuel et les seuils atteints, avec une marge.
  const max = useMemo(() => {
    const valeurs = [100_000, revenuActuel, ...MARQUEURS.map((m) => s25[m.cle] ?? 0)];
    return Math.ceil((Math.max(...valeurs) * 1.08) / 20_000) * 20_000;
  }, [revenuActuel, s25]);
  const pct = (v: number) => Math.min(100, (v / max) * 100);

  // Lignes du tableau, triées par seuil croissant (même ordre que les pastilles sur la ligne).
  const lignes = useMemo(
    () => [...MARQUEURS].sort((a, b) => (s25[a.cle] ?? Infinity) - (s25[b.cle] ?? Infinity)),
    [s25],
  );

  // Position nette : phrase dont la soustraction se lit dans le bon ordre selon le statut.
  const phrase = (pos: PositionNette) => {
    const benef = pos.nette >= 0;
    return {
      statut: (benef ? UI.beneficiaireNet : UI.contributeurNetTitre)[lang],
      verbe: (benef ? UI.posRecoit : UI.posPaie)[lang],
      dePlus: (benef ? UI.posDePlusTransferts : UI.posDePlusImpots)[lang],
      detail: benef
        ? `${fmt(pos.transferts)} ${UI.posTransferts[lang]} ${UI.posContre[lang]} ${fmt(pos.impots)} ${UI.posImpots[lang]}`
        : `${fmt(pos.impots)} ${UI.posImpots[lang]} ${UI.posContre[lang]} ${fmt(pos.transferts)} ${UI.posTransferts[lang]}`,
      montant: fmt(Math.abs(pos.nette)),
    };
  };
  const p25 = phrase(pos25);
  const p26 = phrase(pos26);

  const bascule = s25.contributeurNet;

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* Position nette au revenu actuel */}
      <p className="max-w-3xl text-sm">
        <span className="font-semibold">
          {p25.statut} {UI.enAnnee[lang]} 2025
        </span>{" "}
        — {p25.verbe} <span className="font-semibold">{p25.montant}</span> {p25.dePlus} ({p25.detail}).{" "}
        <span className="text-muted-foreground">
          {lang === "en" ? "In" : "En"} 2026 : {p26.statut.toLowerCase()} {UI.posDe[lang]} {p26.montant}.
        </span>
      </p>

      {/* Ligne de revenu : deux zones (bénéficiaire | contributeur), seuils 2025, revenu actuel */}
      <div className="px-1 pb-8 pt-5">
        <div className="relative h-1.5 rounded-full bg-muted">
          {/* Zone « bénéficiaire net » (sous la bascule) */}
          {bascule !== null && (
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--chart-2)] opacity-30"
              style={{ width: `${pct(bascule)}%` }}
            />
          )}
          {MARQUEURS.map(({ cle, couleur }) => {
            const v = s25[cle];
            return v === null ? null : (
              <span
                key={cle}
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
                style={{ left: `${pct(v)}%`, backgroundColor: couleur }}
              />
            );
          })}
          {revenuActuel >= 0 && (
            <span
              className="absolute top-1/2 h-4 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
              style={{ left: `${pct(revenuActuel)}%` }}
            />
          )}
          <span
            className="absolute -top-5 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground"
            style={{ left: `${pct(revenuActuel)}%` }}
          >
            {UI.revenuActuel[lang]}
          </span>
          {/* Étiquettes des zones, puis bornes de l'échelle */}
          {bascule !== null && pct(bascule) > 18 && (
            <span
              className="absolute -bottom-5 -translate-x-1/2 whitespace-nowrap text-xs text-[var(--chart-2)]"
              style={{ left: `${pct(bascule) / 2}%` }}
            >
              ← {UI.segBeneficiaire[lang]}
            </span>
          )}
          {bascule !== null && pct(bascule) < 82 && (
            <span
              className="absolute -bottom-5 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground"
              style={{ left: `${(pct(bascule) + 100) / 2}%` }}
            >
              {UI.segContributeur[lang]} →
            </span>
          )}
          <span className="absolute -bottom-5 left-0 text-xs tabular-nums text-muted-foreground">0 $</span>
          <span className="absolute -bottom-5 right-0 text-xs tabular-nums text-muted-foreground">
            {Math.round(max / 1000)} k$
          </span>
        </div>
      </div>

      {/* Seuils exacts : des REVENUS de bascule, pas des montants à payer */}
      <div className="overflow-hidden rounded-lg border text-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30 text-muted-foreground">
              <td className="px-3 py-1.5">{UI.seuilRevenu[lang]}</td>
              <td className="px-3 py-1.5 text-right">2025</td>
              <td className="px-3 py-1.5 text-right">2026</td>
            </tr>
          </thead>
          <tbody>
            {lignes.map(({ cle, libelle, couleur }) => (
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
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                  {s26[cle] === null ? UI.nonAtteint[lang] : fmt(s26[cle])}
                </td>
              </tr>
            ))}
            <tr className="text-xs text-muted-foreground">
              <td className="px-3 py-1.5" colSpan={3}>
                {UI.parGouvCourt[lang]}{" "}
                {s25.contributeurNetQuebec === null ? UI.nonAtteint[lang] : fmt(s25.contributeurNetQuebec)} ;{" "}
                {UI.fedSeulA[lang]}{" "}
                {s25.contributeurNetFederal === null ? UI.nonAtteint[lang] : fmt(s25.contributeurNetFederal)} (2025)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="max-w-3xl text-xs text-muted-foreground">{UI.seuilsNote[lang]}</p>
    </div>
  );
}
