import { createAdminClient } from '@/lib/supabase/admin';

import type { SourceResult, SupabaseAcquisitionMetrics } from './types';

const PROVIDER = 'supabase';

export async function fetchSupabaseAcquisitionMetrics(): Promise<SourceResult<SupabaseAcquisitionMetrics>> {
  try {
    const admin = createAdminClient();
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const since90 = new Date(Date.now() - 90 * 86400000).toISOString();

    const { count: newProfiles, error: pErr } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since30);
    if (pErr) {
      return { ok: false, provider: PROVIDER, error: `profiles : ${pErr.message}` };
    }

    const { data: subs, error: sErr } = await admin
      .from('subscriptions')
      .select('status')
      .in('status', ['trialing', 'active']);
    if (sErr) {
      return { ok: false, provider: PROVIDER, error: `subscriptions : ${sErr.message}` };
    }

    const trialingCount = (subs ?? []).filter((s) => s.status === 'trialing').length;
    const paidCount = (subs ?? []).filter((s) => s.status === 'active').length;

    const { count: cohort90 } = await admin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', since90);

    const { count: total90 } = await admin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since90);

    const retention90d =
      total90 && total90 > 0 && cohort90 != null
        ? Math.round((cohort90 / total90) * 1000) / 10
        : null;

    return {
      ok: true,
      data: {
        newProfiles30d: newProfiles ?? null,
        trialingCount,
        paidCount,
        retention90d,
      },
    };
  } catch (e) {
    return {
      ok: false,
      provider: PROVIDER,
      error: e instanceof Error ? e.message : 'Erreur Supabase',
    };
  }
}
