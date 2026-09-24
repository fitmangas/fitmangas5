# Setup Meta Ads (FitMangas) — guide Kevin

> **État live 24/09/2026 ~17h50** — token OK · `META_ADS_ENABLED=1` (lecture + brouillons PAUSED) · **aucune campagne ACTIVE** · funding Meta **absent** (carte à ajouter).

## Déjà fait

| Élément | État |
|---|---|
| Onglet ADS redesign (funnel, cartes, KPIs, accordéon, galerie) | ✅ code |
| Ad Account `act_1070085439154384` « FitMangas Ads » | ✅ ACTIVE (status 1) |
| Token System User Ads | ✅ `ads_management` + `ads_read` + `business_management` · `expires_at: 0` |
| `META_ADS_ENABLED` | ✅ `1` (lecture + PAUSED seulement) |
| Probe lecture insights 7 j | ✅ 0 ligne (compte neuf, 0 € dépensé) |
| Brouillon froid Meta | ✅ `120248916689610330` · **PAUSED** · `daily_budget=800` (8 €) · `OUTCOME_TRAFFIC` |
| Garde-fou activation | ✅ refuse sans double confirm / budget mismatch / (tests vitest) |
| Moyen de paiement Meta | ❌ **absent** — Kevin ajoute la carte sur la page facturation |

## Facturation (Kevin — saisie manuelle)

URL ouverte / à garder :

`https://business.facebook.com/billing_hub/payment_settings?business_id=1015050482234942&asset_id=1070085439154384`

→ redirige vers le détail **FitMangas Ads** → bouton **« Ajouter un moyen de paiement »**.

Capture : `docs/captures/ads/meta-billing-add-payment.png`

**Pas de formulaire de carte dans FitMangas** — uniquement Meta.

## Accès Marketing API (vérifié live, pas supposé)

- Token type : **SYSTEM_USER**, `is_valid: true`
- Scopes : `ads_management`, `ads_read`, `business_management` (+ `public_profile`)
- Niveau pratique : accès **opérationnel sur notre Ad Account** (création/lecture OK). Cas d’usage Developers « Prête pour le test » — suffisant pour ce BM / System User.
- Lecture `/{act}/campaigns` + `/{act}/insights` : **200**
- Écriture campagne PAUSED : **200** → status vérifié `PAUSED` / `effective_status: PAUSED`
- Bloquant spend : **pas de funding_source** (carte) + activation ACTIVE bloquée sans double confirm UI Kevin

## Variables

```bash
META_ADS_ENABLED=1
META_ADS_APP_ID=…                     # = META_APP_ID
META_ADS_APP_SECRET=…                 # = META_APP_SECRET
META_ADS_AD_ACCOUNT_ID=act_1070085439154384
META_ADS_ACCESS_TOKEN=…               # System User (ne jamais coller dans le chat)
```

## Garde-fou

Aucune campagne ACTIVE sans 2 cases + budget € resaisi exact. Le code refuse sinon. Brouillon PAUSED = **0 €** de diffusion.

## Reste Kevin

1. Ajouter le moyen de paiement sur la page Meta ci-dessus  
2. Quand prêt : activer la campagne froide **lui-même** via la double confirmation UI (affiche 8,00 €/j)
