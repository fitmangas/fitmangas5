create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  level smallint not null check (level between 0 and 3),
  track text not null,
  goals text[] not null default '{}',
  intensity smallint, impact text, live_style text,
  title jsonb not null, promise jsonb, for_who jsonb, not_for jsonb, coach_note jsonb,
  benefits jsonb not null default '[]', equipment jsonb not null default '[]', tests jsonb not null default '[]',
  weeks smallint not null, sessions_per_week smallint not null, minutes_range text,
  cover_url text, next_program_id uuid references public.programs(id),
  sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.program_weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  week smallint not null, focus jsonb not null, cues jsonb not null default '[]',
  unique (program_id, week)
);

create table if not exists public.program_steps (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  week smallint not null, position smallint not null,
  kind text not null check (kind in ('video','live')),
  -- set null : une vidéo retirée de la bibliothèque (synchro Vimeo) ne doit jamais bloquer la synchro ; l'étape est alors signalée sans vidéo.
  video_id uuid references public.standalone_vimeo_videos(id) on delete set null,
  start_s int, end_s int, segment_to_validate boolean not null default false,
  minutes smallint, objective jsonb, objective_long jsonb, live_style text,
  unique (program_id, week, position)
);

create sequence if not exists public.program_certificate_seq;

create table if not exists public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id),
  status text not null default 'active' check (status in ('active','paused','completed','abandoned')),
  start_date date not null,
  chosen_days smallint[] not null default '{1,3,5}',
  reminder_time time not null default '18:00',
  reminder_email boolean not null default true,
  reminder_inapp boolean not null default true,
  reminder_push boolean not null default false,
  paused_at timestamptz, completed_at timestamptz, certificate_number text unique,
  postponed_until date,
  created_at timestamptz not null default now()
);
create unique index if not exists program_enrollments_one_active
  on public.program_enrollments(user_id) where status = 'active';

create table if not exists public.program_step_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  step_id uuid not null references public.program_steps(id) on delete cascade,
  watched_s int not null default 0, completed_at timestamptz,
  feeling text check (feeling in ('easy','right','hard')),
  unique (enrollment_id, step_id)
);

create table if not exists public.program_test_results (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  phase text not null check (phase in ('start','end')),
  results jsonb not null, created_at timestamptz not null default now(),
  unique (enrollment_id, phase)
);

create table if not exists public.program_feedback (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  rating smallint check (rating between 1 and 5), message text,
  publish_consent boolean not null default false, consent_withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.programs enable row level security;
alter table public.program_weeks enable row level security;
alter table public.program_steps enable row level security;
alter table public.program_enrollments enable row level security;
alter table public.program_step_progress enable row level security;
alter table public.program_test_results enable row level security;
alter table public.program_feedback enable row level security;

revoke all on public.programs, public.program_weeks, public.program_steps,
  public.program_enrollments, public.program_step_progress,
  public.program_test_results, public.program_feedback from anon;
revoke all on public.programs, public.program_weeks, public.program_steps,
  public.program_enrollments, public.program_step_progress,
  public.program_test_results, public.program_feedback from authenticated;

grant select on public.programs, public.program_weeks, public.program_steps to authenticated;
grant select on public.program_enrollments, public.program_step_progress,
  public.program_test_results, public.program_feedback to authenticated;
grant all on public.programs, public.program_weeks, public.program_steps,
  public.program_enrollments, public.program_step_progress,
  public.program_test_results, public.program_feedback to service_role;
grant usage, select on sequence public.program_certificate_seq to service_role;

create policy programs_select_published on public.programs
  for select to authenticated
  using (
    status = 'published'
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy program_weeks_select on public.program_weeks
  for select to authenticated
  using (
    exists (select 1 from public.programs pr where pr.id = program_id and pr.status = 'published')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy program_steps_select on public.program_steps
  for select to authenticated
  using (
    exists (select 1 from public.programs pr where pr.id = program_id and pr.status = 'published')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy enrollments_select_own on public.program_enrollments
  for select to authenticated using (user_id = auth.uid());
create policy progress_select_own on public.program_step_progress
  for select to authenticated
  using (exists (select 1 from public.program_enrollments e where e.id = enrollment_id and e.user_id = auth.uid()));
create policy tests_select_own on public.program_test_results
  for select to authenticated
  using (exists (select 1 from public.program_enrollments e where e.id = enrollment_id and e.user_id = auth.uid()));
create policy feedback_select_own on public.program_feedback
  for select to authenticated
  using (exists (select 1 from public.program_enrollments e where e.id = enrollment_id and e.user_id = auth.uid()));

create or replace function public.start_program(
  p_user_id uuid,
  p_program_id uuid,
  p_start_date date,
  p_chosen_days smallint[],
  p_reminder_time time,
  p_reminder_email boolean,
  p_reminder_inapp boolean,
  p_reminder_push boolean
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  update public.program_enrollments
    set status = 'paused', paused_at = now()
    where user_id = p_user_id and status = 'active';

  insert into public.program_enrollments (
    user_id, program_id, status, start_date, chosen_days,
    reminder_time, reminder_email, reminder_inapp, reminder_push
  ) values (
    p_user_id, p_program_id, 'active', p_start_date, p_chosen_days,
    p_reminder_time, p_reminder_email, p_reminder_inapp, p_reminder_push
  ) returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.start_program(uuid, uuid, date, smallint[], time, boolean, boolean, boolean) from public, anon, authenticated;
grant execute on function public.start_program(uuid, uuid, date, smallint[], time, boolean, boolean, boolean) to service_role;

create or replace function public.nextval_program_certificate()
returns bigint
language sql
security definer
set search_path = public
as $$ select nextval('public.program_certificate_seq'); $$;
revoke all on function public.nextval_program_certificate() from public, anon, authenticated;
grant execute on function public.nextval_program_certificate() to service_role;
