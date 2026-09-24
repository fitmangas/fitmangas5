# Setup Meta Ads (FitMangas) — guide Kevin

> **État live vérifié le 24/09/2026** (probe tokens existants).

## Déjà fait (par Cursor — rien à refaire)

| Élément | État |
|---|---|
| Onglet ADS `/admin/croissance?tab=ads` | ✅ en prod |
| Tables `ad_campaigns` / `ad_metrics_daily` / `ad_creatives` | ✅ |
| **5 créatives** seedées en base (FR/ES) | ✅ |
| **3 brouillons locaux** (froid / warm / hot) | ✅ |
| `META_APP_ID` / `META_APP_SECRET` | ✅ déjà en local + Vercel |
| `META_ADS_APP_ID` / `META_ADS_APP_SECRET` | ✅ alias ajoutés dans `.env.local` (= mêmes valeurs) |
| `META_ADS_ENABLED` | ✅ `0` (OFF) — **aucune dépense** |
| Code lecture insights + brouillons Meta PAUSED | ✅ |
| Garde-fou double confirmation budget | ✅ |

## Probe token actuel (important)

Token Page `meta_social_connection` (messaging / CM) :
- ✅ valide, type PAGE
- ✅ a `business_management`
- ❌ **PAS** `ads_read`
- ❌ **PAS** `ads_management`
- → `/me/adaccounts` impossible avec ce token

Token IG `acquisition_meta_connection` (DM) : **inutilisable** pour Ads (IGAA).

**Conclusion** : on ne peut pas « transformer » le token messaging en token Ads. Il faut un **System User** (ou User token) avec permissions Ads + un **Ad Account**.

## Ce qui reste — uniquement toi (Meta Business)

1. **Business Manager** → Ad Account FitMangas (EUR) → noter l’ID `act_…`
2. **App Review** sur l’app `106774…` : `ads_management` + `ads_read` (+ `business_management` déjà présent sur le token Page)
3. **System User** avec accès à l’Ad Account + token long-lived Ads
4. Me donner (ou coller en Vercel) :
   - `META_ADS_ACCESS_TOKEN=…`
   - `META_ADS_AD_ACCOUNT_ID=act_…`
5. GO écrit : `OK pour META_ADS_ENABLED=1`

Ensuite Cursor branche le flag + sync insights + création brouillons **côté Meta** (PAUSED). Activation budget = toujours double confirm UI.

## Variables

```bash
META_ADS_ENABLED=0          # déjà OFF
META_ADS_APP_ID=…           # = META_APP_ID (déjà)
META_ADS_APP_SECRET=…       # = META_APP_SECRET (déjà)
META_ADS_ACCESS_TOKEN=…     # ← manquant (System User Ads)
META_ADS_AD_ACCOUNT_ID=act_… # ← manquant
```

## Garde-fou

Aucune campagne ACTIVE sans 2 cases cochées + budget € resaisi. Flag OFF = aucune écriture Meta.
