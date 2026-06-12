"use client";

import { useMemo } from "react";
import { calculerRevenuDisponible } from "@/index";
import { versMenage, type MenageEtat } from "@/lib/menage-etat";
import { UI, type Lang } from "@/lib/i18n";

type Resultat = ReturnType<typeof calculerRevenuDisponible>;

/**
 * Taux effectif d'une variation discrète de revenu : 1 − ΔRD/ΔR, le coût
 * **moyen** sur tout l'écart (distinct du TEMI ponctuel du calculateur). Ne
 * s'affiche que si les deux ménages comparés diffèrent UNIQUEMENT par le
 * revenu — sinon ΔRD mêlerait plusieurs effets et le « taux » n'aurait pas de
 * sens. La comparaison du « reste » se fait sur la projection moteur, si bien
 * que le revenu ignoré d'un second adulte absent ne fausse rien.
 */
export function TauxVariation({
  etatA,
  etatB,
  rA,
  rB,
  lang,
}: {
  etatA: MenageEtat;
  etatB: MenageEtat;
  rA: Resultat;
  rB: Resultat;
  lang: Lang;
}) {
  const v = useMemo(() => {
    const ma = versMenage(etatA);
    const mb = versMenage(etatB);
    const memeReste =
      ma.situation === mb.situation &&
      ma.ageAdulte1 === mb.ageAdulte1 &&
      ma.ageAdulte2 === mb.ageAdulte2 &&
      JSON.stringify(ma.enfants) === JSON.stringify(mb.enfants);
    if (!memeReste) return null;

    const revA = ma.revenu1 + ma.revenu2;
    const revB = mb.revenu1 + mb.revenu2;
    if (revA === revB) return null; // aucune variation de revenu

    // Ordonner du plus bas au plus haut revenu (lecture « hausse de revenu »).
    const [revBas, revHaut, rdBas, rdHaut] =
      revA < revB
        ? [revA, revB, rA.revenuDisponible, rB.revenuDisponible]
        : [revB, revA, rB.revenuDisponible, rA.revenuDisponible];

    const dR = revHaut - revBas;
    const dRD = rdHaut - rdBas;
    return { revBas, revHaut, dR, dRD, taux: (1 - dRD / dR) * 100 };
  }, [etatA, etatB, rA, rB]);

  if (!v) return null;

  const loc = lang === "fr" ? "fr-CA" : "en-CA";
  const fmt = (n: number) => `${Math.round(n).toLocaleString(loc)} $`;
  const gain = v.dRD >= 0;
  const centsNet = Math.round((v.dRD / v.dR) * 100); // part retenue par dollar, en cents

  return (
    <div className="space-y-1.5 rounded-lg border bg-muted/20 px-4 py-3 text-sm">
      <p className="font-medium">{UI.tvTitre[lang]}</p>
      <p>
        {UI.tvDe[lang]} <span className="tabular-nums">{fmt(v.revBas)}</span> {UI.tvVers[lang]}{" "}
        <span className="tabular-nums">{fmt(v.revHaut)}</span> (+{fmt(v.dR)}) :{" "}
        {(gain ? UI.tvHausse : UI.tvBaisse)[lang]} <span className="tabular-nums">{fmt(Math.abs(v.dRD))}</span> —{" "}
        <strong>
          {UI.tvLabel[lang]} {Math.round(v.taux)} %
        </strong>
        .
      </p>
      {gain && (
        <p className="text-xs text-muted-foreground">
          {UI.tvGloss[lang]} <span className="tabular-nums">{centsNet} ¢</span> {UI.tvNet[lang]}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{UI.tvNote[lang]}</p>
    </div>
  );
}
