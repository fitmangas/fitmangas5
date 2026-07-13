begin;

alter table public.profiles enable row level security;

drop policy if exists "Mise à jour du profil par l’utilisateur" on public.profiles;
drop policy if exists "profiles_update_own_safe_columns" on public.profiles;

create policy "profiles_update_own_safe_columns"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on public.profiles from anon;
revoke update on public.profiles from authenticated;

grant update (
  first_name,
  last_name,
  avatar_url,
  birth_date,
  onboarding_completed,
  preferred_locale,
  preferred_blog_language,
  display_timezone,
  display_timezone_manual_locked,
  marketing_email_opt_in,
  marketing_email_opt_in_at
) on public.profiles to authenticated;

grant all on public.profiles to service_role;

commit;
