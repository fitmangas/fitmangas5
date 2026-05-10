import type { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

import { COURSE_CUSTOMER_TIER, COURSE_PRICE_CENTS } from '@/lib/checkout-courses';
import { sendPublicationNewsletter } from '@/lib/blog/newsletter-double-optin';
import { notifyMembersNewBlogArticle } from '@/lib/blog/publish-notifications';
import { COACH_PUBLISH_TIMEZONE, calendarDayKeyInTimeZone, formatInUserTimezone, isWithinCoachMorningPublishWindow } from './timezone';
import { dispatch } from './dispatcher';
import { runPhase3DailyJobs } from './phase3';

type DispatchFn = typeof dispatch;

type Profile = {
  id: string;
  first_name?: string | null;
  display_timezone?: string | null;
  preferred_locale?: string | null;
  created_at?: string | null;
  stripe_customer_id?: string | null;
};

type SubscriptionRow = {
  user_id: string;
  tier: string;
  status: string;
  starts_at: string;
  ends_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  profiles?: Profile | Profile[] | null;
};

type Course = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  timezone?: string | null;
  course_format: 'online' | 'onsite';
  course_category: 'individual' | 'group';
  live_url?: string | null;
  jitsi_link?: string | null;
  replay_url?: string | null;
};

type EnrollmentRow = {
  user_id: string;
  course_id: string;
  status: string;
  profiles?: Profile | Profile[] | null;
  courses?: Course | Course[] | null;
};

type Phase2Deps = {
  dispatch?: DispatchFn;
  now?: Date;
  stripe?: Stripe;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const APP_URL = () => (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas5.vercel.app').replace(/\/$/, '');

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function dayDiffInZone(fromIso: string, to: Date, timeZone: string) {
  const fromDay = calendarDayKeyInTimeZone(timeZone, new Date(fromIso));
  const toDay = calendarDayKeyInTimeZone(timeZone, to);
  return Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / DAY_MS);
}

function channelHintsFor(eventType: string): ('in_app' | 'email' | 'push' | 'digest')[] {
  if (eventType === 'onboarding.day1' || eventType === 'onboarding.day7' || eventType === 'subscription.win_back_J+30') return ['email'];
  if (eventType === 'subscription.renewed') return ['email'];
  if (eventType.endsWith('reminder_H-1') || eventType.endsWith('reminder_H-2')) return ['in_app', 'push'];
  return ['in_app', 'email', 'push'];
}

async function send(
  client: SupabaseClient,
  dispatchFn: DispatchFn,
  params: {
    userId: string;
    eventType: string;
    title: string;
    body: string;
    idempotencyKey: string;
    payload?: Record<string, unknown>;
    channelHints?: ('in_app' | 'email' | 'push' | 'digest')[];
  },
) {
  return dispatchFn(
    client,
    {
      event_type: params.eventType,
      user_id: params.userId,
      payload: {
        title: params.title,
        body: params.body,
        kind: params.eventType,
        appUrl: APP_URL(),
        ...params.payload,
      },
      channel_hints: params.channelHints ?? channelHintsFor(params.eventType),
      idempotency_key: params.idempotencyKey,
    },
  );
}

export async function runOnboardingCycle(client: SupabaseClient, deps: Phase2Deps = {}) {
  const now = deps.now ?? new Date();
  const dispatchFn = deps.dispatch ?? dispatch;
  const { data, error } = await client
    .from('subscriptions')
    .select('user_id, tier, status, starts_at, stripe_customer_id, profiles!inner(id, first_name, display_timezone, preferred_locale, created_at)')
    .in('status', ['active', 'trialing']);
  if (error) throw error;

  let sent = 0;
  for (const row of (data ?? []) as SubscriptionRow[]) {
    if (!row.tier.startsWith('online_')) continue;
    const profile = first(row.profiles);
    const tz = profile?.display_timezone?.trim() || 'Europe/Paris';
    const days = dayDiffInZone(row.starts_at || profile?.created_at || now.toISOString(), now, tz);
    const eventType = days === 1 ? 'onboarding.day1' : days === 3 ? 'onboarding.day3' : days === 7 ? 'onboarding.day7' : null;
    if (!eventType) continue;
    await send(client, dispatchFn, {
      userId: row.user_id,
      eventType,
      title: eventType === 'onboarding.day3' ? 'Découvrez vos ressources membres' : 'Votre parcours FitMangas continue',
      body: eventType === 'onboarding.day1' ? 'Premier pas : choisissez votre prochain cours visio.' : 'Votre espace membre vous accompagne entre deux séances.',
      idempotencyKey: `${eventType}:${row.user_id}`,
      payload: { firstName: profile?.first_name, courseUrl: `${APP_URL()}/compte/planning`, resourcesUrl: `${APP_URL()}/compte/blog` },
    });
    sent += 1;
  }
  return { sent };
}

export async function runWinBackCycle(client: SupabaseClient, deps: Phase2Deps = {}) {
  const now = deps.now ?? new Date();
  const dispatchFn = deps.dispatch ?? dispatch;
  const { data, error } = await client
    .from('subscriptions')
    .select('user_id, tier, status, ends_at, profiles!inner(id, display_timezone)')
    .eq('status', 'canceled')
    .not('ends_at', 'is', null);
  if (error) throw error;

  let sent = 0;
  for (const row of (data ?? []) as SubscriptionRow[]) {
    if (!row.tier.startsWith('online_') || !row.ends_at) continue;
    const profile = first(row.profiles);
    const tz = profile?.display_timezone?.trim() || 'Europe/Paris';
    if (dayDiffInZone(row.ends_at, now, tz) !== 30) continue;
    await send(client, dispatchFn, {
      userId: row.user_id,
      eventType: 'subscription.win_back_J+30',
      title: 'Vous nous manquez',
      body: 'Revenez quand vous voulez : votre abonnement collectif visio est disponible à 39€/mois.',
      idempotencyKey: `subscription.win_back_J+30:${row.user_id}`,
      channelHints: ['email'],
    });
    sent += 1;
  }
  return { sent };
}

function localHour(date: Date, timeZone: string) {
  const part = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hour12: false }).formatToParts(date).find((p) => p.type === 'hour')?.value;
  return Number(part ?? NaN);
}

