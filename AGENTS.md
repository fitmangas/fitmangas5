# AGENTS.md — FitMangas (Cursor)

Ce repo est piloté surtout via Cursor. Lis dans l’ordre :

1. `.cursor/rules/fitmangas-source-de-verite.mdc` — faits acquis, chemins CM, autonomie
2. `.cursor/rules/fitmangas-inventaire-fige.mdc` — surfaces à ne pas casser
3. `docs/CONTEXTE_VIVANT.md` — journal des validations récentes
4. `docs/archive-produit/` — copie descriptive admin / cliente / quiz

## Fin de tâche réussie
- Mettre à jour `docs/CONTEXTE_VIVANT.md`
- `NODE_OPTIONS=--max-old-space-size=4096 npm run build`
- Commit + push : si `support811` → 403, pousser via MCP GitHub compte **`fitmangas`** (PR + merge)

## Interdits rapides
- Mangitas / rendez-vous fixe ambigu / Pollinations / Vertex / 2e clé Gemini « gratuite »
- SQL destructif sans GO écrit
- Refonte d’une surface listée dans l’inventaire sans demande explicite
