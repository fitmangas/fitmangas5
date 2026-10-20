# Lot 6 — Fonction d'accès unique

Date : 19/10/2026. Branche `chantier-oct-2026` (commit local, pas de push).

## Items non faits ou partiels

- **ACCESS_V2 non activé** (et **bloqué**) : 1 écart réel (profil `f694a7d9…`) — accès actuel oui via `current_customer_tier` / `customer_tier`, V2 non (aucune subscription active/essai live). Les 3 profils lot 1 `subscription_status=active` sans ligne active ont aujourd’hui un accès actuel **non** (RPC alignée) : plus un écart d’accès, mais les **données profil** restent sales jusqu’au GO de correction.
- **Branche partout** (espace client, admin, notifications, programmes, cadeaux) : **non faite**. Le drapeau est câblé seulement dans `hasVisioClientAccess`. Tant qu’il est off, le chemin actuel (`current_customer_tier`) est inchangé.
- **Compteurs admin** : non réalignés (attendre GO + 0 écart).
- **Stripe live** : clé locale = test, `livemode` non lu chez Stripe. V2 exclut déjà `livemode === false` si le champ est fourni, et les ids hors `sub_…`.
- **GA4** : aucun code (SPEC). Marche à suivre ci-dessous.

## Décisions prudentes

- `ACCESS_V2` vide / off dans `.env.local`. Toute différence **bloque** l’activation.
- Correction des 5 lignes lot 1 = **GO Kevin sur les données**, pas un SQL de schéma. Aucune écriture ici.
- `hasVisioClientAccess` : si drapeau on → `computeVisioAccessV2` ; sinon comportement actuel.

## 1. Fonction

`src/lib/access/access-v2.ts` : visio = au moins une `subscriptions` `active` ou `trialing`, `stripe_subscription_id` `sub_…`, `ends_at` futur ou vide, `livemode !== false`.

Tests : **6/6**.

## 2. Comparatif (SELECT, 19/10/2026)

`npx tsx scripts/chantier-oct/compare-access-v2.ts`

| Profil | Accès actuel | Accès V2 | Écart |
|---|---|---|---|
| 44b98152… | oui | oui (essai live) | OK |
| f749fae0… | oui | oui (abonnement live) | OK |
| f694a7d9… | oui | non (aucune subscription) | **DIFFÉRENCE** |
| autres members listés | non | non | OK |

**Écarts : 1 → ACCESS_V2 reste off.**

Explication `f694a7d9…` : `customer_tier` / RPC donne encore un accès visio alors qu’il n’y a plus (ou jamais eu) de subscription live active — orphelin lot 1. Allumer V2 lui **retirerait** l’accès. À trancher par Kevin (remettre un abonnement, ou assumer la perte d’accès).

## 3. Branchement après GO

Quand le comparatif affiche 0 écart **et** Kevin a corrigé les données : poser `ACCESS_V2=1` (Vercel + `.env.local`) et redéployer. `hasVisioClientAccess` bascule alors tout seul (programmes, cadeaux, replays, connaissance de soi). Compteurs admin : passer les agrégats « payante » sur la même fonction.

## 4. GA4 (aucun code)

Dans GA4 → Admin → Événements :
1. Vérifier que `trial_started` et `purchase` arrivent (debug view, un essai test).
2. Marquer les deux comme **événements clés**.
3. Exclure le trafic interne (lot 7, §12.6) avant de lire les conversions.

Aperçu : `/dev/apercu/acces-v2`. Capture : `rapports/captures/lot-6/acces-v2.png`.

## Build

`NODE_OPTIONS=--max-old-space-size=4096 npm run build` → **vert** (~6 min 5 s).

## Mise en production

1. Déployer **drapeau off** : rien ne change.
2. Kevin relit le comparatif (et Stripe live si possible) ; corrige `f694a7d9…` et les `subscription_status` orphelins.
3. Relancer le script ; 0 écart.
4. `ACCESS_V2=1` + redéploiement.
5. Sans ces prérequis : le lot ne casse rien.
