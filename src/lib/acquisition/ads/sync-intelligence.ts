/**
 * Sync Ads + organique → snapshots datés (tendances).
 * Lecture seule Meta ; jamais d’activation de campagne.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { getMetaSocialConnection } from '@/lib/admin/social-comms';
import { getAdsConnectionState, getMetaAdsConfig, isMetaAdsEnabled } from './config';
import { listAdCampaigns, upsertDailyMetricsFromInsights } from './repository';

const GRAPH = 'https://graph.facebook.com/v21.0';

const INSIGHT_FIELDS =
  'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,actions,inline_link_clicks,video_thruplay_watched_actions';

export type CapabilityProbe = {
  id: string;
  label: string;
  accessible: boolean;
  missingPermission: string | null;
  note: string;
};

export type SyncIntelligenceResult = {
  ok: boolean;
  source: 'cron' | 'manual' | 'probe';
  ranAt: string;
  adsOk: boolean;
  organicOk: boolean;
  detail: {
    insightsRows: number;
    breakdownRows: number;
    organicMedia: number;
    organicAccount: boolean;
    capabilities: CapabilityProbe[];
    errors: string[];
  };
};

function todayParis(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
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

function thruplayCount(
  actions: Array<{ action_type?: string; value?: string }> | undefined,
): number {
  if (!actions?.length) return 0;
  let n = 0;
  for (const a of actions) {
    if (a.action_type === 'video_view' || a.action_type?.includes('thruplay')) {
      n += Number(a.value ?? 0) || 0;
    }
  }
  return n;
}

async function adsGraphGet(
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
      const err = json as { error?: { message?: string; code?: number; error_subcode?: number } };
      return { ok: false, error: err.error?.message ?? `Meta HTTP ${res.status}` };
    }
    return { ok: true, json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau Meta' };
  }
}

async function pageGraphGet(
  path: string,
  token: string,
  params: Record<string, string>,
): Promise<{ ok: true; json: unknown } | { ok: false; error: string; code?: number }> {
  const url = new URL(`${GRAPH}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  try {
    const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
    const json = (await res.json()) as {
      error?: { message?: string; code?: number; error_subcode?: number };
    };
    if (!res.ok) {
      return {
        ok: false,
        error: json.error?.message ?? `Meta HTTP ${res.status}`,
        code: json.error?.code,
      };
    }
    return { ok: true, json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau Meta' };
  }
}

function scoreOrganic(row: {
  like_count: number;
  comments_count: number;
  reach: number | null;
  views: number | null;
  saved: number | null;
  shares: number | null;
}): number {
  const likes = row.like_count;
  const comments = row.comments_count;
  const reach = row.reach ?? 0;
  const views = row.views ?? 0;
  const saved = row.saved ?? 0;
  const shares = row.shares ?? 0;
  // Engagement de base toujours dispo ; insights pondérés si présents.
  return (
    likes * 1 +
    comments * 3 +
    saved * 5 +
    shares * 6 +
    Math.min(views, 50_000) * 0.02 +
    Math.min(reach, 50_000) * 0.01
  );
}

export function buildStaticCapabilities(params: {
  adsConfigured: boolean;
  adsInsightsOk: boolean;
  adsBreakdownOk: boolean;
  igListOk: boolean;
  igInsightsOk: boolean;
  igAccountInsightsOk: boolean;
  igInsightsError?: string | null;
}): CapabilityProbe[] {
  const igMissing =
    params.igInsightsOk || params.igAccountInsightsOk
      ? null
      : 'instagram_manage_insights (Page token / System User lié à la Page IG)';

  return [
    {
      id: 'ads_insights_levels',
      label: 'Ads Insights compte / campagne / adset / ad',
      accessible: params.adsConfigured && params.adsInsightsOk,
      missingPermission: params.adsConfigured ? null : 'META_ADS_ACCESS_TOKEN + ads_read',
      note: params.adsInsightsOk
        ? 'Lecture OK (zéros si aucun spend).'
        : 'Token Ads ou Ad Account manquant / erreur API.',
    },
    {
      id: 'ads_breakdowns',
      label: 'Breakdowns âge / genre / plateforme / pays / heure',
      accessible: params.adsConfigured && params.adsBreakdownOk,
      missingPermission: params.adsConfigured ? null : 'ads_read',
      note: 'platform_position + actions = combo API invalide — non utilisée.',
    },
    {
      id: 'organic_media_list',
      label: 'Liste médias IG (likes / commentaires)',
      accessible: params.igListOk,
      missingPermission: params.igListOk ? null : 'Page token + IG User ID (meta_social_connection)',
      note: 'Engagement de surface toujours lisible si Page connectée.',
    },
    {
      id: 'organic_media_insights',
      label: 'Insights média IG (reach, views, saves, shares)',
      accessible: params.igInsightsOk,
      missingPermission: igMissing,
      note: params.igInsightsError ?? (params.igInsightsOk ? 'OK' : 'Scope manquant — likes/comments seuls.'),
    },
    {
      id: 'organic_account_insights',
      label: 'Insights compte IG (vues profil, portée, clics bio)',
      accessible: params.igAccountInsightsOk,
      missingPermission: igMissing,
      note: 'followers_count via /{ig-user-id} sans insights ; métriques profil = scope insights.',
    },
  ];
}

type InsightRow = {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  frequency?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: Array<{ action_type?: string; value?: string }>;
  inline_link_clicks?: string;
  video_thruplay_watched_actions?: Array<{ action_type?: string; value?: string }>;
  date_start?: string;
};

function mapInsightToDaily(
  level: 'account' | 'campaign' | 'adset' | 'ad',
  row: InsightRow,
  metricDate: string,
): Record<string, unknown> {
  const spend = Number(row.spend ?? 0) || 0;
  const leads = parseLeadActions(row.actions);
  const entityId =
    level === 'account'
      ? 'account'
      : level === 'campaign'
        ? String(row.campaign_id ?? 'unknown')
        : level === 'adset'
          ? String(row.adset_id ?? 'unknown')
          : String(row.ad_id ?? 'unknown');
  const entityName =
    level === 'account'
      ? 'Compte Ads'
      : level === 'campaign'
        ? String(row.campaign_name ?? '')
        : level === 'adset'
          ? String(row.adset_name ?? '')
          : String(row.ad_name ?? '');

  return {
    metric_date: row.date_start ?? metricDate,
    level,
    entity_id: entityId,
    entity_name: entityName,
    spend_cents: Math.round(spend * 100),
    impressions: Number(row.impressions ?? 0) || 0,
    reach: Number(row.reach ?? 0) || 0,
    frequency: row.frequency != null ? Number(row.frequency) : null,
    clicks: Number(row.clicks ?? 0) || 0,
    ctr: row.ctr != null ? Number(row.ctr) : null,
    cpc_cents: row.cpc != null ? Math.round(Number(row.cpc) * 100) : null,
    cpm_cents: row.cpm != null ? Math.round(Number(row.cpm) * 100) : null,
    leads,
    cpl_cents: leads > 0 ? Math.round((spend / leads) * 100) : null,
    inline_link_clicks: Number(row.inline_link_clicks ?? 0) || 0,
    video_thruplay: thruplayCount(row.video_thruplay_watched_actions),
    raw: row,
  };
}

async function syncAdsInsights(metricDate: string, errors: string[]): Promise<{
  insightsRows: number;
  breakdownRows: number;
  insightsOk: boolean;
  breakdownOk: boolean;
}> {
  const state = getAdsConnectionState();
  if (!state.enabledFlag || !state.configured) {
    errors.push(state.message);
    return { insightsRows: 0, breakdownRows: 0, insightsOk: false, breakdownOk: false };
  }

  const cfg = getMetaAdsConfig();
  const accountId = cfg.adAccountId!;
  const admin = createAdminClient();
  let insightsRows = 0;
  let breakdownRows = 0;
  let insightsOk = false;
  let breakdownOk = false;

  const levels: Array<'account' | 'campaign' | 'adset' | 'ad'> = [
    'account',
    'campaign',
    'adset',
    'ad',
  ];

  for (const level of levels) {
    const res = await adsGraphGet(`/${accountId}/insights`, {
      level,
      fields: INSIGHT_FIELDS,
      date_preset: 'last_7d',
      time_increment: '1',
      limit: '200',
    });
    if (!res.ok) {
      errors.push(`insights ${level}: ${res.error}`);
      continue;
    }
    insightsOk = true;
    const data = res.json as { data?: InsightRow[] };
    for (const row of data.data ?? []) {
      const mapped = mapInsightToDaily(level, row, metricDate);
      const { error } = await admin.from('ad_insights_daily').upsert(mapped, {
        onConflict: 'metric_date,level,entity_id',
      });
      if (error) errors.push(`upsert insights: ${error.message}`);
      else insightsRows += 1;
    }
  }

  // Sync legacy CRM metrics for linked campaigns (campaign level, last_7d aggregate day = today)
  const campaignRes = await adsGraphGet(`/${accountId}/insights`, {
    level: 'campaign',
    fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,actions',
    date_preset: 'last_7d',
    limit: '50',
  });
  if (campaignRes.ok) {
    const campaigns = await listAdCampaigns();
    if (campaigns.ok) {
      const data = campaignRes.json as {
        data?: Array<{
          campaign_id?: string;
          spend?: string;
          impressions?: string;
          clicks?: string;
          ctr?: string;
          actions?: Array<{ action_type?: string; value?: string }>;
        }>;
      };
      const rows = [];
      for (const insight of data.data ?? []) {
        const match = campaigns.items.find((c) => c.metaCampaignId === insight.campaign_id);
        if (!match) continue;
        const spend = Number(insight.spend ?? 0) || 0;
        const leads = parseLeadActions(insight.actions);
        rows.push({
          campaignId: match.id,
          metricDate,
          spendCents: Math.round(spend * 100),
          impressions: Number(insight.impressions ?? 0) || 0,
          clicks: Number(insight.clicks ?? 0) || 0,
          leads,
          ctr: insight.ctr != null ? Number(insight.ctr) : null,
          cplCents: leads > 0 ? Math.round((spend / leads) * 100) : null,
        });
      }
      await upsertDailyMetricsFromInsights(rows);
    }
  }

  const breakdowns: Array<{ type: 'age' | 'gender' | 'publisher_platform' | 'country' | 'hour'; param: string }> = [
    { type: 'age', param: 'age' },
    { type: 'gender', param: 'gender' },
    { type: 'publisher_platform', param: 'publisher_platform' },
    { type: 'country', param: 'country' },
    { type: 'hour', param: 'hourly_stats_aggregated_by_advertiser_time_zone' },
  ];

  for (const bd of breakdowns) {
    const fields =
      bd.type === 'hour'
        ? 'spend,impressions,clicks,ctr'
        : 'spend,impressions,clicks,ctr,actions';
    const res = await adsGraphGet(`/${accountId}/insights`, {
      fields,
      breakdowns: bd.param,
      date_preset: 'last_7d',
      limit: '100',
    });
    if (!res.ok) {
      errors.push(`breakdown ${bd.type}: ${res.error}`);
      continue;
    }
    breakdownOk = true;
    const data = res.json as {
      data?: Array<
        Record<string, string | undefined> & {
          actions?: Array<{ action_type?: string; value?: string }>;
        }
      >;
    };
    for (const row of data.data ?? []) {
      const key =
        bd.type === 'hour'
          ? String(row.hourly_stats_aggregated_by_advertiser_time_zone ?? 'unknown')
          : String(row[bd.param] ?? 'unknown');
      const spend = Number(row.spend ?? 0) || 0;
      const leads = parseLeadActions(row.actions);
      const { error } = await admin.from('ad_breakdowns_daily').upsert(
        {
          metric_date: metricDate,
          breakdown_type: bd.type,
          breakdown_key: key,
          spend_cents: Math.round(spend * 100),
          impressions: Number(row.impressions ?? 0) || 0,
          clicks: Number(row.clicks ?? 0) || 0,
          ctr: row.ctr != null ? Number(row.ctr) : null,
          leads,
          raw: row,
        },
        { onConflict: 'metric_date,breakdown_type,breakdown_key' },
      );
      if (error) errors.push(`upsert breakdown: ${error.message}`);
      else breakdownRows += 1;
    }
  }

  return { insightsRows, breakdownRows, insightsOk, breakdownOk };
}

async function syncOrganic(metricDate: string, errors: string[]): Promise<{
  mediaCount: number;
  accountOk: boolean;
  listOk: boolean;
  insightsOk: boolean;
  accountInsightsOk: boolean;
  insightsError: string | null;
}> {
  const meta = await getMetaSocialConnection();
  if (!meta.accessToken || !meta.igUserId) {
    errors.push('meta_social_connection incomplet (token / igUserId).');
    return {
      mediaCount: 0,
      accountOk: false,
      listOk: false,
      insightsOk: false,
      accountInsightsOk: false,
      insightsError: 'Page token manquant',
    };
  }

  const admin = createAdminClient();
  const token = meta.accessToken;
  const igUserId = meta.igUserId;
  let listOk = false;
  let insightsOk = false;
  let accountInsightsOk = false;
  let insightsError: string | null = null;
  let mediaCount = 0;

  // Compte de base (followers) — sans scope insights
  const profile = await pageGraphGet(`/${igUserId}`, token, {
    fields: 'id,username,followers_count,media_count,name',
  });
  let followers: number | null = null;
  let mediaTotal: number | null = null;
  if (profile.ok) {
    const p = profile.json as { followers_count?: number; media_count?: number };
    followers = p.followers_count ?? null;
    mediaTotal = p.media_count ?? null;
  } else {
    errors.push(`IG profile: ${profile.error}`);
  }

  // Insights compte
  const acctInsights = await pageGraphGet(`/${igUserId}/insights`, token, {
    metric: 'profile_views,reach,website_clicks',
    period: 'day',
    metric_type: 'total_value',
  });
  let profileViews: number | null = null;
  let reach: number | null = null;
  let websiteClicks: number | null = null;
  if (acctInsights.ok) {
    accountInsightsOk = true;
    const data = acctInsights.json as {
      data?: Array<{ name?: string; total_value?: { value?: number }; values?: Array<{ value?: number }> }>;
    };
    for (const row of data.data ?? []) {
      const v = row.total_value?.value ?? row.values?.[0]?.value ?? null;
      if (row.name === 'profile_views') profileViews = v;
      if (row.name === 'reach') reach = v;
      if (row.name === 'website_clicks') websiteClicks = v;
    }
  } else {
    insightsError = acctInsights.error;
    if (/insight|permission|(#10)|oauth/i.test(acctInsights.error)) {
      insightsError = `${acctInsights.error} → ajouter instagram_manage_insights`;
    }
  }

  await admin.from('organic_account_snapshots').upsert(
    {
      snapshot_date: metricDate,
      followers_count: followers,
      media_count: mediaTotal,
      profile_views: profileViews,
      reach,
      website_clicks: websiteClicks,
      insights_available: accountInsightsOk,
      missing_permission: accountInsightsOk ? null : 'instagram_manage_insights',
      raw: { profile: profile.ok ? profile.json : null, insightsError },
    },
    { onConflict: 'snapshot_date' },
  );

  // Médias
  const mediaRes = await pageGraphGet(`/${igUserId}/media`, token, {
    fields:
      'id,caption,media_type,media_product_type,permalink,thumbnail_url,timestamp,like_count,comments_count',
    limit: '30',
  });
  if (!mediaRes.ok) {
    errors.push(`IG media list: ${mediaRes.error}`);
    return {
      mediaCount: 0,
      accountOk: Boolean(followers != null),
      listOk: false,
      insightsOk: false,
      accountInsightsOk,
      insightsError,
    };
  }
  listOk = true;

  const mediaData = mediaRes.json as {
    data?: Array<{
      id?: string;
      caption?: string;
      media_type?: string;
      media_product_type?: string;
      permalink?: string;
      thumbnail_url?: string;
      timestamp?: string;
      like_count?: number;
      comments_count?: number;
    }>;
  };

  const scored: Array<{
    ig_media_id: string;
    score: number;
    row: Record<string, unknown>;
  }> = [];

  for (const m of mediaData.data ?? []) {
    if (!m.id) continue;
    let reachM: number | null = null;
    let viewsM: number | null = null;
    let savedM: number | null = null;
    let sharesM: number | null = null;
    let mediaInsightsAvailable = false;

    const ins = await pageGraphGet(`/${m.id}/insights`, token, {
      metric: 'reach,views,saved,shares',
    });
    if (ins.ok) {
      mediaInsightsAvailable = true;
      insightsOk = true;
      const d = ins.json as {
        data?: Array<{ name?: string; values?: Array<{ value?: number }> }>;
      };
      for (const row of d.data ?? []) {
        const v = row.values?.[0]?.value ?? null;
        if (row.name === 'reach') reachM = v;
        if (row.name === 'views') viewsM = v;
        if (row.name === 'saved') savedM = v;
        if (row.name === 'shares') sharesM = v;
      }
    } else if (!insightsError) {
      insightsError = ins.error;
    }

    const likeCount = Number(m.like_count ?? 0) || 0;
    const commentsCount = Number(m.comments_count ?? 0) || 0;
    const score = scoreOrganic({
      like_count: likeCount,
      comments_count: commentsCount,
      reach: reachM,
      views: viewsM,
      saved: savedM,
      shares: sharesM,
    });

    const row = {
      snapshot_date: metricDate,
      ig_media_id: m.id,
      media_type: m.media_type ?? null,
      media_product_type: m.media_product_type ?? null,
      caption: (m.caption ?? '').slice(0, 500) || null,
      permalink: m.permalink ?? null,
      thumbnail_url: m.thumbnail_url ?? null,
      published_at: m.timestamp ?? null,
      like_count: likeCount,
      comments_count: commentsCount,
      reach: reachM,
      views: viewsM,
      saved: savedM,
      shares: sharesM,
      score,
      boost_badge: false,
      insights_available: mediaInsightsAvailable,
      raw: m,
    };
    scored.push({ ig_media_id: m.id, score, row });
  }

  scored.sort((a, b) => b.score - a.score);
  const boostThreshold = scored[2]?.score ?? scored[0]?.score ?? 0;
  for (let i = 0; i < scored.length; i++) {
    const item = scored[i]!;
    const boost = i < 3 && item.score > 0 && item.score >= boostThreshold * 0.85;
    item.row.boost_badge = boost;
    const { error } = await admin.from('organic_media_snapshots').upsert(item.row, {
      onConflict: 'snapshot_date,ig_media_id',
    });
    if (error) errors.push(`organic upsert: ${error.message}`);
    else mediaCount += 1;
  }

  return {
    mediaCount,
    accountOk: Boolean(followers != null),
    listOk,
    insightsOk,
    accountInsightsOk,
    insightsError,
  };
}

export async function runAdsIntelligenceSync(
  source: 'cron' | 'manual' | 'probe' = 'manual',
): Promise<SyncIntelligenceResult> {
  const ranAt = new Date().toISOString();
  const metricDate = todayParis();
  const errors: string[] = [];
  const adsState = getAdsConnectionState();

  const ads = await syncAdsInsights(metricDate, errors);
  const organic = await syncOrganic(metricDate, errors);

  const capabilities = buildStaticCapabilities({
    adsConfigured: adsState.configured && isMetaAdsEnabled(),
    adsInsightsOk: ads.insightsOk,
    adsBreakdownOk: ads.breakdownOk,
    igListOk: organic.listOk,
    igInsightsOk: organic.insightsOk,
    igAccountInsightsOk: organic.accountInsightsOk,
    igInsightsError: organic.insightsError,
  });

  const ok = errors.length === 0 || ads.insightsOk || organic.listOk;
  const detail = {
    insightsRows: ads.insightsRows,
    breakdownRows: ads.breakdownRows,
    organicMedia: organic.mediaCount,
    organicAccount: organic.accountOk,
    capabilities,
    errors,
  };

  try {
    const admin = createAdminClient();
    await admin.from('ads_sync_runs').insert({
      source,
      ok,
      detail,
      ran_at: ranAt,
    });
  } catch (e) {
    errors.push(e instanceof Error ? e.message : 'log sync_runs échoué');
  }

  // Régénération auto des conseils + plan (dédupliqués) après chaque sync réussie
  try {
    const { loadAdsIntelligenceBundle } = await import('./intelligence-repository');
    const { regenerateAndPersistCoach } = await import('./coach-persist');
    const bundle = await loadAdsIntelligenceBundle();
    await regenerateAndPersistCoach(bundle);
  } catch (e) {
    errors.push(e instanceof Error ? `coach regen: ${e.message}` : 'coach regen échoué');
  }

  return {
    ok,
    source,
    ranAt,
    adsOk: ads.insightsOk,
    organicOk: organic.listOk,
    detail: { ...detail, errors },
  };
}
