# Archive — Quiz Profil de discipline

Dernière MAJ : 2026-09-21.

## Routes
- FR : `/quiz`, `/quiz/[slug]` (slug `profil-discipline`)
- ES : `/es/quiz`, `/es/quiz/[slug]`
- API lead : `POST /api/quiz/lead`

## Code clé
- Définitions : `src/lib/quiz/quizzes/profil-discipline*.ts`
- PDF : `src/lib/quiz/build-report-pdf.ts` — logo **PNG transparent**, mix couleurs page 2, titres collés aux bannières
- Nurture : `src/lib/quiz/lead-nurture.ts` — email immédiat + J+2 + J+5 ; WA tentative ; stop si trial/paid Stripe
- Tables : `quiz_leads` (+ colonnes nurture), sync `acq_contacts`

## Copy / règles
- Pas de skip dans le runner
- WhatsApp cold hors 24h : **template Meta requis** ; sinon `awaiting_optin` + lien wa.me dans l’email
- Template cible : `quiz_essai_fitmangas` (FR, Marketing, corps **sans variables**)
- **21/09/2026** : reformulations clarté (Q1–Q4, Q7–Q10) suite retour cliente — options DiSC inchangées (poids).

## Bloquant Meta (21/09/2026)
WABA `1427605062481966` : **aucun moyen de paiement** → `can_send_message: BLOCKED` (erreur 141006).  
Carte Kevin = demain. Puis template marketing.
