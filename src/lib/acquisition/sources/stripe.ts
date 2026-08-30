import Stripe from 'stripe';

import { isRealStripeSubscriptionId } from '@/lib/admin/member-health';
import { createAdminClient } from '@/lib/supabase/admin';

import type { SourceResult, StripeAcquisitionMetrics } from './types';

const PROVIDER = 'stripe';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' });
}

function monthlyCents(priceCents: number, interval: string | null): number {
  if (interval === 'year') return Math.round(priceCents / 12);
  return priceCents;
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
      .select('status, stripe_subscription_id, price_cents, interval, updated_at, created_at')
      .in('status', ['trialing', 'active']);
    if (error) {
      return { ok: false, provider: PROVIDER, error: `Supabase subscriptions : ${error.message}` };
    }
    const rows = subs ?? [];
    const activeTrials = rows.filter((r) => r.status === 'trialing').length;
    const activePaidRows = rows.filter((r) => r.status === 'active');
    const activePaid = activePaidRows.length;

    const { count: converted } = await admin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('updated_at', since);

    const trialToPaidRate =
      activeTrials + activePaid > 0 && converted != null
        ? Math.round((converted / Math.max(activeTrials + activePaid, 1)) * 1000) / 10
        : null;

    const { count: newPaid30d } = await admin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', since);

    let mrrCents = 0;
    let paidArpuCents = 0;
    let paidArpuCount = 0;
    for (const row of rows) {
      if (!isRealStripeSubscriptionId(row.stripe_subscription_id)) continue;
      const cents = monthlyCents(row.price_cents ?? 0, row.interval ?? 'month');
      if (row.status === 'active' || row.status === 'trialing') {
        mrrCents += cents;
      }
      if (row.status === 'active') {
        paidArpuCents += cents;
        paidArpuCount += 1;
      }
    }
    const mrrEur = Math.round((mrrCents / 100) * 100) / 100;
    const arpuEur =
      paidArpuCount > 0 ? Math.round((paidArpuCents / paidArpuCount / 100) * 100) / 100 : null;

    const { data: statsRow } = await admin
      .from('business_stats_daily')
      .select('churn_rate_30d, mrr_eur')
      .order('stat_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const monthlyChurnRate =
      statsRow?.churn_rate_30d != null ? Number(statsRow.churn_rate_30d) : null;

    let ltvEur: number | null = null;
    if (arpuEur != null) {
      if (monthlyChurnRate != null && monthlyChurnRate > 0) {
        ltvEur = Math.round((arpuEur / (monthlyChurnRate / 100)) * 100) / 100;
      } else {
        ltvEur = Math.round(arpuEur * 12 * 100) / 100;
      }
    }

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
        arpuEur,
        monthlyChurnRate,
        ltvEur,
        newPaid30d: newPaid30d ?? null,
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
