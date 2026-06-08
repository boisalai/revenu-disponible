// Export du tableau des résultats en CSV et PDF (100 % côté client, sans dépendance serveur).

import type { ResultatRevenuDisponible } from "@/index";
import { UI, type Lang } from "@/lib/i18n";
import { POSTES_INFO } from "@/lib/postes-info";
import { type MenageEtat } from "@/lib/menage-etat";

export interface LigneExport {
  poste: string;
  v2025: number;
  v2026: number;
  ecart: number;
}

/** Lignes du tableau des résultats — mêmes postes, sous-totaux et libellés que l'affichage. */
export function lignesResultats(r25: ResultatRevenuDisponible, r26: ResultatRevenuDisponible, lang: Lang): LigneExport[] {
  const L: LigneExport[] = [];
  const add = (poste: string, a: number, b: number) => L.push({ poste, v2025: a, v2026: b, ecart: b - a });
  const nom = (cle: string, fb: string) => POSTES_INFO[cle]?.nom[lang] ?? fb;
  const cles = <T extends object>(o: T) => Object.keys(o) as (keyof T & string)[];

  add(UI.revenu[lang], r25.composantes.revenu, r26.composantes.revenu);
  for (const k of cles(r25.detail.cotisations)) add(nom(k, k), -r25.detail.cotisations[k], -r26.detail.cotisations[k]);
  add(UI.totalCotisations[lang], -r25.composantes.cotisations, -r26.composantes.cotisations);
  for (const k of cles(r25.detail.transfertsQuebec)) add(nom(k, k), r25.detail.transfertsQuebec[k], r26.detail.transfertsQuebec[k]);
  add(UI.totalTransfertsQC[lang], r25.composantes.transfertsQuebec, r26.composantes.transfertsQuebec);
  add(nom("impotQuebec", UI.impotQC[lang]), -r25.detail.impotQuebec, -r26.detail.impotQuebec);
  for (const k of cles(r25.detail.transfertsFederaux)) add(nom(k, k), r25.detail.transfertsFederaux[k], r26.detail.transfertsFederaux[k]);
  add(UI.totalTransfertsFederaux[lang], r25.composantes.transfertsFederaux, r26.composantes.transfertsFederaux);
  add(nom("impotFederal", UI.impotFederal[lang]), -r25.detail.impotFederal, -r26.detail.impotFederal);
  if (r25.detail.fraisGardeCout > 0 || r26.detail.fraisGardeCout > 0)
    add(UI.fraisGarde[lang], -r25.detail.fraisGardeCout, -r26.detail.fraisGardeCout);
  add(UI.revenuDisponible[lang], r25.revenuDisponible, r26.revenuDisponible);
  return L;
}

// Index par Situation (0..4) → segment de nom de fichier.
const TYPE_FICHIER = ["personne-seule", "monoparentale", "couple", "retraite-seul", "couple-retraites"];

function nomFichier(etat: MenageEtat, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const type = TYPE_FICHIER[etat.situation] ?? "menage";
  return `revenu-disponible-${type}-${etat.revenu1}-${date}.${ext}`;
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

const dateLocale = (lang: Lang) => new Date().toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA");

/** Export CSV (BOM UTF-8 pour qu'Excel lise correctement les accents). */
export function exporterCSV(etat: MenageEtat, r25: ResultatRevenuDisponible, r26: ResultatRevenuDisponible, lang: Lang) {
  const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const sit = UI.situations[etat.situation][lang];
  const out: string[] = [
    esc(UI.titre[lang]),
    [esc("Date"), esc(dateLocale(lang))].join(","),
    [esc(UI.typeMenage[lang]), esc(sit)].join(","),
    [esc(UI.revenuTravail[lang]), esc(etat.revenu1)].join(","),
    [esc(UI.age[lang]), esc(etat.age1)].join(","),
    "",
    [UI.poste[lang], "2025", "2026", UI.ecart[lang]].map(esc).join(","),
    ...lignesResultats(r25, r26, lang).map((l) =>
      [esc(l.poste), l.v2025.toFixed(2), l.v2026.toFixed(2), l.ecart.toFixed(2)].join(","),
    ),
  ];
  telecharger(new Blob(["﻿" + out.join("\r\n")], { type: "text/csv;charset=utf-8" }), nomFichier(etat, "csv"));
}

/** Export PDF (jsPDF + autotable, chargés dynamiquement → code-split, hors du bundle initial). */
export async function exporterPDF(etat: MenageEtat, r25: ResultatRevenuDisponible, r26: ResultatRevenuDisponible, lang: Lang) {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF();
  const sit = UI.situations[etat.situation][lang];
  const fmt = (n: number) => `${Math.round(n).toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")} $`;
  const fmtE = (n: number) => (n > 0 ? "+" : "") + fmt(n);
  const lignes = lignesResultats(r25, r26, lang);

  doc.setFontSize(15);
  doc.text(UI.titre[lang], 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(dateLocale(lang), 14, 24);
  doc.setTextColor(20);
  doc.setFontSize(10);
  doc.text(
    `${UI.typeMenage[lang]} : ${sit}    ·    ${UI.revenuTravail[lang]} : ${fmt(etat.revenu1)}    ·    ${UI.age[lang]} : ${etat.age1}`,
    14,
    32,
  );

  autoTable(doc, {
    startY: 38,
    head: [[UI.poste[lang], "2025", "2026", UI.ecart[lang]]],
    body: lignes.map((l) => [l.poste, fmt(l.v2025), fmt(l.v2026), fmtE(l.ecart)]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [60, 80, 130] },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === lignes.length - 1) data.cell.styles.fontStyle = "bold";
    },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 38;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(UI.disclaimer[lang], 14, finalY + 10, { maxWidth: 182 });
  doc.text("Alain Boisvert — revenu-disponible.vercel.app", 14, finalY + 22);

  doc.save(nomFichier(etat, "pdf"));
}
