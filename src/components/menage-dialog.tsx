"use client";

import { useEffect, useState } from "react";
import { enregistrerMenage, modifierMenage } from "@/lib/bibliotheque";
import { UI, type Lang } from "@/lib/i18n";
import { MENAGE_DEFAUT, type MenageEtat } from "@/lib/menage-etat";
import { FormulaireMenage } from "@/components/formulaire-menage";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface MenageInitial {
  id?: string;
  name?: string;
  etat?: MenageEtat;
}

/** Dialogue de création / édition d'un ménage type. Réutilisable (bibliothèque, /budget…). */
export function MenageDialog({
  open,
  onOpenChange,
  lang,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lang: Lang;
  initial?: MenageInitial;
  onSaved?: () => void;
}) {
  const [nom, setNom] = useState("");
  const [etat, setEtat] = useState<MenageEtat>(MENAGE_DEFAUT);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNom(initial?.name ?? "");
    setEtat(initial?.etat ?? MENAGE_DEFAUT);
    setErreur(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const sauvegarder = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      if (initial?.id) await modifierMenage(initial.id, nom, etat);
      else await enregistrerMenage(nom, etat);
      onSaved?.();
      onOpenChange(false);
    } catch {
      setErreur(UI.erreurGenerique[lang]);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.id ? UI.modifierMenageTitre[lang] : UI.nouveauMenage[lang]}</DialogTitle>
        </DialogHeader>
        <form onSubmit={sauvegarder} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="menage-nom">{UI.nomMenage[lang]}</Label>
            <Input id="menage-nom" value={nom} onChange={(e) => setNom(e.target.value)} required autoFocus maxLength={80} />
          </div>
          <FormulaireMenage etat={etat} onChange={setEtat} lang={lang} prefixe="biblio-m-" />
          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
          <DialogFooter>
            <Button type="submit" disabled={enCours || !nom.trim()}>
              {enCours ? UI.chargement[lang] : UI.enregistrer[lang]}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