function minutesUntil(startsAt: string, now: Date) {
  return Math.round((new Date(startsAt).getTime() - now.getTime()) / 60000);
}

export async function runCourseCycles(client: SupabaseClient, deps: Phase2Deps = {}) {
  const now = deps.now ?? new Date();
  const dispatchFn = deps.dispatch ?? dispatch;
  const lower = new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString();
  const upper = new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from('enrollments')
    .select('user_id, course_id, status, profiles!inner(id, first_name, display_timezone, preferred_locale), courses!inner(id, title, starts_at, ends_at, timezone, course_format, course_category, live_url, jitsi_link, replay_url)')
    .in('status', ['booked'])
    .gte('courses.starts_at', lower)
    .lte('courses.starts_at', upper);
  if (error) throw error;

  let sent = 0;
  for (const row of (data ?? []) as EnrollmentRow[]) {
    const profile = first(row.profiles);
    const course = first(row.courses);
    if (!course) continue;
    const tz = course.course_format === 'onsite' ? 'Europe/Paris' : profile?.display_timezone?.trim() || course.timezone || 'Europe/Paris';
    const dayDelta = dayDiffInZone(now.toISOString(), new Date(course.starts_at), tz);
    const hour = localHour(now, tz);
    const mins = minutesUntil(course.starts_at, now);
    const courseTime = formatInUserTimezone(new Date(course.starts_at), tz, profile?.preferred_locale === 'es' ? 'es' : 'fr', 'HH:mm');
    const common = {
      courseTitle: course.title,
      courseDate: formatInUserTimezone(new Date(course.starts_at), tz, profile?.preferred_locale === 'es' ? 'es' : 'fr', 'PPPP'),
      courseTime,
      joinUrl: course.jitsi_link || course.live_url || `${APP_URL()}/compte/planning`,
      replayUrl: course.replay_url || `${APP_URL()}/compte/replays`,
    };
    if (course.course_format === 'online' && dayDelta === 1 && hour === 18) {
      await send(client, dispatchFn, {
        userId: row.user_id,
        eventType: 'course.visio.reminder_J-1',
        title: `Rappel : ${course.title} demain à ${courseTime}`,
        body: 'Votre cours visio est prévu demain.',
        idempotencyKey: `course.visio.reminder_J-1:${course.id}:${row.user_id}`,
        payload: common,
      });
      sent += 1;
    }
    if (course.course_format === 'online' && mins >= 55 && mins <= 65) {
      await send(client, dispatchFn, {
        userId: row.user_id,
        eventType: 'course.visio.reminder_H-1',
        title: 'Votre cours commence dans 1h',
        body: 'Rejoindre le cours.',
        idempotencyKey: `course.visio.reminder_H-1:${course.id}:${row.user_id}`,
        payload: common,
        channelHints: ['in_app', 'push'],
      });
      sent += 1;
    }
    if (course.course_format === 'onsite' && dayDelta === 1 && hour === 18) {
      await send(client, dispatchFn, {
        userId: row.user_id,
        eventType: 'course.presential.reminder_J-1',
        title: `Rappel : séance demain à ${courseTime}`,
        body: 'Adresse : 17 Passage Leroy, 44300 Nantes.',
        idempotencyKey: `course.presential.reminder_J-1:${course.id}:${row.user_id}`,
        payload: common,
      });
      sent += 1;
    }
    if (course.course_format === 'onsite' && mins >= 115 && mins <= 125) {
      await send(client, dispatchFn, {
        userId: row.user_id,
        eventType: 'course.presential.reminder_H-2',
        title: 'Votre séance commence dans 2h',
        body: 'Bon trajet !',
        idempotencyKey: `course.presential.reminder_H-2:${course.id}:${row.user_id}`,
        payload: common,
        channelHints: ['in_app', 'push'],
      });
      sent += 1;
    }
    if (dayDiffInZone(course.ends_at, now, tz) === 1) {
      await send(client, dispatchFn, {
        userId: row.user_id,
        eventType: course.course_format === 'onsite' ? 'course.presential.missed' : 'course.visio.missed',
        title: course.course_format === 'onsite' ? 'Vous avez manqué votre séance' : 'Vous avez manqué le cours',
        body: course.course_format === 'onsite' ? 'Nous espérons vous revoir très vite.' : 'Voici le replay dès qu’il est disponible.',
        idempotencyKey: `course.${course.course_format === 'onsite' ? 'presential' : 'visio'}.missed:${course.id}:${row.user_id}`,
        payload: common,
      });
      sent += 1;
    }
  }
  return { sent };
}

