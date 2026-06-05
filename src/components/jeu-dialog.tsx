"use client";

import { useEffect, useState } from "react";
import { enregistrerJeuParametres, modifierJeuParametres } from "@/lib/bibliotheque";
import { PARAMETRES_OFFICIELS, type Annee, type Parametres } from "@/index";
import { diffParams } from "@/lib/partage";
import { UI, type Lang } from "@/lib/i18n";
import { EditeurParametres } from "@/components/editeur-parametres";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface JeuInitial {
  id?: string;
  name?: string;
  anneeBase?: Annee;
  bundle?: Parametres;
}

const ANNEES: Annee[] = [2025, 2026];
const cloner = (a: Annee): Parametres => structuredClone(PARAMETRES_OFFICIELS[a]);

/** Dialogue de création / édition d'un jeu de paramètres. Réutilisable (bibliothèque, /budget…). */
export function JeuDialog({
  open,
  onOpenChange,
  lang,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lang: Lang;
  initial?: JeuInitial;
  onSaved?: () => void;
}) {
  const [nom, setNom] = useState("");
  const [annee, setAnnee] = useState<Annee>(2025);
  const [bundle, setBundle] = useState<Parametres>(() => cloner(2025));
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const a = initial?.anneeBase ?? 2025;
    setNom(initial?.name ?? "");
    setAnnee(a);
    setBundle(initial?.bundle ?? cloner(a));
    setErreur(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Changer l'année de base réinitialise le jeu sur l'officiel de cette année.
  const changerAnnee = (a: Annee) => {
    setAnnee(a);
    setBundle(cloner(a));
  };

  const sauvegarder = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const diff = diffParams(bundle, PARAMETRES_OFFICIELS[annee]);
      if (initial?.id) await modifierJeuParametres(initial.id, nom, annee, diff);
      else await enregistrerJeuParametres(nom, annee, diff);
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial?.id ? UI.modifierJeuTitre[lang] : UI.nouveauJeu[lang]}</DialogTitle>
        </DialogHeader>
        <form onSubmit={sauvegarder} className="grid gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid flex-1 gap-1.5">
              <Label htmlFor="jeu-nom">{UI.nomJeu[lang]}</Label>
              <Input id="jeu-nom" value={nom} onChange={(e) => setNom(e.target.value)} required maxLength={80} />
            </div>
            <div className="grid gap-1.5">
              <Label>{UI.anneeBase[lang]}</Label>
              <Select value={String(annee)} onValueChange={(v) => changerAnnee(Number(v) as Annee)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANNEES.map((a) => (
                    <SelectItem key={a} value={String(a)}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <EditeurParametres bundle={bundle} officiel={PARAMETRES_OFFICIELS[annee]} onChange={setBundle} lang={lang} />
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
