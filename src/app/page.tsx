import { Calculateur } from "@/components/calculateur";

export default function Home() {
  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Calculateur />
      </div>
    </main>
  );
}
