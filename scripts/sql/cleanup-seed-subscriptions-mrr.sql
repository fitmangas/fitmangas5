-- ONE-SHOT (ne pas exécuter sans GO explicite / revue)
-- Nettoie les abonnements seed / manuels qui gonflent le MRR DB (ex. 733 €)
-- et faussent la cohorte « abonnée » côté snapshots SQL refresh_business_stats_daily.
--
-- Contexte (diagnostic 2026-07-14) :
--   seed_sub_* (Admin Owner 269€, Camille Individuel 269€, Sofia Collectif 39€)
--   + manual_test_demo 39€
--   + vrais sub_* (Michelle, Elodie, Carole…)
--   → somme active/trialing = 733 € alors que Stripe live ≈ MRR réel.
--
-- Effet attendu après exécution :
--   - mrr_eur du jour via refresh_business_stats_daily ≈ somme des sub_* uniquement
--   - les profils seed (Camille Individuel, Sofia Collectif, 57777d4e…) passent en
--     « Pas finalisé » côté santé app (déjà géré en code via isRealStripeSubscriptionId)
--
-- Option A — annuler les faux abonnements (réversible) :

begin;

update public.subscriptions
set
  status = 'canceled',
  updated_at = now(),
  ends_at = coalesce(ends_at, now())
where status in ('active', 'trialing')
  and (
    stripe_subscription_id is null
    or stripe_subscription_id = ''
    or stripe_subscription_id not like 'sub_%'
  );

-- Optionnel : archiver profils clairement test / seed (adapter la liste avant GO)
-- update public.profiles
-- set archived = true, updated_at = now()
-- where id in (
--   '04d0099c-18de-47b2-82e2-ee4a897c709b', -- Camille Individuel
--   '365730d3-2df4-451f-acd5-57085f5a2d2e', -- Sofia Collectif
--   'e960326e-e964-43e0-93cf-d6499521644f', -- Julie PresentielGroup
--   'c4dd00dd-7f3d-4938-a426-c8ce559bac22', -- Nora PresentielInd
--   '57777d4e-7d01-4c0e-82d3-1e3e2017184a', -- manual_test_demo
--   '3b78f562-eb8c-424b-a9f3-9dbaa371db45'  -- Kevin Test
-- );

select public.refresh_business_stats_daily();

-- Vérification attendue : mrr_eur du jour = prix des seules lignes sub_…
select
  s.user_id,
  p.first_name,
  p.last_name,
  s.status,
  s.price_cents,
  s.stripe_subscription_id
from public.subscriptions s
left join public.profiles p on p.id = s.user_id
where s.status in ('active', 'trialing')
order by s.price_cents desc;

select stat_date, mrr_eur, active_subscribers
from public.business_stats_daily
order by stat_date desc
limit 3;

-- commit;  -- décommenter après revue
rollback;
