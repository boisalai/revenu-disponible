"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { UI, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Suppression de compte en libre-service (politique de confidentialité, §4-5).
 * Compte courriel/mot de passe : Better Auth exige le mot de passe. Compte Google
 * sans mot de passe : suppression sur session fraîche (aucun courriel requis).
 * La cascade de la base détruit scénarios, ménages types et jeux de paramètres.
 */
export function SupprimerCompteDialog({
  open,
  onOpenChange,
  lang,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lang: Lang;
}) {
  const [aMotDePasse, setAMotDePasse] = useState<boolean | null>(null);
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(false);

  // À l'ouverture : le compte a-t-il un mot de passe (provider « credential ») ?
  useEffect(() => {
    if (!open) return;
    setMotDePasse("");
    setErreur(false);
    setAMotDePasse(null);
    authClient
      .listAccounts()
      .then(({ data }) => {
        const liste = (data ?? []) as { provider?: string; providerId?: string }[];
        setAMotDePasse(liste.some((a) => (a.provider ?? a.providerId) === "credential"));
      })
      .catch(() => setAMotDePasse(false));
  }, [open]);

  const supprimer = async () => {
    setEnCours(true);
    setErreur(false);
    const { error } = await authClient.deleteUser(aMotDePasse ? { password: motDePasse } : {});
    if (error) {
      setErreur(true);
      setEnCours(false);
      return;
    }
    // Compte détruit : retour à l'accueil, état de session repris à zéro.
    window.location.href = "/";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !enCours && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{UI.supprimerCompteTitre[lang]}</DialogTitle>
          <DialogDescription>{UI.supprimerCompteDesc[lang]}</DialogDescription>
        </DialogHeader>

        {aMotDePasse && (
          <div className="space-y-2">
            <Label htmlFor="mdp-suppression">{UI.supprimerCompteMdp[lang]}</Label>
            <Input
              id="mdp-suppression"
              type="password"
              autoComplete="current-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
          </div>
        )}

        {erreur && <p className="text-sm text-destructive">{UI.supprimerCompteErreur[lang]}</p>}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" disabled={enCours} onClick={() => onOpenChange(false)}>
            {UI.annuler[lang]}
          </Button>
          <Button
            variant="destructive"
            disabled={enCours || aMotDePasse === null || (aMotDePasse && motDePasse.length === 0)}
            onClick={supprimer}
          >
            {UI.supprimerCompteConfirmer[lang]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
