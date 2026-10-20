# Synthèse — Chantier octobre 2026

Branche locale `chantier-oct-2026` depuis `main` @ `7c46c7c`. **Aucun push, PR, merge ni déploiement.** Plugins MCP en lecture seule. Aucune migration appliquée. Aucun envoi réel (email, push, DM, WhatsApp).

Build de référence (avant lot 1) : vert. `npm test` : 392 OK, 1 échec préexistant (`email-audit.test.ts`, timeout `git grep` / disque). Chaque lot a un build vert.

| Lot | Commit | Drapeau (off) |
|---|---|---|
| 1 Sécurité | `2d0581e` | `TURNSTILE_ENABLED`, `RATE_LIMIT_ENABLED`, `ADMIN_REQUIRE_MFA` |
| 2a Notifications moteur | `915113f` | `NEXT_PUBLIC_FEATURE_NOTIF_V2` |
| 2b Notifications écrans | `2b7c27b` | idem |
| 3a Programmes données | `c8dc159` | `NEXT_PUBLIC_FEATURE_PROGRAMMES` |
| 3b Programmes client | `a1005fd` | idem |
| 4 Cartes cadeaux | `2e0579b` | `NEXT_PUBLIC_FEATURE_GIFTS` |
| 5 Conversion | `cfb58bd` | `ONSITE_ENABLED` déjà faux |
| 6 Accès unique | `ed9d7ea` | `ACCESS_V2` **bloqué** (1 écart) |
| 7 Croissance | (ce commit) | `CROISSANCE_V2` |

`EMAIL_SAFE_MODE` actif hors production.

Rapports détaillés : `lot-1.md` … `lot-7.md`. Captures : `rapports/captures/lot-<n>/` (aperçus `/dev/apercu`, données fictives).

---

## Fait (ce que tu as déjà, drapeau coupé)

- **Sécurité / perf** : en-têtes, CSP report-only, erreurs publiques, sanitization articles, MFA/Turnstile/limite IP **prêts mais éteints**, scripts de comparaison (lecture seule).
- **Notifications v2** : moteur rappels, lives récurrents, gabarits emails, centre, préférences, page santé — inactifs tant que le drapeau + SQL ne sont pas là.
- **Programmes** : schéma + import à blanc + admin + espace client + lecteur + certificat + test de niveau — bloqués tant que les tables n’existent pas. Aperçus OK.
- **Cartes cadeaux** : pages offrir / activer / PDF A5 / admin — bloqués tant que `gift_cards` + prix Stripe test manquent.
- **Conversion** : accueil titre A, menu, modale essai (case immédiat seulement offre 269 €), planning v3, habillage live, Les cours, test de niveau, suivi clientes, info-bulles, nav mobile, présentiel masqué.
- **Accès V2** : fonction prête, **pas branchée** partout. 1 profil encore différent → activation interdite.
- **Croissance** : 43 règles intactes. Nouveaux textes / mots-clés / relance unique / 9–20 h **uniquement si** `CROISSANCE_V2=1`. UI additive (entonnoir de référence, Test, liste moteur, À filmer, doublons, guides blog).

Sans aucun GO de ta part, **rien de tout ça ne change le site en ligne**.

---

## Reste à faire (pas du code, ou code volontairement arrêté)

- Relire `src/content/a-valider.ts` (tous les lots) + `croissance-messages.md` (Alejandra).
- Diplômes, langues des vidéos, minutages programmes, médiateur, planning lives, styles de cours (SPEC §10).
- Pixel-perfect mobile / emails vs JPG : approximations, à valider à l’œil après déploiement.
- Page live réelle : Kevin teste hors horaire de cours (on n’a pas ouvert `/live/...` pour ne pas écrire de visite).
- Doublon légende : alerte sur le bandeau Publications, pas encore un « Programmer quand même » au clic.
- Guides blog : pages listes OK ; pas de lien retour dans chaque article.
- Compteurs Croissance « sans l’équipe » : attendent la table `acq_team_accounts`.

---

## GO dont tu auras besoin (dans cet ordre)

