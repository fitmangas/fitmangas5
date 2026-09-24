# Archive — Onglet ADS / Centre d’intelligence

Surface : `/admin/croissance?tab=ads`

## Rôle
Pilotage Meta Ads en lecture + brouillons PAUSED, avec analyse organique, tableaux insights, alertes fatigue/kill, et coach expert borné à `docs/ADS_EXPERTISE.md`.

## Règles absolues
- Aucune dépense auto / aucune campagne ACTIVE sans double confirmation budget.
- Zéros honnêtes (jamais de faux CPL/ROAS).
- « Transformer en pub » → campagne Meta **PAUSED**.

## Fichiers clés
- UI : `AdsPilotPanel.tsx`, `AdsIntelligenceHub.tsx`
- Sync : `sync-intelligence.ts`, cron `ads-intelligence-sync`
- Coach : `coach.ts` + `docs/ADS_EXPERTISE.md`
- Setup : `docs/ADS-SETUP.md`

## Permissions Meta (état 24/09/2026)
- Ads insights + breakdowns : OUI
- IG liste + likes/comments : OUI
- IG insights reach/saves/profil : NON → `instagram_manage_insights`
