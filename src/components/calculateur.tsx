"use client";

import { useMemo, useState } from "react";
import {
  calculerRevenuDisponible,
  Situation,
  SITUATIONS,
  type Menage,
  type ResultatRevenuDisponible,
} from "@/index";
import { LABELS_COTISATIONS, LABELS_TRANSFERTS_FED, LABELS_TRANSFERTS_QC } from "@/lib/postes-labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SITUATIONS_ORDRE: Situation[] = [
  Situation.PersonneSeule,
  Situation.FamilleMonoparentale,
  Situation.Couple,
  Situation.RetraiteSeul,
  Situation.CoupleRetraites,
];

const dollars = (n: number) =>
  n.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

/** Une ligne du tableau de résultats. */
type Ligne = { label: string; v2025: number; v2026: number };
type Section = { titre: string | null; lignes: Ligne[]; total?: Ligne };

/** Construit les sections du tableau à partir des deux résultats annuels (montants signés à l'affichage :
 *  cotisations et impôts en négatif, transferts et revenu en positif). */
function construireSections(r25: ResultatRevenuDisponible, r26: ResultatRevenuDisponible): Section[] {
  const cles = <T extends object>(o: T) => Object.keys(o) as (keyof T)[];
  const ligne = (label: string, a: number, b: number): Ligne => ({ label, v2025: a, v2026: b });

  return [
    {
      titre: null,
      lignes: [ligne("Revenu de travail et de retraite", r25.composantes.revenu, r26.composantes.revenu)],
    },
    {
      titre: "Cotisations",
      lignes: cles(r25.detail.cotisations).map((k) =>
        ligne(LABELS_COTISATIONS[k], -r25.detail.cotisations[k], -r26.detail.cotisations[k]),
      ),
      total: ligne("Total des cotisations", -r25.composantes.cotisations, -r26.composantes.cotisations),
    },
    {
      titre: "Transferts — Québec",
      lignes: cles(r25.detail.transfertsQuebec).map((k) =>
        ligne(LABELS_TRANSFERTS_QC[k], r25.detail.transfertsQuebec[k], r26.detail.transfertsQuebec[k]),
      ),
      total: ligne("Total des transferts du Québec", r25.composantes.transfertsQuebec, r26.composantes.transfertsQuebec),
    },
    {
      titre: "Impôt du Québec",
      lignes: [ligne("Impôt du Québec", -r25.detail.impotQuebec, -r26.detail.impotQuebec)],
    },
    {
      titre: "Transferts — fédéral",
      lignes: cles(r25.detail.transfertsFederaux).map((k) =>
        ligne(LABELS_TRANSFERTS_FED[k], r25.detail.transfertsFederaux[k], r26.detail.transfertsFederaux[k]),
      ),
      total: ligne("Total des transferts fédéraux", r25.composantes.transfertsFederaux, r26.composantes.transfertsFederaux),
    },
    {
      titre: "Impôt fédéral",
      lignes: [ligne("Impôt fédéral", -r25.detail.impotFederal, -r26.detail.impotFederal)],
    },
  ];
}

function CelluleMontant({ valeur, fort = false }: { valeur: number; fort?: boolean }) {
  const nul = Math.round(valeur) === 0;
  return (
    <TableCell
      className={`text-right tabular-nums ${fort ? "font-semibold" : ""} ${
        nul ? "text-muted-foreground" : valeur < 0 ? "text-red-600 dark:text-red-400" : ""
      }`}
    >
      {nul ? "—" : dollars(valeur)}
    </TableCell>
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

  const changerNbEnfants = (n: number) => {
    setAgesEnfants((prev) => Array.from({ length: Math.max(0, Math.min(5, n)) }, (_, i) => prev[i] ?? 5));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Entrées */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Situation du ménage</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-1.5">
            <Label>Type de ménage</Label>
            <Select value={String(situation)} onValueChange={changerSituation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SITUATIONS_ORDRE.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {SITUATIONS[s].libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ChampMontant id="rev1" label={meta.retraite ? "Revenu de retraite" : "Revenu de travail"} valeur={revenu1} onChange={setRevenu1} />
            <ChampMontant id="age1" label="Âge" valeur={age1} onChange={setAge1} />
          </div>

          {couple && (
            <div className="grid grid-cols-2 gap-3">
              <ChampMontant id="rev2" label={meta.retraite ? "Revenu de retraite (conjoint)" : "Revenu de travail (conjoint)"} valeur={revenu2} onChange={setRevenu2} />
              <ChampMontant id="age2" label="Âge (conjoint)" valeur={age2} onChange={setAge2} />
            </div>
          )}

          {peutEnfants && (
            <div className="grid gap-3">
              <ChampMontant id="nbEnf" label="Nombre d'enfants" valeur={agesEnfants.length} onChange={changerNbEnfants} />
              {agesEnfants.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {agesEnfants.map((age, i) => (
                    <ChampMontant
                      key={i}
                      id={`enf${i}`}
                      label={`Âge enf. ${i + 1}`}
                      valeur={age}
                      onChange={(n) => setAgesEnfants((prev) => prev.map((a, j) => (j === i ? n : a)))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Outil pédagogique — valeurs indicatives reproduisant le modèle du ministère des Finances du Québec. Ne
            constitue pas un avis fiscal.
          </p>
        </CardContent>
      </Card>

      {/* Résultats */}
      <Card>
        <CardHeader>
          <CardTitle>Revenu disponible</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg border bg-muted/30 p-4 text-center">
            {[
              { an: "2025", v: r25.revenuDisponible },
              { an: "2026", v: r26.revenuDisponible },
              { an: "Écart", v: r26.revenuDisponible - r25.revenuDisponible, ecart: true },
            ].map((c) => (
              <div key={c.an}>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.an}</div>
                <div className={`mt-1 text-2xl font-semibold tabular-nums ${c.ecart && c.v < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                  {c.ecart && c.v > 0 ? "+" : ""}
                  {dollars(c.v)}
                </div>
              </div>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Poste</TableHead>
                <TableHead className="text-right">2025</TableHead>
                <TableHead className="text-right">2026</TableHead>
                <TableHead className="text-right">Écart</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((sec) => (
                <SectionLignes key={sec.titre ?? "revenu"} section={sec} />
              ))}
              <TableRow className="border-t-2 bg-muted/40 font-semibold">
                <TableCell>Revenu disponible</TableCell>
                <CelluleMontant valeur={r25.revenuDisponible} fort />
                <CelluleMontant valeur={r26.revenuDisponible} fort />
                <CelluleMontant valeur={r26.revenuDisponible - r25.revenuDisponible} fort />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionLignes({ section }: { section: Section }) {
  return (
    <>
      {section.titre && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={4} className="py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {section.titre}
          </TableCell>
        </TableRow>
      )}
      {section.lignes.map((l) => (
        <TableRow key={l.label}>
          <TableCell className="pl-6 text-sm">{l.label}</TableCell>
          <CelluleMontant valeur={l.v2025} />
          <CelluleMontant valeur={l.v2026} />
          <CelluleMontant valeur={l.v2026 - l.v2025} />
        </TableRow>
      ))}
      {section.total && (
        <TableRow className="border-b font-medium">
          <TableCell className="pl-6 text-sm">{section.total.label}</TableCell>
          <CelluleMontant valeur={section.total.v2025} fort />
          <CelluleMontant valeur={section.total.v2026} fort />
          <CelluleMontant valeur={section.total.v2026 - section.total.v2025} fort />
        </TableRow>
      )}
    </>
  );
}
