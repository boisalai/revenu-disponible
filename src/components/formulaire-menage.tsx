"use client";

import { Situation, SITUATIONS, TypeGarde } from "@/index";
import { UI, type Lang } from "@/lib/i18n";
import {
  aDeuxAdultes,
  peutAvoirEnfants,
  ENFANT_DEFAUT,
  FRAIS_GARDE_MAX,
  type EnfantEtat,
  type MenageEtat,
} from "@/lib/menage-etat";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SITUATIONS_ORDRE: Situation[] = [
  Situation.PersonneSeule,
  Situation.FamilleMonoparentale,
  Situation.Couple,
  Situation.RetraiteSeul,
  Situation.CoupleRetraites,
];

function ChampMontant({
  id,
  label,
  valeur,
  onChange,
  max,
}: {
  id: string;
  label: string;
  valeur: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={valeur === 0 ? "" : valeur}
        placeholder="0"
        onChange={(e) => onChange(Math.min(max ?? Infinity, Number(e.target.value) || 0))}
      />
    </div>
  );
}

/** Formulaire d'un ménage (situation, âges, revenus, enfants). `prefixe` rend les ids uniques par scénario. */
export function FormulaireMenage({
  etat,
  onChange,
  lang,
  prefixe = "",
}: {
  etat: MenageEtat;
  onChange: (e: MenageEtat) => void;
  lang: Lang;
  prefixe?: string;
}) {
  const meta = SITUATIONS[etat.situation];
  const couple = aDeuxAdultes(etat.situation);
  const aEnfants = peutAvoirEnfants(etat.situation);
  const maj = (p: Partial<MenageEtat>) => onChange({ ...etat, ...p });
  const majEnfant = (i: number, patch: Partial<EnfantEtat>) =>
    maj({ enfants: etat.enfants.map((e, j) => (j === i ? { ...e, ...patch } : e)) });

  const changerSituation = (v: string) => {
    const s = Number(v) as Situation;
    const m = SITUATIONS[s];
    const age = m.retraite ? 70 : 40;
    const peut = s === Situation.FamilleMonoparentale || s === Situation.Couple;
    onChange({ ...etat, situation: s, age1: age, age2: age, enfants: peut ? etat.enfants : [] });
  };

  const changerNbEnfants = (n: number) =>
    maj({ enfants: Array.from({ length: Math.max(0, Math.min(5, n)) }, (_, i) => etat.enfants[i] ?? ENFANT_DEFAUT) });

  return (
    <div className="grid gap-5">
      <div className="grid gap-1.5">
        <Label>{UI.typeMenage[lang]}</Label>
        <Select value={String(etat.situation)} onValueChange={changerSituation}>
          <SelectTrigger className="w-full">
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
        <ChampMontant id={`${prefixe}rev1`} label={(meta.retraite ? UI.revenuRetraite : UI.revenuTravail)[lang]} valeur={etat.revenu1} onChange={(n) => maj({ revenu1: n })} />
        <ChampMontant id={`${prefixe}age1`} label={UI.age[lang]} valeur={etat.age1} onChange={(n) => maj({ age1: n })} />
      </div>

      {couple && (
        <div className="grid grid-cols-2 gap-3">
          <ChampMontant id={`${prefixe}rev2`} label={(meta.retraite ? UI.revenuRetraiteConjoint : UI.revenuTravailConjoint)[lang]} valeur={etat.revenu2} onChange={(n) => maj({ revenu2: n })} />
          <ChampMontant id={`${prefixe}age2`} label={UI.ageConjoint[lang]} valeur={etat.age2} onChange={(n) => maj({ age2: n })} />
        </div>
      )}

      {aEnfants && (
        <div className="grid gap-3">
          <ChampMontant id={`${prefixe}nbEnf`} label={UI.nbEnfants[lang]} valeur={etat.enfants.length} onChange={changerNbEnfants} />
          {etat.enfants.map((enf, i) => (
            <div key={i} className="grid gap-2 rounded-lg border bg-muted/30 p-2.5">
              <p className="text-xs font-medium text-muted-foreground">
                {UI.enfant[lang]} {i + 1}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <ChampMontant id={`${prefixe}enfAge${i}`} label={UI.age[lang]} valeur={enf.age} onChange={(a) => majEnfant(i, { age: a })} />
                <ChampMontant id={`${prefixe}enfFrais${i}`} label={UI.fraisGarde[lang]} valeur={enf.fraisGarde} max={FRAIS_GARDE_MAX} onChange={(f) => majEnfant(i, { fraisGarde: f })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${prefixe}enfType${i}`}>{UI.serviceGarde[lang]}</Label>
                <Select value={String(enf.typeGarde)} onValueChange={(v) => majEnfant(i, { typeGarde: Number(v) })}>
                  <SelectTrigger id={`${prefixe}enfType${i}`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(TypeGarde.Subventionne)}>{UI.subventionne[lang]}</SelectItem>
                    <SelectItem value={String(TypeGarde.NonSubventionne)}>{UI.nonSubventionne[lang]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
