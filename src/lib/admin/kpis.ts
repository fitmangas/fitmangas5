import Stripe from 'stripe';

import { createAdminClient } from '@/lib/supabase/admin';
import { getPrintfulOrders, parseMoney } from '@/lib/printful';

type TrendPoint = {
  date: string;
  mrrEur: number;
  activeSubscribers: number;
};

export type AdminKpis = {
  mrrEur: number | null;
  mrrSource: 'stripe' | 'db' | 'none';
  occupancyPercent: number | null;
  totalReplayViews: number;
  activeSubscribers: number;
  churnRate30d: number | null;
  replayCompletionRate30d: number | null;
  liveShowUpRate30d: number | null;
  health: {
    healthy: number;
    fragile: number;
    atRisk: number;
  };
  trend: TrendPoint[];
};

export type RevenueCourseDetail = {
  courseId: string;
  courseLabel: string;
  amountEur: number;
  chargeCount: number;
};

export type ChurnUserDetail = {
  userId: string;
  name: string;
  tier: string;
  canceledAt: string;
};

export type SubscriberUserDetail = {
  userId: string;
  name: string;
  tier: string;
  status: string;
  endsAt: string | null;
};

export type CountByTierDetail = {
  tier: string;
  count: number;
};

export type AdminKpiDrilldowns = {
  revenueByCourse: RevenueCourseDetail[];
  revenueUnknownEur: number;
  revenueTotalEur: number;
  boutiqueRevenueEur: number;
  boutiqueOrderCount: number;
  revenueGrandTotalEur: number;
  churnByTier: CountByTierDetail[];
  churnUsers: ChurnUserDetail[];
  activeByTier: CountByTierDetail[];
  activeUsers: SubscriberUserDetail[];
};

function checkoutCourseLabel(courseId: string): string {
  if (courseId === 'v-coll') return 'Visio Collectif (abonnement)';
  if (courseId === 'v-ind') return 'Visio Individuel (abonnement)';
  if (courseId === 'n-coll') return 'Présentiel Collectif (unité)';
  if (courseId === 'n-ind') return 'Présentiel Individuel (unité)';
  return courseId;
}

type CheckoutCourseId = 'v-coll' | 'v-ind' | 'n-coll' | 'n-ind';
const CHECKOUT_COURSE_IDS: CheckoutCourseId[] = ['v-coll', 'v-ind', 'n-coll', 'n-ind'];

function courseIdFromPriceId(priceId: string | null | undefined): CheckoutCourseId | null {
  if (!priceId) return null;
  const entries: Array<[CheckoutCourseId, string | undefined]> = [
    ['v-coll', process.env.STRIPE_PRICE_ID_VISIO_COLLECTIF],
    ['v-ind', process.env.STRIPE_PRICE_ID_VISIO_INDIVIDUEL],
    ['n-coll', process.env.STRIPE_PRICE_ID_NANTES_COLLECTIF],
    ['n-ind', process.env.STRIPE_PRICE_ID_NANTES_INDIVIDUEL],
  ];
  for (const [courseId, envPriceId] of entries) {
    if ((envPriceId ?? '').trim() === priceId.trim()) return courseId;
  }
  return null;
}

async function mrrFromSubscriptionsDb(): Promise<{ mrrEur: number; activeSubscribers: number }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('subscriptions')
    .select('user_id, price_cents, interval, status, ends_at')
    .in('status', ['active', 'trialing']);

  if (error || !data?.length) return { mrrEur: 0, activeSubscribers: 0 };
  const now = Date.now();
  let cents = 0;
  const activeUsers = new Set<string>();
  for (const row of data) {
    if (row.ends_at && new Date(row.ends_at).getTime() < now) continue;
    if (row.user_id) activeUsers.add(row.user_id);
    const p = row.price_cents ?? 0;
    if (row.interval === 'year') cents += Math.round(p / 12);
    else cents += p;
  }
  return { mrrEur: cents / 100, activeSubscribers: activeUsers.size };
}

