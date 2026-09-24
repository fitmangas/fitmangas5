import { createAdminClient } from '@/lib/supabase/admin';

import type {
  AdCampaign,
  AdCampaignObjective,
  AdCampaignStatus,
  AdChannel,
  AdCreative,
  AdMetricsDaily,
  AdsPerformanceSummary,
} from './config';
import { getAdsConnectionState } from './config';
import { ADS_COPY_ANGLES } from './strategy-content';

function mapCampaign(row: Record<string, unknown>): AdCampaign {
  return {
    id: String(row.id),
    channel: row.channel as AdChannel,
    name: String(row.name),
    objective: row.objective as AdCampaignObjective,
    status: row.status as AdCampaignStatus,
    dailyBudgetCents: row.daily_budget_cents != null ? Number(row.daily_budget_cents) : null,
    currency: String(row.currency ?? 'EUR'),
    metaCampaignId: row.meta_campaign_id ? String(row.meta_campaign_id) : null,
    metaAdsetId: row.meta_adset_id ? String(row.meta_adset_id) : null,
    metaAdId: row.meta_ad_id ? String(row.meta_ad_id) : null,
    notes: row.notes ? String(row.notes) : null,
    activatedAt: row.activated_at ? String(row.activated_at) : null,
    createdAt: String(row.created_at),
  };
}

function mapCreative(row: Record<string, unknown>): AdCreative {
  return {
    id: String(row.id),
    channel: row.channel as AdCreative['channel'],
    title: String(row.title),
    angle: String(row.angle),
    copyFr: String(row.copy_fr),
    copyEs: String(row.copy_es),
    mediaPath: row.media_path ? String(row.media_path) : null,
    mediaKind: (row.media_kind as AdCreative['mediaKind']) ?? 'image',
    campaignObjective: (row.campaign_objective as AdCampaignObjective) ?? null,
    complianceNotes: row.compliance_notes ? String(row.compliance_notes) : null,
  };
}

export async function isAdsSchemaReady(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('ad_campaigns').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function listAdCampaigns(): Promise<{ ok: true; items: AdCampaign[] } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('ad_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return { ok: false, error: error.message };
  return { ok: true, items: (data ?? []).map((r) => mapCampaign(r as Record<string, unknown>)) };
}

export async function listAdCreatives(): Promise<{ ok: true; items: AdCreative[] } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('ad_creatives')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) return { ok: false, error: error.message };
  return { ok: true, items: (data ?? []).map((r) => mapCreative(r as Record<string, unknown>)) };
}

/** Seed angles copy si table vide (idempotent). */
export async function ensureAdCreativeSeed(): Promise<{ upserted: number }> {
  const ready = await isAdsSchemaReady();
  if (!ready) return { upserted: 0 };
  const existing = await listAdCreatives();
  if (existing.ok && existing.items.length > 0) return { upserted: 0 };

  const admin = createAdminClient();
  const rows = ADS_COPY_ANGLES.map((a) => ({
    channel: 'meta',
    title: a.angle,
    angle: a.id,
    copy_fr: a.copyFr,
    copy_es: a.copyEs,
    media_path: a.mediaHint,
    media_kind: 'image',
    campaign_objective: a.objective,
    compliance_notes: 'complianceNotes' in a ? (a as { complianceNotes?: string }).complianceNotes ?? null : null,
    active: true,
  }));
  const { data, error } = await admin.from('ad_creatives').insert(rows).select('id');
  if (error) {
    console.error('[ads] seed creatives', error.message);
    return { upserted: 0 };
  }
  return { upserted: data?.length ?? 0 };
}

export async function insertDraftCampaign(params: {
  channel: AdChannel;
  name: string;
  objective: AdCampaignObjective;
  dailyBudgetCents: number;
  metaCampaignId?: string | null;
  notes?: string;
}): Promise<{ ok: true; campaign: AdCampaign } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('ad_campaigns')
    .insert({
      channel: params.channel,
      name: params.name,
      objective: params.objective,
      status: 'draft',
      daily_budget_cents: params.dailyBudgetCents,
      meta_campaign_id: params.metaCampaignId ?? null,
      notes: params.notes ?? null,
    })
    .select('*')
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? 'Insert campagne échoué.' };
  return { ok: true, campaign: mapCampaign(data as Record<string, unknown>) };
}