export async function runBlogPublishScheduled(client: SupabaseClient, now = new Date()) {
  if (!isWithinCoachMorningPublishWindow(now, COACH_PUBLISH_TIMEZONE)) {
    return { skipped: true, reason: 'outside_coach_publish_window', published: 0 };
  }
  const { data, error } = await client
    .from('blog_articles')
    .select('id, title_fr, slug_fr')
    .eq('status', 'validated')
    .lte('scheduled_publication_at', now.toISOString());
  if (error) throw error;

  let published = 0;
  for (const row of (data ?? []) as { id: string; title_fr: string; slug_fr: string }[]) {
    const { error: updateError } = await client.from('blog_articles').update({ status: 'published', published_at: now.toISOString(), updated_at: now.toISOString() }).eq('id', row.id).eq('status', 'validated');
    if (updateError) throw updateError;
    const memberNotifications = await notifyMembersNewBlogArticle(client, { articleId: row.id, title: row.title_fr, slugFr: row.slug_fr });
    await sendPublicationNewsletter({
      articleId: row.id,
      title: row.title_fr,
      slugFr: row.slug_fr,
      excludeUserIds: memberNotifications?.notifiedUserIds ?? [],
    });
    published += 1;
  }
  return { skipped: false, published };
}

export async function runPhase2DailyJobs(client: SupabaseClient, deps: Phase2Deps = {}) {
  const now = deps.now ?? new Date();
  const [blog, onboarding, winBack, courses, phase3] = await Promise.all([
    runBlogPublishScheduled(client, now),
    runOnboardingCycle(client, deps),
    runWinBackCycle(client, deps),
    runCourseCycles(client, deps),
    runPhase3DailyJobs(client, deps),
  ]);
  return { blog, onboarding, winBack, courses, phase3 };
}

