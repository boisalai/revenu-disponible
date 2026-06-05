"use client";

import { Info } from "lucide-react";
import type { ResultatRevenuDisponible } from "@/index";
import { UI, type Bilingue, type Lang } from "@/lib/i18n";
import { POSTES_INFO } from "@/lib/postes-info";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

function CelluleMontant({ valeur, lang, fort = false }: { valeur: number; lang: Lang; fort?: boolean }) {
  const nul = Math.round(valeur) === 0;
  return (
    <TableCell
      className={`text-right tabular-nums ${fort ? "font-semibold" : ""} ${
        nul ? "text-muted-foreground" : valeur < 0 ? "text-red-600 dark:text-red-400" : ""
      }`}
    >
      {nul ? "—" : dollars(valeur, lang)}
    </TableCell>
  );
}

function PosteDialog({ cle, lang }: { cle: string; lang: Lang }) {
  const info = POSTES_INFO[cle];
  if (!info) return null;
  const champ = (titre: string, texte: string) => (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titre}</div>
      <p className="mt-0.5">{texte}</p>
    </div>
  );
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="text-muted-foreground/70 transition-colors hover:text-foreground" aria-label={UI.enSavoirPlus[lang]}>
          <Info className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{info.nom[lang]}</DialogTitle>
          <DialogDescription>{info.description[lang]}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {champ(UI.objectif[lang], info.objectif[lang])}
          {champ(UI.regleCalcul[lang], info.regle[lang])}
          {champ(UI.references[lang], info.references[lang])}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LibelleLigne({ ligne, lang }: { ligne: Ligne; lang: Lang }) {
  const texte = ligne.cle ? POSTES_INFO[ligne.cle]?.nom[lang] ?? ligne.cle : ligne.label![lang];
  return (
    <span className="inline-flex items-center gap-1.5">
      {texte}
      {ligne.cle && POSTES_INFO[ligne.cle] && <PosteDialog cle={ligne.cle} lang={lang} />}
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
          <CelluleMontant valeur={l.vD - l.vG} lang={lang} />
        </TableRow>
      ))}
      {section.total && (
        <TableRow className="border-b font-medium">
          <TableCell className="pl-6 text-sm">{section.total.label![lang]}</TableCell>
          <CelluleMontant valeur={section.total.vG} lang={lang} fort />
          <CelluleMontant valeur={section.total.vD} lang={lang} fort />
          <CelluleMontant valeur={section.total.vD - section.total.vG} lang={lang} fort />
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
      <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg border bg-muted/30 p-4 text-center">
        {[
          { t: enteteGauche, v: rdG, ecart: false },
          { t: enteteDroite, v: rdD, ecart: false },
          { t: UI.ecart[lang], v: rdD - rdG, ecart: true },
        ].map((c) => (
          <div key={c.t}>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.t}</div>
            <div className={`mt-1 text-2xl font-semibold tabular-nums ${c.ecart && c.v < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
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
            <CelluleMontant valeur={rdD - rdG} lang={lang} fort />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