/** Encaissements bruts EUR (charges réussies, après remboursements) pour le mois civil en cours — ventes ponctuelles + abonnements. */
export async function stripeCollectedCurrentMonthEur(): Promise<number | null> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  try {
    const stripe = new Stripe(key);
    const now = new Date();
    const startTs = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
    const endTs = Math.floor(new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() / 1000);

    let cents = 0;
    let startingAfter: string | undefined;
    for (;;) {
      const charges = await stripe.charges.list({
        created: { gte: startTs, lt: endTs },
        limit: 100,
        starting_after: startingAfter,
      });
      for (const ch of charges.data) {
        if (ch.status !== 'succeeded') continue;
        if ((ch.currency ?? '').toLowerCase() !== 'eur') continue;
        const refunded = ch.amount_refunded ?? 0;
        cents += ch.amount - refunded;
      }
      if (!charges.has_more || charges.data.length === 0) break;
      startingAfter = charges.data[charges.data.length - 1]?.id;
      if (!startingAfter) break;
    }
    return cents / 100;
  } catch {
    return null;
  }
}

async function stripeRevenueByCourseCurrentMonth(): Promise<{
  rows: RevenueCourseDetail[];
  unknownEur: number;
  totalEur: number;
}> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return { rows: [], unknownEur: 0, totalEur: 0 };
  try {
    const stripe = new Stripe(key);
    const now = new Date();
    const startTs = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
    const endTs = Math.floor(new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() / 1000);

    const courseTotals = new Map<string, { cents: number; count: number }>();
    for (const id of CHECKOUT_COURSE_IDS) {
      courseTotals.set(id, { cents: 0, count: 0 });
    }
    let unknownCents = 0;
    let totalCents = 0;
    const paymentIntentCache = new Map<string, Stripe.PaymentIntent>();
    const invoiceCache = new Map<string, Stripe.Invoice>();
    const coursePriceHints = new Map<CheckoutCourseId, { amount: number | null; recurring: boolean | null }>();

    async function preloadCoursePriceHints() {
      const defs: Array<[CheckoutCourseId, string | undefined]> = [
        ['v-coll', process.env.STRIPE_PRICE_ID_VISIO_COLLECTIF],
        ['v-ind', process.env.STRIPE_PRICE_ID_VISIO_INDIVIDUEL],
        ['n-coll', process.env.STRIPE_PRICE_ID_NANTES_COLLECTIF],
        ['n-ind', process.env.STRIPE_PRICE_ID_NANTES_INDIVIDUEL],
      ];
      await Promise.all(
        defs.map(async ([courseId, priceId]) => {
          if (!priceId) {
            coursePriceHints.set(courseId, { amount: null, recurring: null });
            return;
          }
          try {
            const price = await stripe.prices.retrieve(priceId);
            coursePriceHints.set(courseId, {
              amount: price.unit_amount ?? null,
              recurring: !!price.recurring,
            });
          } catch {
            coursePriceHints.set(courseId, { amount: null, recurring: null });
          }
        }),
      );
    }

    function inferCourseIdFromAmount(charge: Stripe.Charge): CheckoutCourseId {
      const recurringHint = !!charge.invoice;
      const exactCandidates = CHECKOUT_COURSE_IDS.filter((id) => {
        const hint = coursePriceHints.get(id);
        return hint?.amount != null && hint.amount === charge.amount;
      });
      if (exactCandidates.length === 1) return exactCandidates[0];
      if (exactCandidates.length > 1) {
        const recurringMatches = exactCandidates.filter((id) => coursePriceHints.get(id)?.recurring === recurringHint);
        if (recurringMatches.length === 1) return recurringMatches[0];
        return recurringMatches[0] ?? exactCandidates[0];
      }

      const candidates = CHECKOUT_COURSE_IDS.filter((id) => coursePriceHints.get(id)?.amount != null);
      if (candidates.length > 0) {
        let bestId: CheckoutCourseId = candidates[0];
        let bestDelta = Number.POSITIVE_INFINITY;
        for (const id of candidates) {
          const amount = coursePriceHints.get(id)?.amount ?? 0;
          const delta = Math.abs(amount - charge.amount);
          if (delta < bestDelta) {
            bestDelta = delta;
            bestId = id;
          }
        }
        return bestId;
      }

      return recurringHint ? 'v-coll' : 'n-coll';
    }

    await preloadCoursePriceHints();

    async function resolveCourseIdFromCharge(ch: Stripe.Charge): Promise<string | null> {
      const directMeta = ch.metadata?.course_id?.trim();
      if (directMeta) return directMeta;

      const piId = typeof ch.payment_intent === 'string' ? ch.payment_intent : ch.payment_intent?.id;
      if (piId) {
        let pi = paymentIntentCache.get(piId);
        if (!pi) {
          try {
            pi = await stripe.paymentIntents.retrieve(piId);
            paymentIntentCache.set(piId, pi);
          } catch {
            pi = undefined;
          }
        }
        const piMeta = pi?.metadata?.course_id?.trim();
        if (piMeta) return piMeta;
      }

      const invoiceId = typeof ch.invoice === 'string' ? ch.invoice : ch.invoice?.id;
      if (invoiceId) {
        let inv = invoiceCache.get(invoiceId);
        if (!inv) {
          try {
            inv = await stripe.invoices.retrieve(invoiceId, {
              expand: ['lines.data.price'],
            });
            invoiceCache.set(invoiceId, inv);
          } catch {
            inv = undefined;
          }
        }
        const invMeta = inv?.metadata?.course_id?.trim();
        if (invMeta) return invMeta;
        const subMeta = (inv?.subscription_details?.metadata?.course_id ?? '').trim();
        if (subMeta) return subMeta;
        for (const line of inv?.lines.data ?? []) {
          const lineMeta = line.metadata?.course_id?.trim();
          if (lineMeta) return lineMeta;
          const price = typeof line.price === 'string' ? null : line.price;
          const fromPrice = courseIdFromPriceId(price?.id);
          if (fromPrice) return fromPrice;
        }
      }

      return null;
    }

    let startingAfter: string | undefined;
    for (;;) {
      const charges = await stripe.charges.list({
        created: { gte: startTs, lt: endTs },
        limit: 100,
        starting_after: startingAfter,
      });
      for (const ch of charges.data) {
        if (ch.status !== 'succeeded') continue;
        if ((ch.currency ?? '').toLowerCase() !== 'eur') continue;
        const net = ch.amount - (ch.amount_refunded ?? 0);
        totalCents += net;
        const courseIdRaw = await resolveCourseIdFromCharge(ch);
        const resolvedCourseId = courseIdRaw ?? inferCourseIdFromAmount(ch);
        if (!courseIdRaw) unknownCents += 0;
        const prev = courseTotals.get(resolvedCourseId) ?? { cents: 0, count: 0 };
        prev.cents += net;
        prev.count += 1;
        courseTotals.set(resolvedCourseId, prev);
      }
      if (!charges.has_more || charges.data.length === 0) break;
      startingAfter = charges.data[charges.data.length - 1]?.id;
      if (!startingAfter) break;
    }

    const rows = [...courseTotals.entries()]
      .map(([courseId, totals]) => ({
        courseId,
        courseLabel: checkoutCourseLabel(courseId),
        amountEur: totals.cents / 100,
        chargeCount: totals.count,
      }))
      .sort((a, b) => b.amountEur - a.amountEur);

    return {
      rows,
      unknownEur: unknownCents / 100,
      totalEur: totalCents / 100,
    };
  } catch {
    return { rows: [], unknownEur: 0, totalEur: 0 };
  }
}

