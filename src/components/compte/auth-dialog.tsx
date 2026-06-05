"use client";

import { useState } from "react";
import { signIn, signUp, GOOGLE_ACTIVE } from "@/lib/auth-client";
import { UI, type Lang } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Onglet = "connexion" | "inscription";

/** Dialogue de connexion / inscription (courriel + mot de passe, + Google si configuré). */
export function AuthDialog({
  open,
  onOpenChange,
  lang,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lang: Lang;
}) {
  const [onglet, setOnglet] = useState<Onglet>("connexion");
  const [nom, setNom] = useState("");
  const [courriel, setCourriel] = useState("");
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const reset = () => {
    setNom("");
    setCourriel("");
    setMdp("");
    setErreur(null);
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const res =
        onglet === "inscription"
          ? await signUp.email({ email: courriel, password: mdp, name: nom || courriel })
          : await signIn.email({ email: courriel, password: mdp });
      if (res.error) {
        setErreur(UI.erreurAuth[lang]);
        return;
      }
      onOpenChange(false);
      reset();
    } catch {
      setErreur(UI.erreurGenerique[lang]);
    } finally {
      setEnCours(false);
    }
  };

  const google = async () => {
    setErreur(null);
    await signIn.social({ provider: "google", callbackURL: window.location.href });
  };

  const titre = onglet === "inscription" ? UI.inscription[lang] : UI.connexion[lang];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titre}</DialogTitle>
        </DialogHeader>

        <Tabs value={onglet} onValueChange={(v) => { setOnglet(v as Onglet); setErreur(null); }}>
          <TabsList className="w-full">
            <TabsTrigger value="connexion" className="flex-1">{UI.connexion[lang]}</TabsTrigger>
            <TabsTrigger value="inscription" className="flex-1">{UI.inscription[lang]}</TabsTrigger>
          </TabsList>

          <form onSubmit={soumettre} className="mt-4 grid gap-3">
            {onglet === "inscription" && (
              <div className="grid gap-1.5">
                <Label htmlFor="auth-nom">{UI.champNom[lang]}</Label>
                <Input id="auth-nom" value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="auth-courriel">{UI.champCourriel[lang]}</Label>
              <Input id="auth-courriel" type="email" required value={courriel} onChange={(e) => setCourriel(e.target.value)} autoComplete="email" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="auth-mdp">{UI.champMotDePasse[lang]}</Label>
              <Input
                id="auth-mdp"
                type="password"
                required
                minLength={8}
                value={mdp}
                onChange={(e) => setMdp(e.target.value)}
                autoComplete={onglet === "inscription" ? "new-password" : "current-password"}
              />
            </div>
            {erreur && <p className="text-sm text-destructive">{erreur}</p>}
            <Button type="submit" disabled={enCours} className="mt-1">
              {enCours ? UI.chargement[lang] : titre}
            </Button>
          </form>
        </Tabs>

        {GOOGLE_ACTIVE && (
          <>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {UI.ou[lang]}
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button type="button" variant="outline" onClick={google} className="w-full">
              {UI.continuerGoogle[lang]}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
