/**
 * Lecture snapshots intelligence Ads / organique pour l’UI.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { computeAdsAlerts, type AdsAlert, type InsightEntity } from './alerts';
import type { CapabilityProbe } from './sync-intelligence';

export type IntelligenceBundle = {
  lastSyncAt: string | null;
  lastSyncOk: boolean | null;
  capabilities: CapabilityProbe[];
  campaigns: InsightEntity[];
  trends: Array<{
    metricDate: string;
    spendCents: number;
    leads: number;
    clicks: number;
    impressions: number;
    cplCents: number | null;
    ctr: number | null;
    frequency: number | null;
  }>;
  breakdowns: {
    age: BreakdownRow[];
    gender: BreakdownRow[];
    publisher_platform: BreakdownRow[];
    country: BreakdownRow[];
    hour: BreakdownRow[];
  };
  organicMedia: OrganicMediaRow[];
  organicAccount: OrganicAccountRow | null;
  organicAccountHistory: OrganicAccountRow[];
  alerts: AdsAlert[];
  temperatureCompare: TemperatureRow[];
};

export type BreakdownRow = {
  key: string;
  spendCents: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  leads: number;
};

export type OrganicMediaRow = {
  igMediaId: string;
  mediaType: string | null;
  mediaProductType: string | null;
  caption: string | null;
  permalink: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  likeCount: number;
  commentsCount: number;
  reach: number | null;
  views: number | null;
  saved: number | null;
  shares: number | null;
  score: number;
  boostBadge: boolean;
  insightsAvailable: boolean;
};

export type OrganicAccountRow = {
  snapshotDate: string;
  followersCount: number | null;
  mediaCount: number | null;
  profileViews: number | null;
  reach: number | null;
  websiteClicks: number | null;
  insightsAvailable: boolean;
  missingPermission: string | null;
};

export type TemperatureRow = {
  temperature: 'froid' | 'warm' | 'hot';
  label: string;
  spendCents: number;
  leads: number;
  cplCents: number | null;
  ctr: number | null;
  frequency: number | null;
  campaigns: number;
};

function emptyBundle(): IntelligenceBundle {
  return {
    lastSyncAt: null,
    lastSyncOk: null,
    capabilities: [],
    campaigns: [],
    trends: [],
    breakdowns: {
      age: [],
      gender: [],
      publisher_platform: [],
      country: [],
      hour: [],
    },
    organicMedia: [],
    organicAccount: null,
    organicAccountHistory: [],
    alerts: computeAdsAlerts([]),
    temperatureCompare: [
      { temperature: 'froid', label: 'Froid', spendCents: 0, leads: 0, cplCents: null, ctr: null, frequency: null, campaigns: 0 },
      { temperature: 'warm', label: 'Warm', spendCents: 0, leads: 0, cplCents: null, ctr: null, frequency: null, campaigns: 0 },
      { temperature: 'hot', label: 'Hot', spendCents: 0, leads: 0, cplCents: null, ctr: null, frequency: null, campaigns: 0 },
    ],
  };
}

function tempOf(name: string | null): 'froid' | 'warm' | 'hot' {
  const s = (name ?? '').toLowerCase();
  if (/hot|brûlant|essai|trial/.test(s)) return 'hot';
  if (/warm|chaud|retarget/.test(s)) return 'warm';
  return 'froid';
}

export async function loadAdsIntelligenceBundle(): Promise<IntelligenceBundle> {
  try {
    const admin = createAdminClient();
    const bundle = emptyBundle();

    const { data: syncRows } = await admin
      .from('ads_sync_runs')
      .select('ran_at, ok, detail')
      .order('ran_at', { ascending: false })
      .limit(1);
    const last = syncRows?.[0] as
      | { ran_at?: string; ok?: boolean; detail?: { capabilities?: CapabilityProbe[] } }
      | undefined;
    if (last) {
      bundle.lastSyncAt = last.ran_at ?? null;
      bundle.lastSyncOk = last.ok ?? null;
      if (Array.isArray(last.detail?.capabilities)) {
        bundle.capabilities = last.detail!.capabilities!;
      }
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString().slice(0, 10);

    const { data: insightRows } = await admin
      .from('ad_insights_daily')
      .select('*')
      .eq('level', 'campaign')
      .gte('metric_date', sinceIso)
      .order('metric_date', { ascending: false })
      .limit(200);

    const byEntity = new Map<string, InsightEntity & { dates: Set<string> }>();
    const byDate = new Map<
      string,
      { spendCents: number; leads: number; clicks: number; impressions: number; freqSum: number; freqN: number; ctrSum: number; ctrN: number }
    >();

    for (const raw of insightRows ?? []) {
      const r = raw as Record<string, unknown>;
      const entityId = String(r.entity_id);
      const entityName = r.entity_name ? String(r.entity_name) : null;
      const spendCents = Number(r.spend_cents ?? 0);
      const leads = Number(r.leads ?? 0);
      const clicks = Number(r.clicks ?? 0);
      const impressions = Number(r.impressions ?? 0);
      const frequency = r.frequency != null ? Number(r.frequency) : null;
      const ctr = r.ctr != null ? Number(r.ctr) : null;
      const cplCents = r.cpl_cents != null ? Number(r.cpl_cents) : null;
      const metricDate = String(r.metric_date);

      const prev = byEntity.get(entityId);
      if (!prev) {
        byEntity.set(entityId, {
          entityId,
          entityName,
          level: 'campaign',
          spendCents,
          frequency,
          leads,
          clicks,
          ctr,
          cplCents,
          impressions,
          dates: new Set([metricDate]),
        });
      } else {
        prev.spendCents += spendCents;
        prev.leads += leads;
        prev.clicks += clicks;
        prev.impressions += impressions;
        prev.dates.add(metricDate);
        if (frequency != null) prev.frequency = Math.max(prev.frequency ?? 0, frequency);
        prev.cplCents =
          prev.leads > 0 ? Math.round(prev.spendCents / prev.leads) : null;
        if (ctr != null) prev.ctr = ctr;
      }

      const day = byDate.get(metricDate) ?? {
        spendCents: 0,
        leads: 0,
        clicks: 0,
        impressions: 0,
        freqSum: 0,
        freqN: 0,
        ctrSum: 0,
        ctrN: 0,
      };
      day.spendCents += spendCents;
      day.leads += leads;
      day.clicks += clicks;
      day.impressions += impressions;
      if (frequency != null) {
        day.freqSum += frequency;
        day.freqN += 1;
      }
      if (ctr != null) {
        day.ctrSum += ctr;
        day.ctrN += 1;
      }
      byDate.set(metricDate, day);
    }

    bundle.campaigns = [...byEntity.values()].map(({ dates: _d, ...rest }) => rest);
    bundle.trends = [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([metricDate, d]) => ({
        metricDate,
        spendCents: d.spendCents,
        leads: d.leads,
        clicks: d.clicks,
        impressions: d.impressions,
        cplCents: d.leads > 0 ? Math.round(d.spendCents / d.leads) : null,
        ctr: d.ctrN > 0 ? d.ctrSum / d.ctrN : null,
        frequency: d.freqN > 0 ? d.freqSum / d.freqN : null,
      }));

    const temps: Record<'froid' | 'warm' | 'hot', TemperatureRow> = {
      froid: { temperature: 'froid', label: 'Froid', spendCents: 0, leads: 0, cplCents: null, ctr: null, frequency: null, campaigns: 0 },
      warm: { temperature: 'warm', label: 'Warm', spendCents: 0, leads: 0, cplCents: null, ctr: null, frequency: null, campaigns: 0 },
      hot: { temperature: 'hot', label: 'Hot', spendCents: 0, leads: 0, cplCents: null, ctr: null, frequency: null, campaigns: 0 },
    };
    for (const c of bundle.campaigns) {
      const t = tempOf(c.entityName);
      temps[t].spendCents += c.spendCents;
      temps[t].leads += c.leads;
      temps[t].campaigns += 1;
      if (c.frequency != null) temps[t].frequency = Math.max(temps[t].frequency ?? 0, c.frequency);
      if (c.ctr != null) temps[t].ctr = c.ctr;
    }
    for (const t of Object.values(temps)) {
      t.cplCents = t.leads > 0 ? Math.round(t.spendCents / t.leads) : null;
    }
    bundle.temperatureCompare = [temps.froid, temps.warm, temps.hot];

    const { data: bdRows } = await admin
      .from('ad_breakdowns_daily')
      .select('*')
      .gte('metric_date', sinceIso)
      .order('metric_date', { ascending: false })
      .limit(500);

    const bdAgg: Record<string, Map<string, BreakdownRow>> = {
      age: new Map(),
      gender: new Map(),
      publisher_platform: new Map(),
      country: new Map(),
      hour: new Map(),
    };
    for (const raw of bdRows ?? []) {
      const r = raw as Record<string, unknown>;
      const type = String(r.breakdown_type);
      const map = bdAgg[type];
      if (!map) continue;
      const key = String(r.breakdown_key);
      const prev = map.get(key) ?? { key, spendCents: 0, impressions: 0, clicks: 0, ctr: null, leads: 0 };
      prev.spendCents += Number(r.spend_cents ?? 0);
      prev.impressions += Number(r.impressions ?? 0);
      prev.clicks += Number(r.clicks ?? 0);
      prev.leads += Number(r.leads ?? 0);
      if (r.ctr != null) prev.ctr = Number(r.ctr);
      map.set(key, prev);
    }
    bundle.breakdowns = {
      age: [...bdAgg.age.values()].sort((a, b) => b.spendCents - a.spendCents),
      gender: [...bdAgg.gender.values()].sort((a, b) => b.spendCents - a.spendCents),
      publisher_platform: [...bdAgg.publisher_platform.values()].sort((a, b) => b.spendCents - a.spendCents),
      country: [...bdAgg.country.values()].sort((a, b) => b.spendCents - a.spendCents),
      hour: [...bdAgg.hour.values()].sort((a, b) => a.key.localeCompare(b.key)),
    };

    const { data: orgMedia } = await admin
      .from('organic_media_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(80);

    // latest snapshot date only
    const latestOrgDate = orgMedia?.[0] ? String((orgMedia[0] as { snapshot_date: string }).snapshot_date) : null;
    bundle.organicMedia = (orgMedia ?? [])
      .filter((r) => !latestOrgDate || String((r as { snapshot_date: string }).snapshot_date) === latestOrgDate)
      .map((raw) => {
        const r = raw as Record<string, unknown>;
        return {
          igMediaId: String(r.ig_media_id),
          mediaType: r.media_type ? String(r.media_type) : null,
          mediaProductType: r.media_product_type ? String(r.media_product_type) : null,
          caption: r.caption ? String(r.caption) : null,
          permalink: r.permalink ? String(r.permalink) : null,
          thumbnailUrl: r.thumbnail_url ? String(r.thumbnail_url) : null,
          publishedAt: r.published_at ? String(r.published_at) : null,
          likeCount: Number(r.like_count ?? 0),
          commentsCount: Number(r.comments_count ?? 0),
          reach: r.reach != null ? Number(r.reach) : null,
          views: r.views != null ? Number(r.views) : null,
          saved: r.saved != null ? Number(r.saved) : null,
          shares: r.shares != null ? Number(r.shares) : null,
          score: Number(r.score ?? 0),
          boostBadge: Boolean(r.boost_badge),
          insightsAvailable: Boolean(r.insights_available),
        };
      })
      .sort((a, b) => b.score - a.score);

    const { data: orgAcct } = await admin
      .from('organic_account_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(14);

    bundle.organicAccountHistory = (orgAcct ?? []).map((raw) => {
      const r = raw as Record<string, unknown>;
      return {
        snapshotDate: String(r.snapshot_date),
        followersCount: r.followers_count != null ? Number(r.followers_count) : null,
        mediaCount: r.media_count != null ? Number(r.media_count) : null,
        profileViews: r.profile_views != null ? Number(r.profile_views) : null,
        reach: r.reach != null ? Number(r.reach) : null,
        websiteClicks: r.website_clicks != null ? Number(r.website_clicks) : null,
        insightsAvailable: Boolean(r.insights_available),
        missingPermission: r.missing_permission ? String(r.missing_permission) : null,
      };
    });
    bundle.organicAccount = bundle.organicAccountHistory[0] ?? null;

    bundle.alerts = computeAdsAlerts(bundle.campaigns);
    return bundle;
  } catch (e) {
    console.error('[ads intelligence load]', e);
    return emptyBundle();
  }
}
