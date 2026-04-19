-- Phase 3: vidéos Vimeo et bibliothèque de replays.
-- Table pivot entre cours et vidéos hébergées (Vimeo).

create table if not exists public.video_recordings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  vimeo_video_id text not null unique,
  vimeo_uri text,
  title text,
  description text,
  embed_url text,
  thumbnail_url text,
  duration_seconds integer,
  privacy_view text not null default 'unlisted',
  upload_status text not null default 'uploading',
  is_ready boolean not null default false,
  available_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_recordings_duration_positive check (duration_seconds is null or duration_seconds > 0),
  constraint video_recordings_upload_status_valid check (
    upload_status in ('uploading', 'transcoding', 'ready', 'error', 'archived')
  )
);

create index if not exists idx_video_recordings_course_id
  on public.video_recordings(course_id);

create index if not exists idx_video_recordings_ready_available
  on public.video_recordings(is_ready, available_at);

drop trigger if exists trg_video_recordings_updated_at on public.video_recordings;
create trigger trg_video_recordings_updated_at
before update on public.video_recordings
for each row execute function public.set_updated_at();

alter table public.video_recordings enable row level security;

drop policy if exists "Users can read unlocked replays" on public.video_recordings;
create policy "Users can read unlocked replays"
  on public.video_recordings
  for select
  using (
    auth.uid() is not null
    and is_ready = true
    and exists (
      select 1
      from public.courses c
      where c.id = course_id
        and c.is_published = true
        and c.ends_at < now()
    )
    and public.course_access_level(auth.uid(), course_id) = 'full'
  );

drop policy if exists "Admins can manage video recordings" on public.video_recordings;
create policy "Admins can manage video recordings"
  on public.video_recordings
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

comment on table public.video_recordings is 'Métadonnées des vidéos de replay (Vimeo) associées aux cours.';
comment on column public.video_recordings.vimeo_video_id is 'Identifiant vidéo Vimeo (ex: 123456789).';
comment on column public.video_recordings.embed_url is 'URL iframe Vimeo prête pour affichage.';
comment on column public.video_recordings.is_ready is 'Vidéo prête et autorisée à l’affichage dans la bibliothèque.';
