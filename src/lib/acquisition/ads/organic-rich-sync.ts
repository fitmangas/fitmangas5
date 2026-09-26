/**
 * Stats organiques riches (niveau Meta Business Suite) :
 * séries quotidiennes compte (≤ 90 j) + démographie followers.
 * Lecture seule. Contraintes Meta vérifiées le 26/09/2026 :
 * - total_value : fenêtre ≤ 30 j → on interroge jour par jour (1 appel / jour).
 * - follower_count : série jour, 30 derniers jours seulement.
 * - follower_demographics : lifetime, breakdown age | gender | country | city.
 * - engaged / reached_audience_demographics et online_followers : réponses vides sur ce compte.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { mapWithConcurrency, pageGraphGet } from './meta-page-graph';

export const ORGANIC_DAILY_WINDOW_DAYS = 90;

const DAY_METRICS = [
  'views',
  'reach',
  'accounts_engaged',
  'total_interactions',
  'likes',
  'comments',
  'shares',
  'saves',
  'profile_views',
  'website_clicks',
  'profile_links_taps',
] as const;

type DayMetric = (typeof DAY_METRICS)[number];

export type OrganicRichSyncResult = {
  dailyOk: boolean;
  daysSynced: number;
  demographicsOk: boolean;
  demographicsRows: number;
  followerSeriesOk: boolean;
  errors: string[];
};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayBounds(isoDate: string): { since: number; until: number } {
  const since = Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 1000);
  return { since, until: since + 86400 };
}

/** Jours [aujourd’hui-1 … aujourd’hui-windowDays] (le jour courant est incomplet). */
export function lastDays(windowDays: number, now = new Date()): string[] {
  const out: string[] = [];
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (let i = 1; i <= windowDays; i++) out.push(isoDay(new Date(base - i * 86400_000)));
  return out;
}

async function fetchDay(
  igUserId: string,
  token: string,
  date: string,
): Promise<{ date: string; row: Record<string, unknown> | null; error: string | null }> {
  const { since, until } = dayBounds(date);
  const main = await pageGraphGet(`/${igUserId}/insights`, token, {
    metric: DAY_METRICS.join(','),
    period: 'day',
    metric_type: 'total_value',
    since: String(since),
    until: String(until),
  });
  if (!main.ok) return { date, row: null, error: main.error };

  const values: Partial<Record<DayMetric, number>> = {};
  const data = (main.json as { data?: Array<{ name?: string; total_value?: { value?: number } }> }).data;
  for (const m of data ?? []) {
    if (m.name && (DAY_METRICS as readonly string[]).includes(m.name)) {
      values[m.name as DayMetric] = Number(m.total_value?.value ?? 0) || 0;
    }
  }

  let follows: number | null = null;
  let unfollows: number | null = null;
  const fu = await pageGraphGet(`/${igUserId}/insights`, token, {
    metric: 'follows_and_unfollows',
    period: 'day',
    metric_type: 'total_value',
    breakdown: 'follow_type',
    since: String(since),
    until: String(until),
  });
  if (fu.ok) {
    const results =
      (fu.json as {
        data?: Array<{
          total_value?: {
            breakdowns?: Array<{ results?: Array<{ dimension_values?: string[]; value?: number }> }>;
          };
        }>;
      }).data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [];
    follows = 0;
    unfollows = 0;
    for (const r of results) {
      if (r.dimension_values?.[0] === 'FOLLOWER') follows = Number(r.value ?? 0) || 0;
      if (r.dimension_values?.[0] === 'NON_FOLLOWER') unfollows = Number(r.value ?? 0) || 0;
    }
  }

  return {
    date,
    row: {
      metric_date: date,
      views: values.views ?? null,
      reach: values.reach ?? null,
      accounts_engaged: values.accounts_engaged ?? null,
      total_interactions: values.total_interactions ?? null,
      likes: values.likes ?? null,
      comments: values.comments ?? null,
      shares: values.shares ?? null,
      saves: values.saves ?? null,
      profile_views: values.profile_views ?? null,
      website_clicks: values.website_clicks ?? null,
      profile_links_taps: values.profile_links_taps ?? null,
      follows,
      unfollows,
      synced_at: new Date().toISOString(),
    },
    error: null,
  };
}

