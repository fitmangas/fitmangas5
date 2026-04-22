# Blog Pilates — mise en route

## Base de données

Appliquer la migration Supabase :

- `supabase/migrations/015_blog_system.sql`

## Variables d’environnement

| Variable | Rôle |
|----------|------|
| `CRON_SECRET` | Jeton partagé : header `Authorization: Bearer <secret>` pour les routes cron (publication automatique). |
| `GOOGLE_TRANSLATE_API_KEY` | Optionnel : auto-traduction EN/ES depuis `/api/admin/blog/articles/[id]/translate`. |

Sur Vercel, définir `CRON_SECRET` et configurer le cron dans `vercel.json` (déjà présent : tous les jours à 8h UTC — ajuster le fuseau si besoin via l’heure d’exécution du cron ou la logique métier).

## Seed des 104 articles

1. Éditer ou générer `data/PLANNING_EDITORIAL_104_ARTICLES.md` (voir format dans le fichier).
2. Exécuter : `npx tsx scripts/seed-blog-articles.ts`

Le script utilise le **premier profil `role = admin`** comme `coach_id`.

## Flux publication

1. Articles importés en `draft` avec batch mensuel `admin_article_validations` (pending).
2. Coach valide dans `/admin/blog/validation` → statut article `validated`.
3. Cron `GET|POST /api/admin/blog/cron/publish-scheduled` avec `Authorization: Bearer CRON_SECRET` publie les articles `validated` dont `scheduled_publication_at <= maintenant` → `published` + notifications membres.

## Fichier planning éditorial

Le dépôt inclut un **gabarit** `data/PLANNING_EDITORIAL_104_ARTICLES.md`. Remplace-le par ton export réel (titres + dates + catégories) puis relance le seed.
