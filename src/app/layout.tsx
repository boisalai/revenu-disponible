import type { Metadata } from "next";
import "./globals.css";
import { IBM_Plex_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { PanneauInfoProvider } from "@/components/panneau-info";
import { LangProvider } from "@/components/lang-provider";

const police = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://revenu-disponible.vercel.app"),
  title: {
    default: "Revenu disponible — Québec",
    template: "%s — Revenu disponible — Québec",
  },
  description:
    "Calculateur du revenu disponible des ménages québécois pour 2025 et 2026 : calculs vérifiés, chaque poste expliqué et rattaché à sa source officielle.",
  // Open Graph / Twitter : titre et description héritent de ceux de la page ;
  // l'image vient de src/app/opengraph-image.png (convention App Router).
  openGraph: {
    type: "website",
    siteName: "Revenu disponible — Québec",
    locale: "fr_CA",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={cn("font-sans", police.variable)}>
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
