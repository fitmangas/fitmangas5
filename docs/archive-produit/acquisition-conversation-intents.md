# Acquisition — intentions conversationnelles (2026-09-24)

## Rôle
Répondre au bon message avant de vendre (STRATEGIE_CROISSANCE).

## Fichiers
- `src/lib/acquisition/engine/conversation-intents.ts`
- `src/lib/acquisition/engine/orchestrator.ts` (intercept avant follow-gate)
- `src/lib/acquisition/ai/concierge.ts` + `concierge-actions.ts`
- `src/lib/acquisition/engine/human-delay.ts`
- `src/app/api/acquisition/webhooks/meta/route.ts` (`after()` + délai 30–90s)

## Tags
`thinking` · `thinking_nudge_refused` · `factual_price` · `factual_schedule` · `factual_replay` · `factual_how` · `trial_offer` · `support_request` · `warm_no_intent` · `offtopic_warm` · `soft_decline` · `optout`

## Triggers catalogue (resserrés)
| Ancien trop large | Nouveau |
|---|---|
| `info` | `plus d'info` / `des infos` / `más info` |
| `temps` / `busy` / `occup` | `pas le temps` / `no tengo tiempo` / … |
| `quiz\|profil\|test\|energie…` | `quiz` / `mon profil` / `test de profil` / … |

## Catch-all
Concierge seul — **pas** de `capture_email_optin` au premier message vague.
