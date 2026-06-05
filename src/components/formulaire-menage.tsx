"use client";

import { Situation, SITUATIONS } from "@/index";
import { UI, type Lang } from "@/lib/i18n";
import { aDeuxAdultes, peutAvoirEnfants, type MenageEtat } from "@/lib/menage-etat";
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
  const enfants = peutAvoirEnfants(etat.situation);
  const maj = (p: Partial<MenageEtat>) => onChange({ ...etat, ...p });

  const changerSituation = (v: string) => {
    const s = Number(v) as Situation;
    const m = SITUATIONS[s];
    const age = m.retraite ? 70 : 40;
    const peut = s === Situation.FamilleMonoparentale || s === Situation.Couple;
    onChange({ ...etat, situation: s, age1: age, age2: age, agesEnfants: peut ? etat.agesEnfants : [] });
  };

  const changerNbEnfants = (n: number) =>
    maj({ agesEnfants: Array.from({ length: Math.max(0, Math.min(5, n)) }, (_, i) => etat.agesEnfants[i] ?? 5) });

  return (
    <div className="grid gap-5">
      <div className="grid gap-1.5">
        <Label>{UI.typeMenage[lang]}</Label>
        <Select value={String(etat.situation)} onValueChange={changerSituation}>
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
        <ChampMontant id={`${prefixe}rev1`} label={(meta.retraite ? UI.revenuRetraite : UI.revenuTravail)[lang]} valeur={etat.revenu1} onChange={(n) => maj({ revenu1: n })} />
        <ChampMontant id={`${prefixe}age1`} label={UI.age[lang]} valeur={etat.age1} onChange={(n) => maj({ age1: n })} />
      </div>

      {couple && (
        <div className="grid grid-cols-2 gap-3">
          <ChampMontant id={`${prefixe}rev2`} label={(meta.retraite ? UI.revenuRetraiteConjoint : UI.revenuTravailConjoint)[lang]} valeur={etat.revenu2} onChange={(n) => maj({ revenu2: n })} />
          <ChampMontant id={`${prefixe}age2`} label={UI.ageConjoint[lang]} valeur={etat.age2} onChange={(n) => maj({ age2: n })} />
        </div>
      )}

      {enfants && (
        <div className="grid gap-3">
          <ChampMontant id={`${prefixe}nbEnf`} label={UI.nbEnfants[lang]} valeur={etat.agesEnfants.length} onChange={changerNbEnfants} />
          {etat.agesEnfants.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {etat.agesEnfants.map((age, i) => (
                <ChampMontant
                  key={i}
                  id={`${prefixe}enf${i}`}
                  label={`${UI.ageEnfant[lang]} ${i + 1}`}
                  valeur={age}
                  onChange={(n) => maj({ agesEnfants: etat.agesEnfants.map((a, j) => (j === i ? n : a)) })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
