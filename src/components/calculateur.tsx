"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import {
  calculerRevenuDisponible,
  Situation,
  SITUATIONS,
  type Menage,
  type ResultatRevenuDisponible,
} from "@/index";
import { UI, type Bilingue, type Lang } from "@/lib/i18n";
import { POSTES_INFO } from "@/lib/postes-info";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const SITUATIONS_ORDRE: Situation[] = [
  Situation.PersonneSeule,
  Situation.FamilleMonoparentale,
  Situation.Couple,
  Situation.RetraiteSeul,
  Situation.CoupleRetraites,
];

const dollars = (n: number, lang: Lang) =>
  n.toLocaleString(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

type Ligne = { cle?: string; label?: Bilingue; v2025: number; v2026: number };
type Section = { titre: Bilingue | null; lignes: Ligne[]; total?: Ligne };

/** Sections du tableau (montants signés : cotisations/impôts en négatif, transferts/revenu en positif). */
function construireSections(r25: ResultatRevenuDisponible, r26: ResultatRevenuDisponible): Section[] {
  const cles = <T extends object>(o: T) => Object.keys(o) as (keyof T & string)[];
  const lp = (cle: string, a: number, b: number): Ligne => ({ cle, v2025: a, v2026: b });
  const ll = (label: Bilingue, a: number, b: number): Ligne => ({ label, v2025: a, v2026: b });

  return [
    { titre: null, lignes: [ll(UI.revenu, r25.composantes.revenu, r26.composantes.revenu)] },
    {
      titre: UI.cotisations,
      lignes: cles(r25.detail.cotisations).map((k) => lp(k, -r25.detail.cotisations[k], -r26.detail.cotisations[k])),
      total: ll(UI.totalCotisations, -r25.composantes.cotisations, -r26.composantes.cotisations),
    },
    {
      titre: UI.transfertsQC,
      lignes: cles(r25.detail.transfertsQuebec).map((k) => lp(k, r25.detail.transfertsQuebec[k], r26.detail.transfertsQuebec[k])),
      total: ll(UI.totalTransfertsQC, r25.composantes.transfertsQuebec, r26.composantes.transfertsQuebec),
    },
    { titre: UI.impotQC, lignes: [lp("impotQuebec", -r25.detail.impotQuebec, -r26.detail.impotQuebec)] },
    {
      titre: UI.transfertsFederaux,
      lignes: cles(r25.detail.transfertsFederaux).map((k) => lp(k, r25.detail.transfertsFederaux[k], r26.detail.transfertsFederaux[k])),
      total: ll(UI.totalTransfertsFederaux, r25.composantes.transfertsFederaux, r26.composantes.transfertsFederaux),
    },
    { titre: UI.impotFederal, lignes: [lp("impotFederal", -r25.detail.impotFederal, -r26.detail.impotFederal)] },
  ];
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

/** Panneau pédagogique (Dialog) déclenché par l'icône d'information à côté du poste. */
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
        <button
          type="button"
          className="text-muted-foreground/70 transition-colors hover:text-foreground"
          aria-label={UI.enSavoirPlus[lang]}
        >
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

function ChampMontant({ id, label, valeur, onChange }: { id: string; label: string; valeur: number; onChange: (n: number) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={valeur === 0 ? "" : valeur}
        placeholder="0"
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

export function Calculateur() {
  const [lang, setLang] = useState<Lang>("fr");
  const [situation, setSituation] = useState<Situation>(Situation.PersonneSeule);
  const [revenu1, setRevenu1] = useState(50_000);
  const [age1, setAge1] = useState(40);
  const [revenu2, setRevenu2] = useState(0);
  const [age2, setAge2] = useState(40);
  const [agesEnfants, setAgesEnfants] = useState<number[]>([]);

  const meta = SITUATIONS[situation];
  const couple = meta.nbAdultes === 2;
  const peutEnfants = situation === Situation.FamilleMonoparentale || situation === Situation.Couple;

  const menage: Menage = useMemo(
    () => ({
      situation,
      revenu1,
      ageAdulte1: age1,
      revenu2: couple ? revenu2 : 0,
      ageAdulte2: couple ? age2 : 0,
      enfants: peutEnfants ? agesEnfants.map((age) => ({ age, fraisGarde: 0, typeGarde: 0 })) : [],
    }),
    [situation, revenu1, age1, revenu2, age2, agesEnfants, couple, peutEnfants],
  );

  const r25 = useMemo(() => calculerRevenuDisponible(menage, 2025), [menage]);
  const r26 = useMemo(() => calculerRevenuDisponible(menage, 2026), [menage]);
  const sections = useMemo(() => construireSections(r25, r26), [r25, r26]);

  const changerSituation = (v: string) => {
    const s = Number(v) as Situation;
    const m = SITUATIONS[s];
    setSituation(s);
    setAge1(m.retraite ? 70 : 40);
    setAge2(m.retraite ? 70 : 40);
    if (!(s === Situation.FamilleMonoparentale || s === Situation.Couple)) setAgesEnfants([]);
  };

  const changerNbEnfants = (n: number) =>
    setAgesEnfants((prev) => Array.from({ length: Math.max(0, Math.min(5, n)) }, (_, i) => prev[i] ?? 5));

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{UI.titre[lang]}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{UI.sousTitre[lang]}</p>
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-md border text-sm">
          {(["fr", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 font-medium uppercase transition-colors ${
                lang === l ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Entrées */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{UI.situationMenage[lang]}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-1.5">
              <Label>{UI.typeMenage[lang]}</Label>
              <Select value={String(situation)} onValueChange={changerSituation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SITUATIONS_ORDRE.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {UI.situations[s][lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ChampMontant id="rev1" label={(meta.retraite ? UI.revenuRetraite : UI.revenuTravail)[lang]} valeur={revenu1} onChange={setRevenu1} />
              <ChampMontant id="age1" label={UI.age[lang]} valeur={age1} onChange={setAge1} />
            </div>

            {couple && (
              <div className="grid grid-cols-2 gap-3">
                <ChampMontant id="rev2" label={(meta.retraite ? UI.revenuRetraiteConjoint : UI.revenuTravailConjoint)[lang]} valeur={revenu2} onChange={setRevenu2} />
                <ChampMontant id="age2" label={UI.ageConjoint[lang]} valeur={age2} onChange={setAge2} />
              </div>
            )}

            {peutEnfants && (
              <div className="grid gap-3">
                <ChampMontant id="nbEnf" label={UI.nbEnfants[lang]} valeur={agesEnfants.length} onChange={changerNbEnfants} />
                {agesEnfants.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {agesEnfants.map((age, i) => (
                      <ChampMontant
                        key={i}
                        id={`enf${i}`}
                        label={`${UI.ageEnfant[lang]} ${i + 1}`}
                        valeur={age}
                        onChange={(n) => setAgesEnfants((prev) => prev.map((a, j) => (j === i ? n : a)))}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{UI.disclaimer[lang]}</p>
          </CardContent>
        </Card>

        {/* Résultats */}
        <Card>
          <CardHeader>
            <CardTitle>{UI.revenuDisponible[lang]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg border bg-muted/30 p-4 text-center">
              {[
                { an: "2025", v: r25.revenuDisponible, ecart: false },
                { an: "2026", v: r26.revenuDisponible, ecart: false },
                { an: UI.ecart[lang], v: r26.revenuDisponible - r25.revenuDisponible, ecart: true },
              ].map((c) => (
                <div key={c.an}>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.an}</div>
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
                  <TableHead className="text-right">2025</TableHead>
                  <TableHead className="text-right">2026</TableHead>
                  <TableHead className="text-right">{UI.ecart[lang]}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((sec, i) => (
                  <SectionLignes key={i} section={sec} lang={lang} />
                ))}
                <TableRow className="border-t-2 bg-muted/40 font-semibold">
                  <TableCell>{UI.revenuDisponible[lang]}</TableCell>
                  <CelluleMontant valeur={r25.revenuDisponible} lang={lang} fort />
                  <CelluleMontant valeur={r26.revenuDisponible} lang={lang} fort />
                  <CelluleMontant valeur={r26.revenuDisponible - r25.revenuDisponible} lang={lang} fort />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
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
          <CelluleMontant valeur={l.v2025} lang={lang} />
          <CelluleMontant valeur={l.v2026} lang={lang} />
          <CelluleMontant valeur={l.v2026 - l.v2025} lang={lang} />
        </TableRow>
      ))}
      {section.total && (
        <TableRow className="border-b font-medium">
          <TableCell className="pl-6 text-sm">{section.total.label![lang]}</TableCell>
          <CelluleMontant valeur={section.total.v2025} lang={lang} fort />
          <CelluleMontant valeur={section.total.v2026} lang={lang} fort />
          <CelluleMontant valeur={section.total.v2026 - section.total.v2025} lang={lang} fort />
        </TableRow>
      )}
    </>
  );
}
