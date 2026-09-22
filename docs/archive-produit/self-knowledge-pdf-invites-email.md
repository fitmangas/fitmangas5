# Self-knowledge — PDF, invites, blog opt-in, priorité email (2026-09-22)

## Surfaces
- PDF builder client : `src/lib/self-knowledge/build-self-test-pdf.ts` (`buildSelfTestReportPdf`, `downloadBlob`)
- Parrainage optionnel : `SelfTestShareInvite.tsx` + API `/api/self-knowledge/invite/{share,email,remind-inviter}`
- Table : `self_test_invites` (share_link | email, 1 email / couple)
- Lead public : checkbox `blogOptIn` → double opt-in `newsletter_subscriptions`
- Dédup email : `email-flow-priority.ts` — member > acquisition > blog_public

## Règles RGPD / produit
- PDF libre ; parrainage n’est jamais un frein
- Email invite : un seul envoi, jamais de follow-up auto à l’invitée
- Rappel : uniquement à l’invitante
- Consent acquisition ≠ opt-in blog
- Membre active|trialing sort de la liste blog (`unsubscribed`) et du nurture acq (`opt_in=false` + tag `member`)
