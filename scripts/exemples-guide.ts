// ============================================================================
// Générateur des EXEMPLES CHIFFRÉS du guide PDF (docs/guide/exemples/*.tex).
//
// Principe : aucun chiffre écrit à la main. Chaque exemple reproduit pas à pas
// l'algorithme du poste (mêmes formules, mêmes arrondis que src/postes/…) pour
// un ménage type du cast M1–M13, puis VÉRIFIE par assertion que la dernière
// étape retombe exactement (au demi-cent) sur le montant du moteur
// (`calculerRevenuDisponible(...).detail`). Une divergence fait échouer la
// génération — et la suite de tests (tests/exemples-guide.test.ts), qui
// vérifie aussi que les fichiers générés sur disque sont à jour.
//
// Régénérer : npm run exemples   (écrit docs/guide/exemples/*.tex)
// Tous les exemples portent sur l'année d'imposition 2025.
// ============================================================================

import { Situation, SITUATIONS, TypeGarde, impotProgressif, type Menage } from "../src/socle";
import { RRQ, cotisationRRQ } from "../src/postes/01-rrq";
import { RQAP } from "../src/postes/02-rqap";
import { AE } from "../src/postes/03-ae";
import { FSS } from "../src/postes/04-fss";
import { RAMQ } from "../src/postes/05-ramq";
import { GARDE, plafondFraisEnfant, plafondFederalEnfant, tauxCreditGarde } from "../src/postes/06-garde";
import { ALLOCATION_FAMILLE } from "../src/postes/07-allocation-famille";
import { PRIME_TRAVAIL } from "../src/postes/08-prime-travail";
import { SOLIDARITE } from "../src/postes/09-solidarite";
import { ALLOCATION_LOGEMENT } from "../src/postes/10-allocation-logement";
import { SOUTIEN_AINES } from "../src/postes/11-soutien-aines";
import { FRAIS_MEDICAUX } from "../src/postes/12-frais-medicaux";
import { AIDE_SOCIALE } from "../src/postes/13-aide-sociale";
import { ACE } from "../src/postes/14-allocation-canadienne-enfants";
import { TPS } from "../src/postes/15-credit-tps";
import { ACT } from "../src/postes/16-allocation-travailleurs";
import { PSV, svNonImposableParAdulte } from "../src/postes/17-securite-vieillesse";
import { SUPPLEMENT_MEDICAL } from "../src/postes/18-supplement-medical-federal";
import { IMPOT_FEDERAL, IMPOT_QUEBEC } from "../src/postes/19-impot";
import { PALIERS_FEDERAL, PALIERS_QC } from "../src/impot/parametres";
import { calculerRevenuDisponible } from "../src/postes/20-revenu-disponible";
import { courbeTauxMarginal, zonesTrappe } from "../src/lib/taux-marginal";

const AN = 2025;

// ---------------------------------------------------------------------------
// Le cast : 13 ménages types, précisément spécifiés
// ---------------------------------------------------------------------------

interface MenageType {
  code: string; // « M4 »
  /** Description complète (utilisée dans l'en-tête de chaque exemple). */
  titre: string;
  /** Colonnes du tableau récapitulatif : situation / âges / revenus / enfants. */
  specs: [string, string, string, string];
  menage: Menage;
}

const menage = (
  situation: Situation,
  revenu1: number,
  revenu2: number,
  age1: number,
  age2: number,
  enfants: Menage["enfants"] = [],
): Menage => ({ situation, revenu1, revenu2, ageAdulte1: age1, ageAdulte2: age2, enfants });

export const MENAGES: MenageType[] = [
  {
    code: "M1",
    titre: "personne vivant seule, 25~ans, aucun revenu",
    specs: ["Personne vivant seule", "25", "0\\,\\$", "---"],
    menage: menage(Situation.PersonneSeule, 0, 0, 25, 0),
  },
  {
    code: "M2",
    titre: "personne vivant seule, 30~ans, revenu de travail de \\D{9000}",
    specs: ["Personne vivant seule", "30", "\\D{9000}", "---"],
    menage: menage(Situation.PersonneSeule, 9000, 0, 30, 0),
  },
  {
    code: "M3",
    titre: "personne vivant seule, 30~ans, revenu de travail de \\D{15000}",
    specs: ["Personne vivant seule", "30", "\\D{15000}", "---"],
    menage: menage(Situation.PersonneSeule, 15_000, 0, 30, 0),
  },
  {
    code: "M4",
    titre: "personne vivant seule, 40~ans, revenu de travail de \\D{50000}",
    specs: ["Personne vivant seule", "40", "\\D{50000}", "---"],
    menage: menage(Situation.PersonneSeule, 50_000, 0, 40, 0),
  },
  {
    code: "M5",
    titre: "personne vivant seule, 45~ans, revenu de travail de \\D{100000}",
    specs: ["Personne vivant seule", "45", "\\D{100000}", "---"],
    menage: menage(Situation.PersonneSeule, 100_000, 0, 45, 0),
  },
  {
    code: "M6",
    titre:
      "famille monoparentale, 35~ans, revenu de travail de \\D{35000}, un enfant de 3~ans en garderie subventionnée (\\D{2000} payés dans l'année)",
    specs: ["Famille monoparentale", "35", "\\D{35000}", "3 ans (subv., \\D{2000})"],
    menage: menage(Situation.FamilleMonoparentale, 35_000, 0, 35, 0, [
      { age: 3, fraisGarde: 2000, typeGarde: TypeGarde.Subventionne },
    ]),
  },
  {
    code: "M7",
    titre: "couple, 45 et 44~ans, revenus de travail de \\D{30000} et \\D{0}, sans enfant",
    specs: ["Couple", "45 / 44", "\\D{30000} / 0\\,\\$", "---"],
    menage: menage(Situation.Couple, 30_000, 0, 45, 44),
  },
  {
    code: "M8",
    titre:
      "couple, 38 et 36~ans, revenus de travail de \\D{60000} et \\D{40000}, deux enfants : 4~ans (garde non subventionnée, \\D{13000}) et 8~ans (garde non subventionnée, \\D{3000})",
    specs: ["Couple", "38 / 36", "\\D{60000} / \\D{40000}", "4 ans (\\D{13000}) ; 8 ans (\\D{3000})"],
    menage: menage(Situation.Couple, 60_000, 40_000, 38, 36, [
      { age: 4, fraisGarde: 13_000, typeGarde: TypeGarde.NonSubventionne },
      { age: 8, fraisGarde: 3000, typeGarde: TypeGarde.NonSubventionne },
    ]),
  },
  {
    code: "M9",
    titre:
      "couple, 45 et 45~ans, revenus de travail de \\D{120000} et \\D{60000}, un enfant de 5~ans (garde non subventionnée, \\D{15000})",
    specs: ["Couple", "45 / 45", "\\D{120000} / \\D{60000}", "5 ans (\\D{15000})"],
    menage: menage(Situation.Couple, 120_000, 60_000, 45, 45, [
      { age: 5, fraisGarde: 15_000, typeGarde: TypeGarde.NonSubventionne },
    ]),
  },
  {
    code: "M10",
    titre: "retraité vivant seul, 70~ans, revenu de pension privée de \\D{20000}",
    specs: ["Retraité vivant seul", "70", "\\D{20000}", "---"],
    menage: menage(Situation.RetraiteSeul, 20_000, 0, 70, 0),
  },
  {
    code: "M11",
    titre: "couple de retraités, 72 et 70~ans, pensions privées de \\D{30000} et \\D{10000}",
    specs: ["Couple de retraités", "72 / 70", "\\D{30000} / \\D{10000}", "---"],
    menage: menage(Situation.CoupleRetraites, 30_000, 10_000, 72, 70),
  },
  {
    code: "M12",
    titre: "retraité vivant seul, 76~ans, revenu de pension privée de \\D{110000}",
    specs: ["Retraité vivant seul", "76", "\\D{110000}", "---"],
    menage: menage(Situation.RetraiteSeul, 110_000, 0, 76, 0),
  },
  {
    code: "M13",
    titre: "couple de retraités, 68 et 66~ans, pensions privées de \\D{12000} et \\D{6000}",
    specs: ["Couple de retraités", "68 / 66", "\\D{12000} / \\D{6000}", "---"],
    menage: menage(Situation.CoupleRetraites, 12_000, 6000, 68, 66),
  },
];

const M = Object.fromEntries(MENAGES.map((m) => [m.code, m]));

/** Résultat complet du moteur pour chaque ménage (calculé une seule fois). */
const RES = Object.fromEntries(MENAGES.map((m) => [m.code, calculerRevenuDisponible(m.menage, AN)]));

// ---------------------------------------------------------------------------
// Aides de mise en forme LaTeX
// ---------------------------------------------------------------------------

/** Arrondi au cent. */
const cent = (x: number) => Math.round(x * 100) / 100;

/** Nombre LaTeX : entier tel quel, sinon 2 décimales (siunitx affichera la virgule). */
const fm = (x: number): string => {
  const r = cent(x);
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
};

/** Nombre « trimé » (taux, facteurs) : jusqu'à 4 décimales, sans zéros de queue. */
const ft = (x: number): string => String(Math.round(x * 10_000) / 10_000);

const D = (x: number) => `\\D{${fm(x)}}`; // montant en dollars (texte)
const N = (x: number) => `\\num{${fm(x)}}`; // nombre (texte ou math)
const PC = (taux: number) => `\\pc{${ft(taux * 100)}}`; // taux : 0.0765 → 7,65 %

/** Vérifie qu'une recette retombe sur le montant du moteur (au demi-cent). */
function verifier(ou: string, moteur: number, recette: number): void {
  if (Math.abs(moteur - recette) > 0.005) {
    throw new Error(`Exemple « ${ou} » : la recette donne ${recette}, le moteur ${moteur}.`);
  }
}

/** Un exemple : en-tête en gras (ménage précisément décrit), puis corps. */
function exemple(code: string, corps: string): string {
  const m = M[code];
  return `\\medskip\\noindent\\textbf{${m.code} --- ${m.titre}.}\n${corps.trim()}`;
}

/** Bloc align* (une équation par ligne, alignée sur le =). */
const align = (...lignes: string[]) => `\\begin{align*}\n${lignes.join(" \\\\\n")}\n\\end{align*}`;

interface Fichier {
  nom: string; // ex. « 01-rrq.tex »
  contenu: string;
}

const entete =
  "% ============================================================================\n" +
  "% GÉNÉRÉ par scripts/exemples-guide.ts — NE PAS ÉDITER À LA MAIN.\n" +
  "% Régénérer : npm run exemples (chaque chiffre est vérifié contre le moteur).\n" +
  "% ============================================================================\n";

function fichier(nom: string, intro: string, exemples: string[]): Fichier {
  return { nom, contenu: `${entete}\\pexemples ${intro.trim()}\n\n${exemples.join("\n\n")}\n` };
}

// ---------------------------------------------------------------------------
// Tableaux du cast (ménages + bases de revenu) — § architecture
// ---------------------------------------------------------------------------

