# Connaissance de soi (moteur tests 2026-09 + hub membre 2026-09-23)

## Remplace
Ancien hub quiz DiSC / 5 évaluations (code archivé dans `_archive/quiz-legacy-2026-09-21/`). Table `quiz_leads` conservée pour historiques nurture.

## Public
- `/quiz`, `/quiz/big-five`, `/quiz/attachement` (+ `/es/…`)
- Switcher FR/ES dans `SelfTestShell` (liens miroir URL)
- DA cream/terracotta (`SelfTestShell`)
- Lead email → `self_test_results` + `acq_contacts` (INSERT daté)
- Teaser + CTA `/?offer=v-coll`

## Compte — hub cerveau 5 onglets
- `/compte/connaissance-de-soi` — **Mon évolution**
- `/compte/connaissance-de-soi/progression` — courbe + streak (+ `/compte/progression` aligné DA)
- `/compte/connaissance-de-soi/tests` — historique + compare radar T0/T1
- `/compte/connaissance-de-soi/corps` — santé + historique scores (`/sante` → redirect)
- `/compte/connaissance-de-soi/developpement` — journal · défis · lecture affiliée
- Accès = `hasVisioClientAccess` ; nav Brain inchangée

## Santé / wearables
- Consentement `health_consents` ; entrées `health_score_entries` (+ `source`)
- Wearables : OAuth Strava/Fitbit **prêt**, `WEARABLES_V2_ENABLED = false`
- Clés : `STRAVA_CLIENT_ID/SECRET`, `FITBIT_CLIENT_ID/SECRET` + redirect URIs callback
- Apple Santé = app iOS HealthKit (pas web)

## Tables additives (2026-09-23)
`member_progress_monthly`, `wearable_connections`, `wearable_metric_samples`, `journal_entries`, `reflection_prompts`, `reflection_completions`, `soft_challenges`, `challenge_completions`, `affiliate_clicks` + colonnes `reading_resources.affiliate_url/disclosure/resource_type`

## Fichiers clés
- `src/lib/self-knowledge/*`, `src/components/SelfKnowledge/*`, `src/components/SelfKnowledge/compte/*`
- `src/components/Charts/TrendLineChart.tsx`
- `src/app/api/self-knowledge/*`