export async function markStripeEventProcessed(client: SupabaseClient, event: Stripe.Event) {
  const { error } = await client.from('stripe_events').insert({ id: event.id, type: event.type });
  if (error) {
    if (String(error.code) === '23505') return false;
    throw error;
  }
  return true;
}

export async function dispatchSubscriptionActivated(client: SupabaseClient, userId: string, courseId: string, customerId: string | null, subscriptionId: string | null, deps: Phase2Deps = {}) {
  const tier = COURSE_CUSTOMER_TIER[courseId];
  if (!tier) return;
  const now = deps.now ?? new Date();
  await client.from('subscriptions').upsert({
    user_id: userId,
    tier,
    status: 'active',
    starts_at: now.toISOString(),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    price_cents: COURSE_PRICE_CENTS[courseId] ?? 0,
    currency: 'eur',
    interval: 'month',
    metadata: { source: 'stripe_webhook', course_id: courseId },
  }, { onConflict: 'stripe_subscription_id' });
  await client.from('profiles').update({ stripe_customer_id: customerId, last_checkout_course_id: courseId, customer_tier: tier, updated_at: now.toISOString() }).eq('id', userId);
  await send(client, deps.dispatch ?? dispatch, {
    userId,
    eventType: 'onboarding.day0',
    title: 'Bienvenue ! Votre abonnement est actif.',
    body: 'Votre abonnement FitMangas est actif.',
    idempotencyKey: `onboarding.day0:${userId}:${subscriptionId ?? courseId}`,
    payload: { firstName: '' },
    channelHints: ['in_app', 'email'],
  });
}

