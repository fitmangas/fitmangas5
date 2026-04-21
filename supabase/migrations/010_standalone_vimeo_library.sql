-- Bibliothèque Vimeo autonome : webhook → pending → validation admin → visible abonnés online uniquement.

create table if not exists public.standalone_vimeo_videos (
  id uuid primary key default gen_random_uuid(),
  vimeo_video_id text not null unique,
  vimeo_uri text,
  title text,
  description text,
  thumbnail_url text,
  duration_seconds integer,
  embed_url text,
  validation_status text not null default 'pending'
    constraint standalone_vimeo_validation_chk
      check (validation_status in ('pending', 'published', 'rejected')),
  published_at timestamptz,
  webhook_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint standalone_vimeo_duration_positive check (duration_seconds is null or duration_seconds >= 0)
);

create index if not exists idx_standalone_vimeo_status_created
  on public.standalone_vimeo_videos (validation_status, created_at desc);

drop trigger if exists trg_standalone_vimeo_updated_at on public.standalone_vimeo_videos;
create trigger trg_standalone_vimeo_updated_at
before update on public.standalone_vimeo_videos
for each row execute function public.set_updated_at();

alter table public.standalone_vimeo_videos enable row level security;

drop policy if exists "Admins manage standalone vimeo videos" on public.standalone_vimeo_videos;
create policy "Admins manage standalone vimeo videos"
  on public.standalone_vimeo_videos
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

drop policy if exists "Online subscribers read published standalone videos" on public.standalone_vimeo_videos;
create policy "Online subscribers read published standalone videos"
  on public.standalone_vimeo_videos
  for select
  using (
    validation_status = 'published'
    and auth.uid() is not null
    and public.tier_is_online(public.current_customer_tier(auth.uid()))
  );

comment on table public.standalone_vimeo_videos is
  'Vidéos Vimeo hors cours : pending jusqu’à validation admin ; lecture réservée aux abonnés online (collectif/individuel).';
