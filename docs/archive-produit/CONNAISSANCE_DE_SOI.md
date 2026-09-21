# Connaissance de soi (moteur tests 2026-09)

## Remplace
Ancien hub quiz DiSC / 5 évaluations (code archivé dans `_archive/quiz-legacy-2026-09-21/`). Table `quiz_leads` conservée pour historiques nurture.

## Public
- `/quiz`, `/quiz/big-five`, `/quiz/attachement` (+ `/es/…`)
- DA cream/terracotta (`SelfTestShell`)
- Lead email → `self_test_results` + `acq_contacts` (tags `test:big-five` | `test:attachement`)
- Teaser + CTA `/?offer=v-coll` (SignupCheckoutModal existant)

## Compte
- `/compte/connaissance-de-soi` — historique, tests complets, santé, club lecture
- Accès = `hasVisioClientAccess` (active | trialing)
- Nav : clé i18n `selfKnowledge`

## Santé
- Consentement distinct `health_consents` avant toute saisie
- Scores maison : Régularité / Récupération / Énergie — **non médicaux**
- Wearables v2 : `WEARABLES_V2_ENABLED = false` (Strava/Fitbit stubs)

## Fichiers clés
- `src/lib/self-knowledge/*`
- `src/components/SelfKnowledge/*`
- `src/app/api/self-knowledge/*`
