'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import {
  getConversionRate,
  getPageViews,
  getRealtimeUsers,
  getTopPages,
  getTrafficSources,
  getUsersByCountry,
} from '@/lib/google/analytics';
import { hasGoogleServiceAccountJson } from '@/lib/google/service-account';

export async function fetchGaRealtimeUsers() {
  await requireAdmin();
  if (!hasGoogleServiceAccountJson()) return { ok: false as const, error: 'no_credentials' };
  try {
    const value = await getRealtimeUsers();
    return { ok: true as const, value };
  } catch (e) {
    console.error('[fetchGaRealtimeUsers]', e);
    return { ok: false as const, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function fetchGaDashboardBundle() {
  await requireAdmin();
  if (!hasGoogleServiceAccountJson()) return { ok: false as const, error: 'no_credentials' };
  try {
    const [pageViews, topPages, trafficSources, conversion, countries] = await Promise.all([
      getPageViews(30),
      getTopPages(30, 10),
      getTrafficSources(30),
      getConversionRate(30),
      getUsersByCountry(30),
    ]);
    return {
      ok: true as const,
      pageViews,
      topPages,
      trafficSources,
      conversion,
      countries,
    };
  } catch (e) {
    console.error('[fetchGaDashboardBundle]', e);
    return { ok: false as const, error: e instanceof Error ? e.message : 'unknown' };
  }
}
