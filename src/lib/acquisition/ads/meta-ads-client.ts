/**
 * Client Meta Marketing API — lecture insights + écriture brouillons.
 * GARDE-FOU : status ACTIVE jamais sans confirmation humaine (couche actions).
 */

import {
  getAdsConnectionState,
  getMetaAdsConfig,
  isMetaAdsEnabled,
  type AdsConnectionState,
} from './config';

const GRAPH = 'https://graph.facebook.com/v21.0';

export type MetaCampaignInsight = {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  ctr: number | null;
  cpl: number | null;
};

export type MetaInsightsResult =
  | { ok: true; connected: true; insights: MetaCampaignInsight[]; rawNote?: string }
  | { ok: true; connected: false; insights: []; message: string; state: AdsConnectionState }
  | { ok: false; error: string; state: AdsConnectionState };

async function graphGet(
  path: string,
  params: Record<string, string>,
): Promise<{ ok: true; json: unknown } | { ok: false; error: string }> {
  const cfg = getMetaAdsConfig();
  if (!cfg.accessToken) return { ok: false, error: 'Token Meta Ads absent.' };
  const url = new URL(`${GRAPH}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', cfg.accessToken);
  try {
    const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
    const text = await res.text();
    let json: unknown = {};
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, error: `Réponse Meta non-JSON (${res.status})` };
    }
    if (!res.ok) {
      const err = json as { error?: { message?: string } };
      return { ok: false, error: err.error?.message ?? `Meta HTTP ${res.status}` };
    }
    return { ok: true, json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau Meta' };
  }
}

async function graphPost(
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; json: unknown } | { ok: false; error: string }> {
  const cfg = getMetaAdsConfig();
  if (!cfg.accessToken) return { ok: false, error: 'Token Meta Ads absent.' };
  const url = new URL(`${GRAPH}${path}`);
  url.searchParams.set('access_token', cfg.accessToken);
  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: unknown = {};
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, error: `Réponse Meta non-JSON (${res.status})` };
    }
    if (!res.ok) {
      const err = json as { error?: { message?: string } };
      return { ok: false, error: err.error?.message ?? `Meta HTTP ${res.status}` };
    }
    return { ok: true, json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau Meta' };
  }
}

function parseLeadActions(actions: Array<{ action_type?: string; value?: string }> | undefined): number {
  if (!actions?.length) return 0;
  let n = 0;
  for (const a of actions) {
    if (
      a.action_type === 'lead' ||
      a.action_type === 'onsite_conversion.lead_grouped' ||
      a.action_type === 'offsite_conversion.fb_pixel_lead'
    ) {
      n += Number(a.value ?? 0) || 0;
    }
  }
  return n;
}

/** Lecture insights — jamais inventée. */
export async function fetchMetaAdsInsights(params?: {
  datePreset?: string;
}): Promise<MetaInsightsResult> {
  const state = getAdsConnectionState();
  if (!state.enabledFlag || !state.configured) {
    return {
      ok: true,
      connected: false,
      insights: [],
      message: state.message,
      state,
    };
  }

  const cfg = getMetaAdsConfig();
  const accountId = cfg.adAccountId!;
  const datePreset = params?.datePreset ?? 'last_7d';

  const res = await graphGet(`/${accountId}/insights`, {
    level: 'campaign',
    fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,actions',
    date_preset: datePreset,
    limit: '50',
  });

  if (!res.ok) {
    return { ok: false, error: res.error, state };
  }

  const data = res.json as {
    data?: Array<{
      campaign_id?: string;
      campaign_name?: string;
      spend?: string;
      impressions?: string;
      clicks?: string;
      ctr?: string;
      actions?: Array<{ action_type?: string; value?: string }>;
    }>;
  };

  const insights: MetaCampaignInsight[] = (data.data ?? []).map((row) => {
    const spend = Number(row.spend ?? 0) || 0;
    const leads = parseLeadActions(row.actions);
    return {
      campaignId: String(row.campaign_id ?? ''),
      campaignName: String(row.campaign_name ?? 'Campagne'),
      spend,
      impressions: Number(row.impressions ?? 0) || 0,
      clicks: Number(row.clicks ?? 0) || 0,
      leads,
      ctr: row.ctr != null ? Number(row.ctr) : null,
      cpl: leads > 0 ? Math.round((spend / leads) * 100) / 100 : null,
    };
  });

  return { ok: true, connected: true, insights };
}

export type DraftCampaignSpec = {
  name: string;
  /** Toujours PAUSED à la création. */
  dailyBudgetCents: number;
  objectiveApi?: string;
};

/**
 * Crée une campagne Meta EN BROUILLON (status PAUSED).
 * Refuse si flag OFF ou config incomplète.
 */
export async function createMetaCampaignDraft(
  spec: DraftCampaignSpec,
): Promise<{ ok: true; campaignId: string } | { ok: false; error: string }> {
  if (!isMetaAdsEnabled()) {
    return { ok: false, error: 'META_ADS_ENABLED=OFF — création Meta refusée.' };
  }
  const state = getAdsConnectionState();
  if (!state.configured) {
    return { ok: false, error: state.blockers.join(' · ') || 'Config Meta Ads incomplète.' };
  }
  if (spec.dailyBudgetCents < 100) {
    return { ok: false, error: 'Budget quotidien minimum 1,00 € (en brouillon).' };
  }

  const cfg = getMetaAdsConfig();
  const res = await graphPost(`/${cfg.adAccountId}/campaigns`, {
    name: spec.name,
    objective: spec.objectiveApi ?? 'OUTCOME_LEADS',
    status: 'PAUSED',
    special_ad_categories: [],
    daily_budget: String(spec.dailyBudgetCents),
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
  });

  if (!res.ok) return { ok: false, error: res.error };
  const json = res.json as { id?: string };
  if (!json.id) return { ok: false, error: 'Meta n’a pas renvoyé d’ID campagne.' };
  return { ok: true, campaignId: json.id };
}

/**
 * Activation PAUSED → ACTIVE — UNIQUEMENT après double confirmation UI.
 * Le code refuse si confirmBudgetCents ne matche pas ou si flag OFF.
 */
export async function activateMetaCampaign(params: {
  metaCampaignId: string;
  confirmBudgetCents: number;
  expectedDailyBudgetCents: number;
  humanConfirmedTwice: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!params.humanConfirmedTwice) {
    return { ok: false, error: 'Double confirmation humaine obligatoire.' };
  }
  if (params.confirmBudgetCents !== params.expectedDailyBudgetCents) {
    return {
      ok: false,
      error: `Budget confirmé (${params.confirmBudgetCents} cts) ≠ budget annoncé (${params.expectedDailyBudgetCents} cts).`,
    };
  }
  if (params.expectedDailyBudgetCents < 500) {
    return { ok: false, error: 'Budget quotidien minimum pour activer : 5,00 € (garde-fou).' };
  }
  if (!isMetaAdsEnabled()) {
    return { ok: false, error: 'META_ADS_ENABLED=OFF — activation refusée.' };
  }

  const res = await graphPost(`/${params.metaCampaignId}`, {
    status: 'ACTIVE',
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}
