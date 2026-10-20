-- Sans begin/commit : le fichier de migration est déjà exécuté d'un seul tenant (tout ou rien).
do $$
declare t text;
begin
  foreach t in array array[
    'ad_breakdowns_daily','ad_campaigns','ad_creatives','ad_insights_daily',
    'ad_metrics_daily','ads_sync_runs','organic_account_snapshots','organic_media_snapshots'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke all on public.%I from authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = ''admin''))',
      t || '_admin_select', t
    );
  end loop;
end $$;
-- La politique admin ne sert que si un écran lit un jour ces tables avec la session (aujourd’hui : service_role).
grant select on public.ad_breakdowns_daily, public.ad_campaigns, public.ad_creatives, public.ad_insights_daily,
  public.ad_metrics_daily, public.ads_sync_runs, public.organic_account_snapshots, public.organic_media_snapshots
  to authenticated;

drop policy if exists "Users can insert own enrollments" on public.enrollments;

create table if not exists public.rate_limits (
  id bigserial primary key,
  scope text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limits_scope_ip_created on public.rate_limits (scope, ip_hash, created_at desc);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
grant all on public.rate_limits to service_role;
grant usage, select on sequence public.rate_limits_id_seq to service_role;

-- 1) Nouveaux profils : non par défaut
alter table public.profiles alter column marketing_email_opt_in set default false;
