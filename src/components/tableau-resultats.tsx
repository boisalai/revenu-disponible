"use client";

import { Info } from "lucide-react";
import type { ResultatRevenuDisponible } from "@/index";
import { UI, type Bilingue, type Lang } from "@/lib/i18n";
import { POSTES_INFO } from "@/lib/postes-info";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePanneauInfo } from "@/components/panneau-info";

const dollars = (n: number, lang: Lang) =>
  n.toLocaleString(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

type Ligne = { cle?: string; label?: Bilingue; vG: number; vD: number };
type Section = { titre: Bilingue | null; lignes: Ligne[]; total?: Ligne };

/** Sections du tableau (montants signés : cotisations/impôts en négatif, transferts/revenu en positif). */
function construireSections(rG: ResultatRevenuDisponible, rD: ResultatRevenuDisponible): Section[] {
  const cles = <T extends object>(o: T) => Object.keys(o) as (keyof T & string)[];
  const lp = (cle: string, a: number, b: number): Ligne => ({ cle, vG: a, vD: b });
  const ll = (label: Bilingue, a: number, b: number): Ligne => ({ label, vG: a, vD: b });

  const sections: Section[] = [
    { titre: null, lignes: [ll(UI.revenu, rG.composantes.revenu, rD.composantes.revenu)] },
    {
      titre: UI.cotisations,
      lignes: cles(rG.detail.cotisations).map((k) => lp(k, -rG.detail.cotisations[k], -rD.detail.cotisations[k])),
      total: ll(UI.totalCotisations, -rG.composantes.cotisations, -rD.composantes.cotisations),
    },
    {
      titre: UI.transfertsQC,
      lignes: cles(rG.detail.transfertsQuebec).map((k) => lp(k, rG.detail.transfertsQuebec[k], rD.detail.transfertsQuebec[k])),
      total: ll(UI.totalTransfertsQC, rG.composantes.transfertsQuebec, rD.composantes.transfertsQuebec),
    },
    { titre: UI.impotQC, lignes: [lp("impotQuebec", -rG.detail.impotQuebec, -rD.detail.impotQuebec)] },
    {
      titre: UI.transfertsFederaux,
      lignes: cles(rG.detail.transfertsFederaux).map((k) => lp(k, rG.detail.transfertsFederaux[k], rD.detail.transfertsFederaux[k])),
      total: ll(UI.totalTransfertsFederaux, rG.composantes.transfertsFederaux, rD.composantes.transfertsFederaux),
    },
    { titre: UI.impotFederal, lignes: [lp("impotFederal", -rG.detail.impotFederal, -rD.detail.impotFederal)] },
  ];
  // Coût des frais de garde (réduit le RD) — affiché seulement s'il y en a.
  if (rG.detail.fraisGardeCout > 0 || rD.detail.fraisGardeCout > 0) {
    sections.push({ titre: null, lignes: [ll(UI.fraisGarde, -rG.detail.fraisGardeCout, -rD.detail.fraisGardeCout)] });
  }
  return sections;
}

function CelluleMontant({
  valeur,
  lang,
  fort = false,
  ecart = false,
}: {
  valeur: number;
  lang: Lang;
  fort?: boolean;
  ecart?: boolean;
}) {
  const nul = Math.round(valeur) === 0;
  // Colonnes normales : montants négatifs (cotisations, impôts, coût) en rouge.
  // Colonne écart : gain en vert, perte en rouge.
  const couleur = nul
    ? "text-muted-foreground"
    : ecart
      ? valeur > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400"
      : valeur < 0
        ? "text-red-600 dark:text-red-400"
        : "";
  return (
    <TableCell className={`text-right tabular-nums ${fort ? "font-semibold" : ""} ${couleur}`}>
      {nul ? "—" : `${ecart && valeur > 0 ? "+" : ""}${dollars(valeur, lang)}`}
    </TableCell>
  );
}

function BoutonInfo({ cle, lang }: { cle: string; lang: Lang }) {
  const { ouvrir } = usePanneauInfo();
  return (
    <button
      type="button"
      onClick={() => ouvrir(cle, lang)}
      className="text-muted-foreground/70 transition-colors hover:text-foreground"
      aria-label={UI.enSavoirPlus[lang]}
    >
      <Info className="size-3.5" />
    </button>
  );
}

function LibelleLigne({ ligne, lang }: { ligne: Ligne; lang: Lang }) {
  const texte = ligne.cle ? POSTES_INFO[ligne.cle]?.nom[lang] ?? ligne.cle : ligne.label![lang];
  return (
    <span className="inline-flex items-center gap-1.5">
      {texte}
      {ligne.cle && POSTES_INFO[ligne.cle] && <BoutonInfo cle={ligne.cle} lang={lang} />}
    </span>
  );
}

function SectionLignes({ section, lang }: { section: Section; lang: Lang }) {
  return (
    <>
      {section.titre && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={4} className="py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {section.titre[lang]}
          </TableCell>
        </TableRow>
      )}
      {section.lignes.map((l, i) => (
        <TableRow key={i}>
          <TableCell className="pl-6 text-sm">
            <LibelleLigne ligne={l} lang={lang} />
          </TableCell>
          <CelluleMontant valeur={l.vG} lang={lang} />
          <CelluleMontant valeur={l.vD} lang={lang} />
          <CelluleMontant valeur={l.vD - l.vG} lang={lang} ecart />
        </TableRow>
      ))}
      {section.total && (
        <TableRow className="border-b font-medium">
          <TableCell className="pl-6 text-sm">{section.total.label![lang]}</TableCell>
          <CelluleMontant valeur={section.total.vG} lang={lang} fort />
          <CelluleMontant valeur={section.total.vD} lang={lang} fort />
          <CelluleMontant valeur={section.total.vD - section.total.vG} lang={lang} fort ecart />
        </TableRow>
      )}
    </>
  );
}

