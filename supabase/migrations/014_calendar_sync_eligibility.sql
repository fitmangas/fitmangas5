-- Éligibilité au flux calendrier tokenisé :
-- - tier effectif (current_customer_tier : abonnement active/trialing ou tier profil),
-- - OU abonnement en défaut de paiement (past_due) encore dans sa période — non bloquant pour le calendrier,
-- - OU inscription à un cours encore non terminé.
-- Les statuts « refus volontaire » (ex. canceled) ne sont pas traités comme past_due et ne passent pas par cette branche.

create or replace function public.customer_calendar_feed_eligible(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_customer_tier(target_user_id) is not null
    or exists (
      select 1
      from public.subscriptions s
      where s.user_id = target_user_id
        and s.status = 'past_due'::public.subscription_status
        and (s.ends_at is null or s.ends_at > now())
    )
    or exists (
      select 1
      from public.enrollments e
      inner join public.courses c on c.id = e.course_id
      where e.user_id = target_user_id
        and e.status in ('booked', 'attended')
        and c.ends_at > now()
    );
$$;

comment on function public.customer_calendar_feed_eligible(uuid) is
  'Calendrier : accès si tier effectif, ou souscription past_due dans la période, ou cours réservé non terminé. Annulation volontaire (canceled) : hors branche past_due.';

grant execute on function public.customer_calendar_feed_eligible(uuid) to authenticated;
grant execute on function public.customer_calendar_feed_eligible(uuid) to service_role;
