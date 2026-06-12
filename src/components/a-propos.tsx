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

const MFQ_CALCULATEUR =
  "https://www.finances.gouv.qc.ca/ministere/outils_services/outils_calcul/revenu_disponible/outil_revenu.asp";

/** Rend `texte` en transformant la première occurrence de `terme` en lien externe. */
function AvecLien({ texte, terme, href }: { texte: string; terme: string; href: string }) {
  const i = texte.indexOf(terme);
  if (i < 0) return <>{texte}</>;
  return (
    <>
      {texte.slice(0, i)}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {terme}
      </a>
      {texte.slice(i + terme.length)}
    </>
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

          <Section titre={UI.aProposMethodeTitre[lang]}>
            <p>
              <AvecLien
                texte={UI.aProposMethode[lang]}
                terme={lang === "fr" ? "calculateur officiel" : "calculator"}
                href={MFQ_CALCULATEUR}
              />
            </p>
            <p className="mt-2">
              <AvecLien
                texte={UI.aProposMethodeGuide[lang]}
                terme={lang === "fr" ? "guide PDF" : "PDF guide"}
                href="/guide-revenu-disponible.pdf"
              />
            </p>
          </Section>
          <Section titre={UI.aProposTechTitre[lang]}>{UI.aProposTech[lang]}</Section>
          <Section titre={UI.aProposIATitre[lang]}>{UI.aProposIA[lang]}</Section>
          <Section titre={UI.aProposAvertTitre[lang]}>{UI.aProposAvert[lang]}</Section>
        </div>
      </div>

      <PiedPage lang={lang} />
    </div>
  );
}
