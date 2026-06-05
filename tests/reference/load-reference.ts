// ===========================================================================
// Chargeur du calculateur de référence (revenu-disponible_dec2025.js) pour Node.
//
// Le fichier est un bundle navigateur (jQuery + runtime SpreadsheetConverter). On
// n'en exécute que la TRANCHE calculatoire — à partir de la première déclaration de
// données (`var row2xB5B9 = …`) jusqu'à la fin. Cette tranche initialise les tableaux
// globaux (purs) puis définit `calc()` et tous les helpers (déclarations de fonctions,
// donc hoistées). Seule la queue du bundle (liaison DOM/Bootstrap) lève une exception,
// APRÈS l'initialisation des données : on l'attrape, `calc()` reste pleinement utilisable.
//
// `calc(data)` lit ses entrées depuis data['Situation'], data['Revenu1']… et écrit ses
// sorties sur le même objet (data['QC_ramq_old']…). Aucun DOM requis.
// ===========================================================================

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

export interface EnfantReference {
  age: number;
  frais: number; // frais de garde payés ($)
  typeGarde: string; // "Subventionnée" ou autre (ex. "Non subventionnée")
}

export interface EntreesReference {
  Situation: string; // libellé exact (ex. "Couple", "Famille monoparentale")
  Revenu1: number;
  AgeAdulte1: number;
  Revenu2?: number;
  AgeAdulte2?: number;
  enfants?: EnfantReference[];
}

type CalcFn = (data: Record<string, unknown>) => void;

function chargerCalc(): CalcFn {
  const chemin = fileURLToPath(
    new URL("../../reference/revenu-disponible_dec2025_beautified.js", import.meta.url),
  );
  const lignes = readFileSync(chemin, "utf8").split("\n");
  const debut = lignes.findIndex((l) => /^var row2xB5B9 = new Array/.test(l));
  if (debut < 0) throw new Error("Bloc de données introuvable dans la référence.");

  let source = lignes.slice(debut).join("\n");
  // Instrumentation : exposer le revenu familial net interne (c2T271 / c2S271 = somme des
  // lignes 275), base d'imposition des transferts (RAMQ, Allocation famille, solidarité,
  // prime au travail). Une simple affectation sur `data` (le paramètre de calc).
  source = source
    .replace(
      "var c2T271 = (((c2T223) + (c2T249)));",
      "var c2T271 = (((c2T223) + (c2T249))); data['_rfn_old'] = c2T271;",
    )
    .replace(
      "var c2S271 = (((c2S223) + (c2S249)));",
      "var c2S271 = (((c2S223) + (c2S249))); data['_rfn_new'] = c2S271;",
    )
    // Revenu aux fins de l'allocation-logement (c2T357 = revenu net moins un ajustement pour
    // revenus de pension) : exposé pour la parité du poste 10. Injecté après c2T362/c2S362,
    // où c2T357/c2S357 sont en portée.
    .replace(
      "var c2T362 = (max(0, sumcnt1321_sum, sumcnt1321_cnt, eecm1));",
      "var c2T362 = (max(0, sumcnt1321_sum, sumcnt1321_cnt, eecm1)); data['_ral_old'] = c2T357;",
    )
    .replace(
      "var c2S362 = (max(0, sumcnt1318_sum, sumcnt1318_cnt, eecm1));",
      "var c2S362 = (max(0, sumcnt1318_sum, sumcnt1318_cnt, eecm1)); data['_ral_new'] = c2S357;",
    )
    // Revenu familial net rajusté FÉDÉRAL (c2T124) : base de l'Allocation canadienne pour
    // enfants (poste 14) et des transferts fédéraux. Exposé pour la parité.
    .replace("var c2T124 = (c2T121);", "var c2T124 = (c2T121); data['_afni_old'] = c2T124;")
    .replace("var c2S124 = (c2S121);", "var c2S124 = (c2S121); data['_afni_new'] = c2S124;");

  // Stub « universel » : absorbe tout accès/appel (jQuery, DOM…) sans jamais lever
  // d'exception. `any` justifié — il doit se comporter comme n'importe quelle valeur.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stub: any = new Proxy(function () {}, {
    get: (_t, p) => (p === Symbol.toPrimitive ? () => "" : p === "length" ? 0 : stub),
    apply: () => stub,
    construct: () => stub,
    set: () => true,
  });
  const sandbox: Record<string, unknown> = { console };
  for (const k of ["window", "document", "navigator", "location", "self", "top", "$", "jQuery", "alert", "ssc", "co"])
    sandbox[k] = stub;
  sandbox.setTimeout = () => 0;
  sandbox.setInterval = () => 0;
  vm.createContext(sandbox);
  try {
    new vm.Script(source, { filename: "reference-slice.js" }).runInContext(sandbox, { timeout: 20000 });
  } catch {
    // Queue du bundle (Bootstrap/jQuery, liaison DOM) : échoue après l'init des données
    // et la définition (hoistée) des fonctions. Sans incidence sur calc().
  }
  const calc = sandbox.calc;
  if (typeof calc !== "function") throw new Error("calc() introuvable après chargement de la référence.");
  return calc as CalcFn;
}

let memo: CalcFn | null = null;

/**
 * Exécute le `calc()` de revenu-disponible_dec2025.js et renvoie l'objet de sortie complet.
 * Les sorties d'année 2025 portent le suffixe `_old`, celles de 2026 le suffixe `_new`.
 * Le revenu familial net interne est exposé sous `_rfn_old` / `_rfn_new` (instrumentation).
 */
export function calcReference(entrees: EntreesReference): Record<string, number> {
  memo ??= chargerCalc();
  const co: Record<string, unknown> = {
    Situation: entrees.Situation,
    Revenu1: entrees.Revenu1,
    AgeAdulte1: entrees.AgeAdulte1,
    Revenu2: entrees.Revenu2 ?? 0,
    AgeAdulte2: entrees.AgeAdulte2 ?? 0,
    NbEnfants: entrees.enfants?.length ?? 0,
  };
  const enfants = entrees.enfants ?? [];
  for (let i = 1; i <= 5; i++) {
    const e = enfants[i - 1];
    co[`AgeEnfant${i}`] = e ? e.age : "";
    co[`Frais${i}`] = e ? e.frais : 0;
    co[`type_garde${i}`] = e ? e.typeGarde : "";
  }
  memo(co);
  return co as Record<string, number>;
}