function fichierMenages(): Fichier {
  const lignesCast = MENAGES.map(
    (m) => `${m.code} & ${m.specs[0]} & ${m.specs[1]} & ${m.specs[2]} & ${m.specs[3]} \\\\`,
  );
  const lignesBases = MENAGES.map((m) => {
    const r = RES[m.code];
    const brut = m.menage.revenu1 + (SITUATIONS[m.menage.situation].nbAdultes === 2 ? m.menage.revenu2 : 0);
    return `${m.code} & ${N(brut)} & ${N(r.revenuNetFamilial)} & ${N(r.afni)} & ${N(r.revenuAL)} \\\\`;
  });
  const contenu = `${entete}\\subsection{Les ménages types des exemples}
\\label{sec:menages-exemples}

Les sections~\\ref{sec:cotisations} à~\\ref{sec:rd} illustrent chaque poste par
des exemples chiffrés, calculés pour l'\\textbf{année d'imposition 2025} sur un
même jeu de treize ménages types (tableau~\\ref{tab:menages-exemples}). Chaque
exemple reproduit l'algorithme du poste à la calculatrice ; tous les montants
sont produits par le moteur de calcul et chaque résultat final est
\\textbf{vérifié automatiquement} contre celui-ci par la suite de tests du
projet (le fichier source des exemples est régénéré à chaque modification du
moteur).

\\begin{table}[ht]
\\centering
\\small
\\begin{tabular}{c l c l l}
\\toprule
Code & Situation & Âges & Revenus bruts & Enfants (garde) \\\\
\\midrule
${lignesCast.join("\n")}
\\bottomrule
\\end{tabular}
\\caption{Les treize ménages types des exemples. Les revenus sont des revenus
de travail (ménages actifs) ou de pension privée (ménages retraités) ; les
frais de garde sont les frais annuels payés.}
\\label{tab:menages-exemples}
\\end{table}

Plusieurs postes sont modulés sur les bases de revenu de la
section~\\ref{sec:bases} plutôt que sur le revenu brut. Le
tableau~\\ref{tab:bases-exemples} donne ces bases, telles que le moteur les
reconstruit (équations~\\eqref{eq:rfn} à~\\eqref{eq:ral}) : les exemples y
renvoient sans refaire ce calcul, détaillé au poste~19 et à la
section~\\ref{sec:bases}.

\\begin{table}[ht]
\\centering
\\small
\\begin{tabular}{c r r r r}
\\toprule
Code & Revenu brut $R$ & $\\RFN$ & $\\AFNI$ & $\\RAL$ \\\\
\\midrule
${lignesBases.join("\n")}
\\bottomrule
\\end{tabular}
\\caption{Bases de revenu 2025 des ménages types, reconstruites par le moteur
(montants en dollars). Pour les retraités, $\\RFN$ et $\\AFNI$ incluent la
Sécurité de la vieillesse (pension, SRG et suppléments) ; $\\RAL$ en retranche
une fraction (équation~\\eqref{eq:ral}).}
\\label{tab:bases-exemples}
\\end{table}
`;
  return { nom: "menages.tex", contenu };
}

// ---------------------------------------------------------------------------
// TEMI — tableau d'illustration de la section « architecture » (M6)
// ---------------------------------------------------------------------------

function fichierTemi(): Fichier {
  const pas = 5000;
  const points = courbeTauxMarginal(M.M6.menage, AN, { max: 60_000, pas });
  // Le texte du guide affirme que M6 traverse une trappe (> 60 %) : on le garantit.
  if (zonesTrappe(points).length === 0) {
    throw new Error("TEMI M6 : plus aucune zone de trappe > 60 % — revoir le texte de la section TEMI du guide.");
  }
  const pct = (x: number) => `\\pc{${String(Math.round(x * 10) / 10)}}`;
  const lignes = points.map((p) => {
    const cellules = [`\\num{${p.revenu}}`, pct(p.bareme), pct(p.total)];
    return (p.total > 60 ? cellules.map((c) => `\\textbf{${c}}`) : cellules).join(" & ") + " \\\\";
  });
  const contenu = `${entete}\\begin{table}[ht]
\\centering
\\small
\\begin{tabular}{r r r}
\\toprule
Revenu de travail (\\$) & Barème seul & TEMI réel \\\\
\\midrule
${lignes.join("\n")}
\\bottomrule
\\end{tabular}
\\caption{TEMI 2025 du ménage type M6 (famille monoparentale, un enfant de
3~ans en garde subventionnée), par tranche de \\D{5000} : chaque ligne donne
le taux effectif sur la tranche de revenu qui débute au montant indiqué. En
gras, les tranches en \\emph{trappe} (TEMI $>$ \\pc{60}). La colonne
\\og barème seul \\fg{} est le taux marginal des seules tables d'imposition
au revenu imposable correspondant (zéro sous le montant personnel de base).}
\\label{tab:temi-m6}
\\end{table}
`;
  return { nom: "temi.tex", contenu };
}

// ---------------------------------------------------------------------------
// Poste 1 — RRQ
// ---------------------------------------------------------------------------

