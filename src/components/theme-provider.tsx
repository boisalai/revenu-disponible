"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Fournit le thème clair/sombre (ajoute la classe `.dark` sur <html>). */
export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