export async function markCampaignActive(params: {
  id: string;
  activatedBy?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('ad_campaigns')
    .update({
      status: 'active',
      activated_at: new Date().toISOString(),
      activated_by: params.activatedBy ?? 'admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getCampaignById(
  id: string,
): Promise<{ ok: true; campaign: AdCampaign } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.from('ad_campaigns').select('*').eq('id', id).maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? 'Campagne introuvable.' };
  return { ok: true, campaign: mapCampaign(data as Record<string, unknown>) };
}

export async function upsertDailyMetricsFromInsights(
  rows: Array<{
    campaignId: string;
    metricDate: string;
    spendCents: number;
    impressions: number;
    clicks: number;
    leads: number;
    ctr: number | null;
    cplCents: number | null;
  }>,
): Promise<void> {
  if (!rows.length) return;
  const admin = createAdminClient();
  for (const r of rows) {
    await admin.from('ad_metrics_daily').upsert(
      {
        campaign_id: r.campaignId,
        metric_date: r.metricDate,
        spend_cents: r.spendCents,
        impressions: r.impressions,
        clicks: r.clicks,
        leads: r.leads,
        ctr: r.ctr,
        cpl_cents: r.cplCents,
      },
      { onConflict: 'campaign_id,metric_date' },
    );
  }
}

export async function summarizeAdsPerformance(): Promise<AdsPerformanceSummary> {
  const state = getAdsConnectionState();
  if (!state.connected) {
    return {
      connected: false,
      spendCents: null,
      leads: null,
      impressions: null,
      clicks: null,
      cplCents: null,
      cacCents: null,
      costPerTrialCents: null,
      waitingMessage: state.message,
    };
  }

  const ready = await isAdsSchemaReady();
  if (!ready) {
    return {
      connected: false,
      spendCents: null,
      leads: null,
      impressions: null,
      clicks: null,
      cplCents: null,
      cacCents: null,
      costPerTrialCents: null,
      waitingMessage: 'Tables Ads absentes — migration requise.',
    };
  }

  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString().slice(0, 10);

  const { data, error } = await admin
    .from('ad_metrics_daily')
    .select('spend_cents, leads, impressions, clicks, trial_starts, paid_conversions')
    .gte('metric_date', sinceIso);

  if (error) {
    return {
      connected: true,
      spendCents: null,
      leads: null,
      impressions: null,
      clicks: null,
      cplCents: null,
      cacCents: null,
      costPerTrialCents: null,
      waitingMessage: `Erreur lecture metrics : ${error.message}`,
    };
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return {
      connected: true,
      spendCents: 0,
      leads: 0,
      impressions: 0,
      clicks: 0,
      cplCents: null,
      cacCents: null,
      costPerTrialCents: null,
      waitingMessage: 'Connecté — aucune métrique syncée sur 30 j (lancer sync insights).',
    };
  }

  const spend = rows.reduce((s, r) => s + Number(r.spend_cents ?? 0), 0);
  const leads = rows.reduce((s, r) => s + Number(r.leads ?? 0), 0);
  const impressions = rows.reduce((s, r) => s + Number(r.impressions ?? 0), 0);
  const clicks = rows.reduce((s, r) => s + Number(r.clicks ?? 0), 0);
  const trials = rows.reduce((s, r) => s + Number(r.trial_starts ?? 0), 0);
  const paid = rows.reduce((s, r) => s + Number(r.paid_conversions ?? 0), 0);

  return {
    connected: true,
    spendCents: spend,
    leads,
    impressions,
    clicks,
    cplCents: leads > 0 ? Math.round(spend / leads) : null,
    cacCents: paid > 0 ? Math.round(spend / paid) : null,
    costPerTrialCents: trials > 0 ? Math.round(spend / trials) : null,
    waitingMessage: null,
  };
}

export async function listRecentMetrics(limit = 14): Promise<AdMetricsDaily[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('ad_metrics_daily')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    campaignId: String(row.campaign_id),
    metricDate: String(row.metric_date),
    spendCents: Number(row.spend_cents ?? 0),
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    leads: Number(row.leads ?? 0),
    trialStarts: Number(row.trial_starts ?? 0),
    paidConversions: Number(row.paid_conversions ?? 0),
    ctr: row.ctr != null ? Number(row.ctr) : null,
    cplCents: row.cpl_cents != null ? Number(row.cpl_cents) : null,
    cacCents: row.cac_cents != null ? Number(row.cac_cents) : null,
  }));
}
