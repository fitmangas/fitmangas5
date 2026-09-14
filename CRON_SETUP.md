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
- `acquisition/run-followups` — toutes les **15 min** : exécute les relances `acq_followups` dues (sandbox ou live selon `MESSAGING_MODE`)
- `community/insights-sync` — **4h UTC** : Insights IG → `post_metrics` + scores banque hooks
- `prepare-monthly-validation` — 1er du mois 7h UTC

Ne pas ajouter `course-reminders` dans `vercel.json` si vous utilisez cron-job.org (évite les doubles appels inutiles, l’idempotence reste garantie).

### Community Manager (Instagram programmé)

Facebook utilise la programmation native Meta. Instagram passe par la file FitMangas + cron.

**Cause historique des non-publications à l’heure :** un seul cron à 05h45 UTC ne peut pas publier un Reel prévu à 12h Paris. Corrigé via plusieurs jobs quotidiens dans `vercel.json`.

Pour une précision ~15 min (recommandé en plus du filet Vercel), ajouter sur cron-job.org :

- **URL** : `https://fitmangas.com/api/admin/community/cron/publish-scheduled`
- **Schedule** : toutes les **15 minutes**
- **Header** : `Authorization: Bearer <CRON_SECRET>`

Test manuel :

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://fitmangas.com/api/admin/community/cron/publish-scheduled"
```
