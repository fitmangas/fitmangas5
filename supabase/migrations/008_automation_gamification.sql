-- Automatisation hybride (présentiel / ligne), gamification, naissance, playlist Spotify sur le cours.

-- ---------------------------------------------------------------------------
-- Profils : gamification + naissance
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists birth_date date,
  add column if not exists gamification_points integer not null default 0 check (gamification_points >= 0),
  add column if not exists gamification_grade text not null default 'debutant'
    check (gamification_grade in ('debutant', 'confirme', 'expert')),
  add column if not exists onsite_presence_count integer not null default 0 check (onsite_presence_count >= 0),
  add column if not exists total_replay_watch_seconds bigint not null default 0 check (total_replay_watch_seconds >= 0),
  add column if not exists live_visit_count integer not null default 0 check (live_visit_count >= 0);

comment on column public.profiles.birth_date is 'Pour e-mails anniversaire (jour/mois uniquement côté métier).';
comment on column public.profiles.gamification_grade is 'Ruban affiché : debutant | confirme | expert.';
comment on column public.profiles.onsite_presence_count is 'Présences validées en présentiel (pointage admin).';
comment on column public.profiles.total_replay_watch_seconds is 'Temps cumulé estimé depuis la progression Vimeo.';
comment on column public.profiles.live_visit_count is 'Jours distincts avec participation live (Jitsi), par cours/jour.';

-- ---------------------------------------------------------------------------
-- Cours : playlist Spotify liée à la séance / replay
-- ---------------------------------------------------------------------------

alter table public.courses
  add column if not exists spotify_playlist_url text;

comment on column public.courses.spotify_playlist_url is 'Playlist Spotify affichée sur la fiche replay / live de la séance.';

-- ---------------------------------------------------------------------------
-- Visites live (1 comptage par jour civil Europe/Paris par cours)
-- ---------------------------------------------------------------------------

create table if not exists public.live_course_daily_visits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  visit_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id, visit_date)
);

create index if not exists idx_live_visits_user on public.live_course_daily_visits(user_id);

alter table public.live_course_daily_visits enable row level security;

-- Pas de policy : accès uniquement via fonctions security definer / service_role.

-- ---------------------------------------------------------------------------
-- Segmentation tiers
-- ---------------------------------------------------------------------------

create or replace function public.tier_is_online(t public.customer_tier)
returns boolean
language sql
immutable
as $$
  select t in (
    'online_individual_monthly'::public.customer_tier,
    'online_group_monthly'::public.customer_tier
  );
$$;

create or replace function public.tier_is_onsite(t public.customer_tier)
returns boolean
language sql
immutable
as $$
  select t in (
    'onsite_group_single'::public.customer_tier,
    'onsite_individual_single'::public.customer_tier
  );
$$;