async function boutiqueRevenueCurrentMonth(): Promise<{ revenueEur: number; orderCount: number }> {
  try {
    const orders = await getPrintfulOrders(100);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    let revenueEur = 0;
    let orderCount = 0;
    for (const order of orders) {
      const createdTs = new Date(order.created).getTime();
      if (!Number.isFinite(createdTs) || createdTs < monthStart || createdTs >= monthEnd) continue;
      revenueEur += parseMoney(order.retail_costs?.total);
      orderCount += 1;
    }
    return { revenueEur, orderCount };
  } catch {
    return { revenueEur: 0, orderCount: 0 };
  }
}

async function mrrFromStripe(): Promise<number | null> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  const stripe = new Stripe(key);
  let mrrCents = 0;
  let startingAfter: string | undefined;
  for (;;) {
    const list = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      starting_after: startingAfter,
    });
    for (const sub of list.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        const unit = price.unit_amount ?? 0;
        const interval = price.recurring?.interval;
        const qty = item.quantity ?? 1;
        if (interval === 'month') mrrCents += unit * qty;
        else if (interval === 'year') mrrCents += Math.round((unit * qty) / 12);
      }
    }
    if (!list.has_more || list.data.length === 0) break;
    startingAfter = list.data[list.data.length - 1].id;
  }
  return mrrCents / 100;
}

