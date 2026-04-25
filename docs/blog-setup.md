# Blog Pilates — mise en route

## Base de données

Appliquer la migration Supabase :

- `supabase/migrations/015_blog_system.sql`

## Variables d’environnement

| Variable | Rôle |
|----------|------|
| `CRON_SECRET` | Jeton partagé : header `Authorization: Bearer <secret>` pour les routes cron (publication automatique). |
| `GOOGLE_TRANSLATE_API_KEY` | Optionnel : auto-traduction EN/ES depuis `/api/admin/blog/articles/[id]/translate`. |
| `GEMINI_API_KEY` | Optionnel (recommandé) : génération rédactionnelle longue via `seed:blog:complete` avec l’API Gemini ([Google AI Studio](https://aistudio.google.com/apikey)). Accepte aussi `GOOGLE_GENAI_API_KEY` ou `GOOGLE_API_KEY` si `GEMINI_API_KEY` est absent. |
| `GEMINI_MODEL` | Optionnel : modèle Gemini (défaut `gemini-2.0-flash`). |
| `OPENAI_API_KEY` | Optionnel : repli si Gemini indisponible ou clé absente ; modèle via `OPENAI_MODEL` (défaut `gpt-4o-mini`). |
| `UNSPLASH_ACCESS_KEY` | Optionnel : récupération d’images réelles depuis Unsplash pendant le seed complet. |

Sur Vercel, définir `CRON_SECRET` et configurer le cron dans `vercel.json` (déjà présent : tous les jours à 8h UTC — ajuster le fuseau si besoin via l’heure d’exécution du cron ou la logique métier).

## Seed des 104 articles

1. Éditer ou générer `data/PLANNING_EDITORIAL_104_ARTICLES.md` (voir format dans le fichier).
2. Seed standard (rapide): `npm run seed:blog`
3. Seed complet (IA + images): `npm run seed:blog:complete` (charge automatiquement `.env.local` à la racine)
   - première fois sans `.env.local` : `npm run env:bootstrap` puis remplir les clés
   - test sur 5 articles: `npm run seed:blog:complete -- --limit=5`

Le script utilise le **premier profil `role = admin`** comme `coach_id`.

## Flux publication

1. Articles importés en `draft` avec batch mensuel `admin_article_validations` (pending).
2. Coach valide dans `/admin/blog/validation` → statut article `validated`.
3. Cron `GET|POST /api/admin/blog/cron/publish-scheduled` avec `Authorization: Bearer CRON_SECRET` publie les articles `validated` dont `scheduled_publication_at <= maintenant` → `published` + notifications membres.

## Fichier planning éditorial

Le dépôt inclut un **gabarit** `data/PLANNING_EDITORIAL_104_ARTICLES.md`. Remplace-le par ton export réel (titres + dates + catégories) puis relance le seed.
