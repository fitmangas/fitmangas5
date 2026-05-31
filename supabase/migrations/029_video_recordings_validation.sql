-- Validation admin des replays de cours (video_recordings).

alter table public.video_recordings
  add column if not exists validation_status text not null default 'pending';

alter table public.video_recordings
  drop constraint if exists video_recordings_validation_status_valid;

alter table public.video_recordings
  add constraint video_recordings_validation_status_valid
  check (validation_status in ('pending', 'approved', 'rejected'));

-- Replays déjà publiés aux clientes : conserver l'accès.
update public.video_recordings
set validation_status = 'approved'
where is_ready = true
  and validation_status = 'pending';

create index if not exists idx_video_recordings_validation_pending
  on public.video_recordings (validation_status)
  where validation_status = 'pending';

drop policy if exists "Users can read unlocked replays" on public.video_recordings;

create policy "Users can read unlocked replays"
  on public.video_recordings
  for select
  using (
    auth.uid() is not null
    and is_ready = true
    and validation_status = 'approved'
    and exists (
      select 1
      from public.courses c
      where c.id = course_id
        and c.is_published = true
        and c.ends_at < now()
    )
    and public.course_access_level(auth.uid(), course_id) = 'full'
  );

comment on column public.video_recordings.validation_status is
  'Workflow admin : pending → approved (visible client) ou rejected.';
