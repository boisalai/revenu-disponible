"use client";

import Link from "next/link";
import { UI } from "@/lib/i18n";
import { useLangue } from "@/components/lang-provider";
import { BarreSuperieure, PiedPage } from "@/components/espace-travail";

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{titre}</h2>
      <div className="space-y-2 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Tableau({ lignes }: { lignes: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-lg border text-sm">
      <table className="w-full">
        <tbody>
          {lignes.map(([a, b]) => (
            <tr key={a} className="border-b last:border-b-0">
              <td className="px-3 py-1.5 align-top font-medium text-foreground">{a}</td>
              <td className="px-3 py-1.5">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Politique de confidentialité (RLRQ, c. P-39.1). Texte en français — version
 * faisant foi ; un repère en anglais l'indique aux visiteurs anglophones.
 */
export function Confidentialite() {
  const { lang, setLang } = useLangue();

  return (
    <div className="flex min-h-[calc(100dvh-0.25rem)] flex-col">
      <BarreSuperieure
        lang={lang}
        onLang={setLang}
        titre={UI.confidentialiteTitre[lang]}
        sousTitre={UI.confidentialiteSousTitre[lang]}
        avecPartage={false}
        nav={
          <>
            <Link href="/" className="underline-offset-4 hover:underline">← {UI.navCalculateur[lang]}</Link>
            <Link href="/a-propos" className="underline-offset-4 hover:underline">{UI.aProposLien[lang]}</Link>
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-8 px-6 py-10 text-sm">
          <p className="text-xs text-muted-foreground">
            En vigueur le 12 juin 2026. {lang === "en" && <em>This policy is provided in French, its authoritative version.</em>}
          </p>

          <p className="leading-relaxed text-muted-foreground">
            Cette politique décrit comment l'application <span className="font-medium text-foreground">Revenu disponible — Québec</span> (revenu-disponible.vercel.app),
            exploitée par Alain Boisvert (« nous »), recueille, utilise, conserve et protège les renseignements personnels,
            conformément à la <em>Loi sur la protection des renseignements personnels dans le secteur privé</em> (RLRQ, c. P-39.1).
          </p>

          <Section titre="1. Responsable de la protection des renseignements personnels">
            <p>
              Alain Boisvert — <a href="mailto:ay.boisvert@gmail.com" className="font-medium text-primary underline-offset-4 hover:underline">ay.boisvert@gmail.com</a>.
              Toute question sur cette politique ou toute demande relative à vos renseignements personnels peut lui être adressée.
            </p>
          </Section>

          <Section titre="2. Ce que nous recueillons — et ce que nous ne recueillons pas">
            <h3 className="pt-1 font-medium text-foreground">2.1 Utilisation sans compte (par défaut)</h3>
            <p>
              Le calcul du revenu disponible s'effectue <strong>entièrement dans votre navigateur</strong> : les revenus, âges,
              situations familiales et frais de garde que vous saisissez <strong>ne sont ni transmis à nos serveurs, ni recueillis</strong>.
              L'outil est pédagogique et ces données sont présumées fictives.
            </p>
            <p>
              L'hébergeur produit des journaux techniques (adresse IP, date, ressource demandée) à des fins de sécurité et de
              diagnostic, conservés pour une courte durée qu'il détermine. Aucun témoin (cookie) publicitaire, aucune mesure
              d'audience de tiers. Les <strong>liens de partage</strong> que vous créez encodent les paramètres de la simulation dans
              l'adresse elle-même : leur diffusion est entièrement sous votre contrôle.
            </p>
            <h3 className="pt-1 font-medium text-foreground">2.2 Avec un compte (facultatif)</h3>
            <p>Si vous créez un compte pour enregistrer vos scénarios, nous recueillons le strict nécessaire :</p>
            <Tableau
              lignes={[
                ["Adresse courriel", "identifier le compte et y donner accès"],
                ["Nom (si fourni, ou transmis par Google lors d'une connexion Google, avec l'avatar le cas échéant)", "affichage dans l'interface"],
                ["Mot de passe", "authentification — conservé uniquement sous forme hachée (scrypt), jamais en clair"],
                ["Scénarios, ménages types et jeux de paramètres enregistrés", "vous permettre de les retrouver et de les rouvrir"],
                ["Témoin de session", "témoin strictement technique, pour vous garder connecté"],
              ]}
            />
            <p>Aucun renseignement n'est utilisé à des fins publicitaires ni communiqué à des tiers à des fins commerciales.</p>
            <h3 className="pt-1 font-medium text-foreground">2.3 Assistant d'intelligence artificielle (facultatif)</h3>
            <p>
              Si vous utilisez l'assistant, le contenu de vos questions et les paramètres du scénario affiché sont transmis à
              <strong> Anthropic</strong> (fournisseur du modèle Claude) pour produire la réponse. En <strong>mode démo</strong>, la requête
              transite par notre serveur avec notre clé ; un quota par adresse IP est tenu en mémoire vive (compteur du jour,
              jamais enregistré dans une base de données). Avec une <strong>clé personnelle</strong>, celle-ci demeure dans votre
              navigateur (stockage local), est transmise à chaque requête et n'est <strong>jamais conservée sur nos serveurs</strong>.
            </p>
            <p>
              N'incluez pas de renseignements personnels réels — les vôtres ou ceux d'autrui — dans vos échanges avec
              l'assistant. Le traitement par Anthropic est régi par sa propre politique de confidentialité.
            </p>
          </Section>

          <Section titre="3. Communication et hébergement à l'extérieur du Québec">
            <p>Certains renseignements sont hébergés ou traités à l'extérieur du Québec :</p>
            <Tableau
              lignes={[
                ["Vercel (États-Unis)", "hébergement et exécution de l'application"],
                ["Neon (États-Unis — AWS, Virginie du Nord)", "base de données des comptes et des scénarios enregistrés"],
                ["Anthropic (États-Unis)", "traitement des requêtes de l'assistant IA"],
              ]}
            />
            <p>
              Conformément à l'article 17 de la loi, ces communications et ce recours à des fournisseurs hors Québec font
              l'objet d'une évaluation des facteurs relatifs à la vie privée, conservée au dossier : sensibilité limitée des
              renseignements en cause (adresse courriel et scénarios de simulation présumés fictifs), finalités restreintes,
              et garanties contractuelles et techniques offertes par ces fournisseurs.
            </p>
          </Section>

          <Section titre="4. Conservation et destruction">
            <p>
              Les renseignements de compte et les scénarios sont conservés tant que le compte est actif. Sur demande de
              suppression, le compte et les données associées sont détruits dans les 30 jours. Les journaux techniques de
              l'hébergeur sont conservés pour une courte durée qu'il détermine.
            </p>
          </Section>

          <Section titre="5. Vos droits">
            <p>Vous pouvez, en écrivant au responsable identifié à la section 1 :</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>accéder</strong> aux renseignements personnels que nous détenons sur vous ;</li>
              <li>les faire <strong>rectifier</strong> s'ils sont inexacts ou incomplets ;</li>
              <li><strong>retirer votre consentement</strong> à leur utilisation ou à leur communication ;</li>
              <li>demander la <strong>suppression</strong> de votre compte et des scénarios associés ;</li>
              <li>demander la <strong>cessation de la diffusion</strong> d'un renseignement qui vous concerne.</li>
            </ul>
            <p>
              Nous répondons par écrit, avec diligence et au plus tard dans les <strong>30 jours</strong> de la réception de la
              demande (art. 32). En cas d'insatisfaction, vous pouvez vous adresser à la{" "}
              <a href="https://www.cai.gouv.qc.ca" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
                Commission d'accès à l'information du Québec
              </a>.
            </p>
          </Section>

          <Section titre="6. Sécurité">
            <p>
              Communications chiffrées (HTTPS) ; mots de passe hachés (scrypt) ; accès restreint à la base de données ;
              clé API de l'assistant jamais conservée côté serveur ; et minimisation par conception — les données de
              simulation ne quittent pas votre navigateur hors des usages décrits à la section 2.
            </p>
          </Section>

          <Section titre="7. Incidents de confidentialité">
            <p>
              Nous tenons un registre des incidents de confidentialité. Tout incident présentant un risque de préjudice
              sérieux est notifié à la Commission d'accès à l'information et aux personnes concernées.
            </p>
          </Section>

          <Section titre="8. Mineurs de moins de 14 ans">
            <p>
              Ce service ne s'adresse pas aux enfants de moins de 14 ans et nous ne recueillons pas sciemment leurs
              renseignements personnels sans le consentement du titulaire de l'autorité parentale ou du tuteur (art. 4.1).
            </p>
          </Section>

          <Section titre="9. Modifications">
            <p>
              Toute modification de cette politique est publiée sur cette page, avec mise à jour de la date d'entrée en
              vigueur en tête de document.
            </p>
          </Section>

          <p className="text-xs text-muted-foreground">
            Référence : Loi sur la protection des renseignements personnels dans le secteur privé, RLRQ, c. P-39.1 —{" "}
            <a href="https://www.legisquebec.gouv.qc.ca/fr/document/lc/P-39.1" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
              LégisQuébec
            </a>.
          </p>
        </div>
      </div>

      <PiedPage lang={lang} />
    </div>
  );
}