export async function dispatchPaymentFailed(client: SupabaseClient, stripe: Stripe, customerId: string, userId: string, idempotencySuffix: string, deps: Phase2Deps = {}) {
  const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${APP_URL()}/compte/profil` });
  await send(client, deps.dispatch ?? dispatch, {
    userId,
    eventType: 'subscription.payment_failed',
    title: 'Échec de paiement',
    body: 'Mettez à jour votre moyen de paiement.',
    idempotencyKey: `subscription.payment_failed:${userId}:${idempotencySuffix}`,
    payload: { billingPortalUrl: portal.url ?? `${APP_URL()}/compte/profil` },
  });
}

export async function dispatchPresentialPurchased(client: SupabaseClient, userId: string, courseId: string, offerId: string, deps: Phase2Deps = {}) {
  const { data: course, error } = await client
    .from('courses')
    .select('id, title, starts_at, timezone, course_format, course_category')
    .eq('id', courseId)
    .maybeSingle();
  if (error) throw error;
  if (!course) return;
  await client.from('enrollments').upsert({
    user_id: userId,
    course_id: courseId,
    source: 'stripe_checkout',
    status: 'booked',
    price_cents: COURSE_PRICE_CENTS[offerId] ?? 0,
    currency: 'eur',
  }, { onConflict: 'user_id,course_id' });
  const tz = 'Europe/Paris';
  const courseDate = formatInUserTimezone(new Date(String(course.starts_at)), tz, 'fr', 'PPPP HH:mm');
  await send(client, deps.dispatch ?? dispatch, {
    userId,
    eventType: 'course.presential.purchased',
    title: `Séance confirmée — ${courseDate}`,
    body: 'Adresse : 17 Passage Leroy, 44300 Nantes.',
    idempotencyKey: `course.presential.purchased:${courseId}:${userId}`,
    payload: {
      courseTitle: String(course.title),
      courseDate,
    },
    channelHints: ['in_app', 'email'],
  });
}

export async function dispatchCourseCancelledByCoach(client: SupabaseClient, courseId: string, deps: Phase2Deps = {}) {
  const { data: course, error: courseError } = await client
    .from('courses')
    .select('id, title, starts_at, course_format')
    .eq('id', courseId)
    .maybeSingle();
  if (courseError) throw courseError;
  if (!course) return { sent: 0 };

  const { data: enrollments, error } = await client.from('enrollments').select('user_id').eq('course_id', courseId).in('status', ['booked', 'attended']);
  if (error) throw error;

  let sent = 0;
  const format = String(course.course_format) === 'onsite' ? 'presential' : 'visio';
  for (const enrollment of (enrollments ?? []) as { user_id: string }[]) {
    await send(client, deps.dispatch ?? dispatch, {
      userId: enrollment.user_id,
      eventType: format === 'presential' ? 'course.presential.cancelled_by_coach' : 'course.visio.cancelled',
      title: format === 'presential' ? 'Séance annulée' : 'Cours annulé',
      body: `${String(course.title)} est annulé.`,
      idempotencyKey: `course.${format}.cancelled:${String(course.id)}:${enrollment.user_id}`,
      payload: {
        courseTitle: String(course.title),
        courseDate: formatInUserTimezone(new Date(String(course.starts_at)), 'Europe/Paris', 'fr', 'PPPP HH:mm'),
      },
    });
    sent += 1;
  }
  return { sent };
}

export async function dispatchReplayReady(client: SupabaseClient, courseId: string, deps: Phase2Deps = {}) {
  const { data: course, error: courseError } = await client
    .from('courses')
    .select('id, title, replay_url, course_format')
    .eq('id', courseId)
    .maybeSingle();
  if (courseError) throw courseError;
  if (!course || String(course.course_format) !== 'online') return { sent: 0 };

  const { data: enrollments, error } = await client.from('enrollments').select('user_id').eq('course_id', courseId).in('status', ['booked', 'attended']);
  if (error) throw error;

  let sent = 0;
  for (const enrollment of (enrollments ?? []) as { user_id: string }[]) {
    await send(client, deps.dispatch ?? dispatch, {
      userId: enrollment.user_id,
      eventType: 'course.visio.replay_ready',
      title: 'Replay disponible',
      body: `Le replay de ${String(course.title)} est disponible.`,
      idempotencyKey: `course.visio.replay_ready:${String(course.id)}:${enrollment.user_id}`,
      payload: {
        courseTitle: String(course.title),
        replayUrl: String(course.replay_url || `${APP_URL()}/compte/replays`),
      },
      channelHints: ['in_app', 'email'],
    });
    sent += 1;
  }
  return { sent };
}

export async function dispatchSubscriptionCancelled(client: SupabaseClient, userId: string, tier: string, accessEndsAt: string | null, deps: Phase2Deps = {}) {
  await client.from('subscriptions').update({ status: 'canceled', ends_at: accessEndsAt ?? new Date().toISOString(), auto_renews: false }).eq('user_id', userId).eq('tier', tier);
  await send(client, deps.dispatch ?? dispatch, {
    userId,
    eventType: 'subscription.cancelled',
    title: 'Abonnement annulé',
    body: 'Votre abonnement a été annulé.',
    idempotencyKey: `subscription.cancelled:${userId}:${accessEndsAt ?? 'now'}`,
    payload: { tier, accessEndsAt },
    channelHints: ['in_app', 'email'],
  });
  const { data: admins } = await client.from('profiles').select('id').eq('role', 'admin').limit(5);
  for (const admin of (admins ?? []) as { id: string }[]) {
    await send(client, deps.dispatch ?? dispatch, {
      userId: admin.id,
      eventType: 'subscription.cancelled',
      title: 'Une cliente a annulé son abonnement',
      body: `La cliente ${userId} a annulé son abonnement ${tier}.`,
      idempotencyKey: `subscription.cancelled.admin:${admin.id}:${userId}:${accessEndsAt ?? 'now'}`,
      payload: { tier, accessEndsAt },
      channelHints: ['email'],
    });
  }
}

export async function dispatchSubscriptionRenewed(client: SupabaseClient, userId: string, invoiceId: string, deps: Phase2Deps = {}) {
  await send(client, deps.dispatch ?? dispatch, {
    userId,
    eventType: 'subscription.renewed',
    title: 'Paiement reçu — merci',
    body: 'Votre renouvellement FitMangas est confirmé.',
    idempotencyKey: `subscription.renewed:${userId}:${invoiceId}`,
    channelHints: ['email'],
  });
}
