'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { getCrawlErrors, getIndexingStatus, getSearchQueries, getSearchTopPages } from '@/lib/google/search-console';
import { hasGoogleServiceAccountJson } from '@/lib/google/service-account';

export async function fetchSearchConsoleBundle() {
  await requireAdmin();
  if (!hasGoogleServiceAccountJson()) return { ok: false as const, error: 'no_credentials' };
  try {
    const [queries, topPages, indexing, crawlErrors] = await Promise.all([
      getSearchQueries(28, 50),
      getSearchTopPages(28, 25),
      getIndexingStatus(),
      getCrawlErrors(),
    ]);
    const queriesSorted = [...queries].sort((a, b) => b.clicks - a.clicks);
    return { ok: true as const, queries: queriesSorted, topPages, indexing, crawlErrors };
  } catch (e) {
    console.error('[fetchSearchConsoleBundle]', e);
    return { ok: false as const, error: e instanceof Error ? e.message : 'unknown' };
  }
}
