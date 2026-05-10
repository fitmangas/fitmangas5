# Système de communications FitMangas

## Architecture

Tous les producteurs métier appellent `dispatch()` avec un `event_type`, un `user_id`, un `payload`, des `channel_hints` éventuels et une `idempotency_key`.

Flux final :

1. Producteur métier : Stripe, blog, cours, Printful, communauté, digest.
2. Dispatcher : lit profil, préférences, fuseau, caps, silence mode et quiet hours.
3. Canaux : in-app, email Resend, push web, digest queue.
4. Journal : `notification_log` porte l’idempotence et l’historique d’envoi.

## Canaux

- In-app : table `user_notifications`, realtime Supabase.
- Email : Resend via `NEWSLETTER_FROM_EMAIL`, templates FR/ES dans `src/lib/notifications/templates`.
- Push : subscriptions web push VAPID, préférence par catégorie.
- Digest : `notification_digest_queue`, traité par `/api/admin/cron/daily-jobs`.

## Règles

- Caps : email quotidien et non-lues in-app via `settings.ts`.
- Quiet hours : événements non critiques mis en digest.
- Silence mode : bloque les événements non critiques.
- Critiques : `subscription.payment_failed*`, `course.*.cancelled*`.
- Idempotence : une clé unique dans `notification_log`.

## Event types principaux

- `onboarding.day0`, `onboarding.day1`, `onboarding.day3`, `onboarding.day7`
- `subscription.activated`, `subscription.payment_failed`, `subscription.cancelled`, `subscription.renewed`, `subscription.win_back_J+30`
- `course.visio.reminder_J-1`, `course.visio.reminder_H-1`, `course.visio.cancelled`, `course.visio.replay_ready`, `course.visio.missed`
- `course.presential.purchased`, `course.presential.reminder_J-1`, `course.presential.reminder_H-2`, `course.presential.cancelled_by_coach`, `course.presential.missed`
- `blog.article_published`
- `boutique.product_published`, `boutique.order_paid`, `boutique.order_shipped`, `boutique.order_delivered`
- `community.birthday`, `community.we_miss_you_30d`, `community.we_miss_you_60d`
- `digest.summary`
- `subscription.checkout_initiated`, `subscription.checkout_abandoned_explicit`
