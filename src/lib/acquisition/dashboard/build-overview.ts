import { loadHooksBank, topHooksForFewShot } from '@/lib/admin/social-hooks-bank';
import { createAdminClient } from '@/lib/supabase/admin';

import { getMessagingMode } from '@/lib/acquisition/feature-flag';
import { isAcquisitionSchemaReady } from '@/lib/acquisition/db';
import { fetchGa4AcquisitionMetrics } from '@/lib/acquisition/sources/ga4';
import { fetchMetaPixelStatus } from '@/lib/acquisition/sources/metaPixel';
import { fetchGscAcquisitionMetrics } from '@/lib/acquisition/sources/searchConsole';
import { fetchStripeAcquisitionMetrics } from '@/lib/acquisition/sources/stripe';
import { fetchSupabaseAcquisitionMetrics } from '@/lib/acquisition/sources/supabase';
import { fetchAcqCrmFunnel } from '@/lib/acquisition/sources/acq-crm';
import { getMetaLiveReadiness } from '@/lib/acquisition/providers/meta-live';
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

async function loadPerformanceHooks(): Promise<PerformanceHookRow[]> {
  const rows: PerformanceHookRow[] = [];

  // 1) Table post_metrics si migration appliquée
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
        const score = saves != null && reach != null && reach > 0 ? Math.round((saves / reach) * 10000) / 100 : saves;
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

  // 2) Banque hooks CM (admin_settings)
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

  return rows
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 15);
}

export async function buildAcquisitionOverview(
  channel: AcquisitionChannel | 'all' = 'all',
): Promise<AcquisitionOverview> {
  const sourceErrors: SourceError[] = [];
  const [ga4, gsc, stripe, supa, pixel, schemaReady, acqCrm, metaLive] = await Promise.all([
    fetchGa4AcquisitionMetrics(),
    fetchGscAcquisitionMetrics(),
    fetchStripeAcquisitionMetrics(),
    fetchSupabaseAcquisitionMetrics(),
    fetchMetaPixelStatus(),
    isAcquisitionSchemaReady(),
    fetchAcqCrmFunnel(channel),
    getMetaLiveReadiness(),
  ]);

  if (!ga4.ok) sourceErrors.push({ provider: ga4.provider, error: ga4.error });
  if (!gsc.ok) sourceErrors.push({ provider: gsc.provider, error: gsc.error });
  if (!stripe.ok) sourceErrors.push({ provider: stripe.provider, error: stripe.error });
  if (!supa.ok) sourceErrors.push({ provider: supa.provider, error: supa.error });
  if (!pixel.ok) sourceErrors.push({ provider: pixel.provider, error: pixel.error });

  const reach =
    acqCrm.ok && acqCrm.data.contacts > 0
      ? acqCrm.data.contacts
      : channel === 'blog_seo'
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

  const clicks =
    acqCrm.ok && acqCrm.data.contacts > 0
      ? acqCrm.data.qualified + acqCrm.data.trial
      : channel === 'blog_seo'
        ? gsc.ok
          ? gsc.data.clicks
          : null
        : ga4.ok
          ? ga4.data.trialClicks
          : null;

  const trials =
    acqCrm.ok && acqCrm.data.contacts > 0
      ? acqCrm.data.trial
      : stripe.ok
        ? stripe.data.activeTrials
        : supa.ok
          ? supa.data.trialingCount
          : null;
  const paid =
    acqCrm.ok && acqCrm.data.contacts > 0
      ? acqCrm.data.paid + acqCrm.data.member
      : stripe.ok
        ? stripe.data.activePaid
        : supa.ok
          ? supa.data.paidCount
          : null;
  const retention = supa.ok ? supa.data.retention90d : null;

  const funnel: FunnelStep[] = [
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
      value: retention != null ? Math.round(retention) : 0,
      rateFromPrevious: retention,
    },
  ];

  const trialToPaid = stripe.ok ? stripe.data.trialToPaidRate : null;
  const arpu = stripe.ok ? stripe.data.arpuEur : null;
  const ltv = stripe.ok ? stripe.data.ltvEur : null;
  const churn = stripe.ok ? stripe.data.monthlyChurnRate : null;
  const referral = stripe.ok ? stripe.data.referralConversions30d : null;

  const kpis: AcquisitionKpi[] = [
    {
      id: 'cac',
      label: 'CAC',
      value: '—',
      hint: 'Non calculable sans budget publicitaire branché. Suivre le coût organique via le CRM.',
      tone: 'neutral',
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
      label: 'LTV estimée',
      value: formatEur(ltv),
      hint:
        churn != null && churn > 0
          ? `ARPU ÷ churn ${churn} % (business_stats_daily).`
          : 'ARPU × 12 mois (churn indisponible).',
    },
    {
      id: 'churn',
      label: 'Churn 30j',
      value: formatPct(churn),
      tone: churn != null && churn > 8 ? 'watch' : 'neutral',
    },
    {
      id: 'trial_paid',
      label: 'Essai → Payant',
      value: formatPct(trialToPaid),
      tone: trialToPaid != null && trialToPaid >= 25 ? 'good' : 'watch',
    },
    {
      id: 'referral',
      label: 'Parrainage (30j)',
      value: formatNum(referral),
      hint: 'Filleules passées en subscribed.',
    },
    {
      id: 'trials',
      label: 'Essais actifs',
      value: formatNum(trials),
    },
    {
      id: 'paid',
      label: 'Payantes actives',
      value: formatNum(paid),
      tone: 'good',
    },
  ];

  const performanceHooks = await loadPerformanceHooks();

  return {
    channel,
    funnel,
    kpis,
    performanceHooks,
    sourceErrors,
    schemaReady,
    messagingMode: getMessagingMode(),
    metaLiveReadiness: metaLive,
  };
}
