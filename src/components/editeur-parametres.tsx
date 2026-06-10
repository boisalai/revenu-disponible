"use client";

import type { Parametres } from "@/index";
import type { Palier } from "@/index";
import { UI, type Lang } from "@/lib/i18n";
import { labelChamp, labelGroupe, ORDRE_GROUPES } from "@/lib/parametres-meta";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

// L'éditeur parcourt un bundle hétérogène (objets de nombres, ou tableaux de paliers). On accède
// aux groupes par clé dynamique : casts localisés et justifiés vers des formes génériques.
type GroupeObjet = Record<string, number>;

const nombre = (v: number) => Number.isFinite(v) ? v : 0;

/** Un champ numérique d'un paramètre (avec sa valeur officielle en repère). */
function ChampParam({
  label,
  valeur,
  officiel,
  onChange,
}: {
  label: string;
  valeur: number;
  officiel: number;
  onChange: (v: number) => void;
}) {
  const modifie = valeur !== officiel;
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className={`text-sm ${modifie ? "font-medium" : ""}`}>{label}</span>
      <div className="flex items-center gap-2">
        {modifie && <span className="text-xs text-muted-foreground line-through">{officiel.toLocaleString("fr-CA")}</span>}
        <Input
          type="number"
          value={valeur}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`h-8 w-28 text-right tabular-nums ${modifie ? "border-primary" : ""}`}
        />
      </div>
    </div>
  );
}

/** Éditeur des paliers d'imposition (plafond + taux par tranche ; dernier plafond = ∞). */
function PaliersEditeur({
  paliers,
  officiels,
  onChange,
  lang,
}: {
  paliers: Palier[];
  officiels: Palier[];
  onChange: (p: Palier[]) => void;
  lang: Lang;
}) {
  const set = (i: number, champ: "plafond" | "taux", v: number) => {
    const copie = paliers.map((p, j) => (j === i ? { ...p, [champ]: v } : p));
    onChange(copie);
  };
  return (
    <div className="grid gap-1.5">
      {paliers.map((p, i) => {
        const dernier = !Number.isFinite(p.plafond);
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-16 text-xs text-muted-foreground">{UI.tauxAxe[lang]}</span>
            <Input
              type="number"
              step="0.001"
              value={p.taux}
              onChange={(e) => set(i, "taux", Number(e.target.value))}
              className={`h-8 w-24 text-right tabular-nums ${p.taux !== officiels[i]?.taux ? "border-primary" : ""}`}
            />
            <span className="text-xs text-muted-foreground">≤</span>
            {dernier ? (
              <span className="w-28 text-center text-sm text-muted-foreground">∞</span>
            ) : (
              <Input
                type="number"
                value={p.plafond}
                onChange={(e) => set(i, "plafond", Number(e.target.value))}
                className={`h-8 w-28 text-right tabular-nums ${p.plafond !== officiels[i]?.plafond ? "border-primary" : ""}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EditeurParametres({
  bundle,
  officiel,
  onChange,
  lang,
}: {
  bundle: Parametres;
  officiel: Parametres;
  onChange: (b: Parametres) => void;
  lang: Lang;
}) {
  const bRec = bundle as unknown as Record<string, unknown>;
  const oRec = officiel as unknown as Record<string, unknown>;

  const estModifie = (cle: string) => JSON.stringify(bRec[cle]) !== JSON.stringify(oRec[cle]);

  const setObjet = (groupe: string, champ: string, v: number) =>
    onChange({ ...bundle, [groupe]: { ...(bRec[groupe] as GroupeObjet), [champ]: v } } as Parametres);

  const setPaliers = (groupe: string, p: Palier[]) => onChange({ ...bundle, [groupe]: p } as Parametres);

  return (
    <Accordion type="multiple" className="w-full">
      {ORDRE_GROUPES.filter((g) => g in bRec).map((groupe) => {
        const valeur = bRec[groupe];
        const ref = oRec[groupe];
        const modifie = estModifie(groupe);
        return (
          <AccordionItem value={groupe} key={groupe}>
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                {labelGroupe(groupe, lang)}
                {modifie && <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary-foreground">{UI.modifie[lang]}</span>}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {Array.isArray(valeur) ? (
                <PaliersEditeur paliers={valeur as Palier[]} officiels={ref as Palier[]} onChange={(p) => setPaliers(groupe, p)} lang={lang} />
              ) : (
                <div className="grid gap-0.5">
                  {Object.entries(valeur as GroupeObjet)
                    .filter(([, v]) => typeof v === "number")
                    .map(([champ, v]) => (
                      <ChampParam
                        key={champ}
                        label={labelChamp(groupe, champ, lang)}
                        valeur={nombre(v)}
                        officiel={nombre((ref as GroupeObjet)[champ])}
                        onChange={(nv) => setObjet(groupe, champ, nv)}
                      />
                    ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
