import type { Metadata } from "next";
import { APropos } from "@/components/a-propos";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Le projet, l'auteur et la méthodologie : une reconstruction vérifiée du calculateur de revenu disponible du ministère des Finances du Québec.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-card">
      <APropos />
    </main>
  );
}
