import type { Metadata } from "next";
import { Confidentialite } from "@/components/confidentialite";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Renseignements personnels : ce que l'application recueille et ce qu'elle ne recueille pas (RLRQ, c. P-39.1). Le calcul s'effectue entièrement dans votre navigateur.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-card">
      <Confidentialite />
    </main>
  );
}
