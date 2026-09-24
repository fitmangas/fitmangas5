# ADS / Publicité — hub Croissance (2026-09-24)

## Où
`/admin/croissance?tab=ads` — entre Workflows et Publications.

## Modules
- UI : `AdsPilotPanel.tsx`
- Lib : `src/lib/acquisition/ads/` (config, meta client, repository, strategy-content)
- Actions : `src/app/admin/croissance/ads-actions.ts`
- Doc setup : `docs/ADS-SETUP.md`

## Règle d’or
Aucune campagne ACTIVE / budget engagé sans double confirmation UI + `META_ADS_ENABLED=1` + App Review.