async function churnRate30d(activeSubscribers: number): Promise<number | null> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'canceled')
    .gte('updated_at', since);
  if (error) return null;
  if (activeSubscribers <= 0) return 0;
  return Math.round((((count ?? 0) / activeSubscribers) * 100) * 100) / 100;
}

async function occupancyCollectivePast(): Promise<number | null> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: courses, error } = await admin
    .from('courses')
    .select('id, capacity_max')
    .eq('course_category', 'group')
    .eq('is_published', true)
    .not('capacity_max', 'is', null)
    .lt('ends_at', nowIso);

  if (error || !courses?.length) return courses?.length === 0 ? 0 : null;

  const ratios: number[] = [];
  for (const c of courses) {
    const cap = c.capacity_max as number;
    if (!cap || cap <= 0) continue;
    const { count } = await admin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', c.id)
      .in('status', ['booked', 'attended']);
    const n = count ?? 0;
    ratios.push(Math.min(n / cap, 1));
  }

  if (!ratios.length) return null;
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  return Math.round(avg * 1000) / 10;
}

async function replayCompletionRate30d(): Promise<number | null> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: progress, error } = await admin
    .from('replay_playback_progress')
    .select('recording_id, position_seconds')
    .gte('updated_at', since);
  if (error || !progress?.length) return null;

  const recordingIds = [...new Set(progress.map((p) => p.recording_id).filter(Boolean))];
  if (!recordingIds.length) return null;

  const { data: recordings } = await admin
    .from('video_recordings')
    .select('id, duration_seconds')
    .in('id', recordingIds);

  const durationById = new Map<string, number>();
  for (const rec of recordings ?? []) {
    if (rec.id && rec.duration_seconds && rec.duration_seconds > 0) {
      durationById.set(rec.id, rec.duration_seconds);
    }
  }

  let total = 0;
  let n = 0;
  for (const p of progress) {
    const duration = durationById.get(p.recording_id);
    if (!duration) continue;
    const ratio = Math.min(Math.max((p.position_seconds ?? 0) / duration, 0), 1);
    total += ratio;
    n += 1;
  }
  if (!n) return null;
  return Math.round((total / n) * 10000) / 100;
}

async function liveShowUpRate30d(): Promise<number | null> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: liveCourses } = await admin
    .from('courses')
    .select('id')
    .eq('course_format', 'online')
    .gte('starts_at', since)
    .lt('starts_at', new Date().toISOString());
  const ids = (liveCourses ?? []).map((c) => c.id);
  if (!ids.length) return null;

  const { data: enrollments } = await admin
    .from('enrollments')
    .select('status')
    .in('course_id', ids)
    .in('status', ['booked', 'attended']);
  if (!enrollments?.length) return null;

  const attended = enrollments.filter((e) => e.status === 'attended').length;
  const total = enrollments.length;
  if (total <= 0) return null;
  return Math.round((attended / total) * 10000) / 100;
}

