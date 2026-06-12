import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Même alias que tsconfig (`@/* → src/*`) : permet aux tests et au générateur
    // d'exemples d'importer les modules de présentation (ex. src/lib/taux-marginal).
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    // La suite du projet vit dans tests/. Le dossier reference/ (code original du
    // MFQ + ancien code importé) est conservé pour consultation seulement : ses
    // éventuels tests ne font pas partie de la suite et ne doivent pas être exécutés.
    include: ["tests/**/*.test.ts"],
  },
});
