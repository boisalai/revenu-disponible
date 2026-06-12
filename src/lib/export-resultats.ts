// Export du tableau des résultats en CSV et PDF (100 % côté client, sans dépendance serveur).
// Générique : chaque page fournit une spécification (deux résultats, en-têtes de colonnes,
// métadonnées d'en-tête) via les constructeurs specCalculateur / specComparaison / specBudget.

import { SITUATIONS, type Annee, type ResultatRevenuDisponible } from "@/index";
import { UI, type Lang } from "@/lib/i18n";
import { POSTES_INFO } from "@/lib/postes-info";
import { type MenageEtat } from "@/lib/menage-etat";

export interface LigneExport {
  poste: string;
  vGauche: number;
  vDroite: number;
  ecart: number;
}

/** Lignes du tableau des résultats — mêmes postes, sous-totaux et libellés que l'affichage. */
export function lignesResultats(rG: ResultatRevenuDisponible, rD: ResultatRevenuDisponible, lang: Lang): LigneExport[] {
  const L: LigneExport[] = [];
  const add = (poste: string, a: number, b: number) => L.push({ poste, vGauche: a, vDroite: b, ecart: b - a });
  const nom = (cle: string, fb: string) => POSTES_INFO[cle]?.nom[lang] ?? fb;
  const cles = <T extends object>(o: T) => Object.keys(o) as (keyof T & string)[];

  add(UI.revenu[lang], rG.composantes.revenu, rD.composantes.revenu);
  for (const k of cles(rG.detail.cotisations)) add(nom(k, k), -rG.detail.cotisations[k], -rD.detail.cotisations[k]);
  add(UI.totalCotisations[lang], -rG.composantes.cotisations, -rD.composantes.cotisations);
  for (const k of cles(rG.detail.transfertsQuebec)) add(nom(k, k), rG.detail.transfertsQuebec[k], rD.detail.transfertsQuebec[k]);
  add(UI.totalTransfertsQC[lang], rG.composantes.transfertsQuebec, rD.composantes.transfertsQuebec);
  add(nom("impotQuebec", UI.impotQC[lang]), -rG.detail.impotQuebec, -rD.detail.impotQuebec);
  for (const k of cles(rG.detail.transfertsFederaux)) add(nom(k, k), rG.detail.transfertsFederaux[k], rD.detail.transfertsFederaux[k]);
  add(UI.totalTransfertsFederaux[lang], rG.composantes.transfertsFederaux, rD.composantes.transfertsFederaux);
  add(nom("impotFederal", UI.impotFederal[lang]), -rG.detail.impotFederal, -rD.detail.impotFederal);
  if (rG.detail.fraisGardeCout > 0 || rD.detail.fraisGardeCout > 0)
    add(UI.fraisGarde[lang], -rG.detail.fraisGardeCout, -rD.detail.fraisGardeCout);
  add(UI.revenuDisponible[lang], rG.revenuDisponible, rD.revenuDisponible);
  return L;
}

/** Spécification d'un export : titre du document, nom de fichier, métadonnées
 *  d'en-tête (label → valeur), en-têtes des deux colonnes de valeurs, résultats. */
export interface ExportSpec {
  titre: string;
  fichier: string; // sans extension
  meta: [string, string][];
  enteteGauche: string;
  enteteDroite: string;
  rGauche: ResultatRevenuDisponible;
  rDroite: ResultatRevenuDisponible;
}

const fmtMontant = (n: number, lang: Lang) => `${Math.round(n).toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")} $`;
const dateFichier = () => new Date().toISOString().slice(0, 10);
const dateLocale = (lang: Lang) => new Date().toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA");

/** Résumé d'un ménage en une ligne (« Couple · 50 000 $ + 30 000 $ · Âge 40/40 · 2 enfants »). */
export function resumeMenage(etat: MenageEtat, lang: Lang): string {
  const meta = SITUATIONS[etat.situation];
  const couple = meta.nbAdultes === 2;
  const parts = [
    UI.situations[etat.situation][lang],
    couple ? `${fmtMontant(etat.revenu1, lang)} + ${fmtMontant(etat.revenu2, lang)}` : fmtMontant(etat.revenu1, lang),
    `${UI.age[lang]} ${couple ? `${etat.age1}/${etat.age2}` : etat.age1}`,
  ];
  if (etat.enfants.length > 0) parts.push(`${UI.nbEnfants[lang]} : ${etat.enfants.length}`);
  return parts.join(" · ");
}

/** Libellé court d'un jeu de paramètres (« Officiel 2025 » ou « 2025 · 3 paramètre(s) modifié(s) »). */
export function labelJeu(annee: Annee, nbModifs: number, lang: Lang): string {
  return nbModifs === 0 ? `${UI.officiel[lang]} ${annee}` : `${annee} · ${nbModifs} ${UI.paramsModifies[lang]}`;
}

// Index par Situation (0..4) → segment de nom de fichier.
const TYPE_FICHIER = ["personne-seule", "monoparentale", "couple", "retraite-seul", "couple-retraites"];

