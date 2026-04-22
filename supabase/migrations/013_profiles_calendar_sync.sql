alter table public.profiles
  add column if not exists calendar_sync_enabled boolean not null default false,
  add column if not exists calendar_sync_token text unique;
