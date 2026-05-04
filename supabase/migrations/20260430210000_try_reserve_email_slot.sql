-- -----------------------------------------------------------------------------
-- Atomically reserve one email slot for daily cap (race-safe vs read-then-write).
-- Called from Edge/API service_role only.
-- -----------------------------------------------------------------------------

create or replace function public.try_reserve_email_slot(
  p_user_id uuid,
  p_scope_key text,
  p_max integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dummy int;
begin
  update public.notification_frequency_cap
  set
    sent_count = notification_frequency_cap.sent_count + 1,
    updated_at = now(),
    window_expires_at = now() + interval '25 hours'
  where user_id = p_user_id
    and channel = 'email'
    and scope_key = p_scope_key
    and sent_count < p_max
  returning sent_count into v_dummy;

  if found then
    return true;
  end if;

  begin
    insert into public.notification_frequency_cap (
      user_id,
      channel,
      scope_key,
      sent_count,
      window_expires_at,
      updated_at
    )
    values (
      p_user_id,
      'email',
      p_scope_key,
      1,
      now() + interval '25 hours',
      now()
    );
    return true;
  exception
    when unique_violation then
      update public.notification_frequency_cap
      set
        sent_count = notification_frequency_cap.sent_count + 1,
        updated_at = now(),
        window_expires_at = now() + interval '25 hours'
      where user_id = p_user_id
        and channel = 'email'
        and scope_key = p_scope_key
        and sent_count < p_max
      returning sent_count into v_dummy;
      return found;
  end;
end;
$$;

comment on function public.try_reserve_email_slot(uuid, text, integer) is
  'Réserve atomiquement un envoi email dans la fenêtre scope_key ; retourne false si plafond atteint.';

revoke all on function public.try_reserve_email_slot(uuid, text, integer) from public;
grant execute on function public.try_reserve_email_slot(uuid, text, integer) to postgres;
grant execute on function public.try_reserve_email_slot(uuid, text, integer) to service_role;
