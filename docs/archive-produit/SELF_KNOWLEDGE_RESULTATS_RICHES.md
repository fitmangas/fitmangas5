# Connaissance de soi — résultats riches (2026-09-22)

## Surfaces
- Public : `/quiz`, `/quiz/big-five`, `/quiz/attachement` (+ `/es/...`)
- Compte : `/compte/connaissance-de-soi`, `/compte/connaissance-de-soi/tests/[slug]?format=ipip-50|ipip-120`

## Big Five — deux formats
| Format | Items | Durée | Analyse |
|---|---|---|---|
| IPIP-50 | 50 | ~8 min | 5 traits (bas/moyen/élevé) |
| IPIP-NEO-120 | 120 | ~20 min | 5 traits + 30 facettes dépliables |

Choix avant le test (`SelfTestRunner` phase `choose`). Historique : `test_version` = `ipip-50` | `ipip-120`.

## Banques (source de vérité)
- `banks/big-five-traits.ts` — 15 cellules trait (5×3) + 8 combos
- `banks/big-five-facets.ts` — 90 cellules facette (30×3)
- `banks/attachment-bank.ts` — dimensions + 4 styles
- `banks/portraits.ts` — portraits nommés dérivés

## Analyse
1. `assemble-report.ts` assemble portrait + sections depuis la banque
2. Claude (si clé) ne fluidifie que ce payload ; `assertAnalysisWithinBank` rejette les inventions
3. Sans clé : analyse complète, badge discret « Banque FitMangas »

## UI (niveau profil-discipline)
- `SelfTestReport` : hero portrait, radar OCEAN, Qui tu es / Comment tu fonctionnes / Forces / Limites, teaser public verrouillé + CTA, `QuizVideoProof`, export `.txt`
- Intro éditoriale enrichie ; attachement même richesse (barres anxiété/évitement)

## Non-régression
profil-discipline, checkout Stripe, pont conversion self-test → compte, 3 opt-in email distincts.
