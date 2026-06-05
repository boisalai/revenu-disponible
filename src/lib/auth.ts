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
  account: {
    // Lie automatiquement une connexion Google à un compte courriel/mot de passe
    // de même courriel (Google vérifie le courriel). Sans cela : « account_not_linked ».
    // requireLocalEmailVerified:false car la vérification courriel est désactivée ici
    // (POC sans service d'envoi) — sinon Better Auth exige le courriel local vérifié
    // avant de lier. En prod réelle : activer la vérification courriel plutôt que ce drapeau.
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: false,
    },
  },
  // nextCookies() en dernier : gère les cookies de session côté serveur (Next.js).
  plugins: [nextCookies()],
});
