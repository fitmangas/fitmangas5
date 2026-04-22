-- Publication programmée + raison de rejet + coach (FK profils).

alter table public.standalone_vimeo_videos
  drop constraint if exists standalone_vimeo_validation_chk;

alter table public.standalone_vimeo_videos
  add constraint standalone_vimeo_validation_chk
  check (validation_status in ('pending', 'scheduled', 'published', 'rejected'));

alter table public.standalone_vimeo_videos
  add column if not exists scheduled_publication_at timestamptz;

alter table public.standalone_vimeo_videos
  add column if not exists rejection_reason text;

alter table public.standalone_vimeo_videos
  add column if not exists coach_id uuid references public.profiles (id) on delete set null;

create index if not exists idx_standalone_vimeo_validation_status
  on public.standalone_vimeo_videos (validation_status);

create index if not exists idx_standalone_vimeo_scheduled_at
  on public.standalone_vimeo_videos (scheduled_publication_at)
  where scheduled_publication_at is not null;

comment on column public.standalone_vimeo_videos.scheduled_publication_at is
  'Si validation_status = scheduled : heure UTC de publication automatique.';
comment on column public.standalone_vimeo_videos.rejection_reason is
  'Optionnel, renseigné lors du rejet admin.';
comment on column public.standalone_vimeo_videos.coach_id is
  'Coach / admin associé (webhook : VIMEO_DEFAULT_COACH_ID ; sync : utilisateur déclencheur).';
