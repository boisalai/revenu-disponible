"use client";

import { useState } from "react";
import { CircleUser, FolderOpen, LogOut } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import { UI, type Lang } from "@/lib/i18n";
import { AuthDialog } from "./auth-dialog";
import { ScenariosDialog } from "./scenarios-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Contrôle de compte dans l'en-tête : connexion ou menu utilisateur (+ « Mes scénarios »). */
export function BarreCompte({ lang }: { lang: Lang }) {
  const { data: session, isPending } = useSession();
  const [authOuvert, setAuthOuvert] = useState(false);
  const [scnOuvert, setScnOuvert] = useState(false);

  if (isPending) return null; // évite le clignotement connecté/déconnecté à l'hydratation

  if (!session) {
    return (
      <>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAuthOuvert(true)}>
          <CircleUser className="size-4" />
          {UI.seConnecter[lang]}
        </Button>
        <AuthDialog open={authOuvert} onOpenChange={setAuthOuvert} lang={lang} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="max-w-[12rem] gap-1.5">
            <CircleUser className="size-4 shrink-0" />
            <span className="truncate">{session.user.name || session.user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
            {session.user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setScnOuvert(true)}>
            <FolderOpen className="size-4" />
            {UI.mesScenarios[lang]}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="size-4" />
            {UI.seDeconnecter[lang]}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ScenariosDialog open={scnOuvert} onOpenChange={setScnOuvert} lang={lang} />
    </>
  );
}
