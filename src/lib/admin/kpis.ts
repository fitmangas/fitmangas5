import Stripe from 'stripe';

import { createAdminClient } from '@/lib/supabase/admin';

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
