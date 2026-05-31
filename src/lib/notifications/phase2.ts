import type { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

import { COURSE_CUSTOMER_TIER, COURSE_PRICE_CENTS } from '@/lib/checkout-courses';
import { formatEmailFirstName } from '@/lib/email/format-first-name';
import { buildProfileSubscriptionUpdate } from '@/lib/stripe/profile-subscription-sync';
import { sendPublicationNewsletter } from '@/lib/blog/newsletter-double-optin';
import { notifyMembersNewBlogArticle } from '@/lib/blog/publish-notifications';
import { courseReminderCopy } from './course-reminder-copy';
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
const APP_URL = () => (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(/\/$/, '');

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
    const locale = profile?.preferred_locale === 'es' ? 'es' : 'fr';
    const courseTime = formatInUserTimezone(new Date(course.starts_at), tz, locale, 'HH:mm');
    const common = {
      courseTitle: course.title,
      courseDate: formatInUserTimezone(new Date(course.starts_at), tz, locale, 'PPPP'),
      courseTime,
      joinUrl: course.jitsi_link || course.live_url || `${APP_URL()}/compte/planning`,
      replayUrl: course.replay_url || `${APP_URL()}/compte/replays`,
    };
    if (course.course_format === 'online' && dayDelta === 1 && hour === 18) {
      const copy = courseReminderCopy(locale, 'visio_j1', course.title, courseTime);
      await send(client, dispatchFn, {
        userId: row.user_id,
        eventType: 'course.visio.reminder_J-1',
        title: copy.title,
        body: copy.body,
        idempotencyKey: `course.visio.reminder_J-1:${course.id}:${row.user_id}`,
        payload: common,
      });
      sent += 1;
    }
    if (course.course_format === 'online' && mins >= 55 && mins <= 65) {
      const copy = courseReminderCopy(locale, 'visio_h1', course.title, courseTime);
      await send(client, dispatchFn, {
        userId: row.user_id,
        eventType: 'course.visio.reminder_H-1',
        title: copy.title,
        body: copy.body,
        idempotencyKey: `course.visio.reminder_H-1:${course.id}:${row.user_id}`,
        payload: common,
        channelHints: ['in_app', 'push'],
      });
      sent += 1;
    }
    if (course.course_format === 'onsite' && dayDelta === 1 && hour === 18) {
      const copy = courseReminderCopy(locale, 'presential_j1', course.title, courseTime);
      await send(client, dispatchFn, {
        userId: row.user_id,
        eventType: 'course.presential.reminder_J-1',
        title: copy.title,
        body: copy.body,
        idempotencyKey: `course.presential.reminder_J-1:${course.id}:${row.user_id}`,
        payload: common,
      });
      sent += 1;
    }
    if (course.course_format === 'onsite' && mins >= 115 && mins <= 125) {
      const copy = courseReminderCopy(locale, 'presential_h2', course.title, courseTime);
      await send(client, dispatchFn, {
        userId: row.user_id,
        eventType: 'course.presential.reminder_H-2',
        title: copy.title,
        body: copy.body,
        idempotencyKey: `course.presential.reminder_H-2:${course.id}:${row.user_id}`,
        payload: common,
        channelHints: ['in_app', 'push'],
      });
      sent += 1;
    }
  }

  const { data: missedRows, error: missedError } = await client
    .from('enrollments')
    .select('user_id, course_id, status, profiles!inner(id, first_name, display_timezone, preferred_locale), courses!inner(id, title, starts_at, ends_at, timezone, course_format, course_category, live_url, jitsi_link, replay_url)')
    .eq('status', 'missed')
    .lte('courses.ends_at', now.toISOString());
  if (missedError) throw missedError;

  for (const row of (missedRows ?? []) as EnrollmentRow[]) {
    const profile = first(row.profiles);
    const course = first(row.courses);
    if (!course) continue;
    const locale = profile?.preferred_locale === 'es' ? 'es' : 'fr';
    const tz = course.course_format === 'onsite' ? 'Europe/Paris' : profile?.display_timezone?.trim() || course.timezone || 'Europe/Paris';
    const courseTime = formatInUserTimezone(new Date(course.starts_at), tz, locale, 'HH:mm');
    const eventType = course.course_format === 'onsite' ? 'course.presential.missed' : 'course.visio.missed';
    const idempotencyKey = `course.${course.course_format === 'onsite' ? 'presential' : 'visio'}.missed:${course.id}:${row.user_id}`;
    const { data: already } = await client.from('notification_log').select('id').eq('idempotency_key', idempotencyKey).maybeSingle();
    if (already) continue;

    const kind = course.course_format === 'onsite' ? 'presential_missed' : 'visio_missed';
    const copy = courseReminderCopy(locale, kind, course.title, courseTime);
    const common = {
      courseTitle: course.title,
      courseDate: formatInUserTimezone(new Date(course.starts_at), tz, locale, 'PPPP'),
      courseTime,
      joinUrl: course.jitsi_link || course.live_url || `${APP_URL()}/compte/planning`,
      replayUrl: course.replay_url || `${APP_URL()}/compte/replays`,
    };
    await send(client, dispatchFn, {
      userId: row.user_id,
      eventType,
      title: copy.title,
      body: copy.body,
      idempotencyKey,
      payload: common,
    });
    sent += 1;
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

export async function runMissingCourseReplayAlerts(client: SupabaseClient, deps: Phase2Deps = {}) {
  const now = deps.now ?? new Date();
  const cutoffMs = now.getTime() - 24 * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffMs).toISOString();
  const dayKey = now.toISOString().slice(0, 10);

  const { data: courses, error } = await client
    .from('courses')
    .select('id, title, ends_at')
    .eq('course_format', 'online')
    .eq('is_published', true)
    .lt('ends_at', cutoffIso);
  if (error) throw error;

  const { data: admins, error: adminError } = await client.from('profiles').select('id').eq('role', 'admin');
  if (adminError) throw adminError;
  const adminIds = ((admins ?? []) as { id: string }[]).map((a) => a.id);
  if (adminIds.length === 0) return { alerted: 0 };

  let alerted = 0;
  for (const course of (courses ?? []) as { id: string; title: string; ends_at: string }[]) {
    const { count, error: recError } = await client
      .from('video_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', course.id);
    if (recError) throw recError;
    if ((count ?? 0) > 0) continue;

    const endsLabel = formatInUserTimezone(
      new Date(course.ends_at),
      COACH_PUBLISH_TIMEZONE,
      'fr',
      'PPP HH:mm',
    );
    const body = `Le replay du cours ${course.title} du ${endsLabel} n'a pas été créé.`;

    for (const adminId of adminIds) {
      await send(client, deps.dispatch ?? dispatch, {
        userId: adminId,
        eventType: 'admin.replay_missing',
        title: 'Replay manquant',
        body,
        idempotencyKey: `admin.replay_missing:${course.id}:${dayKey}:${adminId}`,
        payload: { courseId: course.id, courseTitle: course.title, endsAt: course.ends_at },
        channelHints: ['in_app', 'email'],
      });
    }
    alerted += 1;
  }
  return { alerted };
}

export async function runPhase2DailyJobs(client: SupabaseClient, deps: Phase2Deps = {}) {
  const now = deps.now ?? new Date();
  const [blog, onboarding, winBack, courses, replayMissing, phase3] = await Promise.all([
    runBlogPublishScheduled(client, now),
    runOnboardingCycle(client, deps),
    runWinBackCycle(client, deps),
    runCourseCycles(client, deps),
    runMissingCourseReplayAlerts(client, deps),
    runPhase3DailyJobs(client, deps),
  ]);
  return { blog, onboarding, winBack, courses, replayMissing, phase3 };
}

export async function markStripeEventProcessed(client: SupabaseClient, event: Stripe.Event) {
  const { error } = await client.from('stripe_events').insert({ id: event.id, type: event.type });
  if (error) {
    if (String(error.code) === '23505') return false;
    throw error;
  }
  return true;
}

export function welcomeDay0IdempotencyKey(userId: string): string {
  return `onboarding.day0:${userId}:first`;
}

export async function hasWelcomeDay0BeenSent(client: SupabaseClient, userId: string): Promise<boolean> {
  const key = welcomeDay0IdempotencyKey(userId);
  const { data: byKey } = await client.from('notification_log').select('id').eq('idempotency_key', key).maybeSingle();
  if (byKey?.id) return true;

  const { data: byEvent } = await client
    .from('notification_log')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', 'onboarding.day0')
    .limit(1)
    .maybeSingle();
  return !!byEvent?.id;
}

export async function dispatchWelcomeDay0(
  client: SupabaseClient,
  userId: string,
  deps: Phase2Deps = {},
): Promise<{ sent: true } | { skipped: true; reason: 'already_sent' }> {
  if (await hasWelcomeDay0BeenSent(client, userId)) {
    return { skipped: true, reason: 'already_sent' };
  }

  const { data: prof } = await client.from('profiles').select('first_name').eq('id', userId).maybeSingle();
  const firstName = formatEmailFirstName(prof?.first_name);
  await send(client, deps.dispatch ?? dispatch, {
    userId,
    eventType: 'onboarding.day0',
    title: 'Bienvenue ! Votre compte FitMangas est prêt.',
    body: 'Ton espace membre est prêt : planning, replays et ressources t’attendent.',
    idempotencyKey: welcomeDay0IdempotencyKey(userId),
    payload: { firstName },
    channelHints: ['in_app', 'email'],
  });
  return { sent: true };
}

export async function dispatchSubscriptionActivated(client: SupabaseClient, userId: string, courseId: string, customerId: string | null, subscriptionId: string | null, deps: Phase2Deps = {}) {
  const tier = COURSE_CUSTOMER_TIER[courseId];
  const now = deps.now ?? new Date();

  if (!tier) {
    console.warn('[dispatchSubscriptionActivated] tier inconnu pour courseId — bienvenue envoyée sans sync abonnement', {
      userId,
      courseId,
    });
    if (customerId) {
      await client.from('profiles').update({ stripe_customer_id: customerId, updated_at: now.toISOString() }).eq('id', userId);
    }
    await dispatchWelcomeDay0(client, userId, deps);
    return;
  }
  const subRow = {
    user_id: userId,
    tier,
    status: 'active' as const,
    starts_at: now.toISOString(),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    price_cents: COURSE_PRICE_CENTS[courseId] ?? 0,
    currency: 'eur',
    interval: 'month',
    metadata: { source: 'stripe_webhook', course_id: courseId },
    updated_at: now.toISOString(),
  };

  if (subscriptionId) {
    const { error: upsertError } = await client.from('subscriptions').upsert(subRow, { onConflict: 'stripe_subscription_id' });
    if (upsertError) {
      console.error('[dispatchSubscriptionActivated] subscriptions upsert', upsertError);
      throw upsertError;
    }
  } else {
    const { data: existing } = await client
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('tier', tier)
      .in('status', ['active', 'trialing'])
      .maybeSingle();
    if (existing?.id) {
      const { error: updateError } = await client.from('subscriptions').update(subRow).eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await client.from('subscriptions').insert(subRow);
      if (insertError) throw insertError;
    }
  }

  const profilePatch = buildProfileSubscriptionUpdate({
    stripeCustomerId: customerId,
    courseId,
    subscriptionStatus: 'active',
    lastCheckoutCourseId: courseId,
    customerTier: tier,
  });
  const { error: profileError } = await client.from('profiles').update(profilePatch).eq('id', userId);
  if (profileError) {
    console.error('[dispatchSubscriptionActivated] profiles update', profileError);
    throw profileError;
  }
  await dispatchWelcomeDay0(client, userId, deps);
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

/** Présentiel payé mais aucune séance publiée à assigner — bienvenue + confirmation d’achat. */
export async function dispatchPresentialPurchaseWithoutScheduledCourse(
  client: SupabaseClient,
  userId: string,
  offerId: string,
  deps: Phase2Deps = {},
) {
  const dispatchFn = deps.dispatch ?? dispatch;
  const { data: prof } = await client.from('profiles').select('first_name').eq('id', userId).maybeSingle();
  const firstName = formatEmailFirstName(prof?.first_name);

  if (await hasWelcomeDay0BeenSent(client, userId)) {
    await send(client, dispatchFn, {
      userId,
      eventType: 'course.presential.purchase_pending',
      title: 'Ton achat est confirmé',
      body: 'Nous te tiendrons informée dès que ta séance sera planifiée.',
      idempotencyKey: `course.presential.purchase_pending:${userId}:${offerId}`,
      payload: { firstName, offerId, appUrl: APP_URL() },
      channelHints: ['in_app', 'email'],
    });
    return;
  }

  await send(client, dispatchFn, {
    userId,
    eventType: 'course.presential.purchase_pending',
    title: 'Bienvenue ! Ton achat FitMangas est confirmé',
    body: 'Ton paiement est enregistré. Ta séance sera planifiée très bientôt.',
    idempotencyKey: welcomeDay0IdempotencyKey(userId),
    payload: { firstName, offerId, appUrl: APP_URL() },
    channelHints: ['in_app', 'email'],
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
  await dispatchWelcomeDay0(client, userId, deps);
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
  const { data: activeSubscriptions } = await client
    .from('subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing']);
  const nextActiveTier =
    ((activeSubscriptions ?? []) as { tier: string }[])
      .filter((row) => row.tier !== tier)
      .find((row) => row.tier.startsWith('online_'))?.tier ?? null;
  await client
    .from('profiles')
    .update({ customer_tier: nextActiveTier, updated_at: new Date().toISOString() })
    .eq('id', userId);
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

export async function dispatchCheckoutAbandoned(
  client: SupabaseClient,
  userId: string,
  courseId: string,
  sessionId: string,
  deps: Phase2Deps = {},
) {
  const { data: prof } = await client.from('profiles').select('first_name').eq('id', userId).maybeSingle();
  await send(client, deps.dispatch ?? dispatch, {
    userId,
    eventType: 'subscription.checkout_abandoned',
    title: 'Finalise ton inscription FitMangas',
    body: 'Ton paiement n’a pas été finalisé. Reprends ton inscription quand tu veux.',
    idempotencyKey: `subscription.checkout_abandoned:${sessionId}`,
    payload: {
      firstName: prof?.first_name,
      courseId,
      appUrl: APP_URL(),
    },
    channelHints: ['email'],
  });
}

export async function dispatchReferralRewardUnlocked(
  client: SupabaseClient,
  referrerUserId: string,
  deps: Phase2Deps = {},
) {
  const { data: prof } = await client.from('profiles').select('first_name').eq('id', referrerUserId).maybeSingle();
  await send(client, deps.dispatch ?? dispatch, {
    userId: referrerUserId,
    eventType: 'referral.reward_unlocked',
    title: 'Félicitations ! Ton abonnement est offert 🎉',
    body: 'Tes 5 filleules sont actives : ton prochain mois Visio est gratuit.',
    idempotencyKey: `referral.reward_unlocked:${referrerUserId}`,
    payload: {
      firstName: prof?.first_name,
      appUrl: APP_URL(),
    },
    channelHints: ['in_app', 'email'],
  });
}
