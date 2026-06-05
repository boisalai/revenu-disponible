import { Calculateur } from "@/components/calculateur";

export default function Home() {
  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Revenu disponible des ménages — Québec</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Estimez le revenu disponible d&apos;un ménage québécois et sa ventilation par poste, pour 2025 et 2026.
            Reconstruction vérifiée du calculateur du ministère des Finances du Québec.
          </p>
        </header>
        <Calculateur />
      </div>
    </main>
  );
}
