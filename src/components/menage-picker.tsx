"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { listerMenages, type MenageResume } from "@/lib/bibliotheque";
import { UI, type Lang } from "@/lib/i18n";
import { type MenageEtat } from "@/lib/menage-etat";
import { MenageDialog } from "@/components/menage-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Charge un ménage type de la bibliothèque dans le formulaire courant + bouton
 * « Enregistrer ce ménage ». Ne s'affiche que pour un utilisateur connecté
 * (les pages restent utilisables sans compte avec le ménage saisi à la main).
 */
export function MenagePicker({
  lang,
  etatCourant,
  onCharger,
}: {
  lang: Lang;
  etatCourant: MenageEtat;
  onCharger: (etat: MenageEtat) => void;
}) {
  const { data: session } = useSession();
  const [menages, setMenages] = useState<MenageResume[]>([]);
  const [dlg, setDlg] = useState(false);

  const recharger = useCallback(() => {
    if (!session) {
      setMenages([]);
      return;
    }
    listerMenages().then(setMenages).catch(() => setMenages([]));
  }, [session]);
  useEffect(() => {
    recharger();
  }, [recharger]);

  if (!session) return null;

  return (
    <div className="grid gap-1.5">
      <Label>{UI.selectMenage[lang]}</Label>
      <div className="flex gap-2">
        <Select
          onValueChange={(id) => {
            const m = menages.find((x) => x.id === id);
            if (m) onCharger(m.data);
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={menages.length ? UI.menagePersonnalise[lang] : UI.aucunMenage[lang]} />
          </SelectTrigger>
          <SelectContent>
            {menages.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => setDlg(true)}>
          <Save className="size-4" />
          {UI.enregistrerCeMenage[lang]}
        </Button>
      </div>
      <MenageDialog open={dlg} onOpenChange={setDlg} lang={lang} initial={{ etat: etatCourant }} onSaved={recharger} />
    </div>
  );
}
