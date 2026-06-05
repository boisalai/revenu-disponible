// Client Better Auth (navigateur). baseURL omis → l'origine courante est utilisée
// (fonctionne en dev sur :3100 comme en prod sur Vercel).
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
export const { signIn, signUp, signOut, useSession } = authClient;

/** Le bouton « Se connecter avec Google » ne s'affiche que si configuré (variable publique). */
export const GOOGLE_ACTIVE = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true";
