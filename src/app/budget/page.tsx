import { Budget } from "@/components/budget";

export default function Page() {
  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Budget />
      </div>
    </main>
  );
}
