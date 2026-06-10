import type { Metadata } from "next";
import { Comparaison } from "@/components/comparaison";

export const metadata: Metadata = {
  title: "Comparer deux ménages",
  description:
    "Comparez le revenu disponible de deux ménages québécois côte à côte, poste par poste, pour 2025 ou 2026.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-card">
      <Comparaison />
    </main>
  );
}
