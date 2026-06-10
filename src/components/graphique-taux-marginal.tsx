"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Line, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";
import type { Annee, Menage } from "@/index";
import { courbeTauxMarginal, tauxMarginalAu, zonesTrappe, SEUIL_TRAPPE } from "@/lib/taux-marginal";
import { UI, type Lang } from "@/lib/i18n";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const CATEGORIES = ["cotisations", "transfertsQuebec", "impotQuebec", "transfertsFederaux", "impotFederal"] as const;
const MAX = 100_000;

export function GraphiqueTauxMarginal({
  menage,
  annee,
  revenuActuel,
  lang,
}: {
  menage: Menage;
  annee: Annee;
  revenuActuel: number;
  lang: Lang;
}) {
  const data = useMemo(() => courbeTauxMarginal(menage, annee, { max: MAX, pas: 1000 }), [menage, annee]);
  const trappes = useMemo(() => zonesTrappe(data), [data]);
  const decomposition = useMemo(() => tauxMarginalAu(menage, annee, revenuActuel), [menage, annee, revenuActuel]);
  // Plancher numérique de l'axe (sommet des aires négatives empilées), arrondi à −20 % près.
  const yMin = useMemo(() => {
    const bas = Math.min(0, ...data.map((d) => CATEGORIES.reduce((s, c) => s + Math.min(0, d[c]), 0)));
    return Math.floor(bas / 20) * 20;
  }, [data]);

  const config = useMemo<ChartConfig>(
    () => ({
      cotisations: { label: UI.cotisations[lang], color: "var(--chart-1)" },
      transfertsQuebec: { label: UI.transfertsQC[lang], color: "var(--chart-2)" },
      impotQuebec: { label: UI.impotQC[lang], color: "var(--chart-3)" },
      transfertsFederaux: { label: UI.transfertsFederaux[lang], color: "var(--chart-4)" },
      impotFederal: { label: UI.impotFederal[lang], color: "var(--chart-5)" },
      total: { label: UI.tauxTotal[lang], color: "var(--foreground)" },
    }),
    [lang],
  );

  const fmtRevenu = (v: number) => `${Math.round(v / 1000)} k$`;
  const fmtPct = (v: number) => `${Math.round(v)} %`;

  return (
    <div className="grid grid-cols-1 gap-2">
      <ChartContainer config={config} className="h-[320px] w-full min-w-0 sm:h-auto sm:aspect-[16/6]">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 20, bottom: 4 }} stackOffset="sign">
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="revenu"
          type="number"
          domain={[0, MAX]}
          tickFormatter={fmtRevenu}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          height={44}
          label={{ value: UI.axeRevenu[lang], position: "insideBottom", offset: 0, fontSize: 12.75, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tickFormatter={fmtPct}
          tickLine={false}
          axisLine={false}
          width={48}
          domain={[yMin, 100]}
          allowDataOverflow
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => fmtRevenu(Number(payload?.[0]?.payload?.revenu ?? 0))}
              formatter={(value, name) => `${(config[name as string]?.label ?? name) as string} : ${Math.round(Number(value))} %`}
            />
          }
        />
        {CATEGORIES.map((c) => (
          <Area key={c} dataKey={c} type="monotone" stackId="tmi" stroke={`var(--color-${c})`} fill={`var(--color-${c})`} fillOpacity={0.5} />
        ))}
        {trappes.map((z, i) => (
          <ReferenceArea key={`trap-${i}`} x1={z.debut} x2={z.fin} fill="var(--destructive)" fillOpacity={0.1} ifOverflow="hidden" />
        ))}
        <Line dataKey="total" type="monotone" stroke="var(--color-total)" dot={false} strokeWidth={2} />
        <ReferenceLine
          y={SEUIL_TRAPPE}
          stroke="var(--destructive)"
          strokeDasharray="3 3"
          strokeOpacity={0.7}
          label={{ value: UI.trappeSeuil[lang], position: "insideTopRight", fontSize: 12.75, fill: "var(--destructive)" }}
        />
        {revenuActuel > 0 && revenuActuel <= MAX && (
          <ReferenceLine
            x={revenuActuel}
            stroke="var(--foreground)"
            strokeDasharray="4 4"
            label={{ value: UI.revenuActuel[lang], position: "top", fontSize: 12.75, fill: "var(--muted-foreground)" }}
          />
        )}
        <ChartLegend content={<ChartLegendContent className="flex-wrap" />} />
      </AreaChart>
      </ChartContainer>

      <div className="overflow-hidden rounded-lg border text-sm">
        <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-3 py-2">
          <span className="font-medium">{UI.decompositionTitre[lang]}</span>
          <span className="tabular-nums text-muted-foreground">
            {Math.round(revenuActuel).toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")} $
          </span>
        </div>
        <table className="w-full">
          <tbody>
            {CATEGORIES.map((c) => (
              <tr key={c} className="border-b">
                <td className="px-3 py-1.5">
                  <span
                    className="mr-2 inline-block size-2.5 rounded-[2px] align-middle"
                    style={{ backgroundColor: config[c]?.color }}
                  />
                  {config[c]?.label}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmtPct(decomposition[c])}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="px-3 py-1.5">{UI.tauxTotal[lang]}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{fmtPct(decomposition.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {trappes.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-destructive">{UI.trappePauvrete[lang]}</span> — {UI.trappeNote[lang]}
        </p>
      )}
    </div>
  );
}