/** Tableau comparatif générique : colonne gauche, colonne droite, écart (droite − gauche). */
export function TableauResultats({
  rGauche,
  rDroite,
  lang,
  enteteGauche,
  enteteDroite,
}: {
  rGauche: ResultatRevenuDisponible;
  rDroite: ResultatRevenuDisponible;
  lang: Lang;
  enteteGauche: string;
  enteteDroite: string;
}) {
  const sections = construireSections(rGauche, rDroite);
  const rdG = rGauche.revenuDisponible;
  const rdD = rDroite.revenuDisponible;

  return (
    <div>
      <div className="mb-6 grid grid-cols-3 gap-4 rounded-xl border bg-card p-5 text-center shadow-[0_1px_2px_rgb(15_23_42/0.04),0_3px_12px_-4px_rgb(15_23_42/0.08)]">
        {[
          { t: enteteGauche, v: rdG, ecart: false },
          { t: enteteDroite, v: rdD, ecart: false },
          { t: UI.ecart[lang], v: rdD - rdG, ecart: true },
        ].map((c) => (
          <div key={c.t}>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.t}</div>
            <div
              className={`mt-1 text-2xl font-semibold tabular-nums ${
                c.ecart ? (c.v > 0 ? "text-emerald-600 dark:text-emerald-400" : c.v < 0 ? "text-red-600 dark:text-red-400" : "") : "text-foreground"
              }`}
            >
              {c.ecart && c.v > 0 ? "+" : ""}
              {dollars(c.v, lang)}
            </div>
          </div>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{UI.poste[lang]}</TableHead>
            <TableHead className="text-right">{enteteGauche}</TableHead>
            <TableHead className="text-right">{enteteDroite}</TableHead>
            <TableHead className="text-right">{UI.ecart[lang]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((sec, i) => (
            <SectionLignes key={i} section={sec} lang={lang} />
          ))}
          <TableRow className="border-t-2 bg-muted/40 font-semibold">
            <TableCell>{UI.revenuDisponible[lang]}</TableCell>
            <CelluleMontant valeur={rdG} lang={lang} fort />
            <CelluleMontant valeur={rdD} lang={lang} fort />
            <CelluleMontant valeur={rdD - rdG} lang={lang} fort ecart />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
