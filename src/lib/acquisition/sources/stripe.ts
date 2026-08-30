import Stripe from 'stripe';

import { stripeCollectedCurrentMonthEur } from '@/lib/admin/kpis';
import { createAdminClient } from '@/lib/supabase/admin';

import type { SourceResult, StripeAcquisitionMetrics } from './types';

const PROVIDER = 'stripe';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' });
}

/** Lecture seule — aucune écriture Stripe. */
export async function fetchStripeAcquisitionMetrics(): Promise<SourceResult<StripeAcquisitionMetrics>> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, provider: PROVIDER, error: 'STRIPE_SECRET_KEY absent.' };
  }
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: subs, error } = await admin
      .from('subscriptions')
      .select('status, stripe_subscription_id')
      .in('status', ['trialing', 'active']);
    if (error) {
      return { ok: false, provider: PROVIDER, error: `Supabase subscriptions : ${error.message}` };
    }
    const rows = subs ?? [];
    const activeTrials = rows.filter((r) => r.status === 'trialing').length;
    const activePaid = rows.filter((r) => r.status === 'active').length;

    const { count: converted } = await admin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('updated_at', since);

    const trialToPaidRate =
      activeTrials + activePaid > 0 && converted != null
        ? Math.round((converted / Math.max(activeTrials + activePaid, 1)) * 1000) / 10
        : null;

    const mrrEur = await stripeCollectedCurrentMonthEur();

    const { count: referralCount } = await admin
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'subscribed')
      .gte('converted_at', since);

    return {
      ok: true,
      data: {
        activeTrials,
        activePaid,
        trialToPaidRate,
        mrrEur,
        referralConversions30d: referralCount ?? null,
      },
    };
  } catch (e) {
    return {
      ok: false,
      provider: PROVIDER,
      error: e instanceof Error ? e.message : 'Erreur lecture Stripe/DB',
    };
  }
}
