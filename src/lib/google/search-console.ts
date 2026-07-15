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
      dataState: 'all',
      searchType: 'web',
      dimensionFilterGroups: [],
    },
  });

  const directRows = (res.data.rows ?? []).map((row) => ({
    query: row.keys?.[0] ?? '',
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: Math.round((row.ctr ?? 0) * 10000) / 100,
    position: Math.round((row.position ?? 0) * 10) / 10,
  }));
  if (directRows.length > 0) return directRows;

  // Search Console peut masquer la dimension query seule (requêtes anonymisées),
  // alors que query+page retourne encore quelques lignes exploitables.
  const fallback = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      dimensions: ['query', 'page'],
      rowLimit,
      dataState: 'all',
      searchType: 'web',
    },
  });
  const byQuery = new Map<string, { clicks: number; impressions: number; weightedPosition: number }>();
  for (const row of fallback.data.rows ?? []) {
    const query = row.keys?.[0]?.trim();
    if (!query) continue;
    const clicks = row.clicks ?? 0;
    const impressions = row.impressions ?? 0;
    const current = byQuery.get(query) ?? { clicks: 0, impressions: 0, weightedPosition: 0 };
    current.clicks += clicks;
    current.impressions += impressions;
    current.weightedPosition += (row.position ?? 0) * Math.max(impressions, 1);
    byQuery.set(query, current);
  }
  return [...byQuery.entries()]
    .map(([query, row]) => ({
      query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.impressions > 0 ? Math.round((row.clicks / row.impressions) * 10000) / 100 : 0,
      position: Math.round((row.weightedPosition / Math.max(row.impressions, 1)) * 10) / 10,
    }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, rowLimit);
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
      dataState: 'all',
      searchType: 'web',
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
  indexedUrls: number | null;
  indexedUrlsLabel: string;
  indexedUrlsSource: 'url_inspection' | 'search_analytics_estimate' | 'unavailable';
  searchAnalyticsUrlsWithImpressions: number;
  inspectedUrls: Array<{ url: string; verdict: string | null; coverageState: string | null; indexed: boolean | null }>;
  sitemapErrors: number;
  sitemapWarnings: number;
};

export async function getIndexingStatus(): Promise<IndexingStatus> {
  const client = await getSearchConsoleClient();
  if (!client) {
    return {
      submittedUrls: 0,
      indexedUrls: null,
      indexedUrlsLabel: 'Non disponible',
      indexedUrlsSource: 'unavailable',
      searchAnalyticsUrlsWithImpressions: 0,
      inspectedUrls: [],
      sitemapErrors: 0,
      sitemapWarnings: 0,
    };
  }
  const siteUrl = searchConsoleSiteUrl();
  const list = await client.sitemaps.list({ siteUrl });
  let submittedUrls = 0;
  let deprecatedIndexedUrls = 0;
  let sitemapErrors = 0;
  let sitemapWarnings = 0;
  for (const sm of list.data.sitemap ?? []) {
    sitemapErrors += Number(sm.errors ?? 0);
    sitemapWarnings += Number(sm.warnings ?? 0);
    for (const c of sm.contents ?? []) {
      const submitted = Number(c.submitted ?? 0);
      const indexed = Number(c.indexed ?? 0);
      submittedUrls += submitted;
      deprecatedIndexedUrls += indexed;
    }
  }

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 28);
  const pages = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      dimensions: ['page'],
      rowLimit: 100,
      dataState: 'all',
      searchType: 'web',
    },
  });
  const pagesWithImpressions = (pages.data.rows ?? [])
    .filter((row) => (row.impressions ?? 0) > 0)
    .map((row) => row.keys?.[0])
    .filter((url): url is string => Boolean(url));

  const inspectionCandidates = [
    'https://fitmangas.com/',
    'https://fitmangas.com/blog',
    ...pagesWithImpressions.slice(0, 3),
  ];
  const uniqueCandidates = [...new Set(inspectionCandidates)].slice(0, 5);
  const inspectedUrls: IndexingStatus['inspectedUrls'] = [];
  for (const url of uniqueCandidates) {
    try {
      const inspect = await client.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl,
        },
      });
      const status = inspect.data.inspectionResult?.indexStatusResult;
      const coverageState = status?.coverageState ?? null;
      const verdict = status?.verdict ?? null;
      inspectedUrls.push({
        url,
        verdict,
        coverageState,
        indexed: verdict === 'PASS' || coverageState?.toLowerCase().includes('indexed') || false,
      });
    } catch {
      inspectedUrls.push({ url, verdict: null, coverageState: null, indexed: null });
    }
  }

  const inspectedIndexed = inspectedUrls.filter((row) => row.indexed === true).length;
  if (inspectedUrls.length > 0 && inspectedIndexed > 0) {
    return {
      submittedUrls,
      indexedUrls: inspectedIndexed,
      indexedUrlsLabel: `${inspectedIndexed}/${inspectedUrls.length} vérifiées`,
      indexedUrlsSource: 'url_inspection',
      searchAnalyticsUrlsWithImpressions: pagesWithImpressions.length,
      inspectedUrls,
      sitemapErrors,
      sitemapWarnings,
    };
  }

  if (pagesWithImpressions.length > 0) {
    return {
      submittedUrls,
      indexedUrls: pagesWithImpressions.length,
      indexedUrlsLabel: `${pagesWithImpressions.length}+ estimées`,
      indexedUrlsSource: 'search_analytics_estimate',
      searchAnalyticsUrlsWithImpressions: pagesWithImpressions.length,
      inspectedUrls,
      sitemapErrors,
      sitemapWarnings,
    };
  }

  return {
    submittedUrls,
    indexedUrls: deprecatedIndexedUrls > 0 ? deprecatedIndexedUrls : null,
    indexedUrlsLabel: deprecatedIndexedUrls > 0 ? String(deprecatedIndexedUrls) : 'Non disponible',
    indexedUrlsSource: deprecatedIndexedUrls > 0 ? 'search_analytics_estimate' : 'unavailable',
    searchAnalyticsUrlsWithImpressions: 0,
    inspectedUrls,
    sitemapErrors,
    sitemapWarnings,
  };
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
