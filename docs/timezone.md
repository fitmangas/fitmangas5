# Fuseaux et fenêtres horaires (Lot 2)

## Helpers (`src/lib/notifications/timezone.ts`)

| Fonction | Rôle |
|----------|------|
| `calendarDayKeyInTimeZone` | Jour calendaire `YYYY-MM-DD` dans un fuseau IANA. |
| `startOfDayUtcIsoInTimeZone` | Minuit local du jour courant → ISO UTC (caps journaliers Lot 1). |
| `fromUserTime(localDateString, timeZone)` | Chaîne locale au format **`yyyy-MM-dd HH:mm:ss`** → instant UTC (`fromZonedTime`). |
| `formatInUserTimezone(date, timeZone, locale, formatStr)` | Formate l’**instant UTC** `date` dans le fuseau et la locale (tokens date-fns). Toujours passer l’instant réel stocké / calculé, pas une date « mur » ambiguë. |
| `isWithinCoachMorningPublishWindow(date)` | Fenêtre **07:59–08:01** heure locale **Europe/Paris** (cron blog). |

Pas d’export `toUserTime` : une API « décomposition locale » non ambiguë pourra être ajoutée en Lot 6 / Lot 8 si besoin.

Constante **`COACH_PUBLISH_TIMEZONE`** : `Europe/Paris`.

## Quiet hours (`src/lib/notifications/quiet-hours.ts`)

`shouldSendNowOrQueue(userId, eventType, timeZone, at?)` :

- **Critique** (`isCriticalEventType`) → toujours **`send`**.
- Sinon : entre **21:00** et **08:00** heure locale de `timeZone` → **`queue_digest`** ; sinon **`send`**.
- Paramètre **`at`** réservé aux tests / simulation ; en production n’est pas passé (défaut : maintenant).

Branchage dispatcher → Lot 6 (caps + file digest).

## Cron publication blog

- **`vercel.json`** — `*/2 5-8 * * *` (UTC, toutes les 2 minutes entre 5 h et 8 h 59 UTC), cf. justification métier (fenêtre Paris ~8 h ; DST géré par `isWithinCoachMorningPublishWindow`).
- **`src/app/api/admin/blog/cron/publish-scheduled/route.ts`** — après auth cron, si **pas** dans `isWithinCoachMorningPublishWindow`, réponse **200** `{ skipped: true, reason: 'outside_coach_publish_window', ... }` sans toucher aux articles.
