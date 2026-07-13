begin;

create table if not exists public.replay_view_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recording_id uuid not null references public.video_recordings(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (user_id, recording_id)
);

alter table public.replay_view_events enable row level security;

drop policy if exists "replay_view_events_select_own" on public.replay_view_events;
create policy "replay_view_events_select_own"
  on public.replay_view_events
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.increment_replay_view(p_recording_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  inserted_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select vr.course_id
  into cid
  from public.video_recordings vr
  join public.courses c on c.id = vr.course_id
  where vr.id = p_recording_id
    and vr.is_ready = true
    and coalesce(vr.validation_status, 'approved') = 'approved'
    and c.is_published = true
    and c.ends_at < now();

  if cid is null then
    raise exception 'recording not found or unavailable';
  end if;

  if public.course_access_level(auth.uid(), cid) <> 'full'::public.access_level then
    raise exception 'forbidden';
  end if;

  insert into public.replay_view_events (user_id, recording_id)
  values (auth.uid(), p_recording_id)
  on conflict (user_id, recording_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 1 then
    update public.video_recordings
    set view_count = view_count + 1
    where id = p_recording_id;
  end if;
end;
$$;

revoke execute on function public.increment_replay_view(uuid) from public;
revoke execute on function public.increment_replay_view(uuid) from anon;
grant execute on function public.increment_replay_view(uuid) to authenticated;

commit;
