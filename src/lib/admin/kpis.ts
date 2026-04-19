import Stripe from 'stripe';

import { createAdminClient } from '@/lib/supabase/admin';

export type AdminKpis = {
  mrrEur: number | null;
  mrrSource: 'stripe' | 'db' | 'none';
  occupancyPercent: number | null;
  totalReplayViews: number;
};

async function mrrFromSubscriptionsDb(): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('subscriptions')
    .select('price_cents, interval, status, ends_at')
    .in('status', ['active', 'trialing']);

  if (error || !data?.length) return 0;
  const now = Date.now();
  let cents = 0;
  for (const row of data) {
    if (row.ends_at && new Date(row.ends_at).getTime() < now) continue;
    const p = row.price_cents ?? 0;
    if (row.interval === 'year') cents += Math.round(p / 12);
    else cents += p;
  }
  return cents / 100;
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

export async function getAdminKpis(): Promise<AdminKpis> {
  let mrrEur: number | null = null;
  let mrrSource: AdminKpis['mrrSource'] = 'none';
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
      mrrEur = await mrrFromSubscriptionsDb();
      mrrSource = 'db';
    } catch {
      mrrEur = null;
      mrrSource = 'none';
    }
  }

  const [occupancyPercent, totalReplayViews] = await Promise.all([
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
  ]);

  return {
    mrrEur,
    mrrSource,
    occupancyPercent,
    totalReplayViews,
  };
}
