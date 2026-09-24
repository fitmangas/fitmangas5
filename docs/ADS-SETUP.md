# Setup Meta Ads (FitMangas) — guide Kevin

> **État live mis à jour le 24/09/2026 ~15h20** — token Ads System User **OK**. Spend toujours OFF.

## Déjà fait (par Cursor — rien à refaire)

| Élément | État |
|---|---|
| Onglet ADS `/admin/croissance?tab=ads` | ✅ en prod (3 brouillons + 5 créatives visibles) |
| Captures admin | ✅ `docs/captures/ads/` |
| Tables `ad_campaigns` / `ad_metrics_daily` / `ad_creatives` | ✅ |
| **5 créatives** seedées en base (FR/ES) | ✅ |
| **3 brouillons locaux** (froid / warm / hot) | ✅ |
| `META_APP_ID` / `META_APP_SECRET` | ✅ local + Vercel |
| `META_ADS_APP_ID` / `META_ADS_APP_SECRET` | ✅ alias (= mêmes valeurs) |
| `META_ADS_ENABLED` | ✅ `0` (OFF) — **aucune dépense** |
| **Ad Account BM** « FitMangas Ads » | ✅ `act_1070085439154384` (EUR, Europe/Paris, status ACTIVE=1) |
| `META_ADS_AD_ACCOUNT_ID` | ✅ `.env.local` + Vercel |
| Cas d’utilisation **API Marketing** | ✅ `ads_*` = **Prête pour le test** |
| System User « Conversions API » | ✅ Ad Account + app + WhatsApp |
| **`META_ADS_ACCESS_TOKEN`** | ✅ System User, scopes `ads_management` + `ads_read` + `business_management`, `expires_at: 0` — local + Vercel |
| Probe Graph `/me/adaccounts` | ✅ voit « FitMangas Ads » |
| Code lecture insights + brouillons Meta PAUSED | ✅ |
| Garde-fou double confirmation budget | ✅ |

## Probe token messaging (toujours vrai)

Token Page `meta_social_connection` :
- ✅ `business_management`
- ❌ **PAS** `ads_read` / `ads_management`
- → ne peut **pas** remplacer le token Ads System User ci-dessus

## Ce qui reste (Kevin — GO écrit uniquement)

1. Quand tu veux **dépenser** : GO écrit `OK pour META_ADS_ENABLED=1`
2. (Optionnel) moyen de paiement sur le Ad Account BM
3. (Recommandé) réinitialiser le mdp temporaire admin `ale.mangas5@gmail.com` utilisé pour les captures

Sans ce GO : lecture insights / brouillons PAUSED possibles ; **zéro campagne ACTIVE**, zéro €.

## Variables

```bash
META_ADS_ENABLED=0                    # ✅ OFF jusqu’au GO
META_ADS_APP_ID=…                     # = META_APP_ID
META_ADS_APP_SECRET=…                 # = META_APP_SECRET
META_ADS_AD_ACCOUNT_ID=act_1070085439154384
META_ADS_ACCESS_TOKEN=…               # ✅ fait (System User, ne jamais coller dans le chat)
```

## Garde-fou

Aucune campagne ACTIVE sans 2 cases cochées + budget € resaisi. Flag OFF = aucune écriture Meta.
