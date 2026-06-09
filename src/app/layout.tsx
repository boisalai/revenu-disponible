import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { PanneauInfoProvider } from "@/components/panneau-info";
import { LangProvider } from "@/components/lang-provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Revenu disponible — Québec",
  description:
    "Calculateur du revenu disponible des ménages québécois pour 2025 et 2026 : calculs vérifiés, chaque poste expliqué et rattaché à sa source officielle.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="h-1 bg-primary" />
          <LangProvider>
            <PanneauInfoProvider>{children}</PanneauInfoProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
