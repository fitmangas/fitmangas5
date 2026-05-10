create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bd date;
  detected_locale text;
  detected_timezone text;
begin
  begin
    bd := nullif(trim(coalesce(new.raw_user_meta_data->>'birth_date', '')), '')::date;
  exception
    when others then
      bd := null;
  end;

  detected_locale := lower(nullif(trim(coalesce(new.raw_user_meta_data->>'preferred_locale', '')), ''));
  if detected_locale not in ('fr', 'es') then
    detected_locale := 'fr';
  end if;

  detected_timezone := nullif(trim(coalesce(new.raw_user_meta_data->>'display_timezone', '')), '');
  if detected_timezone is null then
    detected_timezone := 'Europe/Paris';
  end if;

  insert into public.profiles (
    id,
    first_name,
    last_name,
    birth_date,
    preferred_locale,
    display_timezone,
    display_timezone_manual_locked
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    bd,
    detected_locale,
    detected_timezone,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
