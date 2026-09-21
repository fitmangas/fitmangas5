# Archive — Admin (`/admin`)

Dernière MAJ : 2026-09-21.

| Zone | Chemin | Rôle |
|---|---|---|
| Acquisition | `/admin/acquisition` | Inbox DM IG/Messenger/WA, workflows, followups, readiness Meta |
| Community | `/admin/community` | CM Instagram (génération posts) |
| Marketing | `/admin/marketing` | Alias / surface CM |
| Blog | `/admin/blog` (+ articles, calendar, validation, newsletter, stats) | Contenu SEO |
| Clients | `/admin/clients` | Fiches membres |
| Courses | `/admin/courses` | Planning cours |
| Replays | `/admin/replays` + `/admin/vimeo` | Validation replays |
| Videos | `/admin/videos` | Vidéos standalone |
| Boutique | `/admin/boutique` | Printful |
| Promos / Croissance | `/admin/promos`, `/admin/croissance` | Coupons / funnel |
| Inbox / Support | `/admin/inbox`, `/admin/support` | Messages |
| Notifications | `/admin/notifications` | Observabilité Resend |
| Attendance | `/admin/attendance` | Présences |

## Acquisition — acquis anti-régression
- Catalog : `src/lib/acquisition/engine/workflow-catalog.ts`
- Webhook Meta : anti-doublon `mid` + même texte 2 min
- Copy : jamais « Mangitas » ; pas « rendez-vous fixe » ambigu → **cours collectifs à horaires fixes** ; prix → **groupe 39 €** d’abord
- Cron followups : `/api/admin/acquisition/cron/run-followups`
