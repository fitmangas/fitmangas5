alter table public.notification_preferences
  add column if not exists live_eve_email boolean not null default true,
  add column if not exists live_eve_inapp boolean not null default true,
  add column if not exists live_eve_push boolean not null default false,
  add column if not exists live_hour_email boolean not null default true,
  add column if not exists live_hour_inapp boolean not null default true,
  add column if not exists live_hour_push boolean not null default false,
  add column if not exists live_other_language boolean not null default false,
  add column if not exists program_session_email boolean not null default true,
  add column if not exists program_session_inapp boolean not null default true,
  add column if not exists program_session_push boolean not null default false,
  add column if not exists program_nudge_email boolean not null default true,
  add column if not exists program_nudge_inapp boolean not null default true,
  add column if not exists content_replay_email boolean not null default true,
  add column if not exists content_replay_inapp boolean not null default true,
  add column if not exists content_replay_push boolean not null default false,
  add column if not exists blog_email boolean not null default false,
  add column if not exists blog_inapp boolean not null default true,
  add column if not exists blog_push boolean not null default false,
  add column if not exists weekly_digest_email boolean not null default true,
  add column if not exists silence_mode_hours boolean not null default true;

-- miroir aussi sur le profil (filtre destinataires lives)
alter table public.profiles
  add column if not exists live_other_language boolean not null default false;

alter table public.user_notifications
  add column if not exists category text,
  add column if not exists action_url text,
  add column if not exists action_label text,
  add column if not exists meta jsonb not null default '{}'::jsonb,
  add column if not exists group_key text;

create unique index if not exists user_notifications_group_key_uniq
  on public.user_notifications (user_id, group_key)
  where group_key is not null;

create table if not exists public.cron_heartbeats (
  job text primary key,
  last_run_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);
alter table public.cron_heartbeats enable row level security;
revoke all on public.cron_heartbeats from anon, authenticated;
grant all on public.cron_heartbeats to service_role;
create policy cron_heartbeats_admin_select on public.cron_heartbeats
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
grant select on public.cron_heartbeats to authenticated;

alter table public.courses
  add column if not exists live_style text;

-- L2-f réécrit : extensions + cron_secret_matches (sans vault secret ni cron.schedule)
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function public.cron_secret_matches(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'cron_secret' and decrypted_secret = candidate
  );
$$;
revoke all on function public.cron_secret_matches(text) from public, anon, authenticated;
grant execute on function public.cron_secret_matches(text) to service_role;
