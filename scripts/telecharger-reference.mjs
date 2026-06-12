#!/usr/bin/env node
// ============================================================================
// Télécharge le calculateur de référence du MFQ depuis sa SOURCE OFFICIELLE et
// prépare la copie dé-minifiée qu'exécutent les tests de parité.
//
//   node scripts/telecharger-reference.mjs
//
// Pourquoi ce script : le code du calculateur appartient à l'État québécois et
// n'est pas redistribué dans ce dépôt (voir reference/README.md). Chacun en
// fait sa propre copie, pour sa propre étude, directement chez le ministère.
//
// La chaîne est entièrement reproductible et vérifiée par sommes de contrôle :
//   1. téléchargement de l'édition de décembre 2025 (SHA-256 épinglé) ;
//   2. dé-minification avec js-beautify 1.15.4 (--indent-size 2), épinglée
//      elle aussi — le chargeur des tests s'ancre sur ce formatage exact.
// ============================================================================

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const URL_OFFICIELLE =
  "https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/revenu-disponible_dec2025.js";
// Édition de décembre 2025, celle contre laquelle toute la parité a été vérifiée.
const SHA256_MINIFIE = "bdd31cc0bfa3e3287f9b0fbe82750b4de6022704d0719714665278b1f0007a6d";
// Résultat de : npx js-beautify@1.15.4 --indent-size 2 <minifié>
const SHA256_BEAUTIFIE = "1c285836a402e96a7575cdb85b5d1cb554b1ce4db24279b6bf86e5a295606357";

const DOSSIER = path.join(process.cwd(), "reference");
const MINIFIE = path.join(DOSSIER, "revenu-disponible_dec2025.js");
const BEAUTIFIE = path.join(DOSSIER, "revenu-disponible_dec2025_beautified.js");

const sha256 = (b) => createHash("sha256").update(b).digest("hex");

console.log(`Téléchargement : ${URL_OFFICIELLE}`);
const rep = await fetch(URL_OFFICIELLE);
if (!rep.ok) {
  console.error(`Échec du téléchargement (HTTP ${rep.status}). Le ministère a peut-être déplacé le fichier.`);
  process.exit(1);
}
const octets = Buffer.from(await rep.arrayBuffer());
const h = sha256(octets);
if (h !== SHA256_MINIFIE) {
  console.error(
    [
      "⚠️ Le fichier servi par le MFQ ne correspond PAS à l'édition de décembre 2025",
      `   attendue (SHA-256 ${SHA256_MINIFIE.slice(0, 16)}…, reçu ${h.slice(0, 16)}…).`,
      "   Le ministère a probablement publié une NOUVELLE ÉDITION du calculateur :",
      "   la parité de ce dépôt est vérifiée contre l'édition de décembre 2025 et doit",
      "   être retracée poste par poste avant d'adopter la nouvelle (voir CLAUDE.md).",
      "   Rien n'a été écrit.",
    ].join("\n"),
  );
  process.exit(2);
}
mkdirSync(DOSSIER, { recursive: true });
writeFileSync(MINIFIE, octets);
console.log(`✓ ${path.relative(process.cwd(), MINIFIE)} (SHA-256 vérifié)`);

console.log("Dé-minification (js-beautify 1.15.4, indentation 2)…");
execFileSync("npx", ["--yes", "js-beautify@1.15.4", "--indent-size", "2", "-o", BEAUTIFIE, MINIFIE], {
  stdio: ["ignore", "ignore", "inherit"],
});
const hb = sha256(readFileSync(BEAUTIFIE));
if (hb !== SHA256_BEAUTIFIE) {
  console.error(
    `⚠️ Dé-minification non conforme (SHA-256 ${hb.slice(0, 16)}… ≠ ${SHA256_BEAUTIFIE.slice(0, 16)}…). ` +
      "Les tests de parité peuvent échouer ; vérifier la version de js-beautify.",
  );
  process.exit(3);
}
console.log(`✓ ${path.relative(process.cwd(), BEAUTIFIE)} (SHA-256 vérifié)`);
console.log("\nTerminé. Lancer la suite complète : npm test  (692 tests de parité inclus)");

// Garde-fou : signaler si les fichiers étaient déjà suivis par git (ne devrait jamais arriver).
if (existsSync(path.join(process.cwd(), ".git"))) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", MINIFIE], { stdio: "ignore" });
    console.warn("⚠️ reference/*.js est suivi par git — il ne doit PAS être committé (voir reference/README.md).");
  } catch {
    /* non suivi : attendu */
  }
}
