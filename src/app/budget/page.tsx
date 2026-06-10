import type { Metadata } from "next";
import { Budget } from "@/components/budget";

export const metadata: Metadata = {
  title: "Comparer des paramètres",
  description:
    "Simulez un budget : comparez deux jeux de paramètres socio-fiscaux (montants, taux, seuils, paliers) sur un même ménage québécois.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-card">
      <Budget />
    </main>
  );
}