function p01rrq(): Fichier {
  const p = RRQ[AN];

  const unAdulte = (code: string, revenu: number) => {
    const bande1 = Math.max(0, Math.min(revenu, p.mga) - p.exemption);
    const bande2 = Math.max(0, Math.min(revenu, p.mgas) - p.mga);
    const base = bande1 * p.tauxBase;
    const suppl = bande1 * p.tauxSuppl1 + bande2 * p.tauxSuppl2;
    verifier(`RRQ ${code}`, RES[code].detail.cotisations.rrq, base + suppl);
    return { bande1, bande2, base, suppl, total: base + suppl };
  };

  const exSimple = (code: string, revenu: number) => {
    const c = unAdulte(code, revenu);
    const lignes = [
      `\\text{bande 1} &= \\min(${N(revenu)},\\ ${N(p.mga)}) - ${N(p.exemption)} = ${N(c.bande1)}`,
      `\\text{régime de base} &= ${N(c.bande1)} \\times ${PC(p.tauxBase)} = ${N(c.base)}`,
      `\\text{1\\iere{} cotisation supplémentaire} &= ${N(c.bande1)} \\times ${PC(p.tauxSuppl1)} = ${N(c.bande1 * p.tauxSuppl1)}`,
    ];
    if (c.bande2 > 0) {
      lignes.push(
        `\\text{bande 2} &= \\min(${N(revenu)},\\ ${N(p.mgas)}) - ${N(p.mga)} = ${N(c.bande2)}`,
        `\\text{2\\ieme{} cotisation supplémentaire} &= ${N(c.bande2)} \\times ${PC(p.tauxSuppl2)} = ${N(c.bande2 * p.tauxSuppl2)}`,
      );
    } else {
      lignes.push(`\\text{bande 2} &= 0 \\quad (\\text{revenu} \\le \\text{MGA})`);
    }
    lignes.push(`\\text{cotisation totale} &= ${N(c.total)}`);
    return { c, latex: align(...lignes) };
  };

  const e3 = exSimple("M3", 15_000);
  const e4 = exSimple("M4", 50_000);
  const e5 = exSimple("M5", 100_000);

  // M8 : couple, somme des cotisations individuelles.
  const c81 = cotisationRRQ(60_000, AN);
  const c82 = cotisationRRQ(40_000, AN);
  verifier("RRQ M8", RES.M8.detail.cotisations.rrq, c81.total + c82.total);

  return fichier(
    "01-rrq.tex",
    `La cotisation se calcule \\emph{par adulte}, sur le revenu de travail.
Paramètres 2025 : exemption de ${D(p.exemption)}, MGA de ${D(p.mga)}, MGAS de
${D(p.mgas)}, taux de ${PC(p.tauxBase)} (base), ${PC(p.tauxSuppl1)} (1\\iere{}
supplémentaire) et ${PC(p.tauxSuppl2)} (2\\ieme{} supplémentaire).`,
    [
      exemple(
        "M3",
        `Le revenu est sous le MGA : seule la bande~1 est occupée.
${e3.latex}
Cotisation RRQ : ${D(e3.c.total)}, dont ${D(e3.c.base)} de régime de base
(créditable à l'impôt) et ${D(e3.c.suppl)} de régime supplémentaire (déductible).`,
      ),
      exemple(
        "M4",
        `Même mécanique, plus haut dans la bande~1.
${e4.latex}
Cotisation RRQ : ${D(e4.c.total)} (base ${D(e4.c.base)} ; supplémentaire ${D(e4.c.suppl)}).`,
      ),
      exemple(
        "M5",
        `Le revenu dépasse le MGAS (${D(p.mgas)}) : les deux bandes sont
\\emph{saturées} — la cotisation atteint son maximum 2025.
${e5.latex}
Cotisation RRQ maximale : ${D(e5.c.total)}, dont ${D(e5.c.suppl)} de régime
supplémentaire (déductible du revenu imposable, ce qui réduit aussi les bases
$\\RFN$ et $\\AFNI$).`,
      ),
      exemple(
        "M8",
        `Pour un couple, on calcule chaque adulte séparément puis on additionne :
${align(
  `\\text{adulte 1 } (${N(60_000)}) &: ${N(c81.total)}`,
  `\\text{adulte 2 } (${N(40_000)}) &: ${N(c82.total)}`,
  `\\text{ménage} &= ${N(c81.total)} + ${N(c82.total)} = ${N(c81.total + c82.total)}`,
)}
Cotisation RRQ du ménage : ${D(c81.total + c82.total)}.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 2 — RQAP
// ---------------------------------------------------------------------------

function p02rqap(): Fichier {
  const p = RQAP[AN];
  const ex = (code: string, revenu: number) => {
    const assurable = Math.min(revenu, p.maxAssurable);
    const cot = revenu <= p.seuil ? 0 : assurable * p.taux;
    verifier(`RQAP ${code}`, RES[code].detail.cotisations.rqap, cot);
    return { assurable, cot };
  };
  const e2 = ex("M2", 9000);
  const e4 = ex("M4", 50_000);
  const e5 = ex("M5", 100_000);

  return fichier(
    "02-rqap.tex",
    `Taux unique de ${PC(p.taux)} sur le revenu assurable, \\emph{sans
exemption} : dès que le revenu dépasse ${D(p.seuil)}, la cotisation porte sur
le plein montant, plafonné au maximum assurable de ${D(p.maxAssurable)}.`,
    [
      exemple(
        "M2",
        `${align(`\\text{cotisation} &= ${N(9000)} \\times ${PC(p.taux)} = ${N(e2.cot)}`)}
Le revenu dépasse le seuil de ${D(p.seuil)} : la cotisation s'applique dès le
premier dollar, soit ${D(e2.cot)}.`,
      ),
      exemple(
        "M4",
        `${align(`\\text{cotisation} &= ${N(50_000)} \\times ${PC(p.taux)} = ${N(e4.cot)}`)}
Cotisation RQAP : ${D(e4.cot)}.`,
      ),
      exemple(
        "M5",
        `Le revenu (${D(100_000)}) excède le maximum assurable : la cotisation
est plafonnée.
${align(`\\text{cotisation} &= \\min(${N(100_000)},\\ ${N(p.maxAssurable)}) \\times ${PC(p.taux)} = ${N(e5.cot)}`)}
Cotisation RQAP maximale 2025 : ${D(e5.cot)}.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 3 — Assurance-emploi
// ---------------------------------------------------------------------------

function p03ae(): Fichier {
  const p = AE[AN];
  const ex = (code: string, revenu: number) => {
    const cot = revenu <= p.seuil ? 0 : Math.min(revenu, p.mra) * p.taux;
    verifier(`AE ${code}`, RES[code].detail.cotisations.assuranceEmploi, cot);
    return cot;
  };
  const e2 = ex("M2", 9000);
  const e4 = ex("M4", 50_000);
  const e5 = ex("M5", 100_000);

  return fichier(
    "03-ae.tex",
    `Même structure que le RQAP : taux unique (taux réduit du Québec,
${PC(p.taux)}), sans exemption, plafonné au maximum de la rémunération
assurable (${D(p.mra)}). Sous ${D(p.seuil)} de rémunération, la cotisation est
remboursée (art.~96(4) LAE).`,
    [
      exemple(
        "M2",
        `${align(`\\text{cotisation} &= ${N(9000)} \\times ${PC(p.taux)} = ${N(e2)}`)}
Cotisation AE : ${D(e2)}.`,
      ),
      exemple(
        "M4",
        `${align(`\\text{cotisation} &= ${N(50_000)} \\times ${PC(p.taux)} = ${N(e4)}`)}
Cotisation AE : ${D(e4)}.`,
      ),
      exemple(
        "M5",
        `${align(
          `\\text{cotisation} &= \\min(${N(100_000)},\\ ${N(p.mra)}) \\times ${PC(p.taux)} = ${N(e5)}`,
        )}
Le revenu excède le MRA : cotisation maximale 2025, ${D(e5)}.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 4 — FSS
// ---------------------------------------------------------------------------

function p04fss(): Fichier {
  const p = FSS[AN];
  const cotis = (r: number) => {
    const t1 = Math.min(Math.max(0, r - p.seuil1) * p.taux1, p.plafond1);
    const t2 = Math.min(Math.max(0, r - p.seuil2) * p.taux2, p.plafond2);
    return { t1, t2, tot: t1 + t2 };
  };
  const e10 = cotis(20_000);
  verifier("FSS M10", RES.M10.detail.cotisations.fss, e10.tot);
  const e11a = cotis(30_000);
  const e11b = cotis(10_000);
  verifier("FSS M11", RES.M11.detail.cotisations.fss, e11a.tot + e11b.tot);
  const e12 = cotis(110_000);
  verifier("FSS M12", RES.M12.detail.cotisations.fss, e12.tot);
  const e13 = cotis(12_000).tot + cotis(6000).tot;
  verifier("FSS M13", RES.M13.detail.cotisations.fss, e13);

  return fichier(
    "04-fss.tex",
    `Dans le modèle, seuls les \\emph{revenus de retraite} y sont assujettis
(le revenu d'emploi en est exclu) ; la cotisation se calcule \\emph{par
adulte}, en deux tranches additives de ${PC(p.taux1)}, plafonnées à
${D(p.plafond1)} et ${D(p.plafond2)} respectivement.`,
    [
      exemple(
        "M10",
        `${align(
          `\\text{tranche 1} &= \\min\\bigl(\\pos{${N(20_000)} - ${N(p.seuil1)}} \\times ${PC(p.taux1)},\\ ${N(p.plafond1)}\\bigr) = ${N(e10.t1)}`,
          `\\text{tranche 2} &= \\pos{${N(20_000)} - ${N(p.seuil2)}} \\times ${PC(p.taux2)} = 0`,
        )}
Cotisation FSS : ${D(e10.tot)}.`,
      ),
      exemple(
        "M11",
        `Par adulte : l'adulte~1 (${D(30_000)}) sature la tranche~1
(${N(30_000)} $-$ ${N(p.seuil1)} $=$ ${N(30_000 - p.seuil1)}, dont ${PC(p.taux1)}
excède le plafond de ${D(p.plafond1)}) ; l'adulte~2 (${D(10_000)}) est sous le
premier seuil.
${align(
  `\\text{adulte 1} &= \\min(${N((30_000 - p.seuil1) * p.taux1)},\\ ${N(p.plafond1)}) + 0 = ${N(e11a.tot)}`,
  `\\text{adulte 2} &= 0 \\quad (${N(10_000)} < ${N(p.seuil1)})`,
)}
Cotisation FSS du ménage : ${D(e11a.tot + e11b.tot)}.`,
      ),
      exemple(
        "M12",
        `Le revenu occupe les deux tranches :
${align(
  `\\text{tranche 1} &= \\min\\bigl(\\pos{${N(110_000)} - ${N(p.seuil1)}} \\times ${PC(p.taux1)},\\ ${N(p.plafond1)}\\bigr) = ${N(e12.t1)}`,
  `\\text{tranche 2} &= \\min\\bigl(\\pos{${N(110_000)} - ${N(p.seuil2)}} \\times ${PC(p.taux2)},\\ ${N(p.plafond2)}\\bigr) = ${N(e12.t2)}`,
  `\\text{cotisation} &= ${N(e12.t1)} + ${N(e12.t2)} = ${N(e12.tot)}`,
)}
Cotisation FSS : ${D(e12.tot)} (le maximum, ${D(p.plafond1 + p.plafond2)}, n'est
atteint qu'à ${D(p.seuil2 + p.plafond2 / p.taux2)} de revenu).`,
      ),
      exemple(
        "M13",
        `Les deux pensions (${D(12_000)} et ${D(6000)}) sont sous le premier
seuil de ${D(p.seuil1)} : cotisation nulle pour chacun des adultes —
${D(e13)} au total.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 5 — RAMQ
// ---------------------------------------------------------------------------

function p05ramq(): Fichier {
  const p = RAMQ[AN];

  const prime = (code: string, nbAdultes: 1 | 2, nbEnfants: number) => {
    const rfn = RES[code].revenuNetFamilial;
    const exemption = p.exemption[nbAdultes][Math.min(nbEnfants, 2)];
    const base = Math.max(0, rfn - exemption);
    const t = p.taux[nbAdultes];
    const parAdulte = Math.min(
      t.tranche1 * Math.min(p.largeurTranche1, base) + t.tranche2 * Math.max(0, base - p.largeurTranche1),
      p.primeMax,
    );
    return { rfn, exemption, base, t, parAdulte };
  };

  const e3 = prime("M3", 1, 0);
  verifier("RAMQ M3", RES.M3.detail.cotisations.ramq, e3.base === 0 ? 0 : e3.parAdulte);
  const e4 = prime("M4", 1, 0);
  verifier("RAMQ M4", RES.M4.detail.cotisations.ramq, e4.parAdulte);
  const e6 = prime("M6", 1, 1);
  verifier("RAMQ M6", RES.M6.detail.cotisations.ramq, e6.parAdulte);
  const e13 = prime("M13", 2, 0);
  verifier("RAMQ M13", RES.M13.detail.cotisations.ramq, 2 * e13.parAdulte);
  verifier("RAMQ M1", RES.M1.detail.cotisations.ramq, 0);

  return fichier(
    "05-ramq.tex",
    `La prime se calcule sur le \\emph{revenu familial net} ($\\RFN$,
tableau~\\ref{tab:bases-exemples}), jamais sur le revenu brut.`,
    [
      exemple(
        "M3",
        `Son $\\RFN$ de ${N(e3.rfn)} est \\emph{sous} le seuil d'exonération
(1~adulte, 0~enfant : ${D(e3.exemption)}) : base cotisable nulle, prime nulle.`,
      ),
      exemple(
        "M4",
        `${align(
          `b &= \\pos{${N(e4.rfn)} - ${N(e4.exemption)}} = ${N(e4.base)}`,
          `\\text{prime} &= \\min\\bigl(${PC(e4.t.tranche1)} \\times ${N(p.largeurTranche1)} + ${PC(e4.t.tranche2)} \\times ${N(e4.base - p.largeurTranche1)},\\ ${N(p.primeMax)}\\bigr)`,
          `&= \\min(${N(e4.t.tranche1 * p.largeurTranche1)} + ${N(e4.t.tranche2 * (e4.base - p.largeurTranche1))},\\ ${N(p.primeMax)}) = ${N(e4.parAdulte)}`,
        )}
La somme des deux tranches dépasse largement la prime maximale : prime
\\emph{plafonnée} à ${D(e4.parAdulte)}.`,
      ),
      exemple(
        "M6",
        `Avec un enfant, le seuil d'exonération passe à ${D(e6.exemption)} :
${align(
  `b &= \\pos{${N(e6.rfn)} - ${N(e6.exemption)}} = ${N(e6.base)}`,
  `\\text{prime} &= ${PC(e6.t.tranche1)} \\times \\min(${N(p.largeurTranche1)},\\ ${N(e6.base)}) = ${N(e6.parAdulte)}`,
)}
La base reste dans la première tranche : prime \\emph{partielle} de
${D(e6.parAdulte)}.`,
      ),
      exemple(
        "M13",
        `Couple : barème à demi-taux, seuil de ${D(e13.exemption)}, et la prime
calculée sur le revenu familial commun est payée par \\emph{chacun} des deux
adultes.
${align(
  `b &= \\pos{${N(e13.rfn)} - ${N(e13.exemption)}} = ${N(e13.base)}`,
  `\\text{prime par adulte} &= ${PC(e13.t.tranche1)} \\times ${N(p.largeurTranche1)} + ${PC(e13.t.tranche2)} \\times ${N(e13.base - p.largeurTranche1)} = ${N(e13.parAdulte)}`,
  `\\text{ménage} &= 2 \\times ${N(e13.parAdulte)} = ${N(2 * e13.parAdulte)}`,
)}
Prime du ménage : ${D(2 * e13.parAdulte)}.`,
      ),
      exemple(
        "M1",
        `Ce ménage reçoit l'aide de dernier recours (poste~13) : chaque adulte
prestataire est \\emph{exonéré individuellement} — prime nulle, quel que soit
le calcul ci-dessus.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 6 — Frais de garde (crédit QC + déduction fédérale + coût)
// ---------------------------------------------------------------------------

function p06garde(): Fichier {
  const p = GARDE[AN];

  // M6 — garde subventionnée : pas de crédit QC ; déduction fédérale ; coût.
  const dedM6 = Math.min(2000, p.plafondFedJeune, (2 / 3) * 35_000);
  verifier("Garde M6 (crédit)", RES.M6.detail.transfertsQuebec.fraisGarde, 0);
  verifier("Garde M6 (coût)", RES.M6.detail.fraisGardeCout, 2000);

  // M8 — non subventionnée : crédit (plafond agrégé), déduction (plafond agrégé), coût.
  const r8 = RES.M8;
  const taux8 = tauxCreditGarde(r8.revenuNetFamilial, AN);
  const plafQC8 = plafondFraisEnfant(4, AN) + plafondFraisEnfant(8, AN);
  const fraisAdm8 = Math.min(plafQC8, 13_000 + 3000);
  const credit8 = cent(taux8 * fraisAdm8);
  verifier("Garde M8 (crédit)", r8.detail.transfertsQuebec.fraisGarde, credit8);
  const plafFed8 = plafondFederalEnfant(4, AN) + plafondFederalEnfant(8, AN);
  const ded8 = Math.min(16_000, plafFed8, (2 / 3) * 40_000);
  verifier("Garde M8 (coût)", r8.detail.fraisGardeCout, 16_000);

  // M9 — haut revenu : taux plancher, plafond « jeune » mordant.
  const r9 = RES.M9;
  const taux9 = tauxCreditGarde(r9.revenuNetFamilial, AN);
  const fraisAdm9 = Math.min(plafondFraisEnfant(5, AN), 15_000);
  const credit9 = cent(taux9 * fraisAdm9);
  verifier("Garde M9 (crédit)", r9.detail.transfertsQuebec.fraisGarde, credit9);
  const ded9 = Math.min(15_000, plafondFederalEnfant(5, AN), (2 / 3) * 60_000);

  return fichier(
    "06-garde.tex",
    `Trois effets distincts sur le revenu disponible : le \\textbf{crédit
québécois} (frais \\emph{non subventionnés} seulement), la \\textbf{déduction
fédérale} (tous les frais ; elle réduit l'$\\AFNI$, donc augmente l'ACE et le
crédit TPS, et réduit l'impôt fédéral — postes~14, 15 et 19), et le
\\textbf{coût} des frais payés, soustrait du revenu disponible.`,
    [
      exemple(
        "M6",
        `Garde \\emph{subventionnée} : aucun frais admissible au crédit
québécois (crédit nul). La déduction fédérale, elle, s'applique :
${align(
  `\\text{déduction} &= \\min\\bigl(${N(2000)},\\ ${N(p.plafondFedJeune)},\\ \\tfrac{2}{3} \\times ${N(35_000)}\\bigr) = ${N(dedM6)}`,
)}
Elle abaisse l'$\\AFNI$ de ${N(35_000 - 315)} à ${N(RES.M6.afni)} (le poste~19
détaille la soustraction de la cotisation RRQ supplémentaire). Enfin, les
${D(2000)} payés sont soustraits du revenu disponible.`,
      ),
      exemple(
        "M8",
        `Frais non subventionnés de ${D(13_000)} (4~ans) et ${D(3000)}
(8~ans). Le plafonnement québécois est \\emph{agrégé} : on additionne d'abord
les plafonds des enfants concernés, puis on borne la \\emph{somme} des frais.
${align(
  `\\text{plafonds} &= ${N(p.plafondJeune)} + ${N(p.plafondAutre)} = ${N(plafQC8)}`,
  `\\text{frais admissibles} &= \\min(${N(plafQC8)},\\ ${N(16_000)}) = ${N(fraisAdm8)}`,
  `\\text{crédit} &= ${PC(taux8)} \\times ${N(fraisAdm8)} = ${N(credit8)}`,
)}
Le taux de ${PC(taux8)} découle du $\\RFN$ de ${N(r8.revenuNetFamilial)}
(barème de 78\\,\\% à 67\\,\\%). Noter l'effet du plafond agrégé : l'enfant de
4~ans dépasse à lui seul son plafond de ${N(p.plafondJeune)}, mais l'excédent
est « absorbé » par le plafond inutilisé de l'autre enfant — les ${N(16_000)}
sont admissibles en entier. Au fédéral, le plafonnement est agrégé aussi :
${align(
  `\\text{déduction} &= \\min\\bigl(${N(16_000)},\\ ${N(p.plafondFedJeune)} + ${N(p.plafondFedAutre)},\\ \\tfrac{2}{3} \\times ${N(40_000)}\\bigr) = ${N(ded8)}`,
)}
(la borne de $\\tfrac{2}{3}$ porte sur le revenu de travail du conjoint le
moins payé). Coût soustrait du revenu disponible : ${D(16_000)}.`,
      ),
      exemple(
        "M9",
        `$\\RFN$ de ${N(r9.revenuNetFamilial)} : au-delà du dernier seuil du
barème, le taux est au \\emph{plancher} de ${PC(taux9)}.
${align(
  `\\text{frais admissibles} &= \\min(${N(plafondFraisEnfant(5, AN))},\\ ${N(15_000)}) = ${N(fraisAdm9)}`,
  `\\text{crédit} &= ${PC(taux9)} \\times ${N(fraisAdm9)} = ${N(credit9)}`,
)}
Déduction fédérale : $\\min(${N(15_000)},\\ ${N(plafondFederalEnfant(5, AN))},\\
\\tfrac{2}{3} \\times ${N(60_000)}) = ${N(ded9)}$. Coût soustrait : ${D(15_000)}.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 7 — Allocation famille (+ fournitures scolaires)
// ---------------------------------------------------------------------------

function p07famille(): Fichier {
  const p = ALLOCATION_FAMILLE[AN];

  const calc = (code: string, nbEnfants: number, mono: boolean) => {
    const rfn = RES[code].revenuNetFamilial;
    const maximum = nbEnfants * p.maxParEnfant + (mono ? p.suppMonoMax : 0);
    const minimum = nbEnfants * p.minParEnfant + (mono ? p.suppMonoMin : 0);
    const seuil = mono ? p.seuilMonoparental : p.seuilCouple;
    const reduction = Math.max(0, rfn - seuil) * p.tauxReduction;
    const alloc = cent(Math.max(minimum, maximum - reduction));
    verifier(`Allocation famille ${code}`, RES[code].detail.transfertsQuebec.allocationFamille, alloc);
    return { rfn, maximum, minimum, seuil, reduction, alloc };
  };

  const e6 = calc("M6", 1, true);
  const e8 = calc("M8", 2, false);
  const e9 = calc("M9", 1, false);
  const sfs = (code: string, n: number) => {
    const v = n * p.supplementFournitures;
    verifier(`Fournitures ${code}`, RES[code].detail.transfertsQuebec.fournituresScolaires, v);
    return v;
  };
  const sfs6 = sfs("M6", 0);
  const sfs8 = sfs("M8", 2);
  const sfs9 = sfs("M9", 1);

  return fichier(
    "07-allocation-famille.tex",
    `Le montant maximal (par enfant, plus le supplément monoparental le cas
échéant) est réduit de ${PC(p.tauxReduction)} du $\\RFN$ excédant le seuil,
sans jamais descendre sous le montant minimal. Le supplément pour fournitures
scolaires (${D(p.supplementFournitures)} par enfant de 4 à 16~ans) s'ajoute
sans égard au revenu.`,
    [
      exemple(
        "M6",
        `$\\RFN$ de ${N(e6.rfn)}, sous le seuil monoparental de ${N(e6.seuil)} :
aucune réduction, l'allocation est maximale.
${align(
  `\\text{maximum} &= ${N(p.maxParEnfant)} + ${N(p.suppMonoMax)} = ${N(e6.maximum)}`,
  `\\text{allocation} &= ${N(e6.maximum)} - 0 = ${N(e6.alloc)}`,
)}
L'enfant a 3~ans : pas de supplément pour fournitures scolaires
(${D(sfs6)} — il vise les 4 à 16~ans).`,
      ),
      exemple(
        "M8",
        `${align(
          `\\text{maximum} &= 2 \\times ${N(p.maxParEnfant)} = ${N(e8.maximum)}`,
          `\\text{réduction} &= \\pos{${N(e8.rfn)} - ${N(e8.seuil)}} \\times ${PC(p.tauxReduction)} = ${N(e8.reduction)}`,
          `\\text{allocation} &= \\max\\bigl(${N(e8.minimum)},\\ ${N(e8.maximum)} - ${N(e8.reduction)}\\bigr) = ${N(e8.alloc)}`,
        )}
Le plancher (montant minimal, ${N(e8.minimum)}) ne mord pas encore :
allocation de ${D(e8.alloc)}, plus ${D(sfs8)} de fournitures scolaires
($2 \\times ${N(p.supplementFournitures)}$, enfants de 4 et 8~ans).`,
      ),
      exemple(
        "M9",
        `$\\RFN$ de ${N(e9.rfn)} : la réduction (${N(e9.reduction)}) dépasse
l'écart entre maximum (${N(e9.maximum)}) et minimum (${N(e9.minimum)}) —
l'allocation est au \\emph{plancher}.
${align(
  `\\text{allocation} &= \\max\\bigl(${N(e9.minimum)},\\ ${N(e9.maximum)} - ${N(e9.reduction)}\\bigr) = ${N(e9.alloc)}`,
)}
Toute famille admissible reçoit au moins le minimum, ici ${D(e9.alloc)},
plus ${D(sfs9)} de fournitures scolaires.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 8 — Prime au travail
// ---------------------------------------------------------------------------

function p08prime(): Fichier {
  const p = PRIME_TRAVAIL[AN];

  const calc = (code: string, revenuTravail: number, nbAdultes: 1 | 2, enfants: boolean) => {
    const t = p.parType[nbAdultes][enfants ? "avecEnfants" : "sansEnfants"];
    const rfn = RES[code].revenuNetFamilial;
    const croissance = Math.min(Math.max(0, revenuTravail - t.revenuTravailExclu) * t.tauxCroissance, t.primeMax);
    const reduction = Math.max(0, rfn - t.seuilReduction) * p.tauxReduction;
    const prime = cent(Math.max(0, croissance - reduction));
    verifier(`Prime travail ${code}`, RES[code].detail.transfertsQuebec.primeTravail, prime);
    return { t, rfn, croissance, reduction, prime };
  };

  const e3 = calc("M3", 15_000, 1, false);
  const e6 = calc("M6", 35_000, 1, true);
  const e7 = calc("M7", 30_000, 2, false);
  const e4 = calc("M4", 50_000, 1, false);

  return fichier(
    "08-prime-travail.tex",
    `Deux mouvements : la prime \\emph{croît} sur le revenu de travail au-delà
d'un montant exclu (jusqu'au maximum du type de ménage), puis elle est
\\emph{réduite} de ${PC(p.tauxReduction)} du $\\RFN$ excédant le seuil de
réduction.`,
    [
      exemple(
        "M3",
        `Personne seule sans enfant (taux de croissance ${PC(e3.t.tauxCroissance)},
maximum ${N(e3.t.primeMax)}) :
${align(
  `\\text{croissance} &= \\min\\bigl(\\pos{${N(15_000)} - ${N(e3.t.revenuTravailExclu)}} \\times ${PC(e3.t.tauxCroissance)},\\ ${N(e3.t.primeMax)}\\bigr) = ${N(e3.croissance)}`,
  `\\text{réduction} &= \\pos{${N(e3.rfn)} - ${N(e3.t.seuilReduction)}} \\times ${PC(p.tauxReduction)} = ${N(e3.reduction)}`,
  `\\text{prime} &= ${N(e3.croissance)} - ${N(e3.reduction)} = ${N(e3.prime)}`,
)}
La croissance est \\emph{plafonnée} au maximum ; la réduction commence à
peine ($\\RFN$ de ${N(e3.rfn)}) : prime de ${D(e3.prime)}.`,
      ),
      exemple(
        "M6",
        `Famille monoparentale : taux de croissance \\emph{majoré} à
${PC(e6.t.tauxCroissance)}, maximum de ${N(e6.t.primeMax)}.
${align(
  `\\text{croissance} &= \\min\\bigl(${N(35_000 - e6.t.revenuTravailExclu)} \\times ${PC(e6.t.tauxCroissance)},\\ ${N(e6.t.primeMax)}\\bigr) = ${N(e6.croissance)}`,
  `\\text{réduction} &= \\pos{${N(e6.rfn)} - ${N(e6.t.seuilReduction)}} \\times ${PC(p.tauxReduction)} = ${N(e6.reduction)}`,
  `\\text{prime} &= \\pos{${N(e6.croissance)} - ${N(e6.reduction)}} = ${N(e6.prime)}`,
)}
Prime au travail : ${D(e6.prime)}.`,
      ),
      exemple(
        "M7",
        `Couple sans enfant (exclusion de ${N(e7.t.revenuTravailExclu)},
seuil de réduction de ${N(e7.t.seuilReduction)}) :
${align(
  `\\text{croissance} &= \\min\\bigl(${N(30_000 - e7.t.revenuTravailExclu)} \\times ${PC(e7.t.tauxCroissance)},\\ ${N(e7.t.primeMax)}\\bigr) = ${N(e7.croissance)}`,
  `\\text{réduction} &= \\pos{${N(e7.rfn)} - ${N(e7.t.seuilReduction)}} \\times ${PC(p.tauxReduction)} = ${N(e7.reduction)}`,
  `\\text{prime} &= \\pos{${N(e7.croissance)} - ${N(e7.reduction)}} = ${N(e7.prime)}`,
)}
Prime au travail : ${D(e7.prime)}.`,
      ),
      exemple(
        "M4",
        `La croissance est plafonnée à ${N(e4.t.primeMax)}, mais la réduction
(${PC(p.tauxReduction)} de ${N(e4.rfn)} $-$ ${N(e4.t.seuilReduction)} $=$
${N(e4.reduction)}) l'emporte largement : prime \\emph{éteinte} (${D(e4.prime)}).`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 9 — Crédit pour la solidarité
// ---------------------------------------------------------------------------

function p09solidarite(): Fichier {
  const p = SOLIDARITE[AN];

  const calc = (code: string, nbAdultes: 1 | 2, nbEnfants: number) => {
    const rfn = RES[code].revenuNetFamilial;
    const couple = nbAdultes === 2;
    const tvq = p.tvqBase + (couple ? p.tvqConjoint : p.tvqAdditionnelSeule);
    const logement = (couple ? p.logementCouple : p.logementSeule) + nbEnfants * p.logementParEnfant;
    const reduction = Math.max(0, rfn - p.seuilReduction) * p.tauxReduction;
    const credit = cent(Math.max(0, tvq + logement - reduction));
    verifier(`Solidarité ${code}`, RES[code].detail.transfertsQuebec.solidarite, credit);
    return { rfn, tvq, logement, reduction, credit };
  };

  const e3 = calc("M3", 1, 0);
  const e4 = calc("M4", 1, 0);
  const e8 = calc("M8", 2, 2);
  const e5 = calc("M5", 1, 0);

  return fichier(
    "09-solidarite.tex",
    `Deux volets (TVQ et logement) puis une réduction de ${PC(p.tauxReduction)}
du $\\RFN$ au-delà de ${D(p.seuilReduction)}.`,
    [
      exemple(
        "M3",
        `${align(
          `\\text{volet TVQ} &= ${N(p.tvqBase)} + ${N(p.tvqAdditionnelSeule)} = ${N(e3.tvq)} \\quad (\\text{base} + \\text{vivant seul})`,
          `\\text{volet logement} &= ${N(e3.logement)}`,
          `\\text{réduction} &= 0 \\quad (\\RFN = ${N(e3.rfn)} < ${N(p.seuilReduction)})`,
        )}
Crédit \\emph{plein} : ${D(e3.credit)}.`,
      ),
      exemple(
        "M4",
        `Mêmes volets (${N(e4.tvq)} et ${N(e4.logement)}), mais le $\\RFN$
excède le seuil :
${align(
  `\\text{réduction} &= \\pos{${N(e4.rfn)} - ${N(p.seuilReduction)}} \\times ${PC(p.tauxReduction)} = ${N(e4.reduction)}`,
  `\\text{crédit} &= \\pos{${N(e4.tvq + e4.logement)} - ${N(e4.reduction)}} = ${N(e4.credit)}`,
)}
Crédit \\emph{partiel} : ${D(e4.credit)}.`,
      ),
      exemple(
        "M8",
        `Couple avec deux enfants :
${align(
  `\\text{volet TVQ} &= ${N(p.tvqBase)} + ${N(p.tvqConjoint)} = ${N(e8.tvq)}`,
  `\\text{volet logement} &= ${N(p.logementCouple)} + 2 \\times ${N(p.logementParEnfant)} = ${N(e8.logement)}`,
  `\\text{réduction} &= \\pos{${N(e8.rfn)} - ${N(p.seuilReduction)}} \\times ${PC(p.tauxReduction)} = ${N(e8.reduction)}`,
  `\\text{crédit} &= \\pos{${N(e8.tvq + e8.logement)} - ${N(e8.reduction)}} = ${N(e8.credit)}`,
)}
Crédit : ${D(e8.credit)}.`,
      ),
      exemple(
        "M5",
        `La réduction (${PC(p.tauxReduction)} de ${N(e5.rfn)} $-$
${N(p.seuilReduction)} $=$ ${N(e5.reduction)}) dépasse la somme des volets
(${N(e5.tvq + e5.logement)}) : crédit \\emph{éteint} (${D(e5.credit)}).`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 10 — Allocation-logement
// ---------------------------------------------------------------------------

function p10logement(): Fichier {
  const p = ALLOCATION_LOGEMENT[AN];

  const calc = (code: string, loyer: number, seuil: number) => {
    const ral = RES[code].revenuAL;
    const effort = Math.round(((loyer * 12) / ral) * 10_000) / 10_000;
    const mensuel = effort < 0.3 ? 0 : effort < 0.5 ? p.montant30 : effort < 0.8 ? p.montant50 : p.montant80;
    const reduction = Math.max(0, ral - seuil);
    const alloc = Math.max(0, mensuel * 12 - reduction);
    verifier(`Allocation-logement ${code}`, RES[code].detail.transfertsQuebec.allocationLogement, alloc);
    return { ral, effort, mensuel, reduction, alloc };
  };

  const e6 = calc("M6", p.loyerImpute[1][1], p.seuilMoyen);
  const e10 = calc("M10", p.loyerImpute[1][0], p.seuilSeul0);
  const e13 = calc("M13", p.loyerImpute[2][0], p.seuilCouple0);
  verifier("Allocation-logement M7", RES.M7.detail.transfertsQuebec.allocationLogement, 0);

  return fichier(
    "10-allocation-logement.tex",
    `Le modèle \\emph{impute} le loyer selon la composition du ménage, calcule
le taux d'effort (loyer annuel $\\div$ revenu $\\RAL$, arrondi à quatre
décimales), convertit ce taux en montant mensuel (0, ${D(p.montant30)},
${D(p.montant50)} ou ${D(p.montant80)}), puis réduit le montant annuel
\\emph{dollar pour dollar} au-delà du seuil de revenu.`,
    [
      exemple(
        "M6",
        `Admissible (un enfant à charge). Loyer imputé (1~adulte, 1~enfant) :
${D(p.loyerImpute[1][1])} par mois.
${align(
  `\\text{effort} &= \\frac{${N(p.loyerImpute[1][1])} \\times 12}{${N(e6.ral)}} = ${ft(e6.effort)} \\ \\Rightarrow\\ ${N(e6.mensuel)}\\,\\$/\\text{mois}`,
  `\\text{réduction} &= \\pos{${N(e6.ral)} - ${N(p.seuilMoyen)}} = ${N(e6.reduction)}`,
  `\\text{allocation} &= ${N(e6.mensuel)} \\times 12 - ${N(e6.reduction)} = ${N(e6.alloc)}`,
)}
Allocation-logement : ${D(e6.alloc)} par année.`,
      ),
      exemple(
        "M10",
        `Admissible (50~ans et plus). Le revenu $\\RAL$ retranche du $\\RFN$
une fraction des pensions (équation~\\eqref{eq:ral}) : ${N(e10.ral)}.
${align(
  `\\text{effort} &= \\frac{${N(p.loyerImpute[1][0])} \\times 12}{${N(e10.ral)}} = ${ft(e10.effort)} \\ \\Rightarrow\\ ${N(e10.mensuel)}\\,\\$/\\text{mois}`,
  `\\text{réduction} &= \\pos{${N(e10.ral)} - ${N(p.seuilSeul0)}} = ${N(e10.reduction)}`,
  `\\text{allocation} &= \\pos{${N(e10.mensuel * 12)} - ${N(e10.reduction)}} = ${N(e10.alloc)}`,
)}
La réduction dollar pour dollar gruge une partie du montant :
${D(e10.alloc)} par année.`,
      ),
      exemple(
        "M13",
        `Couple d'aînés, loyer imputé de ${D(p.loyerImpute[2][0])} :
${align(
  `\\text{effort} &= \\frac{${N(p.loyerImpute[2][0])} \\times 12}{${N(e13.ral)}} = ${ft(e13.effort)} \\ \\Rightarrow\\ ${N(e13.mensuel)}\\,\\$/\\text{mois}`,
  `\\text{réduction} &= \\pos{${N(e13.ral)} - ${N(p.seuilCouple0)}} = ${N(e13.reduction)}`,
  `\\text{allocation} &= ${N(e13.mensuel)} \\times 12 - ${N(e13.reduction)} = ${N(e13.alloc)}`,
)}
Allocation-logement : ${D(e13.alloc)} par année.`,
      ),
      exemple(
        "M7",
        `Aucun adulte de 50~ans ou plus et aucun enfant : ménage
\\emph{inadmissible}, allocation nulle — quel que soit son revenu.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 11 — Soutien aux aînés
// ---------------------------------------------------------------------------

function p11aines(): Fichier {
  const p = SOUTIEN_AINES[AN];

  const calc = (code: string, nbAines: number, seuil: number) => {
    const rfn = RES[code].revenuNetFamilial;
    const montantMax = nbAines * p.montantParAine;
    const reduction = Math.max(0, rfn - seuil) * p.tauxReduction;
    const credit = Math.max(0, montantMax - reduction);
    verifier(`Soutien aînés ${code}`, RES[code].detail.transfertsQuebec.soutienAines, credit);
    return { rfn, montantMax, reduction, credit };
  };

  const e10 = calc("M10", 1, p.seuilSeul);
  const e11 = calc("M11", 2, p.seuilCouple);
  const e12 = calc("M12", 1, p.seuilSeul);

  return fichier(
    "11-soutien-aines.tex",
    `${D(p.montantParAine)} par adulte de ${ft(p.ageAdmissible)}~ans et plus,
réduits de ${PC(p.tauxReduction)} du $\\RFN$ excédant le seuil (${D(p.seuilSeul)}
pour un adulte seul ; ${D(p.seuilCouple)} pour un couple).`,
    [
      exemple(
        "M10",
        `${align(
          `\\text{réduction} &= \\pos{${N(e10.rfn)} - ${N(p.seuilSeul)}} \\times ${PC(p.tauxReduction)} = ${N(e10.reduction)}`,
          `\\text{crédit} &= ${N(e10.montantMax)} - ${N(e10.reduction)} = ${N(e10.credit)}`,
        )}
Le $\\RFN$ (${N(e10.rfn)}) inclut la Sécurité de la vieillesse, pas seulement
la pension privée. Crédit : ${D(e10.credit)}.`,
      ),
      exemple(
        "M11",
        `Les deux conjoints ont 70~ans et plus : montant maximal de
$2 \\times ${N(p.montantParAine)} = ${N(e11.montantMax)}$.
${align(
  `\\text{réduction} &= \\pos{${N(e11.rfn)} - ${N(p.seuilCouple)}} \\times ${PC(p.tauxReduction)} = ${N(e11.reduction)}`,
  `\\text{crédit} &= ${N(e11.montantMax)} - ${N(e11.reduction)} = ${N(e11.credit)}`,
)}
Crédit : ${D(e11.credit)}.`,
      ),
      exemple(
        "M12",
        `Le $\\RFN$ (${N(e12.rfn)}) est si élevé que la réduction
(${N(e12.reduction)}) dépasse le montant maximal : crédit \\emph{éteint}
(${D(e12.credit)}). À noter : M13 (68 et 66~ans) n'y a pas droit non plus —
l'âge d'admissibilité est ${ft(p.ageAdmissible)}~ans, pas 65.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 12 — Frais médicaux QC (structurellement nul dans le modèle)
// ---------------------------------------------------------------------------

function p12medQC(): Fichier {
  const p = FRAIS_MEDICAUX[AN];
  const demo = (code: string) => {
    const r = RES[code];
    const prime = r.detail.cotisations.ramq;
    const plancher = p.seuilFrais * r.revenuNetFamilial;
    verifier(`Frais médicaux QC ${code}`, r.detail.transfertsQuebec.fraisMedicaux, 0);
    return { prime, plancher, rfn: r.revenuNetFamilial };
  };
  const e4 = demo("M4");
  const e10 = demo("M10");

  return fichier(
    "12-frais-medicaux.tex",
    `Pourquoi ce poste vaut toujours zéro dans le modèle : la seule dépense
médicale qu'il connaît est la prime RAMQ (poste~5), et celle-ci ne dépasse
jamais le plancher de ${PC(p.seuilFrais)} du revenu familial net.`,
    [
      exemple(
        "M4",
        `Prime RAMQ de ${D(e4.prime)} ; plancher de ${PC(p.seuilFrais)}
$\\times$ ${N(e4.rfn)} $=$ ${N(cent(e4.plancher))}. Les frais admissibles
$\\pos{${N(e4.prime)} - ${N(cent(e4.plancher))}}$ sont nuls : crédit nul.`,
      ),
      exemple(
        "M10",
        `Même constat pour un retraité : prime de ${D(e10.prime)}, plancher de
${N(cent(e10.plancher))}. La prime maximale (${D(RAMQ[AN].primeMax)} par
adulte) resterait sous le plancher dès que le $\\RFN$ dépasse environ
${D(RAMQ[AN].primeMax / p.seuilFrais)} — or il faut un $\\RFN$ bien supérieur
pour devoir la prime maximale : le crédit ne peut jamais s'ouvrir.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 13 — Aide de dernier recours
// ---------------------------------------------------------------------------

function p13aide(): Fichier {
  const p = AIDE_SOCIALE[AN];

  // M1 : aucun revenu, 25 ans, seul sans enfant → base + ajustement « jeune ».
  const base1 = p.baseSeul + p.ajustJeuneSeul;
  const aide1 = base1 * 12;
  verifier("Aide sociale M1", RES.M1.detail.transfertsQuebec.aideSociale, aide1);

  // M2 : 9 000 $ de travail → exemption, réduction, incitation 25 %.
  const cot2 = cent(
    cotisationRRQ(9000, AN).total + Math.min(9000, RQAP[AN].maxAssurable) * RQAP[AN].taux + 9000 * AE[AN].taux,
  );
  const net2 = 9000 - cot2;
  const gains2 = Math.max(0, net2 / 12 - p.exemptionSeul);
  const nette2 = Math.max(0, p.baseSeul + p.ajustJeuneSeul - gains2);
  const incit2 = p.tauxIncitation * gains2;
  const aide2 = (nette2 + incit2) * 12;
  verifier("Aide sociale M2", RES.M2.detail.transfertsQuebec.aideSociale, aide2);

  // M6 : monoparentale, enfant < 5 ans → ajustement « contrainte temporaire », mais revenu trop élevé.
  verifier("Aide sociale M6", RES.M6.detail.transfertsQuebec.aideSociale, 0);
  // M7 : couple, 30 000 $ → revenu compté ≥ prestation de base.
  verifier("Aide sociale M7", RES.M7.detail.transfertsQuebec.aideSociale, 0);

  return fichier(
    "13-aide-sociale.tex",
    `Calcul \\emph{mensuel} puis annualisé : prestation de base (selon la
composition et l'âge), moins le revenu de travail \\emph{net des cotisations}
au-delà de l'exemption mensuelle (${D(p.exemptionSeul)} pour un adulte seul,
${D(p.exemptionCouple)} pour un couple) ; si la prestation reste positive,
${PC(p.tauxIncitation)} des gains comptés sont remboursés (incitation au
travail).`,
    [
      exemple(
        "M1",
        `Aucun revenu. Adulte seul de moins de 50~ans sans enfant : ajustement
de ${D(p.ajustJeuneSeul)} en sus de la base de ${D(p.baseSeul)}.
${align(
  `\\text{prestation mensuelle} &= ${N(p.baseSeul)} + ${N(p.ajustJeuneSeul)} = ${N(base1)}`,
  `\\text{aide annuelle} &= ${N(base1)} \\times 12 = ${N(aide1)}`,
)}
Aide de dernier recours : ${D(aide1)}.`,
      ),
      exemple(
        "M2",
        `Revenu de travail de ${D(9000)}, net des cotisations (postes 1 à 3)
${D(cot2)}, soit ${D(net2)} par année.
${align(
  `\\text{gains comptés} &= \\pos{${N(net2)} \\div 12 - ${N(p.exemptionSeul)}} = ${N(gains2)}`,
  `\\text{prestation nette} &= \\pos{${N(base1)} - ${N(gains2)}} = ${N(nette2)}`,
  `\\text{incitation} &= ${PC(p.tauxIncitation)} \\times ${N(gains2)} = ${N(incit2)}`,
  `\\text{aide annuelle} &= (${N(nette2)} + ${N(incit2)}) \\times 12 = ${N(aide2)}`,
)}
Aide de dernier recours : ${D(aide2)}. Noter le rôle de l'exemption de
${D(p.exemptionSeul)} par mois et de l'incitation au travail de
${PC(p.tauxIncitation)}.`,
      ),
      exemple(
        "M6",
        `Parent seul d'un enfant de moins de 5~ans : la prestation de base
serait majorée de l'ajustement « contrainte temporaire à l'emploi »
(${D(p.ajust58Seul)}). Mais les gains comptés
($\\approx ${N(cent(Math.max(0, (35_000 - cent(cotisationRRQ(35_000, AN).total + 35_000 * RQAP[AN].taux + 35_000 * AE[AN].taux)) / 12 - p.exemptionSeul)))}$
par mois) dépassent largement cette base : prestation nulle, donc pas
d'incitation non plus — aide de ${D(0)}.`,
      ),
      exemple(
        "M7",
        `Couple (base de ${D(p.baseCouple)}, exemption de ${D(p.exemptionCouple)}) :
les gains de travail comptés excèdent la base — aide nulle. L'aide de dernier
recours s'éteint vite : c'est un programme de \\emph{dernier} recours.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 14 — Allocation canadienne pour enfants
// ---------------------------------------------------------------------------

function p14ace(): Fichier {
  const p = ACE[AN];

  const calc = (code: string, nbEnfants: number, nbMoins6: number) => {
    const afni = RES[code].afni;
    const max = nbMoins6 * p.maxJeune + (nbEnfants - nbMoins6) * p.maxAine;
    const i = Math.min(nbEnfants, 4) - 1;
    const bande1 = Math.max(0, Math.min(afni - p.seuil1, p.seuil2 - p.seuil1));
    const bande2 = Math.max(0, afni - p.seuil2);
    const reduction = p.tauxPalier1[i] * bande1 + p.tauxPalier2[i] * bande2;
    const ace = cent(Math.max(0, max - reduction));
    verifier(`ACE ${code}`, RES[code].detail.transfertsFederaux.allocationEnfants, ace);
    return { afni, max, t1: p.tauxPalier1[i], t2: p.tauxPalier2[i], bande1, bande2, reduction, ace };
  };

  const e6 = calc("M6", 1, 1);
  const e8 = calc("M8", 2, 1);
  const e9 = calc("M9", 1, 1);

  return fichier(
    "14-ace.tex",
    `La prestation maximale dépend de l'âge des enfants ; la réduction, de
l'$\\AFNI$ (tableau~\\ref{tab:bases-exemples}) et du \\emph{nombre} d'enfants
(taux par palier).`,
    [
      exemple(
        "M6",
        `Un enfant de moins de 6~ans (maximum ${N(p.maxJeune)}). L'$\\AFNI$ de
${N(e6.afni)} — abaissé par la déduction pour frais de garde (poste~6) — est
\\emph{sous} le premier seuil de ${N(p.seuil1)} : aucune réduction.
${align(`ACE &= ${N(e6.max)} - 0 = ${N(e6.ace)}`)}
Prestation \\emph{maximale} : ${D(e6.ace)}, non imposable.`,
      ),
      exemple(
        "M8",
        `Deux enfants (4 et 8~ans) : maximum de ${N(p.maxJeune)} $+$
${N(p.maxAine)} $=$ ${N(e8.max)} ; taux de réduction « 2~enfants »
(${PC(e8.t1)} puis ${PC(e8.t2)}).
${align(
  `\\text{bande 1} &= \\min\\bigl(\\AFNI - ${N(p.seuil1)},\\ ${N(p.seuil2 - p.seuil1)}\\bigr) = ${N(e8.bande1)}`,
  `\\text{bande 2} &= \\pos{${N(e8.afni)} - ${N(p.seuil2)}} = ${N(e8.bande2)}`,
  `\\text{réduction} &= ${PC(e8.t1)} \\times ${N(e8.bande1)} + ${PC(e8.t2)} \\times ${N(e8.bande2)} = ${N(e8.reduction)}`,
  `ACE &= ${N(e8.max)} - ${N(e8.reduction)} = ${N(e8.ace)}`,
)}
L'$\\AFNI$ (${N(e8.afni)}) bénéficie ici de la déduction fédérale pour frais
de garde de ${N(13_000)} (poste~6) : sans elle, la réduction serait plus
forte. ACE : ${D(e8.ace)}.`,
      ),
      exemple(
        "M9",
        `Un enfant de moins de 6~ans, $\\AFNI$ de ${N(e9.afni)} (taux
« 1~enfant » : ${PC(e9.t1)} puis ${PC(e9.t2)}).
${align(
  `\\text{réduction} &= ${PC(e9.t1)} \\times ${N(e9.bande1)} + ${PC(e9.t2)} \\times ${N(e9.bande2)} = ${N(e9.reduction)}`,
  `ACE &= \\pos{${N(e9.max)} - ${N(e9.reduction)}} = ${N(e9.ace)}`,
)}
Même à ce niveau de revenu, il reste ${D(e9.ace)} : le second palier ne
réduit qu'à ${PC(e9.t2)}.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 15 — Crédit TPS
// ---------------------------------------------------------------------------

function p15tps(): Fichier {
  const p = TPS[AN];

  const calc = (code: string, nbAdultes: 1 | 2, nbEnfants: number) => {
    const afni = RES[code].afni;
    const base = nbAdultes * p.baseAdulte + nbEnfants * p.parEnfant;
    const supplMono = nbAdultes === 1 && nbEnfants > 0 ? p.supplMonoparental : 0;
    const supplSeul =
      nbAdultes === 1 && nbEnfants === 0
        ? Math.max(0, Math.min(p.tauxPhaseIn * (afni - p.seuilPhaseIn), p.plafondPhaseIn))
        : 0;
    const reduction = Math.max(0, afni - p.seuilReduction) * p.tauxReduction;
    const credit = cent(Math.max(0, base + supplMono + supplSeul - reduction));
    verifier(`TPS ${code}`, RES[code].detail.transfertsFederaux.creditTPS, credit);
    return { afni, base, supplMono, supplSeul, reduction, credit };
  };

  const e3 = calc("M3", 1, 0);
  const e6 = calc("M6", 1, 1);
  const e4 = calc("M4", 1, 0);
  const e5 = calc("M5", 1, 0);

  return fichier(
    "15-tps.tex",
    `Montants de base par adulte (${D(p.baseAdulte)}) et par enfant
(${D(p.parEnfant)}), suppléments selon la composition, réduction de
${PC(p.tauxReduction)} de l'$\\AFNI$ au-delà de ${D(p.seuilReduction)}.`,
    [
      exemple(
        "M3",
        `Personne seule sans enfant : le \\emph{supplément pour célibataire}
s'accumule à ${PC(p.tauxPhaseIn)} de l'$\\AFNI$ au-delà de ${N(p.seuilPhaseIn)},
plafonné à ${N(p.plafondPhaseIn)}.
${align(
  `\\text{supplément} &= \\min\\bigl(${PC(p.tauxPhaseIn)} \\times (${N(e3.afni)} - ${N(p.seuilPhaseIn)}),\\ ${N(p.plafondPhaseIn)}\\bigr) = ${N(e3.supplSeul)}`,
  `\\text{crédit} &= ${N(p.baseAdulte)} + ${N(e3.supplSeul)} - 0 = ${N(e3.credit)}`,
)}
Crédit TPS : ${D(e3.credit)}.`,
      ),
      exemple(
        "M6",
        `Famille monoparentale : base adulte ${N(p.baseAdulte)} $+$ enfant
${N(p.parEnfant)} $+$ supplément monoparental ${N(p.supplMonoparental)} $=$
${N(e6.base + e6.supplMono)}. L'$\\AFNI$ (${N(e6.afni)}) est sous le seuil de
réduction : crédit \\emph{plein} de ${D(e6.credit)}.`,
      ),
      exemple(
        "M4",
        `${align(
          `\\text{total avant réduction} &= ${N(p.baseAdulte)} + ${N(e4.supplSeul)} = ${N(e4.base + e4.supplSeul)}`,
          `\\text{réduction} &= \\pos{${N(e4.afni)} - ${N(p.seuilReduction)}} \\times ${PC(p.tauxReduction)} = ${N(e4.reduction)}`,
          `\\text{crédit} &= \\pos{${N(e4.base + e4.supplSeul)} - ${N(e4.reduction)}} = ${N(e4.credit)}`,
        )}
Le supplément pour célibataire est au plafond (${N(e4.supplSeul)}), mais la
réduction mord : crédit de ${D(e4.credit)}.`,
      ),
      exemple(
        "M5",
        `La réduction (${N(e5.reduction)}) dépasse le total : crédit
\\emph{éteint} (${D(e5.credit)}).`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 16 — Allocation canadienne pour les travailleurs
// ---------------------------------------------------------------------------

function p16act(): Fichier {
  const p = ACT[AN];

  const calc = (code: string, revenuTravail: number, moindreNet: number, nbAdultes: 1 | 2, enfants: boolean) => {
    const t = p.parType[nbAdultes][enfants ? "avecEnfants" : "sansEnfants"];
    const afni = RES[code].afni;
    const exclusion = nbAdultes === 2 ? p.exclusionCouple : p.exclusionSeul;
    const phaseIn = Math.min(Math.max(0, revenuTravail - exclusion) * t.tauxPhaseIn, t.primeMax);
    const exemption = Math.min(p.exemptionSecondRevenu, moindreNet);
    const phaseOut = Math.max(0, afni - exemption - t.seuilReduction) * p.tauxReduction;
    const act = cent(Math.max(0, phaseIn - phaseOut));
    verifier(`ACT ${code}`, RES[code].detail.transfertsFederaux.allocationTravailleurs, act);
    return { t, afni, exclusion, phaseIn, exemption, phaseOut, act };
  };

  const e3 = calc("M3", 15_000, 0, 1, false);
  const moindreNetM8 = 40_000 - cotisationRRQ(40_000, AN).supplementaire;
  const e8 = calc("M8", 100_000, moindreNetM8, 2, true);
  const e7 = calc("M7", 30_000, 0, 2, false);
  const e4 = calc("M4", 50_000, 0, 1, false);

  return fichier(
    "16-act.tex",
    `Accumulation sur le revenu de \\emph{travail} (au-delà d'une exclusion),
réduction de ${PC(p.tauxReduction)} sur l'$\\AFNI$ — diminué, pour un couple,
de l'exemption du second revenu de travail (jusqu'à
${D(p.exemptionSecondRevenu)}).`,
    [
      exemple(
        "M3",
        `Personne seule sans enfant (taux d'accumulation de
${PC(e3.t.tauxPhaseIn)}, maximum de ${N(e3.t.primeMax)}) :
${align(
  `\\text{accumulation} &= \\min\\bigl(\\pos{${N(15_000)} - ${N(e3.exclusion)}} \\times ${PC(e3.t.tauxPhaseIn)},\\ ${N(e3.t.primeMax)}\\bigr) = ${N(e3.phaseIn)}`,
  `\\text{réduction} &= \\pos{${N(e3.afni)} - ${N(e3.t.seuilReduction)}} \\times ${PC(p.tauxReduction)} = ${N(e3.phaseOut)}`,
  `ACT &= ${N(e3.phaseIn)} - ${N(e3.phaseOut)} = ${N(e3.act)}`,
)}
L'accumulation est \\emph{plafonnée} ; la réduction commence à peine :
${D(e3.act)}.`,
      ),
      exemple(
        "M7",
        `Couple sans enfant, un seul revenu : le conjoint sans revenu n'apporte
aucune exemption de second revenu.
${align(
  `\\text{accumulation} &= \\min\\bigl(${N(30_000 - e7.exclusion)} \\times ${PC(e7.t.tauxPhaseIn)},\\ ${N(e7.t.primeMax)}\\bigr) = ${N(e7.phaseIn)}`,
  `\\text{réduction} &= \\pos{${N(e7.afni)} - 0 - ${N(e7.t.seuilReduction)}} \\times ${PC(p.tauxReduction)} = ${N(e7.phaseOut)}`,
  `ACT &= ${N(e7.phaseIn)} - ${N(e7.phaseOut)} = ${N(e7.act)}`,
)}
ACT : ${D(e7.act)}.`,
      ),
      exemple(
        "M8",
        `Couple avec enfants : maximum de ${N(e8.t.primeMax)} (vite atteint sur
${N(100_000)} de revenu de travail), mais l'exemption du second revenu
(${N(e8.exemption)}, le revenu de travail du conjoint le moins payé étant net
de la cotisation RRQ supplémentaire) ne suffit pas :
${align(
  `\\text{réduction} &= \\pos{${N(e8.afni)} - ${N(e8.exemption)} - ${N(e8.t.seuilReduction)}} \\times ${PC(p.tauxReduction)} = ${N(e8.phaseOut)}`,
)}
La réduction excède l'accumulation : ACT \\emph{éteinte} (${D(e8.act)}).`,
      ),
      exemple(
        "M4",
        `Accumulation au maximum (${N(e4.t.primeMax)}), mais l'$\\AFNI$ de
${N(e4.afni)} donne une réduction de ${N(e4.phaseOut)} : ACT éteinte
(${D(e4.act)}).`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 17 — Sécurité de la vieillesse (PSV + SRG + suppléments)
// ---------------------------------------------------------------------------

function p17psv(): Fichier {
  const p = PSV[AN];
  const floorT = (x: number, b: number) => Math.floor(x / b) * b;
  const ceilT = (x: number, b: number) => Math.ceil(x / b) * b;

  // M10 — seul, 70 ans, 20 000 $.
  const srg10 = Math.max(0, p.srgMaxSeul - floorT(20_000, p.srgTrancheSeul) * p.srgTauxSeul);
  const topup10 = Math.max(0, p.topupMaxSeul - ceilT(Math.max(0, 20_000 - p.topupExemptionSeul), p.topupTrancheSeul) * p.topupTaux);
  const total10 = cent(p.oasBase + srg10 + topup10);
  verifier("PSV M10", RES.M10.detail.transfertsFederaux.securiteVieillesse, total10);

  // M13 — couple 68/66, 18 000 $ combinés.
  const srg13 = Math.max(0, p.srgMaxCouple - floorT(18_000, p.srgTrancheCouple) * p.srgTauxCouple);
  const topup13 = Math.max(0, p.topupMaxCouple - ceilT(Math.max(0, 18_000 - p.topupExemptionCouple), p.topupTrancheCouple) * p.topupTaux);
  const total13 = cent(2 * p.oasBase + 2 * srg13 + topup13);
  verifier("PSV M13", RES.M13.detail.transfertsFederaux.securiteVieillesse, total13);

  // M11 — couple 72/70, 40 000 $ combinés : SRG éteint.
  const srg11 = Math.max(0, p.srgMaxCouple - floorT(40_000, p.srgTrancheCouple) * p.srgTauxCouple);
  const total11 = cent(2 * p.oasBase + 2 * srg11 + 0);
  verifier("PSV M11", RES.M11.detail.transfertsFederaux.securiteVieillesse, total11);

  // M12 — seul, 76 ans, 110 000 $ : récupération, supplément 75+.
  const base12 = p.oasBase + p.oas75;
  const recup12 = Math.max(0, 110_000 + base12 - p.seuilRecuperation) * p.tauxRecuperation;
  const total12 = cent(Math.max(0, base12 - recup12));
  verifier("PSV M12", RES.M12.detail.transfertsFederaux.securiteVieillesse, total12);

  return fichier(
    "17-securite-vieillesse.tex",
    `Les paramètres sont des moyennes annuelles des quatre barèmes
trimestriels (d'où les décimales). Le SRG et son supplément se calculent par
\\emph{tranches} de revenu (${N(p.srgTrancheSeul)}, ${N(p.srgTrancheCouple)} ou
${N(p.topupTrancheCouple)}~\\$) — le revenu de pension est arrondi à la tranche
avant d'appliquer le taux de réduction.`,
    [
      exemple(
        "M10",
        `Pension de base : ${N(p.oasBase)} (le revenu est loin du seuil de
récupération de ${N(p.seuilRecuperation)}). SRG (taux de ${PC(p.srgTauxSeul)},
tranches de ${N(p.srgTrancheSeul)}~\\$) :
${align(
  `\\text{revenu arrondi} &= \\Bigl\\lfloor \\tfrac{${N(20_000)}}{${N(p.srgTrancheSeul)}} \\Bigr\\rfloor \\times ${N(p.srgTrancheSeul)} = ${N(floorT(20_000, p.srgTrancheSeul))}`,
  `SRG &= \\pos{${N(p.srgMaxSeul)} - ${N(floorT(20_000, p.srgTrancheSeul))} \\times ${PC(p.srgTauxSeul)}} = ${N(srg10)}`,
)}
Le supplément complémentaire est éteint à ce revenu (${N(topup10)}).
Total : ${N(p.oasBase)} $+$ ${N(srg10)} $=$ ${D(total10)}.`,
      ),
      exemple(
        "M13",
        `Couple dont les deux conjoints ont 65~ans et plus, revenu combiné de
${N(18_000)}. Chacun reçoit la pension de base (${N(p.oasBase)}) et le SRG au
barème « couple » (maximum ${N(p.srgMaxCouple)}, taux ${PC(p.srgTauxCouple)},
tranches de ${N(p.srgTrancheCouple)}~\\$) :
${align(
  `SRG &= \\pos{${N(p.srgMaxCouple)} - ${N(floorT(18_000, p.srgTrancheCouple))} \\times ${PC(p.srgTauxCouple)}} = ${N(srg13)} \\quad (\\text{par conjoint})`,
  `\\text{supplément du couple} &= \\pos{${N(p.topupMaxCouple)} - ${N(ceilT(Math.max(0, 18_000 - p.topupExemptionCouple), p.topupTrancheCouple))} \\times ${PC(p.topupTaux)}} = ${N(topup13)}`,
  `\\text{total} &= 2 \\times ${N(p.oasBase)} + 2 \\times ${N(srg13)} + ${N(topup13)} = ${N(total13)}`,
)}
Sécurité de la vieillesse du ménage : ${D(total13)}.`,
      ),
      exemple(
        "M11",
        `Même structure, revenu combiné de ${N(40_000)} : la réduction du SRG
(${N(floorT(40_000, p.srgTrancheCouple))} $\\times$ ${PC(p.srgTauxCouple)} $=$
${N(floorT(40_000, p.srgTrancheCouple) * p.srgTauxCouple)}) dépasse le maximum de
${N(p.srgMaxCouple)} : SRG \\emph{éteint}. Reste la pension de base de chacun :
$2 \\times ${N(p.oasBase)} = ${N(total11)}$, soit ${D(total11)}.`,
      ),
      exemple(
        "M12",
        `75~ans et plus : pension majorée (${N(p.oasBase)} $+$ ${N(p.oas75)}
$=$ ${N(base12)}). Le revenu déclenche l'\\emph{impôt de récupération} :
${align(
  `\\text{récupération} &= \\pos{${N(110_000)} + ${N(base12)} - ${N(p.seuilRecuperation)}} \\times ${PC(p.tauxRecuperation)} = ${N(recup12)}`,
  `PSV &= ${N(base12)} - ${N(recup12)} = ${N(total12)}`,
)}
Pension nette : ${D(total12)} (la pension s'éteint complètement vers
${D(p.seuilRecuperation + base12 / p.tauxRecuperation - base12)} de revenu).`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 18 — Supplément médical fédéral (structurellement nul)
// ---------------------------------------------------------------------------

function p18medFed(): Fichier {
  const p = SUPPLEMENT_MEDICAL[AN];
  const r = RES.M4;
  const prime = r.detail.cotisations.ramq;
  const plancher = Math.min(p.seuilFrais * (r.revenuNetFamilial), p.plafondSeuilFrais);
  verifier("Supplément médical M4", r.detail.transfertsFederaux.supplementMedical, 0);

  return fichier(
    "18-supplement-medical.tex",
    `Comme au poste~12, la seule dépense médicale du modèle est la prime RAMQ :
elle ne franchit jamais le plancher de ${PC(p.seuilFrais)} du revenu net
(plafonné à ${D(p.plafondSeuilFrais)}).`,
    [
      exemple(
        "M4",
        `Prime RAMQ de ${D(prime)} ; plancher
$\\min(${PC(p.seuilFrais)} \\times ${N(r.revenuNetFamilial)},\\ ${N(p.plafondSeuilFrais)})
= ${N(cent(plancher))}$. Frais admissibles nuls $\\Rightarrow$ supplément nul —
et il en va de même pour tous les ménages du modèle.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 19 — Impôt sur le revenu (Québec puis fédéral)
// ---------------------------------------------------------------------------

function p19impot(): Fichier {
  const pq = IMPOT_QUEBEC[AN];
  const pf = IMPOT_FEDERAL[AN];
  const paliersQ = PALIERS_QC[AN];
  const paliersF = PALIERS_FEDERAL[AN];
  const tauxQ = paliersQ[0].taux;
  const tauxF = paliersF[0].taux;

  // ---- M4 : personne seule active, 50 000 $ ----
  const rrq4 = cotisationRRQ(50_000, AN);
  const dedTrav4 = Math.min(pq.deducTravailleurTaux * 50_000, pq.deducTravailleurMax);
  const imposableQ4 = 50_000 - dedTrav4 - rrq4.supplementaire;
  const brutQ4 = impotProgressif(imposableQ4, paliersQ);
  const combine4 = Math.max(0, pq.montantSeul - pq.reductionTaux * Math.max(0, imposableQ4 - pq.reductionSeuil));
  const creditsQ4 = (pq.bpa + combine4) * tauxQ;
  const impotQ4 = cent(Math.max(0, brutQ4 - creditsQ4));
  verifier("Impôt QC M4", RES.M4.detail.impotQuebec, impotQ4);

  const rqap4 = Math.min(50_000, RQAP[AN].maxAssurable) * RQAP[AN].taux;
  const ae4 = Math.min(50_000, AE[AN].mra) * AE[AN].taux;
  const imposableF4 = 50_000 - rrq4.supplementaire;
  const brutF4 = impotProgressif(imposableF4, paliersF);
  const bpa4 = pf.bpaBase + pf.bpaBonif; // revenu net sous le seuil de réduction de la bonification
  const creditsF4 = bpa4 + rrq4.base + rqap4 + ae4 + Math.min(pf.emploiCanadaMax, 50_000);
  const netF4 = Math.max(0, brutF4 - creditsF4 * tauxF);
  const impotF4 = cent(netF4 * (1 - pf.abattementQc));
  verifier("Impôt fédéral M4", RES.M4.detail.impotFederal, impotF4);

  // ---- M10 : retraité seul, 70 ans, 20 000 $ ----
  const psvImp10 = PSV[AN].oasBase; // pas de récupération à ce revenu
  const [svNonImp10] = svNonImposableParAdulte(M.M10.menage, AN);
  const caPsv10 = RES.M10.detail.transfertsFederaux.securiteVieillesse;
  const imposable10 = 20_000 + psvImp10;
  const revenuNet10 = 20_000 + caPsv10;
  const brutQ10 = impotProgressif(imposable10, paliersQ);
  const combine10 = Math.max(
    0,
    pq.montantSeul + pq.ageMontant + Math.min(20_000, pq.pensionMax) -
      pq.reductionTaux * Math.max(0, revenuNet10 - pq.reductionSeuil),
  );
  const creditsQ10 = (pq.bpa + combine10) * tauxQ;
  const impotQ10 = cent(Math.max(0, brutQ10 - creditsQ10));
  verifier("Impôt QC M10", RES.M10.detail.impotQuebec, impotQ10);

  const netF10 = imposable10 + svNonImp10;
  const brutF10 = impotProgressif(imposable10, paliersF);
  const age10 = Math.max(0, pf.ageMontant - pf.ageTaux * Math.max(0, netF10 - pf.ageSeuil));
  const creditsF10 = pf.bpaBase + pf.bpaBonif + age10 + Math.min(pf.pensionMax, 20_000);
  const netImpotF10 = Math.max(0, brutF10 - creditsF10 * tauxF);
  const impotF10 = cent(netImpotF10 * (1 - pf.abattementQc));
  verifier("Impôt fédéral M10", RES.M10.detail.impotFederal, impotF10);

  // ---- M7 : couple monoactif, 30 000 $ / 0 $ ----
  const rrq7 = cotisationRRQ(30_000, AN);
  const dedTrav7 = Math.min(pq.deducTravailleurTaux * 30_000, pq.deducTravailleurMax);
  const t7a = 30_000 - dedTrav7 - rrq7.supplementaire;
  const brutQ7 = impotProgressif(t7a, paliersQ);
  const creditsQ7a = pq.bpa * tauxQ; // pas de montant combiné (moins de 65 ans, actif, en couple)
  const creditsQ7b = pq.bpa * tauxQ;
  const pre7a = brutQ7 - creditsQ7a;
  const excedent7b = Math.max(0, -(0 - creditsQ7b)); // impôt brut de l'adulte 2 = 0
  const impotQ7 = cent(Math.max(0, pre7a - excedent7b));
  verifier("Impôt QC M7", RES.M7.detail.impotQuebec, impotQ7);

  const rqap7 = Math.min(30_000, RQAP[AN].maxAssurable) * RQAP[AN].taux;
  const ae7 = Math.min(30_000, AE[AN].mra) * AE[AN].taux;
  const imposableF7 = 30_000 - rrq7.supplementaire;
  const brutF7 = impotProgressif(imposableF7, paliersF);
  const bpa7 = pf.bpaBase + pf.bpaBonif;
  const conjoint7 = Math.max(0, bpa7 - 0); // revenu net du conjoint : 0
  const creditsF7 = bpa7 + conjoint7 + rrq7.base + rqap7 + ae7 + Math.min(pf.emploiCanadaMax, 30_000);
  const netImpotF7 = Math.max(0, brutF7 - creditsF7 * tauxF);
  const impotF7 = cent(netImpotF7 * (1 - pf.abattementQc));
  verifier("Impôt fédéral M7", RES.M7.detail.impotFederal, impotF7);

  return fichier(
    "19-impot.tex",
    `Trois ménages, du plus simple au plus riche en mécanismes : l'actif seul
(M4), le retraité (M10, montants d'âge et de pension), le couple monoactif
(M7, montant pour conjoint et transfert de crédits). Les crédits valent
\\emph{montant} $\\times$ \\emph{taux du premier palier} (${PC(tauxQ)} au
Québec, ${PC(tauxF)} au fédéral en 2025).`,
    [
      exemple(
        "M4",
        `\\emph{Québec.} Revenu imposable : ${N(50_000)} $-$ ${N(dedTrav4)}
(déduction pour travailleur, plafonnée) $-$ ${N(rrq4.supplementaire)} (RRQ
supplémentaire, déductible) $=$ ${N(imposableQ4)}.
${align(
  `\\text{impôt brut} &= ${PC(paliersQ[0].taux)} \\times ${N(imposableQ4)} = ${N(brutQ4)} \\quad (\\text{1\\ier{} palier seulement})`,
  `\\text{montant seul réduit} &= \\pos{${N(pq.montantSeul)} - ${PC(pq.reductionTaux)} \\times \\pos{${N(imposableQ4)} - ${N(pq.reductionSeuil)}}} = ${N(combine4)}`,
  `\\text{crédits} &= (${N(pq.bpa)} + ${N(combine4)}) \\times ${PC(tauxQ)} = ${N(creditsQ4)}`,
  `\\text{impôt du Québec} &= ${N(brutQ4)} - ${N(creditsQ4)} = ${N(impotQ4)}`,
)}
\\emph{Fédéral.} Revenu imposable : ${N(50_000)} $-$ ${N(rrq4.supplementaire)}
$=$ ${N(imposableF4)} (pas de déduction pour travailleur au fédéral).
${align(
  `\\text{impôt brut} &= ${PC(paliersF[0].taux)} \\times ${N(imposableF4)} = ${N(brutF4)}`,
  `\\text{crédits} &= ${N(bpa4)} + ${N(rrq4.base)} + ${N(cent(rqap4))} + ${N(cent(ae4))} + ${N(pf.emploiCanadaMax)} = ${N(creditsF4)}`,
  `\\text{impôt net} &= ${N(brutF4)} - ${N(creditsF4)} \\times ${PC(tauxF)} = ${N(netF4)}`,
  `\\text{après abattement} &= ${N(netF4)} \\times (1 - ${PC(pf.abattementQc)}) = ${N(impotF4)}`,
)}
Les crédits fédéraux : montant personnel de base bonifié (${N(bpa4)}),
cotisations RRQ de base, RQAP et AE (créditables), montant canadien pour
emploi (${N(pf.emploiCanadaMax)}). L'abattement du Québec retranche
${PC(pf.abattementQc)} de l'impôt fédéral.`,
      ),
      exemple(
        "M10",
        `\\emph{Québec.} Revenu imposable : pension ${N(20_000)} $+$ PSV
imposable ${N(psvImp10)} $=$ ${N(imposable10)} (le SRG, non imposable, en est
exclu — mais il entre dans le revenu \\emph{net} de ${N(revenuNet10)} qui
module les crédits).
${align(
  `\\text{impôt brut} &= ${PC(paliersQ[0].taux)} \\times ${N(imposable10)} = ${N(brutQ10)}`,
  `\\text{montant combiné} &= ${N(pq.montantSeul)} + ${N(pq.ageMontant)} + ${N(pq.pensionMax)} = ${N(pq.montantSeul + pq.ageMontant + pq.pensionMax)}`,
  `&\\quad (\\text{vivant seul} + \\text{âge} + \\text{pension; aucune réduction : } ${N(revenuNet10)} < ${N(pq.reductionSeuil)})`,
  `\\text{crédits} &= (${N(pq.bpa)} + ${N(combine10)}) \\times ${PC(tauxQ)} = ${N(creditsQ10)}`,
  `\\text{impôt du Québec} &= \\pos{${N(brutQ10)} - ${N(creditsQ10)}} = ${N(impotQ10)}`,
)}
\\emph{Fédéral.} Impôt brut ${N(brutF10)} sur ${N(imposable10)} ; crédits :
BPA ${N(pf.bpaBase + pf.bpaBonif)}, montant en raison de l'âge ${N(age10)}
(réduit par le revenu net, SRG \\emph{inclus} : ${N(netF10)}), montant pour
revenu de pension ${N(Math.min(pf.pensionMax, 20_000))}.
${align(
  `\\text{impôt net} &= \\pos{${N(brutF10)} - ${N(creditsF10)} \\times ${PC(tauxF)}} = ${N(netImpotF10)}`,
  `\\text{après abattement} &= ${N(netImpotF10)} \\times (1 - ${PC(pf.abattementQc)}) = ${N(impotF10)}`,
)}
Impôt fédéral : ${D(impotF10)}.`,
      ),
      exemple(
        "M7",
        `\\emph{Québec.} Adulte~1 : revenu imposable ${N(t7a)}, impôt brut
${N(brutQ7)}, crédits ${N(pq.bpa)} $\\times$ ${PC(tauxQ)} $=$ ${N(creditsQ7a)}.
Adulte~2 (aucun revenu) : impôt brut nul, crédits \\emph{inutilisés} de
${N(excedent7b)} — \\textbf{transférés} au conjoint :
${align(
  `\\text{impôt du Québec} &= \\pos{${N(brutQ7)} - ${N(creditsQ7a)} - ${N(excedent7b)}} = ${N(impotQ7)}`,
)}
\\emph{Fédéral.} L'adulte~1 réclame le \\textbf{montant pour conjoint} :
$\\pos{${N(bpa7)} - \\text{revenu net du conjoint } (0)} = ${N(conjoint7)}$ —
un second montant personnel de base, en pratique.
${align(
  `\\text{crédits} &= ${N(bpa7)} + ${N(conjoint7)} + ${N(rrq7.base)} + ${N(cent(rqap7))} + ${N(cent(ae7))} + ${N(pf.emploiCanadaMax)} = ${N(creditsF7)}`,
  `\\text{impôt net} &= \\pos{${N(brutF7)} - ${N(creditsF7)} \\times ${PC(tauxF)}} = ${N(netImpotF7)}`,
  `\\text{après abattement} &= ${N(netImpotF7)} \\times (1 - ${PC(pf.abattementQc)}) = ${N(impotF7)}`,
)}
Impôt fédéral : ${D(impotF7)} — le couple monoactif ne paie presque rien,
grâce au montant pour conjoint et au transfert québécois des crédits.`,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Poste 20 — Agrégation finale
// ---------------------------------------------------------------------------

function p20rd(): Fichier {
  const codes = ["M4", "M6", "M10"] as const;
  for (const code of codes) {
    const r = RES[code];
    const c = r.composantes;
    const rd = cent(
      c.revenu - c.cotisations + c.transfertsQuebec - c.impotQuebec + c.transfertsFederaux - c.impotFederal - c.fraisGarde,
    );
    verifier(`RD ${code}`, r.revenuDisponible, rd);
  }
  const ligne = (label: string, f: (c: (typeof RES)["M4"]["composantes"]) => number, signe = "+") =>
    `${label} & ${codes.map((code) => `${signe === "-" ? "$-$" : ""}${N(f(RES[code].composantes))}`).join(" & ")} \\\\`;

  const tableau = `\\begin{center}
\\small
\\begin{tabular}{l r r r}
\\toprule
 & M4 & M6 & M10 \\\\
\\midrule
${ligne("Revenu de travail ou de retraite", (c) => c.revenu)}
${ligne("Cotisations (postes 1--5)", (c) => c.cotisations, "-")}
${ligne("Transferts québécois (postes 6--13)", (c) => c.transfertsQuebec)}
${ligne("Impôt du Québec (poste 19)", (c) => c.impotQuebec, "-")}
${ligne("Transferts fédéraux (postes 14--18)", (c) => c.transfertsFederaux)}
${ligne("Impôt fédéral (poste 19)", (c) => c.impotFederal, "-")}
${ligne("Frais de garde payés (poste 6)", (c) => c.fraisGarde, "-")}
\\midrule
${`\\textbf{Revenu disponible} & ${codes.map((code) => `\\textbf{${fm(RES[code].revenuDisponible)}}`).join(" & ")} \\\\`}
\\bottomrule
\\end{tabular}
\\end{center}`;

  return fichier(
    "20-revenu-disponible.tex",
    `L'équation~\\eqref{eq:rd} appliquée à trois ménages types (montants 2025
en dollars ; chaque composante est la somme des postes détaillés dans les
sections précédentes) :`,
    [
      `${tableau}
\\medskip\\noindent À lire en colonne : par exemple, M6 (famille monoparentale,
${D(35_000)} de travail) \\emph{ajoute} ${D(RES.M6.composantes.transfertsQuebec)}
de transferts québécois et ${D(RES.M6.composantes.transfertsFederaux)} de
transferts fédéraux à son revenu, pour un revenu disponible de
${D(RES.M6.revenuDisponible)} — supérieur à son revenu brut. À l'autre bout,
M4 (personne seule, ${D(50_000)}) cède ${D(cent(RES.M4.composantes.cotisations + RES.M4.composantes.impotQuebec + RES.M4.composantes.impotFederal))}
en prélèvements et ne reçoit que ${D(cent(RES.M4.composantes.transfertsQuebec + RES.M4.composantes.transfertsFederaux))}
de transferts : revenu disponible de ${D(RES.M4.revenuDisponible)}.`,
    ],
  );
}

// ---------------------------------------------------------------------------
// Assemblage
// ---------------------------------------------------------------------------

/** Génère tous les fichiers d'exemples (et vérifie chaque chiffre au passage). */
export function genererTous(): Fichier[] {
  return [
    fichierMenages(),
    fichierTemi(),
    p01rrq(),
    p02rqap(),
    p03ae(),
    p04fss(),
    p05ramq(),
    p06garde(),
    p07famille(),
    p08prime(),
    p09solidarite(),
    p10logement(),
    p11aines(),
    p12medQC(),
    p13aide(),
    p14ace(),
    p15tps(),
    p16act(),
    p17psv(),
    p18medFed(),
    p19impot(),
    p20rd(),
  ];
}
