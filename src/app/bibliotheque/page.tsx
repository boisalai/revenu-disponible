import type { Metadata } from "next";
import { Bibliotheque } from "@/components/bibliotheque";

export const metadata: Metadata = {
  title: "Bibliothèque",
  description:
    "Conservez des ménages types et des jeux de paramètres réutilisables dans les pages de comparaison du calculateur.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-card">
      <Bibliotheque />
    </main>
  );
}
