"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { listerScenarios, supprimerScenario, type ScenarioResume } from "@/lib/scenarios";
import { UI, type Lang } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ROUTE: Record<ScenarioResume["type"], string> = {
  CALCULATEUR: "/",
  COMPARAISON: "/comparaison",
  BUDGET: "/budget",
};

function libelleType(t: ScenarioResume["type"], lang: Lang): string {
  if (t === "CALCULATEUR") return UI.typeCalculateur[lang];
  if (t === "COMPARAISON") return UI.typeComparaison[lang];
  return UI.typeBudget[lang];
}

/** Liste des scénarios sauvegardés : ouvrir (via ?s=) ou supprimer. */
export function ScenariosDialog({
  open,
  onOpenChange,
  lang,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lang: Lang;
}) {
  const [items, setItems] = useState<ScenarioResume[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setItems(null);
    listerScenarios()
      .then(setItems)
      .catch(() => setItems([]));
  }, [open]);

  // Ouvrir = naviguer vers la page du bon type avec le code de partage : la page
  // le décode au montage (navigation complète pour garantir le remontage).
  const ouvrir = (s: ScenarioResume) => {
    window.location.href = `${ROUTE[s.type]}?s=${s.payload}`;
  };

  const supprimer = async (id: string) => {
    setItems((prev) => prev?.filter((s) => s.id !== id) ?? null);
    await supprimerScenario(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{UI.mesScenarios[lang]}</DialogTitle>
        </DialogHeader>

        {items === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{UI.chargement[lang]}</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{UI.aucunScenario[lang]}</p>
        ) : (
          <ul className="grid max-h-[60vh] gap-2 overflow-y-auto">
            {items.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {libelleType(s.type, lang)} ·{" "}
                    {new Date(s.updatedAt).toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => ouvrir(s)}>
                    <ExternalLink className="size-4" />
                    {UI.ouvrir[lang]}
                  </Button>
                  <Button size="icon" variant="ghost" aria-label={UI.supprimer[lang]} onClick={() => supprimer(s.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
