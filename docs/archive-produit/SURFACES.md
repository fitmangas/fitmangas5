# Archive produit FitMangas — surfaces métier

Dernière MAJ : 2026-09-21.  
But : garder **hors code** une description claire de ce qui a été construit, pour les humains et pour Cursor.

## 1. Public / acquisition
- Landing bilingue FR/ES, essai 7 jours (carte à l’inscription, prélèvement après).
- Offre phare communication : **visio collective ~39 €/mois**.
- Pixel Meta, GA4, WhatsApp flottant (chat manuel) + robot WA (API) quand template OK.

## 2. Quiz « Profil de discipline »
→ détail : `QUIZ.md`
- Hub quiz + runner verrouillé (pas de skip).
- Porte lead → `quiz_leads` + `acq_contacts`.
- PDF brandé + nurture email J+0/J+2/J+5 ; WA cold bloqué sans paiement Meta + template.

## 3. Espace cliente
→ détail : `ESPACE_CLIENTE.md`
- `/connexion` + `/compte/*` : dashboard, planning, replays, progression, profil, prefs, notifs, factures, parrainage, boutique.

## 4. Admin
→ détail : `ADMIN.md`
| Zone | Rôle |
|---|---|
| Acquisition | Inbox DM IG/Messenger/WA, workflows, followups, readiness Meta |
| Community / Marketing | Génération CM Instagram (Reels/carousels/feed) |
| Blog | Titres, articles, cron publish |
| Clients / Courses / Replays | Ops coaching |
| Boutique | Printful |
| Promos / Croissance | Coupons Stripe, funnel |

## 5. Infra
- Next.js 15 + Supabase Pro + Stripe live + Vercel
- VPS live.fitmangas.com (Jitsi/Jibri, replays)
- Crons vercel.json (acquisition followups toutes les 2h, blog, community…)

## 6. Fichiers « ne pas perdre »
Voir `INVENTAIRE_CODE.md` + rules Cursor :
- `.cursor/rules/fitmangas-source-de-verite.mdc`
- `.cursor/rules/fitmangas-inventaire-fige.mdc`
- `docs/CONTEXTE_VIVANT.md`
