"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { enregistrerScenario, type TypeScenario } from "@/lib/scenarios";
import { UI, type Lang } from "@/lib/i18n";
import { AuthDialog } from "./auth-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Bouton « Enregistrer » : sauvegarde le scénario courant (code de partage) pour l'utilisateur. */
export function BoutonEnregistrer({
  type,
  encoded,
  lang,
}: {
  type: TypeScenario;
  encoded: string;
  lang: Lang;
}) {
  const { data: session } = useSession();
  const [authOuvert, setAuthOuvert] = useState(false);
  const [dlgOuvert, setDlgOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [ok, setOk] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const cliquer = () => {
    if (!session) {
      setAuthOuvert(true);
      return;
    }
    setNom("");
    setOk(false);
    setErreur(null);
    setDlgOuvert(true);
  };

  const sauvegarder = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      await enregistrerScenario({ type, nom, payload: encoded });
      setOk(true);
      setTimeout(() => setDlgOuvert(false), 900);
    } catch {
      setErreur(UI.erreurGenerique[lang]);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={cliquer} className="gap-1.5">
        <Save className="size-4" />
        {UI.enregistrer[lang]}
      </Button>

      <AuthDialog open={authOuvert} onOpenChange={setAuthOuvert} lang={lang} />

      <Dialog open={dlgOuvert} onOpenChange={setDlgOuvert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{UI.enregistrerScenarioTitre[lang]}</DialogTitle>
          </DialogHeader>
          <form onSubmit={sauvegarder} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="scn-nom">{UI.nomScenario[lang]}</Label>
              <Input id="scn-nom" value={nom} onChange={(e) => setNom(e.target.value)} required autoFocus maxLength={80} />
            </div>
            {erreur && <p className="text-sm text-destructive">{erreur}</p>}
            {ok && <p className="text-sm text-emerald-600">{UI.scenarioEnregistre[lang]}</p>}
            <DialogFooter>
              <Button type="submit" disabled={enCours || !nom.trim()}>
                {enCours ? UI.chargement[lang] : UI.enregistrer[lang]}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
