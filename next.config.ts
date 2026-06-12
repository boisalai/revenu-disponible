import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le moteur de calcul (src/postes…) est du TypeScript pur importé par l'app.

  // Paquets serveur à NE PAS bundler par webpack (Node les charge au runtime).
  // On externalise UNIQUEMENT la dépendance Kysely fautive (dialectes Bun/SQLite
  // inutilisés ici, dont les imports cassent l'analyse statique du bundler) — pas
  // better-auth lui-même, sinon son client React n'utiliserait pas la même copie
  // de React que le runtime serveur (→ « useRef of null » au prérendu).
  // Le client Prisma et l'adaptateur pg sont natifs/serveur.
  serverExternalPackages: [
    "kysely",
    "@better-auth/kysely-adapter",
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
  ],

  // L'outil `code_poste` de l'assistant lit les sources du moteur au runtime
  // (src/lib/code-postes.ts). Le traçage statique ne voit pas ces lectures
  // dynamiques : sans cette inclusion, les `.ts` n'existent pas dans la
  // fonction déployée sur Vercel (en dev, ils sont lus sur le disque).
  outputFileTracingIncludes: {
    "/api/assistant": ["src/postes/*.ts", "src/socle.ts"],
    "/api/assistant-scenarios": ["src/postes/*.ts", "src/socle.ts"],
  },
};

export default nextConfig;
