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
  /** Séries quotidiennes compte IG (≤ 90 j, ordre chronologique). */
  organicDaily: OrganicDailyRow[];
  demographics: AudienceDemographics;
  /** Totaux pub 30 j (niveau campagne agrégé). */
  adsTotals: AdsTotals;
  /** Nouvelles abonnées payantes 30 j (toutes sources) — base du CAC mixte. */
  newPaidSubs30d: number | null;
};

export type OrganicDailyRow = {
  date: string;
  views: number | null;
  reach: number | null;
  accountsEngaged: number | null;
  totalInteractions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  profileViews: number | null;
  websiteClicks: number | null;
  profileLinksTaps: number | null;
  follows: number | null;
  unfollows: number | null;
  followerGain: number | null;
};

export type DemoRow = { key: string; value: number };

export type AudienceDemographics = {
  snapshotDate: string | null;
  age: DemoRow[];
  gender: DemoRow[];
  country: DemoRow[];
  city: DemoRow[];
};

export type AdsTotals = {
  spendCents: number;
  impressions: number;
  reach: number;
  clicks: number;
  linkClicks: number;
  leads: number;
  thruplays: number;
  /** Valeur des achats attribués par Meta (pixel Purchase), en centimes. */
  purchaseValueCents: number;
  roas: number | null;
  ctr: number | null;
  cpmCents: number | null;
  cplCents: number | null;
  frequency: number | null;
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
  totalInteractions: number | null;
  profileVisits: number | null;
  follows: number | null;
  avgWatchTimeMs: number | null;
  totalWatchTimeMs: number | null;
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
    organicDaily: [],
    demographics: { snapshotDate: null, age: [], gender: [], country: [], city: [] },
    adsTotals: {
      spendCents: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      linkClicks: 0,
      leads: 0,
      thruplays: 0,
      purchaseValueCents: 0,
      roas: null,
      ctr: null,
      cpmCents: null,
      cplCents: null,
      frequency: null,
    },
    newPaidSubs30d: null,
  };
}

const PURCHASE_ACTION_TYPES = ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase'];

/** Meta compte le même achat sous plusieurs action_type → on prend le plus élevé, sans additionner. */
export function purchaseValueCents(raw: unknown): number {
  const values = (raw as { action_values?: Array<{ action_type?: string; value?: string }> } | null)?.action_values;
  if (!Array.isArray(values)) return 0;
  let best = 0;
  for (const v of values) {
    if (v.action_type && PURCHASE_ACTION_TYPES.includes(v.action_type)) {
      best = Math.max(best, Math.round((Number(v.value ?? 0) || 0) * 100));
    }
  }
  return best;
}

function numOrNull(v: unknown): number | null {
  return v != null ? Number(v) : null;
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

      const tot = bundle.adsTotals;
      tot.spendCents += spendCents;
      tot.impressions += impressions;
      tot.reach += Number(r.reach ?? 0);
      tot.clicks += clicks;
      tot.linkClicks += Number(r.inline_link_clicks ?? 0);
      tot.leads += leads;
      tot.thruplays += Number(r.video_thruplay ?? 0);
      tot.purchaseValueCents += purchaseValueCents(r.raw);
      if (frequency != null) tot.frequency = Math.max(tot.frequency ?? 0, frequency);

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

    {
      const tot = bundle.adsTotals;
      tot.ctr = tot.impressions > 0 ? (tot.clicks / tot.impressions) * 100 : null;
      tot.cpmCents = tot.impressions > 0 ? Math.round((tot.spendCents / tot.impressions) * 1000) : null;
      tot.cplCents = tot.leads > 0 ? Math.round(tot.spendCents / tot.leads) : null;
      tot.roas = tot.spendCents > 0 ? tot.purchaseValueCents / tot.spendCents : null;
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
      .limit(120);

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
          totalInteractions: numOrNull(r.total_interactions),
          profileVisits: numOrNull(r.profile_visits),
          follows: numOrNull(r.follows),
          avgWatchTimeMs: numOrNull(r.avg_watch_time_ms),
          totalWatchTimeMs: numOrNull(r.total_watch_time_ms),
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

    const { data: dailyRows } = await admin
      .from('organic_account_daily')
      .select('*')
      .order('metric_date', { ascending: true })
      .limit(120);
    bundle.organicDaily = (dailyRows ?? []).slice(-90).map((raw) => {
      const r = raw as Record<string, unknown>;
      return {
        date: String(r.metric_date),
        views: numOrNull(r.views),
        reach: numOrNull(r.reach),
        accountsEngaged: numOrNull(r.accounts_engaged),
        totalInteractions: numOrNull(r.total_interactions),
        likes: numOrNull(r.likes),
        comments: numOrNull(r.comments),
        shares: numOrNull(r.shares),
        saves: numOrNull(r.saves),
        profileViews: numOrNull(r.profile_views),
        websiteClicks: numOrNull(r.website_clicks),
        profileLinksTaps: numOrNull(r.profile_links_taps),
        follows: numOrNull(r.follows),
        unfollows: numOrNull(r.unfollows),
        followerGain: numOrNull(r.follower_gain),
      };
    });

    const { data: demoLatest } = await admin
      .from('organic_audience_demographics')
      .select('snapshot_date')
      .eq('audience', 'follower')
      .order('snapshot_date', { ascending: false })
      .limit(1);
    const demoDate = demoLatest?.[0] ? String((demoLatest[0] as { snapshot_date: string }).snapshot_date) : null;
    if (demoDate) {
      const { data: demoRows } = await admin
        .from('organic_audience_demographics')
        .select('dimension, dimension_key, value')
        .eq('audience', 'follower')
        .eq('snapshot_date', demoDate);
      const pick = (dim: string) =>
        (demoRows ?? [])
          .filter((r) => (r as { dimension: string }).dimension === dim)
          .map((r) => ({
            key: String((r as { dimension_key: string }).dimension_key),
            value: Number((r as { value: number }).value ?? 0),
          }))
          .sort((a, b) => b.value - a.value);
      bundle.demographics = {
        snapshotDate: demoDate,
        age: pick('age').sort((a, b) => a.key.localeCompare(b.key)),
        gender: pick('gender'),
        country: pick('country'),
        city: pick('city'),
      };
    }

    const { count: paidCount, error: paidErr } = await admin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', sinceIso);
    bundle.newPaidSubs30d = paidErr ? null : (paidCount ?? 0);

    bundle.alerts = computeAdsAlerts(bundle.campaigns);
    return bundle;
  } catch (e) {
    console.error('[ads intelligence load]', e);
    return emptyBundle();
  }
}
