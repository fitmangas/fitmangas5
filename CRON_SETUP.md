# Configuration des crons externes — FitMangas

## Rappels de cours (J-1 à 18h locale + H-1)

Le job Vercel `daily-jobs` (6h UTC) appelle aussi `runCourseCycles` comme **filet de sécurité**. Les rappels précis (18h J-1, fenêtre 55–65 min avant le cours) nécessitent un passage **toutes les 10 minutes**.

Les envois sont **idempotents** : chaque rappel utilise une clé `notification_log` du type `course.visio.reminder_J-1:{courseId}:{userId}`. Un second appel (cron externe + daily-jobs) ne crée pas de doublon.

### cron-job.org (recommandé, gratuit)

1. Créer un compte sur [cron-job.org](https://cron-job.org).
2. **Create cronjob** :
   - **Title** : FitMangas — course reminders
   - **URL** : `https://fitmangas.com/api/admin/cron/course-reminders`
   - **Schedule** : toutes les **10 minutes** (`*/10 * * * *` si l’interface le permet, sinon « Every 10 minutes »).
   - **Request method** : `GET`
3. **Headers** (onglet Advanced / Request headers) :
   ```
   Authorization: Bearer <CRON_SECRET>
   ```
   Remplacer `<CRON_SECRET>` par la valeur de la variable d’environnement `CRON_SECRET` sur Vercel (Production).
4. Activer le job et vérifier les logs HTTP **200** avec un corps JSON du type `{ "sent": … }`.

### Variables d’environnement (Vercel)

| Variable       | Usage                                      |
|----------------|--------------------------------------------|
| `CRON_SECRET`  | Secret partagé avec cron-job.org (Bearer) |

### Test manuel

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://fitmangas.com/api/admin/cron/course-reminders"
```

### Autres crons Vercel (inchangés)

- `daily-jobs` — 5h UTC : onboarding, win-back, digest, filet rappels cours + filet posts IG dus
- `community/publish-scheduled` — **plusieurs créneaux/jour** (UTC) alignés sur les posts IG Paris 07h/08h/11h/12h/17h/18h/19h : filet Vercel Hobby (1×/jour max par expression)
- `acquisition/run-followups` — **3×/jour** (06h05 / 12h05 / 18h05 UTC) sur Vercel Hobby ; pour ~15 min ajouter cron-job.org sur la même URL + `CRON_SECRET`
- `community/insights-sync` — **04h30 UTC** : Insights IG → `post_metrics` + scores hooks CM (nécessite `SOCIAL_INSIGHTS_SYNC_ENABLED=true`)
- `prepare-monthly-validation` — 1er du mois 7h UTC

Ne pas ajouter `course-reminders` dans `vercel.json` si vous utilisez cron-job.org (évite les doubles appels inutiles, l’idempotence reste garantie).

### Community Manager (Instagram programmé)

Facebook utilise la programmation native Meta. Instagram passe par la file FitMangas + cron.

**Cause n°1 des non-publications :** token Meta expiré (OAuth 190). Reconnecte Meta dans Community avant tout.

**Cause n°2 :** Vercel Hobby ne déclenche pas toujours les crons `publish-scheduled`. Le filet fiable est **cron-job.org → course-reminders** (toutes les 10 min), qui appelle aussi `processDueSocialPostsAction`.

Pour une précision ~10 min, garder sur cron-job.org :

- **URL** : `https://fitmangas.com/api/admin/cron/course-reminders` (rappels + publications IG)
- **OU** en plus : `https://fitmangas.com/api/admin/community/cron/publish-scheduled`
- **Schedule** : toutes les **10–15 minutes**
- **Header** : `Authorization: Bearer <CRON_SECRET>`

Test manuel :

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://fitmangas.com/api/admin/community/cron/publish-scheduled"
```

## Supabase Cron (depuis le 20/10/2026)

- **`/api/admin/cron/hourly`** (récapitulatifs, rappels « séance du jour », rappels J-14 / J-3 des cartes cadeaux, alerte de retard) est appelée **toutes les heures à :05 par Supabase Cron** (`pg_cron` + `pg_net`, tâche `fitmangas-hourly`).
- Le secret de Supabase Cron est généré dans la base et rangé dans Vault (`cron_secret`) : il n'est copié nulle part. La base vérifie elle-même la valeur reçue (`public.cron_secret_matches`). Les routes `course-reminders`, `social` et `hourly` acceptent `CRON_SECRET` **ou** ce secret.
- **cron-job.org garde `course-reminders`** (toutes les 10 min). Le jour où on le coupe : programmer `course-reminders` dans Supabase Cron (modèle dans `PROPOSITIONS_MIGRATIONS.md`, L2-f) — jamais les deux en même temps.
- Contrôle : `select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;` et `select job, last_run_at from public.cron_heartbeats;`.
