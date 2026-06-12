// ===========================================================================
// Exemples chiffrés du guide PDF — deux garanties :
//  1. chaque recette d'exemple retombe exactement sur le montant du moteur
//     (assertions internes de genererTous(), qui lèvent en cas d'écart) ;
//  2. les fichiers docs/guide/exemples/*.tex sur disque sont à jour
//     (régénérer : npm run exemples).
// Avec ECRIRE_EXEMPLES=1, le test écrit les fichiers au lieu de comparer.
// ===========================================================================

import { describe, it, expect } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { genererTous } from "../scripts/exemples-guide";

const DOSSIER = path.join(process.cwd(), "docs", "guide", "exemples");

describe("exemples du guide", () => {
  const fichiers = genererTous(); // lève si une recette diverge du moteur

  it("génère les 20 postes + le cast + les tableaux TEMI et seuils", () => {
    expect(fichiers.length).toBe(23);
  });

  if (process.env.ECRIRE_EXEMPLES) {
    it("écrit les fichiers (ECRIRE_EXEMPLES=1)", () => {
      mkdirSync(DOSSIER, { recursive: true });
      for (const f of fichiers) writeFileSync(path.join(DOSSIER, f.nom), f.contenu);
      expect(fichiers.length).toBeGreaterThan(0);
    });
  } else {
    it.each(fichiers.map((f) => [f.nom, f] as const))("%s est à jour sur disque", (nom, f) => {
      let surDisque = "";
      try {
        surDisque = readFileSync(path.join(DOSSIER, nom), "utf8");
      } catch {
        throw new Error(`docs/guide/exemples/${nom} manquant — lancer : npm run exemples`);
      }
      expect(surDisque, `docs/guide/exemples/${nom} périmé — lancer : npm run exemples`).toBe(f.contenu);
    });
  }
});
