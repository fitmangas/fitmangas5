import { getSearchOverview } from '@/lib/google/search-console';
import { hasGoogleServiceAccountJson } from '@/lib/google/service-account';

import type { GscAcquisitionMetrics, SourceResult } from './types';

const PROVIDER = 'search_console';

export async function fetchGscAcquisitionMetrics(days = 28): Promise<SourceResult<GscAcquisitionMetrics>> {
  if (!hasGoogleServiceAccountJson()) {
    return {
      ok: false,
      provider: PROVIDER,
      error: 'GOOGLE_SERVICE_ACCOUNT_JSON absent — Search Console indisponible.',
    };
  }
  try {
    const overview = await getSearchOverview(days);
    return {
      ok: true,
      data: {
        clicks: overview?.clicks ?? null,
        impressions: overview?.impressions ?? null,
        ctr: overview?.ctr ?? null,
      },
    };
  } catch (e) {
    return {
      ok: false,
      provider: PROVIDER,
      error: e instanceof Error ? e.message : 'Erreur Search Console',
    };
  }
}
