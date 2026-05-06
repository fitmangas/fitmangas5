-- -----------------------------------------------------------------------------
-- Garantit une ligne notification_preferences pour l'utilisateur courant (UPSERT
-- no-op). Appelée depuis les Server Actions avant UPDATE ; contourne les profils
-- sans ligne malgré le backfill Phase 1.
-- -----------------------------------------------------------------------------

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
    false,
    true,
    false,
    false,
    true,
    true,
    false,
    true,
    true,
    false,
    false,
    'off'
  )
  on conflict (user_id) do nothing;
end;
$$;

comment on function public.ensure_notification_prefs_row(uuid) is
  'Insert défauts notification_preferences si absent ; sécurisé à auth.uid() = p_user_id.';

revoke all on function public.ensure_notification_prefs_row(uuid) from public;
grant execute on function public.ensure_notification_prefs_row(uuid) to authenticated;
grant execute on function public.ensure_notification_prefs_row(uuid) to postgres;
grant execute on function public.ensure_notification_prefs_row(uuid) to service_role;
