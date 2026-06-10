"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { listerJeuxParametres, type JeuResume } from "@/lib/bibliotheque";
import { PARAMETRES_OFFICIELS, type Annee, type Parametres } from "@/index";
import { appliquerParams } from "@/lib/partage";
import { UI, type Lang } from "@/lib/i18n";
import { JeuDialog } from "@/components/jeu-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cloner = (a: Annee): Parametres => structuredClone(PARAMETRES_OFFICIELS[a]);

/** Clés des options officielles. Un jeu sauvegardé utilise son `id` comme valeur. */
export const cleOfficiel = (a: Annee) => `off-${a}`;

/**
 * Sélectionne un jeu de paramètres : officiels (2025/2026) + jeux de la
 * bibliothèque (si connecté). Option « Enregistrer ce jeu » quand `avecEnregistrer`.
 */
export function JeuPicker({
  lang,
  valeur,
  onCharger,
  bundleCourant,
  anneeCourante,
  avecEnregistrer = false,
  label,
}: {
  lang: Lang;
  valeur: string;
  onCharger: (cle: string, bundle: Parametres, annee: Annee) => void;
  bundleCourant?: Parametres;
  anneeCourante?: Annee;
  avecEnregistrer?: boolean;
  label?: string;
}) {
  const { data: session } = useSession();
  const [jeux, setJeux] = useState<JeuResume[]>([]);
  const [dlg, setDlg] = useState(false);

  const recharger = useCallback(() => {
    if (!session) {
      setJeux([]);
      return;
    }
    listerJeuxParametres().then(setJeux).catch(() => setJeux([]));
  }, [session]);
  useEffect(() => {
    recharger();
  }, [recharger]);

  const choisir = (cle: string) => {
    if (cle === cleOfficiel(2025)) onCharger(cle, cloner(2025), 2025);
    else if (cle === cleOfficiel(2026)) onCharger(cle, cloner(2026), 2026);
    else {
      const j = jeux.find((x) => x.id === cle);
      if (j) onCharger(cle, appliquerParams(j.anneeBase, j.data), j.anneeBase);
    }
  };

  const peutEnregistrer = avecEnregistrer && Boolean(session) && bundleCourant && anneeCourante;
  // `valeur` peut ne correspondre à aucune option (jeu modifié reçu par URL) :
  // on l'affiche alors comme « Modifié » pour que le sélecteur reste cohérent.
  const valeurConnue =
    valeur === cleOfficiel(2025) || valeur === cleOfficiel(2026) || jeux.some((j) => j.id === valeur);

  return (
    <div className="grid gap-2">
      <div className="grid gap-1.5">
        {label && <Label>{label}</Label>}
        <Select value={valeur} onValueChange={choisir}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={cleOfficiel(2025)}>{UI.officiel[lang]} 2025</SelectItem>
            <SelectItem value={cleOfficiel(2026)}>{UI.officiel[lang]} 2026</SelectItem>
            {jeux.map((j) => (
              <SelectItem key={j.id} value={j.id}>
                {j.name}
              </SelectItem>
            ))}
            {!valeurConnue && valeur && <SelectItem value={valeur}>{UI.modifie[lang]}</SelectItem>}
          </SelectContent>
        </Select>
      </div>
      {peutEnregistrer && (
        <Button type="button" size="sm" className="justify-self-start gap-1.5" onClick={() => setDlg(true)}>
          <Save className="size-4" />
          {UI.enregistrerCeJeu[lang]}
        </Button>
      )}
      {peutEnregistrer && (
        <JeuDialog
          open={dlg}
          onOpenChange={setDlg}
          lang={lang}
          initial={{ name: "", anneeBase: anneeCourante, bundle: bundleCourant }}
          onSaved={recharger}
        />
      )}
    </div>
  );
}
