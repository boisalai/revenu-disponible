"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { UI, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/** Copie l'URL courante (qui encode le scénario) dans le presse-papiers, avec retour visuel. */
export function BoutonPartage({ lang }: { lang: Lang }) {
  const [copie, setCopie] = useState(false);
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // presse-papiers indisponible (contexte non sécurisé) — on ignore
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={copier} className="gap-1.5">
      {copie ? <Check className="size-4" /> : <Link2 className="size-4" />}
      {copie ? UI.lienCopie[lang] : UI.copierLien[lang]}
    </Button>
  );
}
