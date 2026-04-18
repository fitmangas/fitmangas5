-- Renommage conceptuel capacity -> capacity_max (plafond d'inscriptions)

alter table public.courses add column if not exists capacity_max integer;

update public.courses
set capacity_max = capacity
where capacity_max is null and capacity is not null;

alter table public.courses drop constraint if exists courses_capacity_positive;

alter table public.courses drop column if exists capacity;

alter table public.courses
  drop constraint if exists courses_capacity_max_positive;

alter table public.courses
  add constraint courses_capacity_max_positive check (capacity_max is null or capacity_max > 0);

comment on column public.courses.capacity_max is 'Nombre max de places (présentiel ou limite logique); null = pas de limite fixée.';