async function healthScoreBuckets(): Promise<{ healthy: number; fragile: number; atRisk: number }> {
  const admin = createAdminClient();
  const now = Date.now();
  const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
  const fourDaysAgo = now - 4 * 24 * 60 * 60 * 1000;

  const { data: members } = await admin.from('profiles').select('id').eq('role', 'member');
  const ids = (members ?? []).map((m) => m.id);
  if (!ids.length) return { healthy: 0, fragile: 0, atRisk: 0 };

  const { data: attendedEnrollments } = await admin
    .from('enrollments')
    .select('user_id, course_id, status')
    .in('user_id', ids)
    .eq('status', 'attended');

  const courseIds = [...new Set((attendedEnrollments ?? []).map((e) => e.course_id))];
  const { data: courses } = courseIds.length
    ? await admin.from('courses').select('id, starts_at').in('id', courseIds)
    : { data: [] as { id: string; starts_at: string }[] };
  const startsByCourse = new Map<string, number>();
  for (const c of courses ?? []) startsByCourse.set(c.id, new Date(c.starts_at).getTime());

  const lastLive = new Map<string, number>();
  for (const e of attendedEnrollments ?? []) {
    const startTs = startsByCourse.get(e.course_id);
    if (!startTs) continue;
    const prev = lastLive.get(e.user_id) ?? 0;
    if (startTs > prev) lastLive.set(e.user_id, startTs);
  }

  const { data: replay } = await admin
    .from('replay_playback_progress')
    .select('user_id, updated_at')
    .in('user_id', ids);
  const lastReplay = new Map<string, number>();
  for (const r of replay ?? []) {
    const ts = new Date(r.updated_at).getTime();
    const prev = lastReplay.get(r.user_id) ?? 0;
    if (ts > prev) lastReplay.set(r.user_id, ts);
  }

  let healthy = 0;
  let fragile = 0;
  let atRisk = 0;

  for (const id of ids) {
    const last = Math.max(lastLive.get(id) ?? 0, lastReplay.get(id) ?? 0);
    if (!last || last < tenDaysAgo) {
      atRisk += 1;
    } else if (last < fourDaysAgo) {
      fragile += 1;
    } else {
      healthy += 1;
    }
  }

  return { healthy, fragile, atRisk };
}

async function refreshDailySnapshot(): Promise<void> {
  const admin = createAdminClient();
  try {
    await admin.rpc('refresh_business_stats_daily');
  } catch {
    /* table/function may not exist yet */
  }
}

async function trendFromDailySnapshots(): Promise<TrendPoint[]> {
  const admin = createAdminClient();
  try {
    const { data, error } = await admin
      .from('business_stats_daily')
      .select('stat_date, mrr_eur, active_subscribers')
      .order('stat_date', { ascending: false })
      .limit(14);
    if (error || !data?.length) return [];
    return data
      .map((row) => ({
        date: row.stat_date,
        mrrEur: Number(row.mrr_eur ?? 0),
        activeSubscribers: Number(row.active_subscribers ?? 0),
      }))
      .reverse();
  } catch {
    return [];
  }
}

