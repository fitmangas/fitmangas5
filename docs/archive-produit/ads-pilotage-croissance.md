# ADS / Publicité — hub Croissance (2026-09-24)

## Où
`/admin/croissance?tab=ads` — entre Workflows et Publications.

## Modules
- UI : `AdsPilotPanel.tsx` + 4 panels `ads/Ads*Panel.tsx`
- Chrome (2026-09-27) : 1 barre compacte (chiffres + Sync + +) · sous-nav 1 ligne · détail connexion/sources derrière le +
- Marché (27/09) : **Le marché en ligne** (externe) vs **Ton audience** (IG réel) — `docs/MARCHE_EXTERNE.md`
- Pipeline créatives : panneau « Comment ça marche ? » + i sur Statut (auto Meta / manuel Plan)
- Lib : `src/lib/acquisition/ads/` (config, meta client, repository, strategy-content)
- Actions : `src/app/admin/croissance/ads-actions.ts`
- Doc setup : `docs/ADS-SETUP.md`

## Règle d’or
Aucune campagne ACTIVE / budget engagé sans double confirmation UI + `META_ADS_ENABLED=1` + App Review.
