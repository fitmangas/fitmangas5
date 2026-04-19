-- Expérience client : favoris replays, reprise lecture, notifications, avatar.

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is 'URL publique (storage) de la photo de profil.';

-- ---------------------------------------------------------------------------
-- Replays : favoris et position de lecture
-- ---------------------------------------------------------------------------

create table if not exists public.replay_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  recording_id uuid not null references public.video_recordings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recording_id)
);

create index if not exists idx_replay_favorites_user on public.replay_favorites(user_id);

alter table public.replay_favorites enable row level security;

drop policy if exists "Users manage own replay favorites" on public.replay_favorites;
create policy "Users manage own replay favorites"
  on public.replay_favorites
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.replay_playback_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  recording_id uuid not null references public.video_recordings(id) on delete cascade,
  position_seconds integer not null default 0 check (position_seconds >= 0 and position_seconds <= 864000),
  updated_at timestamptz not null default now(),
  primary key (user_id, recording_id)
);

create index if not exists idx_replay_progress_user on public.replay_playback_progress(user_id);

alter table public.replay_playback_progress enable row level security;

drop policy if exists "Users read own replay progress" on public.replay_playback_progress;
create policy "Users read own replay progress"
  on public.replay_playback_progress
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users upsert own replay progress via RPC only" on public.replay_playback_progress;
-- Pas d’insert/update direct : uniquement via fonction security definer (vérif accès cours).

create or replace function public.upsert_replay_progress(p_recording_id uuid, p_seconds integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  sec integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select course_id into cid from public.video_recordings where id = p_recording_id;
  if cid is null then
    raise exception 'recording not found';
  end if;
  if public.course_access_level(auth.uid(), cid) <> 'full'::public.access_level then
    raise exception 'forbidden';
  end if;
  sec := least(greatest(coalesce(p_seconds, 0), 0), 864000);
  insert into public.replay_playback_progress (user_id, recording_id, position_seconds, updated_at)
  values (auth.uid(), p_recording_id, sec, now())
  on conflict (user_id, recording_id)
  do update set position_seconds = excluded.position_seconds, updated_at = now();
end;
$$;

grant execute on function public.upsert_replay_progress(uuid, integer) to authenticated;

create or replace function public.toggle_replay_favorite(p_recording_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select course_id into cid from public.video_recordings where id = p_recording_id;
  if cid is null then
    raise exception 'recording not found';
  end if;
  if public.course_access_level(auth.uid(), cid) <> 'full'::public.access_level then
    raise exception 'forbidden';
  end if;
  delete from public.replay_favorites
  where user_id = auth.uid() and recording_id = p_recording_id;
  if found then
    return false;
  end if;
  insert into public.replay_favorites (user_id, recording_id)
  values (auth.uid(), p_recording_id);
  return true;
end;
$$;

grant execute on function public.toggle_replay_favorite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Notifications in-app
-- ---------------------------------------------------------------------------

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_notifications_user_created on public.user_notifications(user_id, created_at desc);

alter table public.user_notifications enable row level security;

drop policy if exists "Users read own notifications" on public.user_notifications;
create policy "Users read own notifications"
  on public.user_notifications
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.user_notifications;
create policy "Users update own notifications"
  on public.user_notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Déclenchés lorsqu’un replay devient disponible.
create or replace function public.fn_notify_replay_ready()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ctitle text;
begin
  if tg_op = 'INSERT' then
    if new.is_ready is not true then
      return new;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.is_ready is not true then
      return new;
    end if;
    if old.is_ready is true then
      return new;
    end if;
  else
    return new;
  end if;
  select title into ctitle from public.courses where id = new.course_id;
  insert into public.user_notifications (user_id, kind, title, body)
  select
    e.user_id,
    'replay_ready',
    'Nouveau replay disponible',
    format('La séance « %s » est disponible en replay.', coalesce(ctitle, 'Ta séance'))
  from public.enrollments e
  where e.course_id = new.course_id
    and e.status in ('booked', 'attended', 'waitlist');
  return new;
end;
$$;

drop trigger if exists trg_notify_replay_ready on public.video_recordings;
create trigger trg_notify_replay_ready
after insert or update of is_ready on public.video_recordings
for each row execute function public.fn_notify_replay_ready();

-- Changement de dates de cours (planning admin).
create or replace function public.fn_notify_course_schedule_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op <> 'update' then
    return new;
  end if;
  if new.starts_at is not distinct from old.starts_at and new.ends_at is not distinct from old.ends_at then
    return new;
  end if;
  insert into public.user_notifications (user_id, kind, title, body)
  select
    e.user_id,
    'course_reschedule',
    'Séance replanifiée',
    format('« %s » : le créneau a été modifié. Vérifie ton calendrier.', coalesce(new.title, 'Ton cours'))
  from public.enrollments e
  where e.course_id = new.id
    and e.status in ('booked', 'attended', 'waitlist');
  return new;
end;
$$;

drop trigger if exists trg_notify_course_schedule on public.courses;
create trigger trg_notify_course_schedule
after update of starts_at, ends_at on public.courses
for each row execute function public.fn_notify_course_schedule_change();

-- ---------------------------------------------------------------------------
-- Stockage avatars (bucket public)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
select 'avatars', 'avatars', true
where not exists (select 1 from storage.buckets where id = 'avatars');

drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);
