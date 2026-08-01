-- CM v5 — Proposition C (GO Kevin 2026-08-01)
-- Index partiel pour agrégats admin des envois newsletter.* dans notification_log.
-- Ne crée PAS de table. N’altère PAS les lignes existantes.

begin;

create index if not exists notification_log_newsletter_event_created_idx
  on public.notification_log (created_at desc)
  where event_type like 'newsletter.%';

comment on index public.notification_log_newsletter_event_created_idx is
  'CM v5 — filtre rapide des envois newsletter.* pour /admin/notifications';

commit;
