# Phase 0 — Vérifications (verrouillé le jour du go)

## 1. Stripe — mode test

- Les clés présentes dans `.env.local` utilisent le préfixe **`pk_test_`** / **`sk_test_`** → **mode test Stripe confirmé** pour l’API.

## 2. Variables `STRIPE_PRICE_ID_*` — valeurs fournies (à intégrer dans `.env.local`)

Les noms **exact** attendus par le code (`src/lib/checkout-courses.ts`, `src/lib/admin/kpis.ts`) sont les suivants — **aucun alias** n’est requis :

- `STRIPE_PRICE_ID_VISIO_COLLECTIF`
- `STRIPE_PRICE_ID_VISIO_INDIVIDUEL`
- `STRIPE_PRICE_ID_NANTES_COLLECTIF`
- `STRIPE_PRICE_ID_NANTES_INDIVIDUEL`

**Valeurs mode test** (Dashboard Stripe — à copier dans `.env.local` et variables Vercel) :

```env
STRIPE_PRICE_ID_VISIO_COLLECTIF=price_1TTPinGe7RgAEfvcN2XTArqE
STRIPE_PRICE_ID_VISIO_INDIVIDUEL=price_1TTPjEGe7RgAEfvcnlgFaHrV
STRIPE_PRICE_ID_NANTES_COLLECTIF=price_1TTPjdGe7RgAEfvcXtK8pLvc
STRIPE_PRICE_ID_NANTES_INDIVIDUEL=price_1TTPjxGe7RgAEfvcoc6p3mxG
```

Sans elles, `POST /api/checkout` renvoie **503** (« Identifiant de prix Stripe manquant »).

### Rappel type de prix (aligné `checkout-courses.ts`)

| Variable | Type attendu |
|----------|----------------|
| `STRIPE_PRICE_ID_VISIO_COLLECTIF` | **Recurring** (mensuel), 39 € affiché landing |
| `STRIPE_PRICE_ID_VISIO_INDIVIDUEL` | **Recurring** (mensuel), 269 € |
| `STRIPE_PRICE_ID_NANTES_COLLECTIF` | **One-time** (10 € / séance) |
| `STRIPE_PRICE_ID_NANTES_INDIVIDUEL` | **One-time** (50 € / séance) |

Puis redémarrer `next dev` / redéployer Vercel.

## 3. URL officielle v1 (décision fondateur)

- **URL plateforme :** `https://fitmangas5.vercel.app`
- **À avoir dans `.env.local` (et Vercel Production) :**

```env
NEXT_PUBLIC_APP_URL=https://fitmangas5.vercel.app
APP_URL=https://fitmangas5.vercel.app
```

## 4. Email expéditeur

- `NEWSLETTER_FROM_EMAIL` et `RESEND_API_KEY` doivent rester configurés (aligné prompt maître §3 BIS).

## 5. Comptes test (Phase 2, rappel)

Création manuelle après env complet :  
`kevin.picard+vcoll|vind|ncoll|nind@gmail.com` + cartes test Stripe documentées dans le prompt maître.

---

*Document généré pour clôture Phase 0 — aucune migration exécutée.*
