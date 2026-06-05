// Instance serveur Better Auth. Connexion courriel/mot de passe + Google (OAuth).
// Le provider Google n'est activé que si ses identifiants sont fournis → l'app
// fonctionne en local sans, et le bouton « Google » n'apparaît que si configuré.
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const gid = process.env.GOOGLE_CLIENT_ID;
const gsecret = process.env.GOOGLE_CLIENT_SECRET;
const socialProviders =
  gid && gsecret ? { google: { clientId: gid, clientSecret: gsecret } } : undefined;

/** Indique au client si le bouton « Se connecter avec Google » doit s'afficher. */
export const googleActive = Boolean(socialProviders);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  ...(socialProviders ? { socialProviders } : {}),
  // nextCookies() en dernier : gère les cookies de session côté serveur (Next.js).
  plugins: [nextCookies()],
});