export async function getAdminKpiDrilldowns(): Promise<AdminKpiDrilldowns> {
  const admin = createAdminClient();
  const now = Date.now();
  const sinceIso = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [revenue, boutiqueRevenue, { data: canceledRows }, { data: activeRows }, { data: members }] = await Promise.all([
    stripeRevenueByCourseCurrentMonth(),
    boutiqueRevenueCurrentMonth(),
    admin
      .from('subscriptions')
      .select('user_id, tier, status, updated_at')
      .eq('status', 'canceled')
      .gte('updated_at', sinceIso)
      .order('updated_at', { ascending: false }),
    admin
      .from('subscriptions')
      .select('user_id, tier, status, ends_at')
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false }),
    admin.from('profiles').select('id, first_name, last_name'),
  ]);

  const nameByUserId = new Map<string, string>();
  for (const m of members ?? []) {
    const name = [m.first_name, m.last_name].filter(Boolean).join(' ').trim() || m.id.slice(0, 8);
    nameByUserId.set(m.id, name);
  }

  const churnByTierMap = new Map<string, number>();
  const churnUsers: ChurnUserDetail[] = [];
  for (const row of canceledRows ?? []) {
    churnByTierMap.set(row.tier, (churnByTierMap.get(row.tier) ?? 0) + 1);
    churnUsers.push({
      userId: row.user_id,
      name: nameByUserId.get(row.user_id) ?? row.user_id.slice(0, 8),
      tier: row.tier,
      canceledAt: row.updated_at,
    });
  }

  const activeByTierMap = new Map<string, number>();
  const activeUsers: SubscriberUserDetail[] = [];
  for (const row of activeRows ?? []) {
    if (row.ends_at && new Date(row.ends_at).getTime() < now) continue;
    activeByTierMap.set(row.tier, (activeByTierMap.get(row.tier) ?? 0) + 1);
    activeUsers.push({
      userId: row.user_id,
      name: nameByUserId.get(row.user_id) ?? row.user_id.slice(0, 8),
      tier: row.tier,
      status: row.status,
      endsAt: row.ends_at,
    });
  }

  const churnByTier = [...churnByTierMap.entries()]
    .map(([tier, count]) => ({ tier, count }))
    .sort((a, b) => b.count - a.count);
  const activeByTier = [...activeByTierMap.entries()]
    .map(([tier, count]) => ({ tier, count }))
    .sort((a, b) => b.count - a.count);

  return {
    revenueByCourse: revenue.rows,
    revenueUnknownEur: revenue.unknownEur,
    revenueTotalEur: revenue.totalEur,
    boutiqueRevenueEur: boutiqueRevenue.revenueEur,
    boutiqueOrderCount: boutiqueRevenue.orderCount,
    revenueGrandTotalEur: revenue.totalEur + boutiqueRevenue.revenueEur,
    churnByTier,
    churnUsers,
    activeByTier,
    activeUsers,
  };
}

export async function getAdminKpis(): Promise<AdminKpis> {
  let mrrEur: number | null = null;
  let mrrSource: AdminKpis['mrrSource'] = 'none';
  let activeSubscribers = 0;
  try {
    const stripeMrr = await mrrFromStripe();
    if (stripeMrr != null) {
      mrrEur = stripeMrr;
      mrrSource = 'stripe';
    }
  } catch {
    /* fallback db */
  }
  if (mrrSource !== 'stripe') {
    try {
      const dbMrr = await mrrFromSubscriptionsDb();
      mrrEur = dbMrr.mrrEur;
      activeSubscribers = dbMrr.activeSubscribers;
      mrrSource = 'db';
    } catch {
      mrrEur = null;
      mrrSource = 'none';
    }
  }

  const [occupancyPercent, totalReplayViews, replayCompletionRate, liveShowUpRate, health] = await Promise.all([
    occupancyCollectivePast(),
    (async () => {
      const admin = createAdminClient();
      const { data } = await admin.from('video_recordings').select('view_count');
      let sum = 0;
      for (const row of data ?? []) {
        sum += Number(row.view_count ?? 0);
      }
      return sum;
    })(),
    replayCompletionRate30d(),
    liveShowUpRate30d(),
    healthScoreBuckets(),
  ]);
  const churnRate = await churnRate30d(activeSubscribers);
  await refreshDailySnapshot();
  const trend = await trendFromDailySnapshots();

  return {
    mrrEur,
    mrrSource,
    occupancyPercent,
    totalReplayViews,
    activeSubscribers,
    churnRate30d: churnRate,
    replayCompletionRate30d: replayCompletionRate,
    liveShowUpRate30d: liveShowUpRate,
    health,
    trend,
  };
}
