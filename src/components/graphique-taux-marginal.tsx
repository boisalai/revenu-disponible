"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Line, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";
import type { Annee, Menage } from "@/index";
import { courbeTauxMarginal, zonesTrappe, SEUIL_TRAPPE } from "@/lib/taux-marginal";
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
    <div className="grid gap-2">
      <ChartContainer config={config} className="aspect-[16/6] w-full">
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
          label={{ value: UI.axeRevenu[lang], position: "insideBottom", offset: 0, fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <YAxis tickFormatter={fmtPct} tickLine={false} axisLine={false} width={48} />
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
          label={{ value: UI.trappeSeuil[lang], position: "insideTopRight", fontSize: 10, fill: "var(--destructive)" }}
        />
        {revenuActuel > 0 && revenuActuel <= MAX && (
          <ReferenceLine
            x={revenuActuel}
            stroke="var(--foreground)"
            strokeDasharray="4 4"
            label={{ value: UI.revenuActuel[lang], position: "top", fontSize: 11, fill: "var(--muted-foreground)" }}
          />
        )}
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
      </ChartContainer>
      {trappes.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-destructive">{UI.trappePauvrete[lang]}</span> — {UI.trappeNote[lang]}
        </p>
      )}
    </div>
  );
}
