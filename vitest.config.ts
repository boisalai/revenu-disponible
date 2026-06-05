import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // La suite du projet vit dans tests/. Le dossier reference/ (code original du
    // MFQ + ancien code importé) est conservé pour consultation seulement : ses
    // éventuels tests ne font pas partie de la suite et ne doivent pas être exécutés.
    include: ["tests/**/*.test.ts"],
  },
});