Toujours : **déployer d’abord avec tous les drapeaux éteints**. Ensuite, un GO à la fois. SQL destructif = jamais. Tout le SQL est dans `PROPOSITIONS_MIGRATIONS.md`.

### A. Données / SQL (toi ou moi après ton GO écrit)

1. **Lot 1** — RLS ads + révocation `anon` ; optionnel `rate_limits` ; défaut `marketing_email_opt_in = false` ; UPDATE des profils sans preuve d’opt-in (à relire : ça coupe le marketing mail). Bucket avatars privé = optionnel.
2. **Lot 2** — colonnes notifications (`group_key`, `category`, `action_url`, préférences) + `NOTIF_V2_CUTOFF` / Vault / pg_cron. Filet cron-job.org : tu décides quand le couper.
3. **Lot 3** — tables programmes + `FM_IMPORT_APPLY=1` sur l’import (dry-run : 67/68 titres).
4. **Lot 4** — table `gift_cards`. Ensuite prix Stripe **mode test** 39 / 109 / 195 / 349 € → variables `STRIPE_PRICE_GIFT_*`.
5. **Lot 5** — `client_followups` (suivi « Relancée ») ; `printful_product_names` (noms boutique FR/ES).
6. **Lot 6** — pas de SQL obligatoire. **Corriger les données** du profil `f694a7d9…` (accès actuel oui, V2 non) et les `subscription_status` orphelins du lot 1. Relancer `npx tsx scripts/chantier-oct/compare-access-v2.ts` : 0 écart avant d’allumer `ACCESS_V2`.
7. **Lot 7** — `acq_team_accounts` (optionnel, pour ignorer Instagram/emails/tél. de l’équipe dans les compteurs).

### B. Stripe / GA4 (toi, dans les consoles)

- Désactiver les e-mails Stripe « fin d’essai ».
- Marquer `trial_started` et `purchase` comme **événements clés** GA4.
- Filtre GA4 **trafic interne** (IP bureau / Mac).
- Cartes cadeaux : produit + 4 prix **test**, puis live seulement après un achat test OK.
- Lot 6 : si tu as une clé Stripe **lecture live**, relancer la réconciliation (en local on n’a que du test).

### C. Drapeaux (après SQL + relecture, un par un, + redéploiement)

Les `NEXT_PUBLIC_*` sont figés au build : changer = redéployer.

1. `NEXT_PUBLIC_FEATURE_NOTIF_V2` — après migration lot 2.
2. `NEXT_PUBLIC_FEATURE_PROGRAMMES` — après import programmes.
3. `NEXT_PUBLIC_FEATURE_GIFTS` — après table + prix test.
4. `ACCESS_V2` — **seulement si** comparatif = 0 écart.
5. `CROISSANCE_V2` — après relecture Alejandra des messages. Runtime (pas `NEXT_PUBLIC_`).
6. `TURNSTILE_ENABLED` / `RATE_LIMIT_ENABLED` / `ADMIN_REQUIRE_MFA` — quand les clés et la table `rate_limits` sont là. MFA : enrôler les comptes admin avant d’exiger.

`ONSITE_ENABLED` reste faux (présentiel masqué, décision du 19/10).

### D. Secrets / Vercel (sans les afficher)

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + secret Turnstile, si tu allumes l’anti-robot.
- Prix cadeaux : `STRIPE_PRICE_GIFT_1M` / `3M` / `6M` / `12M`.
- Chaque variable Vercel → aussi `.env.local`.

### E. Ce que tu n’as PAS à faire tout de suite

- Pas de campagne ads, pas de dépense.
- Pas d’activation de la règle workflow 01f.
- Pas de fusion / suppression d’articles de blog.
- Pas de toucher aux replays ni à Jitsi / `live.fitmangas.com`.

---

## Comment avancer sans te perdre

1. Lire cette page + le lot qui t’intéresse (`lot-N.md`, section **Mise en production**).
2. Dis « GO lot N » (ou « GO SQL lot N ») par écrit.
3. Après application : un drapeau, un redéploiement, un test court, puis le suivant.
