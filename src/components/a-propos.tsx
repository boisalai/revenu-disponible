"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { UI } from "@/lib/i18n";
import { useLangue } from "@/components/lang-provider";
import { BarreSuperieure, PiedPage } from "@/components/espace-travail";

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{titre}</h2>
      <div className="leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function APropos() {
  const { lang, setLang } = useLangue();

  return (
    <div className="flex min-h-[calc(100dvh-0.25rem)] flex-col">
      <BarreSuperieure
        lang={lang}
        onLang={setLang}
        titre={UI.aProposTitre[lang]}
        sousTitre={UI.aProposSousTitre[lang]}
        avecPartage={false}
        nav={
          <>
            <Link href="/" className="underline-offset-4 hover:underline">← {UI.navCalculateur[lang]}</Link>
            <Link href="/comparaison" className="underline-offset-4 hover:underline">{UI.navComparaison[lang]}</Link>
            <Link href="/budget" className="underline-offset-4 hover:underline">{UI.navBudget[lang]}</Link>
            <Link href="/bibliotheque" className="underline-offset-4 hover:underline">{UI.navBibliotheque[lang]}</Link>
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-8 px-6 py-10">
          <Section titre={UI.aProposProjetTitre[lang]}>{UI.aProposProjet[lang]}</Section>

          <Section titre={UI.aProposAuteurTitre[lang]}>
            <p>{UI.aProposAuteur[lang]}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium text-primary">
              <a
                href="https://www.linkedin.com/in/alain-boisvert-mba-98b058156/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
              >
                LinkedIn
                <ExternalLink className="size-3.5" />
              </a>
              <a
                href="https://github.com/boisalai/revenu-disponible"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
              >
                {UI.codeSource[lang]}
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </Section>

          <Section titre={UI.aProposMethodeTitre[lang]}>{UI.aProposMethode[lang]}</Section>
          <Section titre={UI.aProposTechTitre[lang]}>{UI.aProposTech[lang]}</Section>
          <Section titre={UI.aProposIATitre[lang]}>{UI.aProposIA[lang]}</Section>
          <Section titre={UI.aProposAvertTitre[lang]}>{UI.aProposAvert[lang]}</Section>
        </div>
      </div>

      <PiedPage lang={lang} />
    </div>
  );
}
