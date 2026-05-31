import { google } from 'googleapis';

import { parseServiceAccountJson } from '@/lib/google/service-account';

const WEBMASTERS_READONLY = 'https://www.googleapis.com/auth/webmasters.readonly';

export function searchConsoleSiteUrl(): string {
  const fromEnv = process.env.GSC_SITE_URL?.trim();
  if (fromEnv) return fromEnv;
  return 'sc-domain:fitmangas.com';
}

async function getSearchConsoleClient() {
  const creds = parseServiceAccountJson();
  if (!creds) return null;
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [WEBMASTERS_READONLY],
  });
  await auth.authorize();
  return google.searchconsole({ version: 'v1', auth });
}

export type SearchQueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };

export async function getSearchQueries(days: number, rowLimit = 50): Promise<SearchQueryRow[]> {
  const client = await getSearchConsoleClient();
  if (!client) return [];
  const safeDays = Math.min(Math.max(days, 1), 448);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - safeDays);
  const siteUrl = searchConsoleSiteUrl();

  const res = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      dimensions: ['query'],
      rowLimit,
      dimensionFilterGroups: [],
    },
  });

  return (res.data.rows ?? []).map((row) => ({
    query: row.keys?.[0] ?? '',
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: Math.round((row.ctr ?? 0) * 10000) / 100,
    position: Math.round((row.position ?? 0) * 10) / 10,
  }));
}

export type SearchTopPageRow = { page: string; clicks: number; impressions: number };

export async function getSearchTopPages(days: number, rowLimit = 25): Promise<SearchTopPageRow[]> {
  const client = await getSearchConsoleClient();
  if (!client) return [];
  const safeDays = Math.min(Math.max(days, 1), 448);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - safeDays);
  const siteUrl = searchConsoleSiteUrl();

  const res = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      dimensions: ['page'],
      rowLimit,
    },
  });

  return (res.data.rows ?? []).map((row) => ({
    page: row.keys?.[0] ?? '',
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
  }));
}

export type IndexingStatus = {
  submittedUrls: number;
  indexedUrls: number;
  sitemapErrors: number;
  sitemapWarnings: number;
};

export async function getIndexingStatus(): Promise<IndexingStatus> {
  const client = await getSearchConsoleClient();
  if (!client) {
    return { submittedUrls: 0, indexedUrls: 0, sitemapErrors: 0, sitemapWarnings: 0 };
  }
  const siteUrl = searchConsoleSiteUrl();
  const list = await client.sitemaps.list({ siteUrl });
  let submittedUrls = 0;
  let indexedUrls = 0;
  let sitemapErrors = 0;
  let sitemapWarnings = 0;
  for (const sm of list.data.sitemap ?? []) {
    sitemapErrors += Number(sm.errors ?? 0);
    sitemapWarnings += Number(sm.warnings ?? 0);
    for (const c of sm.contents ?? []) {
      const submitted = Number(c.submitted ?? 0);
      const indexed = Number(c.indexed ?? 0);
      submittedUrls += submitted;
      indexedUrls += indexed;
    }
  }
  return { submittedUrls, indexedUrls, sitemapErrors, sitemapWarnings };
}

export type CrawlErrorItem = { type: string; detail: string };

export async function getCrawlErrors(): Promise<CrawlErrorItem[]> {
  const client = await getSearchConsoleClient();
  if (!client) return [];
  const siteUrl = searchConsoleSiteUrl();
  const list = await client.sitemaps.list({ siteUrl });
  const out: CrawlErrorItem[] = [];
  for (const sm of list.data.sitemap ?? []) {
    const errN = Number(sm.errors ?? 0);
    const warnN = Number(sm.warnings ?? 0);
    if (errN > 0) {
      out.push({ type: 'sitemap', detail: `${sm.path ?? 'sitemap'} — ${errN} erreur(s)` });
    }
    if (warnN > 0) {
      out.push({ type: 'sitemap', detail: `${sm.path ?? 'sitemap'} — ${warnN} avertissement(s)` });
    }
  }
  try {
    const inspect = await client.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: siteUrl,
        siteUrl,
      },
    });
    const state = inspect.data.inspectionResult?.indexStatusResult?.indexingState;
    if (state && !state.toLowerCase().includes('indexed') && state !== 'INDEXING_ALLOWED') {
      out.push({ type: 'indexation', detail: state });
    }
  } catch {
    /* inspection peut échouer selon les droits / format d’URL */
  }
  return out;
}
