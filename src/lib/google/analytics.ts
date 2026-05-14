import { BetaAnalyticsDataClient } from '@google-analytics/data';

import { ga4PropertyResourceName, parseServiceAccountJson } from '@/lib/google/service-account';

function createClient(): BetaAnalyticsDataClient | null {
  const creds = parseServiceAccountJson();
  if (!creds) return null;
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
  });
}

function propertyName(): string {
  const name = ga4PropertyResourceName();
  if (!name) throw new Error('GA4_PROPERTY_ID invalide.');
  return name;
}

export async function getRealtimeUsers(): Promise<number> {
  const client = createClient();
  if (!client) return 0;
  const [res] = await client.runRealtimeReport({
    property: propertyName(),
    metrics: [{ name: 'activeUsers' }],
  });
  const v = res.rows?.[0]?.metricValues?.[0]?.value;
  return v ? Number(v) : 0;
}

export type PageViewPoint = { date: string; views: number };

export async function getPageViews(days: number): Promise<PageViewPoint[]> {
  const client = createClient();
  if (!client) return [];
  const safeDays = Math.min(Math.max(days, 1), 90);
  const [res] = await client.runReport({
    property: propertyName(),
    dateRanges: [{ startDate: `${safeDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  });
  const rows = res.rows ?? [];
  return rows.map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? '',
    views: Number(row.metricValues?.[0]?.value ?? 0),
  }));
}

export type TopPageRow = { page: string; views: number; avgTimeSeconds: number };

export async function getTopPages(days: number, limit = 10): Promise<TopPageRow[]> {
  const client = createClient();
  if (!client) return [];
  const safeDays = Math.min(Math.max(days, 1), 90);
  const [res] = await client.runReport({
    property: propertyName(),
    dateRanges: [{ startDate: `${safeDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'pagePathPlusQueryString' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'userEngagementDuration' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit,
  });
  return (res.rows ?? []).map((row) => {
    const views = Number(row.metricValues?.[0]?.value ?? 0);
    const engagement = Number(row.metricValues?.[1]?.value ?? 0);
    const avg = views > 0 ? engagement / views : 0;
    return {
      page: row.dimensionValues?.[0]?.value ?? '',
      views,
      avgTimeSeconds: Math.round(avg),
    };
  });
}

export type TrafficSourceSlice = { name: string; value: number };

function mapChannel(raw: string): 'Direct' | 'Organic' | 'Social' | 'Referral' | 'Other' {
  const s = raw.toLowerCase();
  if (s.includes('direct')) return 'Direct';
  if (s.includes('organic')) return 'Organic';
  if (s.includes('social')) return 'Social';
  if (s.includes('referral')) return 'Referral';
  return 'Other';
}

export async function getTrafficSources(days: number): Promise<TrafficSourceSlice[]> {
  const client = createClient();
  if (!client) return [];
  const safeDays = Math.min(Math.max(days, 1), 90);
  const [res] = await client.runReport({
    property: propertyName(),
    dateRanges: [{ startDate: `${safeDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
    metrics: [{ name: 'sessions' }],
  });
  const bucket = new Map<string, number>();
  for (const row of res.rows ?? []) {
    const label = row.dimensionValues?.[0]?.value ?? 'Other';
    const sessions = Number(row.metricValues?.[0]?.value ?? 0);
    const key = mapChannel(label);
    bucket.set(key, (bucket.get(key) ?? 0) + sessions);
  }
  const order = ['Direct', 'Organic', 'Social', 'Referral', 'Other'] as const;
  return order.map((name) => ({ name, value: bucket.get(name) ?? 0 })).filter((x) => x.value > 0);
}

export async function getConversionRate(days: number): Promise<{ ratePercent: number | null; sessions: number; keyEvents: number }> {
  const client = createClient();
  if (!client) return { ratePercent: null, sessions: 0, keyEvents: 0 };
  const safeDays = Math.min(Math.max(days, 1), 90);
  const [res] = await client.runReport({
    property: propertyName(),
    dateRanges: [{ startDate: `${safeDays}daysAgo`, endDate: 'today' }],
    metrics: [{ name: 'sessions' }, { name: 'keyEvents' }],
  });
  const sessions = Number(res.rows?.[0]?.metricValues?.[0]?.value ?? 0);
  const keyEvents = Number(res.rows?.[0]?.metricValues?.[1]?.value ?? 0);
  if (sessions <= 0 || keyEvents <= 0) return { ratePercent: null, sessions, keyEvents };
  return {
    ratePercent: Math.round((keyEvents / sessions) * 1000) / 10,
    sessions,
    keyEvents,
  };
}

export type CountryBucket = { label: string; users: number };

export async function getUsersByCountry(days: number): Promise<CountryBucket[]> {
  const client = createClient();
  if (!client) return [];
  const safeDays = Math.min(Math.max(days, 1), 90);
  const [res] = await client.runReport({
    property: propertyName(),
    dateRanges: [{ startDate: `${safeDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 40,
  });
  let fr = 0;
  let mx = 0;
  let other = 0;
  for (const row of res.rows ?? []) {
    const country = (row.dimensionValues?.[0]?.value ?? '').trim();
    const users = Number(row.metricValues?.[0]?.value ?? 0);
    if (country === 'France') fr += users;
    else if (country === 'Mexico') mx += users;
    else other += users;
  }
  return [
    { label: 'France', users: fr },
    { label: 'Mexique', users: mx },
    { label: 'Autre', users: other },
  ];
}