async function fetchFollowerGainSeries(
  igUserId: string,
  token: string,
): Promise<{ ok: boolean; byDate: Map<string, number>; error: string | null }> {
  const now = Math.floor(Date.now() / 1000);
  const res = await pageGraphGet(`/${igUserId}/insights`, token, {
    metric: 'follower_count',
    period: 'day',
    since: String(now - 29 * 86400),
    until: String(now),
  });
  const byDate = new Map<string, number>();
  if (!res.ok) return { ok: false, byDate, error: res.error };
  const values =
    (res.json as { data?: Array<{ values?: Array<{ value?: number; end_time?: string }> }> }).data?.[0]
      ?.values ?? [];
  for (const v of values) {
    if (!v.end_time) continue;
    // end_time = fin de journée (07:00 UTC le lendemain) → la valeur concerne le jour précédent.
    const d = isoDay(new Date(Date.parse(v.end_time) - 86400_000));
    byDate.set(d, Number(v.value ?? 0) || 0);
  }
  return { ok: true, byDate, error: null };
}

async function syncDemographics(
  igUserId: string,
  token: string,
  snapshotDate: string,
  errors: string[],
): Promise<{ ok: boolean; rows: number }> {
  const admin = createAdminClient();
  const dims = ['age', 'gender', 'country', 'city'] as const;
  let rows = 0;
  let anyOk = false;
  for (const dim of dims) {
    const res = await pageGraphGet(`/${igUserId}/insights`, token, {
      metric: 'follower_demographics',
      period: 'lifetime',
      metric_type: 'total_value',
      breakdown: dim,
    });
    if (!res.ok) {
      errors.push(`follower_demographics ${dim}: ${res.error}`);
      continue;
    }
    anyOk = true;
    const results =
      (res.json as {
        data?: Array<{
          total_value?: {
            breakdowns?: Array<{ results?: Array<{ dimension_values?: string[]; value?: number }> }>;
          };
        }>;
      }).data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [];
    const payload = results
      .filter((r) => r.dimension_values?.[0])
      .map((r) => ({
        snapshot_date: snapshotDate,
        audience: 'follower' as const,
        dimension: dim,
        dimension_key: String(r.dimension_values![0]),
        value: Number(r.value ?? 0) || 0,
      }));
    if (!payload.length) continue;
    const { error } = await admin
      .from('organic_audience_demographics')
      .upsert(payload, { onConflict: 'snapshot_date,audience,dimension,dimension_key' });
    if (error) errors.push(`upsert demographics ${dim}: ${error.message}`);
    else rows += payload.length;
  }
  return { ok: anyOk, rows };
}

/**
 * Remplit les jours manquants de la fenêtre + rafraîchit toujours les 3 derniers jours
 * (Meta consolide les chiffres avec 24–48 h de retard).
 */
export async function syncOrganicRich(params: {
  igUserId: string;
  token: string;
  snapshotDate: string;
  windowDays?: number;
}): Promise<OrganicRichSyncResult> {
  const errors: string[] = [];
  const admin = createAdminClient();
  const windowDays = params.windowDays ?? ORGANIC_DAILY_WINDOW_DAYS;
  const days = lastDays(windowDays);

  const { data: existing } = await admin
    .from('organic_account_daily')
    .select('metric_date')
    .gte('metric_date', days[days.length - 1]!);
  const have = new Set((existing ?? []).map((r) => String(r.metric_date)));
  const refresh = new Set(days.slice(0, 3));
  const todo = days.filter((d) => refresh.has(d) || !have.has(d));

  const fetched = await mapWithConcurrency(todo, 6, (d) => fetchDay(params.igUserId, params.token, d));
  const gain = await fetchFollowerGainSeries(params.igUserId, params.token);
  if (!gain.ok && gain.error) errors.push(`follower_count: ${gain.error}`);

  const rows: Record<string, unknown>[] = [];
  let firstError: string | null = null;
  for (const f of fetched) {
    if (!f.row) {
      firstError ??= f.error;
      continue;
    }
    rows.push({ ...f.row, follower_gain: gain.byDate.get(f.date) ?? null });
  }
  if (firstError) errors.push(`insights jour: ${firstError}`);

  // Jours déjà en base mais présents dans la série follower_count : compléter le gain.
  const gainOnly = [...gain.byDate.entries()]
    .filter(([d]) => have.has(d) && !todo.includes(d))
    .map(([d, v]) => ({ metric_date: d, follower_gain: v }));

  let daysSynced = 0;
  if (rows.length) {
    const { error } = await admin.from('organic_account_daily').upsert(rows, { onConflict: 'metric_date' });
    if (error) errors.push(`upsert organic_account_daily: ${error.message}`);
    else daysSynced = rows.length;
  }
  for (const g of gainOnly) {
    await admin.from('organic_account_daily').update({ follower_gain: g.follower_gain }).eq('metric_date', g.metric_date);
  }

  const demo = await syncDemographics(params.igUserId, params.token, params.snapshotDate, errors);

  return {
    dailyOk: rows.length > 0 || (todo.length === 0 && have.size > 0),
    daysSynced,
    demographicsOk: demo.ok,
    demographicsRows: demo.rows,
    followerSeriesOk: gain.ok,
    errors,
  };
}
