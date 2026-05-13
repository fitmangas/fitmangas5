-- Sync Vimeo granulaire + masquage sans suppression.

create table if not exists public.app_sync_state (
  key text primary key,
  last_success_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.app_sync_state enable row level security;

drop policy if exists "Admins manage app sync state" on public.app_sync_state;
create policy "Admins manage app sync state"
  on public.app_sync_state
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

alter table public.standalone_vimeo_videos
  add column if not exists is_hidden boolean not null default false,
  add column if not exists hidden_at timestamptz;

create index if not exists idx_standalone_vimeo_visible_published
  on public.standalone_vimeo_videos (published_at desc)
  where validation_status = 'published' and is_hidden = false;

drop policy if exists "Online subscribers read published standalone videos" on public.standalone_vimeo_videos;
create policy "Online subscribers read published standalone videos"
  on public.standalone_vimeo_videos
  for select
  using (
    validation_status = 'published'
    and is_hidden = false
    and auth.uid() is not null
    and public.tier_is_online(public.current_customer_tier(auth.uid()))
  );
