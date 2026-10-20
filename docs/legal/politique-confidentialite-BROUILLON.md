# Politique de confidentialité — BROUILLON (à valider)

> **Brouillon rédigé pendant le chantier d’octobre 2026 (lot 1). Ne pas publier en l’état.**
> Base : `docs/legal-templates-fr-es-draft.md` §3, mise à jour avec les outils réellement utilisés en octobre 2026.
> Les passages entre crochets `[…]` sont à compléter. Version espagnole à traduire après validation.

---

## 1. Responsable du traitement

**Alejandra Mangas**, pour **Mangas Alejandra** (EI, nom commercial FitMangas), SIREN 947 964 508, 17 Passage Leroy, 44300 Nantes, France. Contact : alejandra@fitmangas.com.

## 2. Ce que nous collectons, et pourquoi

| Données | Pourquoi | Base légale |
|---|---|---|
| Nom, email, téléphone, mot de passe (chiffré) | Créer et gérer ton compte | Contrat |
| Date d’anniversaire (jour et mois seulement) | Une petite attention le jour J | Consentement (champ facultatif) |
| Abonnement, paiements, factures | Te facturer, tenir la comptabilité | Contrat, obligation légale |
| Présence aux cours, replays vus, programmes suivis | Te donner accès aux cours et suivre ta progression | Contrat |
| Image et voix pendant les lives | Te corriger en direct ; constituer les replays | Contrat ; voir §5 |
| Réponses aux tests (quiz, connaissance de soi) | Te remettre ton résultat | Consentement |
| Messages (support, Instagram, WhatsApp) | Te répondre | Intérêt légitime / contrat |
| Préférences de notifications, langue, fuseau | Envoyer les bons rappels au bon moment | Contrat |
| Newsletter et emails marketing | T’informer des nouveautés | **Consentement** (case non cochée par défaut) |
| Adresse IP **hachée** (jamais en clair) | Protéger les formulaires contre les robots | Intérêt légitime |
| Cookies de mesure (GA4, Meta Pixel) | Mesurer l’audience et les publicités | **Consentement** (bandeau cookies) |

## 3. Qui reçoit tes données (sous-traitants)

- **Supabase** — base de données et connexion (UE, Irlande `[à confirmer]`)
- **Vercel** — hébergement du site (UE pour les calculs, société américaine)
- **Stripe** — paiement
- **Resend** — envoi des emails
- **Vimeo** — hébergement des replays
- **Hetzner** — serveur des lives visio (Jitsi) et de l’enregistrement (Allemagne)
- **Cloudflare (Turnstile)** — vérification anti-robot des formulaires
- **Printful** — fabrication et envoi des commandes boutique
- **Meta** (Instagram, Facebook, WhatsApp) — messages et publicités
- **Google** (GA4) — mesure d’audience ; **Google Gemini**, **Anthropic Claude**, **Mistral**, **Groq** — aide à la rédaction de réponses et de contenus, sous contrôle humain `[à préciser : quelles données transitent]`

## 4. Transferts hors de l’Union européenne

Certains prestataires sont des sociétés américaines (Vercel, Stripe, Resend, Vimeo, Cloudflare, Meta, Google, Anthropic, Groq). Les transferts reposent sur le Data Privacy Framework UE–États-Unis ou les clauses contractuelles types de la Commission européenne. `[À compléter avec le conseil : registre, DPA signés.]`

## 5. Les lives en visio et leur enregistrement

- Ta **caméra est allumée par défaut** à l’entrée du live ; ton micro est coupé. Tu peux couper ta caméra à tout moment.
- Pendant le live, **la coach et les autres participantes peuvent te voir**.
- Les lives sont **enregistrés** pour créer les replays réservés aux abonnées. L’enregistrement est cadré sur la coach. `[À vérifier sur un replay réel avant publication : si les vignettes des participantes apparaissent dans l’enregistrement, il faut le dire ici et proposer de couper sa caméra.]`
- Les replays sont hébergés sur Vimeo en accès privé, visibles seulement depuis l’espace cliente.

## 6. Durées de conservation

| Données | Durée |
|---|---|
| Compte et historique | Durée de l’abonnement + 3 ans après la dernière activité |
| Factures | 10 ans (obligation comptable) |
| Preuves de consentement et de désinscription | 24 mois après la fin du consentement |
| Journaux d’envoi d’emails et de notifications | 24 mois |
| Adresses IP hachées (anti-robot) | 24 heures |
| Replays | `[À définir]` |

## 7. Tes droits

Accès, rectification, effacement, limitation, opposition (notamment aux emails marketing), portabilité, retrait du consentement à tout moment. Écris à alejandra@fitmangas.com ; réponse sous un mois.

Tu peux aussi :
- changer tes préférences de notifications depuis ton espace ;
- te désinscrire des emails marketing par le lien en bas de chaque email ;
- modifier ton choix de cookies avec le lien « Gérer mes cookies » en bas du site.

Réclamation : **CNIL** (France) — https://www.cnil.fr ; pour les personnes au Mexique : **INAI** `[à vérifier : l’INAI a été remplacé en 2025 — nom de l’autorité actuelle à confirmer]`.

## 8. Mineures

Le service s’adresse aux personnes **majeures**. `[À confirmer.]`

## 9. Sécurité

Connexions chiffrées (HTTPS), mots de passe chiffrés, double authentification pour l’administration, accès aux données limité au strict nécessaire.

---

*Brouillon — chantier octobre 2026, lot 1. Aucune page publique n’a été modifiée.*
