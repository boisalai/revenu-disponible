# Évaluation des facteurs relatifs à la vie privée (art. 17, RLRQ, c. P-39.1)

**Objet :** communication et hébergement de renseignements personnels à l'extérieur du Québec
**Application :** Revenu disponible — Québec (revenu-disponible.vercel.app)
**Responsable :** Alain Boisvert · **Date :** 12 juin 2026 *(à réviser à tout changement de fournisseur ou de collecte)*

> Document interne conservé au dossier, exigé par l'art. 17 P-39.1 (« Avant de
> communiquer à l'extérieur du Québec un renseignement personnel, la personne
> qui exploite une entreprise doit procéder à une évaluation des facteurs
> relatifs à la vie privée ») — applicable aussi lorsqu'elle « confie à une
> personne ou à un organisme à l'extérieur du Québec la tâche de recueillir,
> d'utiliser, de communiquer ou de conserver pour son compte un tel
> renseignement ».

## 1. Renseignements visés et sensibilité

| Renseignement | Sensibilité | Note |
| --- | --- | --- |
| Adresse courriel, nom (et avatar Google le cas échéant) | faible | identifiants de compte usuels |
| Mot de passe | — | jamais communiqué : haché (scrypt) avant stockage |
| Scénarios de simulation (situation, revenus, âges, enfants, frais de garde) | faible | données **présumées fictives** (outil pédagogique) ; non nominatives |
| Questions posées à l'assistant IA | faible à variable | la politique demande expressément de n'y inclure **aucun renseignement personnel réel** |
| Adresse IP (quota du mode démo) | faible | compteur **en mémoire vive** par jour, jamais persisté |

Aucun renseignement sensible au sens de la loi (santé, biométrie, finances
réelles nominatives) n'est recueilli par conception : le calcul s'effectue dans
le navigateur et les simulations ne sont pas transmises au serveur.

## 2. Finalités

Comptes et sauvegarde de scénarios (Neon) ; exécution de l'application
(Vercel) ; génération des réponses de l'assistant (Anthropic). Aucune
finalité publicitaire ; aucune communication à des tiers à des fins
commerciales.

## 3. Destinataires et localisation

| Fournisseur | Tâche confiée | Localisation |
| --- | --- | --- |
| Vercel Inc. | hébergement et exécution | États-Unis |
| Neon Inc. | conservation de la base (comptes, scénarios) | États-Unis (AWS us-east-1, Virginie du Nord) |
| Anthropic PBC | traitement des requêtes de l'assistant | États-Unis |

## 4. Garanties

- Contractuelles : conditions et engagements de confidentialité publiés des
  trois fournisseurs (DPA Vercel ; DPA Neon ; politique de confidentialité et
  conditions commerciales d'Anthropic — les requêtes API ne servent pas à
  l'entraînement par défaut).
- Techniques : chiffrement en transit (HTTPS/TLS) ; hachage scrypt des mots de
  passe ; accès à la base restreint (chaîne de connexion secrète) ; clé API de
  l'assistant jamais conservée côté serveur ; minimisation par conception.

## 5. Conclusion

Compte tenu de la sensibilité limitée des renseignements, des finalités
restreintes, et des garanties contractuelles et techniques des fournisseurs,
les renseignements communiqués ou confiés hors Québec **bénéficient d'une
protection adéquate** eu égard aux principes de protection des renseignements
personnels généralement reconnus. La communication peut avoir lieu.

Mesures d'atténuation retenues : avertissement explicite (ne pas saisir de
renseignements personnels réels dans l'assistant) ; quota démo sans
persistance ; aucune collecte de simulation côté serveur.
