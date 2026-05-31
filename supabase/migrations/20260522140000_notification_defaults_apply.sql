-- Applique les defaults notifications ON (si migration 20260521120000 non exécutée ou partielle).

alter table public.profiles
  alter column marketing_email_opt_in set default true;

alter table public.notification_preferences
  alter column content_email_enabled set default true,
  alter column courses_push_enabled set default true,
  alter column content_push_enabled set default true,
  alter column shop_push_enabled set default true,
  alter column community_push_enabled set default true,
  alter column digest_frequency set default 'weekly';

update public.notification_preferences
set
  content_email_enabled = true,
  courses_push_enabled = true,
  content_push_enabled = true,
  shop_push_enabled = true,
  community_push_enabled = true,
  digest_frequency = 'weekly',
  updated_at = now()
where content_email_enabled = false
  and courses_push_enabled = false
  and digest_frequency = 'off';

update public.profiles
set marketing_email_opt_in = true
where marketing_email_opt_in = false;

create or replace function public.ensure_notification_preferences_for_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (
    user_id,
    courses_inapp_enabled,
    courses_email_enabled,
    courses_push_enabled,
    content_inapp_enabled,
    content_email_enabled,
    content_push_enabled,
    shop_inapp_enabled,
    shop_email_enabled,
    shop_push_enabled,
    community_inapp_enabled,
    community_email_enabled,
    community_push_enabled,
    silence_mode_enabled,
    digest_frequency
  )
  values (
    new.id,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    'weekly'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function public.ensure_notification_prefs_row(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'ensure_notification_prefs_row: forbidden';
  end if;

  insert into public.notification_preferences (
    user_id,
    courses_inapp_enabled,
    courses_email_enabled,
    courses_push_enabled,
    content_inapp_enabled,
    content_email_enabled,
    content_push_enabled,
    shop_inapp_enabled,
    shop_email_enabled,
    shop_push_enabled,
    community_inapp_enabled,
    community_email_enabled,
    community_push_enabled,
    silence_mode_enabled,
    digest_frequency
  )
  values (
    p_user_id,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    'weekly'
  )
  on conflict (user_id) do nothing;
end;
$$;
