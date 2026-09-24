import { loadHooksBank, topHooksForFewShot } from '@/lib/admin/social-hooks-bank';
import { createAdminClient } from '@/lib/supabase/admin';

import { getMessagingMode } from '@/lib/acquisition/feature-flag';
import { isAcquisitionSchemaReady } from '@/lib/acquisition/db';
import { listUpcomingFollowups } from '@/lib/acquisition/engine/repository';
import { fetchGa4AcquisitionMetrics } from '@/lib/acquisition/sources/ga4';
import { fetchMetaPixelStatus } from '@/lib/acquisition/sources/metaPixel';
import { fetchGscAcquisitionMetrics } from '@/lib/acquisition/sources/searchConsole';
import { fetchStripeAcquisitionMetrics } from '@/lib/acquisition/sources/stripe';
import { fetchSupabaseAcquisitionMetrics } from '@/lib/acquisition/sources/supabase';
import { getPerformanceLoopStatus } from '@/lib/acquisition/performance-loop';
import { fetchAcqCrmFunnel } from '@/lib/acquisition/sources/acq-crm';
import { getMetaLiveReadiness } from '@/lib/acquisition/providers/meta-live';
import { summarizeAdsPerformance } from '@/lib/acquisition/ads/repository';
import type {
  AcquisitionChannel,
  AcquisitionKpi,
  AcquisitionOverview,
  FunnelStep,
  PerformanceHookRow,
  SourceError,
} from '@/lib/acquisition/types';

function pct(part: number, whole: number): number | null {
  if (!whole) return null;
  return Math.round((part / whole) * 1000) / 10;
}

function formatEur(n: number | null): string {
  if (n == null) return '—';
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
}

function formatNum(n: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR');
}

function formatPct(n: number | null): string {
  if (n == null) return '—';
  return `${n} %`;
}

function buildSteps(params: {
  reach: number | null;
  clicks: number | null;
  trials: number | null;
  paid: number | null;
  retentionValue: number | null;
  retentionRate: number | null;
}): FunnelStep[] {
  const { reach, clicks, trials, paid, retentionValue, retentionRate } = params;
  return [
    { id: 'reach', label: 'Portée', value: reach ?? 0, rateFromPrevious: null },
    {
      id: 'clicks',
      label: 'Clics / intérêt',
      value: clicks ?? 0,
      rateFromPrevious: pct(clicks ?? 0, reach ?? 0),
    },
    {
      id: 'trial',
      label: 'Essais 7j',
      value: trials ?? 0,
      rateFromPrevious: pct(trials ?? 0, clicks ?? 0),
    },
    {
      id: 'paid',
      label: 'Payant',
      value: paid ?? 0,
      rateFromPrevious: pct(paid ?? 0, trials ?? 0),
    },
    {
      id: 'retention',
      label: 'Rétention 90j',
      value: retentionValue != null ? Math.round(retentionValue) : 0,
      rateFromPrevious: retentionRate,
    },
  ];
}

async function loadPerformanceHooks(): Promise<PerformanceHookRow[]> {
  const rows: PerformanceHookRow[] = [];

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('post_metrics')
      .select('id, hook, reach, saved, format, pilier, fetched_at')
      .not('hook', 'is', null)
      .order('saved', { ascending: false, nullsFirst: false })
      .limit(20);
    if (!error && data?.length) {
      for (const row of data) {
        const saves = row.saved ?? null;
        const reach = row.reach ?? null;
        const score =
          saves != null && reach != null && reach > 0 ? Math.round((saves / reach) * 10000) / 100 : saves;
        rows.push({
          id: String(row.id),
          hook: String(row.hook ?? ''),
          channel: 'instagram',
          saves,
          reach,
          conversions: null,
          score,
          pilier: row.pilier ? String(row.pilier) : null,
          format: row.format ? String(row.format) : null,
        });
      }
    }
  } catch {
    // table absente — on continue
  }

  const bank = await loadHooksBank();
  const top = topHooksForFewShot(bank, 'fr', 10);
  for (const entry of top) {
    if (rows.some((r) => r.hook === entry.text)) continue;
    rows.push({
      id: `bank-${entry.date}-${entry.text.slice(0, 20)}`,
      hook: entry.text,
      channel: 'instagram',
      saves: null,
      reach: null,
      conversions: null,
      score: entry.score,
      pilier: entry.pillarId ? String(entry.pillarId) : null,
      format: entry.format ? String(entry.format) : null,
    });
  }

  return rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 15);
}

