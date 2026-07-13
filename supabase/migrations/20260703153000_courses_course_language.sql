begin;

alter table public.courses
  add column if not exists course_language text;

alter table public.courses
  drop constraint if exists courses_course_language_check;

alter table public.courses
  add constraint courses_course_language_check
  check (course_language is null or course_language in ('fr', 'es'));

comment on column public.courses.course_language is
  'Langue de la séance : fr (français), es (espagnol), ou NULL si non définie.';

commit;
