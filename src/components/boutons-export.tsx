"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { exporterCSV, exporterPDF, type ExportSpec } from "@/lib/export-resultats";
import { UI, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/** Boutons d'export CSV / PDF du tableau des résultats (discrets, côté client). */
export function BoutonsExport({ spec, lang }: { spec: ExportSpec; lang: Lang }) {
  const [pdfEnCours, setPdfEnCours] = useState(false);
  const pdf = async () => {
    setPdfEnCours(true);
    try {
      await exporterPDF(spec, lang);
    } catch {
      // génération PDF indisponible — on n'interrompt pas l'interface
    } finally {
      setPdfEnCours(false);
    }
  };

  return (
    <div className="flex shrink-0 gap-2">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exporterCSV(spec, lang)} title={UI.exportCsv[lang]}>
        <FileDown className="size-4" />
        CSV
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={pdf} disabled={pdfEnCours} title={UI.exportPdf[lang]}>
        <FileDown className="size-4" />
        PDF
      </Button>
    </div>
  );
}