/** Spécification du calculateur : un ménage, 2025 vs 2026 (paramètres officiels). */
export function specCalculateur(etat: MenageEtat, r25: ResultatRevenuDisponible, r26: ResultatRevenuDisponible, lang: Lang): ExportSpec {
  const meta = SITUATIONS[etat.situation];
  const couple = meta.nbAdultes === 2;
  return {
    titre: UI.titre[lang],
    fichier: `revenu-disponible-${TYPE_FICHIER[etat.situation] ?? "menage"}-${etat.revenu1}-${dateFichier()}`,
    meta: [
      [UI.typeMenage[lang], UI.situations[etat.situation][lang]],
      [
        (meta.retraite ? UI.revenuRetraite : UI.revenuTravail)[lang],
        couple ? `${fmtMontant(etat.revenu1, lang)} + ${fmtMontant(etat.revenu2, lang)}` : fmtMontant(etat.revenu1, lang),
      ],
      [UI.age[lang], couple ? `${etat.age1} / ${etat.age2}` : String(etat.age1)],
    ],
    enteteGauche: "2025",
    enteteDroite: "2026",
    rGauche: r25,
    rDroite: r26,
  };
}

/** Spécification de /comparaison : deux ménages (A et B) sur un même jeu de paramètres. */
export function specComparaison(
  etatA: MenageEtat,
  etatB: MenageEtat,
  rA: ResultatRevenuDisponible,
  rB: ResultatRevenuDisponible,
  jeu: string,
  lang: Lang,
): ExportSpec {
  return {
    titre: UI.comparaisonTitre[lang],
    fichier: `comparaison-menages-${dateFichier()}`,
    meta: [
      [UI.scenarioA[lang], resumeMenage(etatA, lang)],
      [UI.scenarioB[lang], resumeMenage(etatB, lang)],
      [UI.selectJeu[lang], jeu],
    ],
    enteteGauche: UI.scenarioA[lang],
    enteteDroite: UI.scenarioB[lang],
    rGauche: rA,
    rDroite: rB,
  };
}

/** Spécification de /budget : un même ménage sous deux jeux de paramètres (A et B). */
export function specBudget(
  etat: MenageEtat,
  rA: ResultatRevenuDisponible,
  rB: ResultatRevenuDisponible,
  anneeA: Annee,
  jeuA: string,
  anneeB: Annee,
  jeuB: string,
  lang: Lang,
): ExportSpec {
  return {
    titre: UI.budgetTitre[lang],
    fichier: `comparaison-parametres-${dateFichier()}`,
    meta: [
      [UI.typeMenage[lang], resumeMenage(etat, lang)],
      [UI.scenarioA[lang], jeuA],
      [UI.scenarioB[lang], jeuB],
    ],
    enteteGauche: `${UI.scenarioA[lang]} (${anneeA})`,
    enteteDroite: `${UI.scenarioB[lang]} (${anneeB})`,
    rGauche: rA,
    rDroite: rB,
  };
}

function telecharger(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Export CSV (BOM UTF-8 pour qu'Excel lise correctement les accents). */
export function exporterCSV(spec: ExportSpec, lang: Lang) {
  const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const out: string[] = [
    esc(spec.titre),
    [esc("Date"), esc(dateLocale(lang))].join(","),
    ...spec.meta.map(([label, valeur]) => [esc(label), esc(valeur)].join(",")),
    "",
    [UI.poste[lang], spec.enteteGauche, spec.enteteDroite, UI.ecart[lang]].map(esc).join(","),
    ...lignesResultats(spec.rGauche, spec.rDroite, lang).map((l) =>
      [esc(l.poste), l.vGauche.toFixed(2), l.vDroite.toFixed(2), l.ecart.toFixed(2)].join(","),
    ),
  ];
  telecharger(new Blob(["﻿" + out.join("\r\n")], { type: "text/csv;charset=utf-8" }), `${spec.fichier}.csv`);
}

/** Export PDF (jsPDF + autotable, chargés dynamiquement → code-split, hors du bundle initial). */
export async function exporterPDF(spec: ExportSpec, lang: Lang) {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF();
  const fmt = (n: number) => fmtMontant(n, lang);
  const fmtE = (n: number) => (n > 0 ? "+" : "") + fmt(n);
  const lignes = lignesResultats(spec.rGauche, spec.rDroite, lang);

  doc.setFontSize(15);
  doc.text(spec.titre, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(dateLocale(lang), 14, 24);
  doc.setTextColor(20);
  doc.setFontSize(10);
  let y = 32;
  for (const [label, valeur] of spec.meta) {
    doc.text(`${label} : ${valeur}`, 14, y);
    y += 6;
  }

  autoTable(doc, {
    startY: y + 2,
    head: [[UI.poste[lang], spec.enteteGauche, spec.enteteDroite, UI.ecart[lang]]],
    body: lignes.map((l) => [l.poste, fmt(l.vGauche), fmt(l.vDroite), fmtE(l.ecart)]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [60, 80, 130] },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === lignes.length - 1) data.cell.styles.fontStyle = "bold";
    },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 2;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(UI.disclaimer[lang], 14, finalY + 10, { maxWidth: 182 });
  doc.text("revenu-disponible.vercel.app", 14, finalY + 22);

  doc.save(`${spec.fichier}.pdf`);
}