-- Points : présences onsite ×30 + minutes replay (plafonnées) ×2 + visites live ×15
create or replace function public.refresh_user_gamification(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  onsite integer;
  secs bigint;
  livec integer;
  pts integer;
  gd text;
  replay_minutes integer;
begin
  select
    coalesce(onsite_presence_count, 0),
    coalesce(total_replay_watch_seconds, 0),
    coalesce(live_visit_count, 0)
  into onsite, secs, livec
  from public.profiles
  where id = target;

  replay_minutes := least(coalesce(secs, 0) / 60, 600);

  pts :=
    coalesce(onsite, 0) * 30 +
    replay_minutes * 2 +
    coalesce(livec, 0) * 15;

  if pts < 80 then
    gd := 'debutant';
  elsif pts < 250 then
    gd := 'confirme';
  else
    gd := 'expert';
  end if;

  update public.profiles
  set
    gamification_points = pts,
    gamification_grade = gd,
    updated_at = now()
  where id = target;
end;
$$;

-- ---------------------------------------------------------------------------
-- Progression replay : cumul du delta + grade
-- ---------------------------------------------------------------------------

create or replace function public.upsert_replay_progress(p_recording_id uuid, p_seconds integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  sec integer;
  prev integer;
  delta integer;
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

  select position_seconds into prev
  from public.replay_playback_progress
  where user_id = auth.uid() and recording_id = p_recording_id;

  prev := coalesce(prev, 0);
  delta := greatest(0, least(sec - prev, 7200));

  if delta > 0 then
    update public.profiles
    set total_replay_watch_seconds = total_replay_watch_seconds + delta
    where id = auth.uid();
  end if;

  insert into public.replay_playback_progress (user_id, recording_id, position_seconds, updated_at)
  values (auth.uid(), p_recording_id, sec, now())
  on conflict (user_id, recording_id)
  do update set position_seconds = excluded.position_seconds, updated_at = now();

  perform public.refresh_user_gamification(auth.uid());
end;
$$;

grant execute on function public.upsert_replay_progress(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Visite live Jitsi (élève avec accès complet au cours)
-- ---------------------------------------------------------------------------

create or replace function public.record_live_course_visit(p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (timezone('Europe/Paris', now()))::date;
  n_ins integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (select 1 from public.courses where id = p_course_id and is_published = true) then
    raise exception 'course not found';
  end if;
  if public.course_access_level(auth.uid(), p_course_id) <> 'full'::public.access_level then
    raise exception 'forbidden';
  end if;

  insert into public.live_course_daily_visits (user_id, course_id, visit_date)
  values (auth.uid(), p_course_id, v_day)
  on conflict (user_id, course_id, visit_date) do nothing;

  get diagnostics n_ins = row_count;

  if n_ins > 0 then
    update public.profiles
    set live_visit_count = live_visit_count + 1
    where id = auth.uid();

    perform public.refresh_user_gamification(auth.uid());
  end if;
end;
$$;

grant execute on function public.record_live_course_visit(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Pointage présentiel → incrément présences onsite
-- ---------------------------------------------------------------------------

create or replace function public.trg_enrollment_attended_gamification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.status = 'attended'
     and old.status is distinct from 'attended'
     and exists (
       select 1 from public.courses c
       where c.id = new.course_id and c.course_format = 'onsite'::public.course_format
     )
  then
    update public.profiles
    set onsite_presence_count = onsite_presence_count + 1
    where id = new.user_id;

    perform public.refresh_user_gamification(new.user_id);
  end if;

  if tg_op = 'INSERT' and new.status = 'attended'
     and exists (
       select 1 from public.courses c
       where c.id = new.course_id and c.course_format = 'onsite'::public.course_format
     )
  then
    update public.profiles
    set onsite_presence_count = onsite_presence_count + 1
    where id = new.user_id;

    perform public.refresh_user_gamification(new.user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enrollment_attended_gamification on public.enrollments;
create trigger trg_enrollment_attended_gamification
after insert or update of status on public.enrollments
for each row execute function public.trg_enrollment_attended_gamification();

-- ---------------------------------------------------------------------------
-- Inscription : naissance depuis les métadonnées auth
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bd date;
begin
  begin
    bd := nullif(trim(coalesce(new.raw_user_meta_data->>'birth_date', '')), '')::date;
  exception
    when others then
      bd := null;
  end;

  insert into public.profiles (id, first_name, last_name, birth_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    bd
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Rapports automation (service_role / scripts)
-- ---------------------------------------------------------------------------

create or replace function public.report_we_miss_you_candidates(p_days integer)
returns table (
  user_id uuid,
  email text,
  segment text,
  message_key text,
  last_activity_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  thresh timestamptz := now() - make_interval(days => greatest(p_days, 1));
  r record;
  t public.customer_tier;
  lb timestamptz;
  last_online_activity timestamptz;
  last_signin timestamptz;
  last_live timestamptz;
begin
  for r in
    select p.id as pid, u.email as em, u.last_sign_in_at as lsi
    from public.profiles p
    join auth.users u on u.id = p.id
    where coalesce(u.email, '') <> ''
  loop
    t := public.current_customer_tier(r.pid);

    if t is null then
      continue;
    end if;

    if public.tier_is_onsite(t) then
      select max(e.purchased_at) into lb
      from public.enrollments e
      join public.courses c on c.id = e.course_id
      where e.user_id = r.pid
        and c.course_format = 'onsite'::public.course_format
        and e.status in ('booked', 'attended', 'waitlist');

      if lb is null or lb < thresh then
        user_id := r.pid;
        email := r.em;
        segment := 'presentiel';
        message_key := 'studio';
        last_activity_at := lb;
        return next;
      end if;

    elsif public.tier_is_online(t) then
      last_signin := r.lsi;
      select max(v.created_at) into last_live
      from public.live_course_daily_visits v
      where v.user_id = r.pid;

      last_online_activity := greatest(
        coalesce(last_signin, to_timestamp(0)),
        coalesce(last_live, to_timestamp(0))
      );

      if last_online_activity < thresh then
        user_id := r.pid;
        email := r.em;
        segment := 'ligne';
        message_key := 'tapis';
        last_activity_at := last_online_activity;
        return next;
      end if;
    end if;
  end loop;
end;
$$;

create or replace function public.report_birthday_today_users()
returns table (
  user_id uuid,
  email text,
  first_name text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p.id,
    coalesce(u.email, '')::text,
    coalesce(p.first_name, '')::text
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.birth_date is not null
    and extract(month from p.birth_date) = extract(month from (timezone('Europe/Paris', now()))::date)
    and extract(day from p.birth_date) = extract(day from (timezone('Europe/Paris', now()))::date)
    and coalesce(u.email, '') <> '';
$$;

revoke all on function public.report_we_miss_you_candidates(integer) from public;
revoke all on function public.report_birthday_today_users() from public;
grant execute on function public.report_we_miss_you_candidates(integer) to service_role;
grant execute on function public.report_birthday_today_users() to service_role;

-- Notification anniversaire : déclenchée en batch (cron) — placeholder table optionnelle
create or replace function public.queue_birthday_notification_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  fn text;
  paris_day date := (timezone('Europe/Paris', now()))::date;
begin
  if exists (
    select 1 from public.user_notifications un
    where un.user_id = p_user_id
      and un.kind = 'birthday'
      and timezone('Europe/Paris', un.created_at)::date = paris_day
  ) then
    return;
  end if;

  select coalesce(first_name, '') into fn from public.profiles where id = p_user_id;
  insert into public.user_notifications (user_id, kind, title, body)
  values (
    p_user_id,
    'birthday',
    'Joyeux anniversaire !',
    format('Toute l’équipe Fit Mangas te souhaite une belle journée%s.', case when length(trim(fn)) > 0 then ', ' || trim(fn) else '' end)
  );
end;
$$;

revoke all on function public.queue_birthday_notification_for_user(uuid) from public;
grant execute on function public.queue_birthday_notification_for_user(uuid) to service_role;

comment on function public.queue_birthday_notification_for_user(uuid) is
  'À appeler depuis un cron quotidien + envoi e-mail ; insère aussi une notif in-app.';

-- Recalcul initial des grades (petits jeux de données).
do $$
declare
  r record;
begin
  for r in select id from public.profiles loop
    perform public.refresh_user_gamification(r.id);
  end loop;
end $$;
