# Setup Meta Ads (FitMangas) — guide Kevin

> **État actuel** : code branché, flag **`META_ADS_ENABLED=OFF`** (défaut).  
> Aucune dépense possible tant que tu n’as pas fourni les accès + App Review + flag ON + double confirmation UI.

## Ce que le code fait déjà

| Capacité | État |
|---|---|
| Onglet **ADS / Publicité** (`/admin/croissance?tab=ads`) | ✅ UI + pédagogie + 3 campagnes stratégie |
| Tables `ad_campaigns` / `ad_metrics_daily` / `ad_creatives` | ✅ Migration additive appliquée |
| Lecture insights Meta (dépense, leads, CPL…) | ✅ Prête — flag + token requis |
| Création campagnes en **brouillon PAUSED** | ✅ Prête — jamais ACTIVE auto |
| Activation avec budget | ✅ **Double confirmation UI** obligatoire |
| TikTok / Pinterest / Google | 🟡 Emplacements phase 2 (pas d’API branchée) |

## Permissions Meta à demander (App Review)

Sur [developers.facebook.com](https://developers.facebook.com) → ton App FitMangas → **App Review** → permissions :

1. **`ads_management`** — créer / modifier campagnes (brouillons + activation manuelle)
2. **`ads_read`** — lire insights (dépense, impressions, leads, CTR)
3. **`business_management`** — lier le Business Manager / Ad Account

Sans App Review approuvée, l’API Marketing reste limitée (mode développement / rôle testeur seulement).

## Variables d’environnement

À mettre dans **Vercel** (Production) **et** `.env.local` :

```bash
# Défaut OFF — ne pas passer à 1 avant App Review + token Ads
META_ADS_ENABLED=0

# App (peut réutiliser META_APP_ID / META_APP_SECRET si même app)
META_ADS_APP_ID=…
META_ADS_APP_SECRET=…

# Token utilisateur Système (ou long-lived) avec ads_management + ads_read
META_ADS_ACCESS_TOKEN=…

# Compte pub (avec ou sans préfixe act_)
META_ADS_AD_ACCOUNT_ID=act_XXXXXXXX
```

Alias acceptés : `META_ADS_TOKEN`, `META_AD_ACCOUNT_ID`, fallback `META_APP_ID` / `META_APP_SECRET`.

## Étapes simples pour toi

1. **Business Manager** Meta → créer / noter l’**Ad Account** FitMangas (monnaie EUR).
2. **App Meta** (même app que IG messaging si possible) → ajouter le produit **Marketing API**.
3. Demander **App Review** pour `ads_management`, `ads_read`, `business_management` (expliquer usage : pilotage admin FitMangas, brouillons + activation manuelle).
4. Générer un **System User token** (Business Settings → System Users) avec accès à l’Ad Account + permissions ads.
5. Coller les 4 variables ci-dessus dans Vercel + `.env.local`.
6. Quand App Review = **Approved** : passer `META_ADS_ENABLED=1`, redéployer.
7. Dans l’admin → **ADS / Publicité** → « Créer 3 brouillons stratégie » → vérifier PAUSED dans Ads Manager.
8. Pour payer vraiment : bouton **Activer** → cocher 2 cases → resaisir le budget € exact.

## Garde-fou budget (non négociable)

- Le code **refuse** `status: ACTIVE` sans `humanConfirmedTwice` + budget exact.
- Flag OFF → aucune écriture / activation Meta.
- Budget test guide : **15–30 €/jour** (stratégie Croissance). Minimum activation code : **5 €/jour**.

## Phase 2 (après Meta rentable)

- **TikTok Ads** : Business Center + Events API + créatives verticales (Reels).
- **Pinterest Ads** : Business + tag + images wellness.
- **Google Ads** : search de marque seulement (protéger « FitMangas »).

Un canal bien avant d’éparpiller.

## Exactement ce qu’il faut me fournir pour activer

1. App Review Meta **approuvée** (`ads_management` + `ads_read` + `business_management`)
2. `META_ADS_ACCESS_TOKEN` (System User, valide)
3. `META_ADS_AD_ACCOUNT_ID` (ex. `act_123…`)
4. Confirmation écrite : « OK pour `META_ADS_ENABLED=1` »
5. (Optionnel) `META_ADS_APP_ID` / `SECRET` si différent de l’app messaging

Ensuite Cursor active le flag + sync Vercel / `.env.local` + tu valides un brouillon dans Ads Manager avant toute activation budget.
