// ===========================================================================
// Outil `code_poste` de l'assistant — la correspondance clé → fichier source
// doit couvrir tous les postes documentés (POSTES_INFO) et ne pointer que vers
// des fichiers existants. Garde-fou si un poste est ajouté ou un fichier renommé.
// ===========================================================================

import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { FICHIER_POSTE, codePoste } from "../src/lib/code-postes";
import { POSTES_INFO } from "../src/lib/postes-info";

describe("code_poste (assistant)", () => {
  it("couvre toutes les clés de POSTES_INFO", () => {
    for (const cle of Object.keys(POSTES_INFO)) {
      expect(FICHIER_POSTE[cle], `clé sans fichier source : ${cle}`).toBeDefined();
    }
  });

  it("ne pointe que vers des fichiers existants", () => {
    for (const [cle, fichier] of Object.entries(FICHIER_POSTE)) {
      expect(existsSync(path.join(process.cwd(), fichier)), `${cle} → ${fichier} introuvable`).toBe(true);
    }
  });

  it("renvoie le code source d'un poste, null pour une clé inconnue", async () => {
    const r = await codePoste("rrq");
    expect(r?.fichier).toBe("src/postes/01-rrq.ts");
    expect(r?.code).toContain("cotisationRRQ");
    expect(await codePoste("inconnu")).toBeNull();
  });
});
