# Lot 4 — Cartes cadeaux

Date : 19/10/2026. Branche `chantier-oct-2026` (commit local, pas de push).

## Items non faits ou partiels

- **Table `gift_cards` absente** (GO Lot 4) : aperçus `/dev/apercu` avec données fictives. Achat, activation, PDF réel, admin réel, cron d’envoi : bloqués jusqu’à SQL + prix Stripe test.
- **Prix Stripe** : Kevin doit créer en **mode test** le produit « Carte cadeau FitMangas » + 4 prix uniques (39 / 109 / 195 / 349 €) et poser `STRIPE_PRICE_GIFT_1M` / `3M` / `6M` / `12M` (Vercel + `.env.local`). Les montants live sont lus via `loadGiftPrices()`. L’aperçu C01 affiche 39/109/195/349 **en dur uniquement** pour la maquette (flag preview).
- **Option email « jour J »** : désactivée tant que le heartbeat `course-reminders` (tâche 10 min) n’est pas vert — option prudente SPEC §5.
- **Activation Stripe** : les 4 modes sont **détectés** (`new_trial` / `existing_no_access` / `balance_credit` / `trial_extension`) ; `trial_end`, `customers.createBalanceTransaction` et prolongation d’essai **non écrits** (reportés après GO + Stripe test). L’activation ne marque la carte que si `stripeGiftWritesAllowed()`.
- **QR sur le PDF A5** : placeholder texte (code + URL d’activation). Pas de package `qrcode` — option prudente, image QR après GO.
- **Remboursement admin (14 j)** : action serveur + confirmation obligatoire ; refuse d’appeler Stripe jusqu’au GO. Prorata non calculé.
- **Carte manuelle FitMangas** : insert prêt ; no-op / erreur générique sans table.
- **Emails Stripe « fin d’essai »** : à désactiver dans le Dashboard Stripe (pas de code).
- **Parcours E2E Stripe test + horloge** : non exécuté (pas de prix, pas de table, pas d’écriture live).
- **Pixel-perfect 390 px** : captures desktop C01 / C04 / C05 ; mobile non joint (émulation approximative comme lot 3b).
- **Email C03** : gabarit v2 côté serveur ; pas de capture HTML autonome (EMAIL_SAFE_MODE, pas d’envoi).

## Décisions prudentes

- Tout derrière `NEXT_PUBLIC_FEATURE_GIFTS` (off) : `/offrir` 404 sauf `DEV_PREVIEW=1` ; rail admin / cliente / landing « Offrir » masqués.
- `stripeGiftWritesAllowed()` : `sk_test_` toujours ; `sk_live_` seulement si `VERCEL_ENV=production` **et** drapeau on. Checkout local refuse donc une clé live.
- Webhook `checkout.session.completed` : si `metadata.kind === 'gift'` → `fulfillGiftCheckout` puis `break` (jamais traité comme abonnement).
- Code `FM-XXXX-XXXX`, alphabet sans 0/O/1/I, `crypto.randomInt`.
- `send_at` = date + heure + IANA (Paris / Mexico). Tests DST 25/10/2026 : Paris 24/10 14:00 → 12:00Z ; 26/10 14:00 → 13:00Z ; Mexico 14:00 → 20:00Z.
- `resolveCode()` : cadeau puis promo puis parrainage. Branchement modale d’essai = **lot 5**.
- Aucun objet Stripe live créé. Aucun email réel.

---

## 1. Stripe (à créer par Kevin, test)

Produit « Carte cadeau FitMangas » + 4 prix. Variables `STRIPE_PRICE_GIFT_1M|3M|6M|12M`. Checkout `mode=payment`, `invoice_creation.enabled`, `metadata.kind=gift`.

## 2. Pages et aperçus

| Maquette | Route / aperçu |
|---|---|
| C01 Offrir | `/offrir` · `/dev/apercu/offrir` |
| C02 PDF A5 | `/api/gifts/pdf/[id]` (`apercu` si `DEV_PREVIEW`) |
| C03 Email destinataire | `sendRecipientGiftEmail` (gabarit v2) |
| C04 Activer | `/offrir/activer` · `/dev/apercu/offrir-activer` |
| C05 Admin | `/admin/cartes-cadeaux` · `/dev/apercu/admin-cartes-cadeaux` |

Captures : `rapports/captures/lot-4/` (`offrir.png`, `offrir-activer.png`, `admin-cartes-cadeaux.png`, `carte-cadeau-pdf-a5.pdf`).

C01 : durées, aperçu live, envoi (email grisé sans heartbeat, PDF), raccourcis 8/12/14/19h, pas de 30 min 07–22h, 08:00 défaut, fuseau, date ≤ 6 mois, case accès immédiat obligatoire (seul endroit du site), récap collant, FAQ.

C04 : `replaceState` retire `?code=` ; Turnstile + `gift_activation` rate-limit ; messages expiré / déjà utilisé / remboursé.

## 3. Webhook, cron, admin

- Fulfill : carte + code, PDF, email acheteuse, destinataire immédiat ou `send_at`.
- `processScheduledGiftEmails` dans `course-reminders` (10 min).
- `sendGiftExpiryReminders` J-14 / J-3 dans `hourly` (textes selon `activation_mode`).
- Admin : KPI, tableau démo, renvoyer email, remboursement (bloqué), carte manuelle. Rail icône Gift.

## 4. CGV

`docs/legal/cgv-BROUILLON.md` §6.3 + §8 (validité 12 mois, rétractation 14 j, email destinataire hors marketing).

## Tests

`npx vitest run src/lib/gifts/send-at.test.ts src/lib/gifts/code.test.ts` → **7/7**.

## Build

`NODE_OPTIONS=--max-old-space-size=4096 npm run build` → **vert** (~7 min 34 s). Routes `/offrir`, `/offrir/activer`, `/admin/cartes-cadeaux` présentes.

## Mise en production

1. GO Kevin → SQL Lot 4 (`gift_cards` + RLS) **non appliqué ici**.
2. Créer produit + 4 prix **Stripe test** ; poser les 4 variables (Vercel + `.env.local`).
3. Déployer le code **drapeau off** : 404 / nav masquée / webhook gift no-op si tables absentes / checkout 404.
4. Vérifier heartbeat `course-reminders` 10 min avant d’allumer l’option email.
5. Allumer `NEXT_PUBLIC_FEATURE_GIFTS=1` **après** relecture Alejandra (textes ES) et un parcours test (achat → PDF → activation).
6. Écritures Stripe live (`trial_end`, solde, refund) : GO séparé + désactiver l’email Stripe « fin d’essai ».
7. Sans ces prérequis : le lot ne casse rien.
