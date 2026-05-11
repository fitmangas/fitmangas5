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

- **URL plateforme :** `https://fitmangas.com`
- **À avoir dans `.env.local` (et Vercel Production) :**

```env
NEXT_PUBLIC_APP_URL=https://fitmangas.com
APP_URL=https://fitmangas.com
```

## 4. Email expéditeur

- `NEWSLETTER_FROM_EMAIL` et `RESEND_API_KEY` doivent rester configurés (aligné prompt maître §3 BIS).

## 5. Comptes test (Phase 2, rappel)

Création manuelle après env complet :  
`kevin.picard+vcoll|vind|ncoll|nind@gmail.com` + cartes test Stripe documentées dans le prompt maître.

---

## 6. TODO bloquant go-live — contenu légal (mentions & confidentialité)

**Statut :** les brouillons `docs/legal-templates-fr-es-draft.md` restent **conceptuellement validés** pour la Phase 0 ; ils contiennent des **[...]** non publiables en production.

**Avant intégration footer / pages `/mentions-legales` et `/confidentialite` :**

- [ ] **Récupérer auprès du fondateur** les mentions légales complètes : raison sociale, forme juridique, SIREN/SIRET, siège social, représentant légal, contact, **hébergeur** (fact-check Vercel), **médiateur consommation** (France / lien RLL si applicable), et équivalents pour le bloc ES/MX si besoin.
- [ ] **Phase 3 (semaine 3)** : en **ouverture** de phase, demander explicitement ces informations avant verrouillage du footer.

---

## 7. Phase 3 — Contrôle déploiement (à implémenter avec les pages légales)

**Comportement attendu** : le build **production** échoue si le footer ou les pages `/mentions-legales` et `/confidentialite` contiennent encore des **crochets `[...]`** ou champs placeholder non remplis — message d’erreur explicite listant les champs manquants (script CI et/ou validation `next build`).  
**À brancher** lors de l’implémentation des pages légales finales (pas avant validation migration Phase 1).

---

*Document généré pour clôture Phase 0 — aucune migration exécutée.*