export async function buildAcquisitionOverview(
  channel: AcquisitionChannel | 'all' = 'all',
): Promise<AcquisitionOverview> {
  const sourceErrors: SourceError[] = [];
  const [ga4, gsc, stripe, supa, pixel, schemaReady, acqCrm, metaLive, performanceLoop, followups, adsPerf] =
    await Promise.all([
      fetchGa4AcquisitionMetrics(),
      fetchGscAcquisitionMetrics(),
      fetchStripeAcquisitionMetrics(),
      fetchSupabaseAcquisitionMetrics(),
      fetchMetaPixelStatus(),
      isAcquisitionSchemaReady(),
      fetchAcqCrmFunnel(channel),
      getMetaLiveReadiness(),
      getPerformanceLoopStatus(),
      listUpcomingFollowups(12),
      summarizeAdsPerformance(),
    ]);

  if (!ga4.ok) sourceErrors.push({ provider: ga4.provider, error: ga4.error });
  if (!gsc.ok) sourceErrors.push({ provider: gsc.provider, error: gsc.error });
  if (!stripe.ok) sourceErrors.push({ provider: stripe.provider, error: stripe.error });
  if (!supa.ok) sourceErrors.push({ provider: supa.provider, error: supa.error });
  if (!pixel.ok) sourceErrors.push({ provider: pixel.provider, error: pixel.error });

  // —— Parcours site (jamais écrasé par le CRM) ——
  const siteReach =
    channel === 'blog_seo'
      ? gsc.ok
        ? gsc.data.clicks
        : null
      : channel === 'referral'
        ? stripe.ok
          ? stripe.data.referralConversions30d
          : null
        : ga4.ok
          ? ga4.data.sessions
          : null;

  const siteClicks =
    channel === 'blog_seo'
      ? gsc.ok
        ? gsc.data.clicks
        : null
      : ga4.ok
        ? ga4.data.trialClicks
        : null;

  const siteTrials = stripe.ok ? stripe.data.activeTrials : supa.ok ? supa.data.trialingCount : null;
  const sitePaid = stripe.ok ? stripe.data.activePaid : supa.ok ? supa.data.paidCount : null;
  const siteRetentionRate = supa.ok ? supa.data.retention90d : null;

  const siteFunnel = buildSteps({
    reach: siteReach,
    clicks: siteClicks,
    trials: siteTrials,
    paid: sitePaid,
    retentionValue: siteRetentionRate,
    retentionRate: siteRetentionRate,
  });

  // —— Pipeline CRM ——
  const crmContacts = acqCrm.ok ? acqCrm.data.contacts : 0;
  const crmInterest = acqCrm.ok ? acqCrm.data.qualified + acqCrm.data.trial : 0;
  const crmTrial = acqCrm.ok ? acqCrm.data.trial : 0;
  const crmPaid = acqCrm.ok ? acqCrm.data.paid + acqCrm.data.member : 0;
  const crmMember = acqCrm.ok ? acqCrm.data.member : 0;
  const crmHot = acqCrm.ok ? acqCrm.data.hotLeads : 0;
  const crmAvgScore = acqCrm.ok ? acqCrm.data.avgLeadScore : null;

  const crmFunnel = buildSteps({
    reach: crmContacts,
    clicks: crmInterest,
    trials: crmTrial,
    paid: crmPaid,
    retentionValue: crmMember,
    retentionRate: pct(crmMember, crmPaid || crmContacts),
  });

  const trialToPaid = stripe.ok ? stripe.data.trialToPaidRate : null;
  const arpu = stripe.ok ? stripe.data.arpuEur : null;
  const ltv = stripe.ok ? stripe.data.ltvEur : null;
  const churn = stripe.ok ? stripe.data.monthlyChurnRate : null;
  const referral = stripe.ok ? stripe.data.referralConversions30d : null;
  const sampleTooSmall = (sitePaid ?? 0) + (siteTrials ?? 0) < 10;

  const kpis: AcquisitionKpi[] = [
    {
      id: 'hot_leads',
      label: 'Leads chauds (score ≥40)',
      value: formatNum(crmHot),
      hint: 'Contacts CRM prêts à convertir (inbox + tags + e-mail).',
      tone: crmHot > 0 ? 'good' : 'watch',
    },
    {
      id: 'avg_score',
      label: 'Score lead moyen',
      value: crmAvgScore != null ? String(crmAvgScore) : '—',
      hint: '0–100 · engagement DM, e-mail, booking, Stripe.',
    },
    {
      id: 'arpu',
      label: 'ARPU mensuel',
      value: formatEur(arpu),
      hint: 'Moyenne price_cents des abonnées actives (Stripe réel).',
      tone: 'good',
    },
    {
      id: 'ltv',
      label: sampleTooSmall ? 'LTV (échantillon trop faible)' : 'LTV estimée',
      value: sampleTooSmall ? `${formatEur(ltv)} · n<10` : formatEur(ltv),
      hint:
        sampleTooSmall
          ? 'Estimation — moins de 10 abonnées : chiffre non décisionnel.'
          : churn != null && churn > 0
            ? `Estimation : ARPU ÷ churn ${churn} % (business_stats_daily).`
            : 'Estimation : ARPU × 12 mois (churn indisponible).',
    },
    {
      id: 'churn',
      label: sampleTooSmall ? 'Churn 30j (échantillon trop faible)' : 'Churn 30j',
      value: sampleTooSmall ? `${formatPct(churn)} · n<10` : formatPct(churn),
      hint: sampleTooSmall
        ? 'Estimation — n trop faible pour interpréter un %.'
        : 'business_stats_daily.churn_rate_30d',
      tone: churn != null && churn > 8 ? 'watch' : 'neutral',
    },
    {
      id: 'trial_paid',
      label: 'Essai → Payant (estimation)',
      value: trialToPaid == null ? '—' : `${formatPct(trialToPaid)} · proxy`,
      hint:
        'Proxy stock (pas une attribution Acquisition). Les payantes Stripe préexistantes ne sont PAS des conversions du module.',
      tone: 'watch',
    },
    {
      id: 'referral',
      label: 'Parrainage (30j)',
      value: formatNum(referral),
      hint: 'Filleules passées en subscribed.',
    },
    {
      id: 'trials',
      label: 'Essais actifs (Stripe)',
      value: formatNum(siteTrials),
      hint: 'Réel — abonnements status=trialing.',
    },
    {
      id: 'paid',
      label: 'Payantes totales (Stripe)',
      value: formatNum(sitePaid),
      hint: 'Réel — stock Stripe active (pas « conversions Acquisition »).',
      tone: 'good',
    },
    {
      id: 'crm_contacts',
      label: 'Contacts CRM',
      value: formatNum(crmContacts),
      hint: 'Pipeline Acquisition (DM / inbox).',
    },
    {
      id: 'ads_cpl',
      label: adsPerf.connected ? 'CPL Ads (30 j)' : 'CPL Ads',
      value: adsPerf.connected
        ? adsPerf.cplCents != null
          ? formatEur(adsPerf.cplCents / 100)
          : '—'
        : 'En attente Meta Ads',
      hint: adsPerf.connected
        ? 'Réel — dépense Ads ÷ leads (ad_metrics_daily).'
        : adsPerf.waitingMessage ?? 'En attente connexion Meta Ads — pas de chiffre inventé.',
      tone: adsPerf.connected ? 'neutral' : 'watch',
    },
    {
      id: 'ads_cac',
      label: adsPerf.connected ? 'CAC Ads (30 j)' : 'CAC Ads',
      value: adsPerf.connected
        ? adsPerf.cacCents != null
          ? formatEur(adsPerf.cacCents / 100)
          : '—'
        : 'En attente Meta Ads',
      hint: adsPerf.connected
        ? 'Réel — dépense Ads ÷ conversions payantes trackées.'
        : 'Voir onglet ADS / Publicité · docs/ADS-SETUP.md',
      tone: adsPerf.connected ? 'neutral' : 'watch',
    },
  ];

  // Rétention site : étiqueter proxy dans le funnel
  const siteFunnelLabeled = siteFunnel.map((step) =>
    step.id === 'retention'
      ? {
          ...step,
          label: sampleTooSmall ? 'Rétention 90j (estimation, n faible)' : 'Rétention 90j (estimation)',
        }
      : step,
  );

  const performanceHooks = await loadPerformanceHooks();

  return {
    channel,
    funnel: crmFunnel,
    siteFunnel: siteFunnelLabeled,
    crmFunnel,
    kpis,
    performanceHooks,
    sourceErrors,
    schemaReady,
    messagingMode: getMessagingMode(),
    upcomingFollowups: followups.ok ? followups.items : [],
    metaLiveReadiness: metaLive,
    performanceLoop,
  };
}
