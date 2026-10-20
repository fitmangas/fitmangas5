import type { SupabaseClient } from '@supabase/supabase-js';

import { A_VALIDER_LOT2 } from '@/content/a-valider';
import { sendEmailBatch, type SendEmailInput } from '@/lib/email/send';
import { formatEmailFirstName } from '@/lib/email/format-first-name';
import { renderV2Email, type V2Live } from '@/lib/email/v2-templates';
import { isOnlineCustomerTier, type CustomerTier } from '@/lib/access-control';

import { dispatch } from '../dispatcher';
import { formatInUserTimezone } from '../timezone';
import { isNotifV2Enabled } from './flag';
import {
  findTwin,
  isVisioLiveRecipient,
  profileLocale,
  shouldNotifyForTwinSlot,
  type RecipientProfile,
  type TwinCourse,
} from './recipients';
import {
  isEveReminderWindow,
  isOneHourReminderWindow,
  minutesUntilStart,
  oneHourCopyMinutes,
  shouldSendEveForLatePublish,
} from './windows';

const APP_URL = () => (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(/\/$/, '');

type CourseRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  timezone?: string | null;
  course_format: 'online' | 'onsite';
  course_language?: string | null;
  is_published?: boolean;
  published_at?: string | null;
  created_at?: string | null;
};

function liveLang(course: CourseRow): 'fr' | 'es' {
  return course.course_language === 'es' ? 'es' : 'fr';
}

function liveOf(course: CourseRow): V2Live {
  return { id: course.id, title: course.title, startsAt: course.starts_at, endsAt: course.ends_at, language: liveLang(course) };
}

function joinUrl(courseId: string) {
  return `${APP_URL()}/live/${courseId}`;
}

/**
 * Abonnées qui ont aujourd'hui l'accès Visio, avec la MÊME règle que l'espace client
 * (`current_customer_tier`) : dernier abonnement actif ou en essai non expiré, sinon `profiles.customer_tier`.
 * Les comptes admin (Kevin, Alejandra) ne reçoivent pas les rappels clientes.
 */
export async function visioProfiles(client: SupabaseClient): Promise<RecipientProfile[]> {
  const nowIso = new Date().toISOString();
  const withOther = 'id, role, first_name, preferred_locale, display_timezone, live_other_language, customer_tier, subscription_status';
  const withoutOther = 'id, role, first_name, preferred_locale, display_timezone, customer_tier, subscription_status';

  let hasOther = true;
  let profilesRes = await client.from('profiles').select(withOther);
  if (profilesRes.error) {
    // Colonne live_other_language absente tant que la migration du lot 2 n'est pas appliquée.
    hasOther = false;
    profilesRes = await client.from('profiles').select(withoutOther);
  }
  if (profilesRes.error) throw profilesRes.error;

  const { data: subs, error: subsError } = await client
    .from('subscriptions')
    .select('user_id, tier, status, ends_at, created_at')
    .in('status', ['active', 'trialing']);
  if (subsError) throw subsError;

  const activeTier = new Map<string, { tier: string; status: string; created_at: string }>();
  for (const s of (subs ?? []) as Array<{ user_id: string; tier: string; status: string; ends_at: string | null; created_at: string }>) {
    if (s.ends_at && s.ends_at <= nowIso) continue;
    const prev = activeTier.get(s.user_id);
    if (!prev || prev.created_at < s.created_at) activeTier.set(s.user_id, { tier: s.tier, status: s.status, created_at: s.created_at });
  }

  const out: RecipientProfile[] = [];
  for (const p of (profilesRes.data ?? []) as Array<ProfileJoin & { role?: string | null; first_name?: string | null }>) {
    if ((p.role ?? '').toLowerCase() === 'admin') continue;
    const sub = activeTier.get(p.id);
    const tier = (sub?.tier ?? p.customer_tier ?? null) as CustomerTier | null;
    const visioAccess = isOnlineCustomerTier(tier);
    if (!visioAccess) continue;
    out.push({
      id: p.id,
      first_name: p.first_name ?? null,
      preferred_locale: p.preferred_locale ?? null,
      live_other_language: hasOther ? Boolean(p.live_other_language) : false,
      customer_tier: tier,
      subscription_status: sub?.status ?? p.subscription_status ?? null,
      display_timezone: p.display_timezone ?? null,
      visioAccess,
    });
  }
  return out;
}

function first<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

type ProfileJoin = {
  id: string;
  preferred_locale?: string | null;
  display_timezone?: string | null;
  live_other_language?: boolean | null;
  customer_tier?: string | null;
  subscription_status?: string | null;
};

async function alreadySent(client: SupabaseClient, key: string): Promise<boolean> {
  const { data } = await client.from('notification_log').select('id').eq('idempotency_key', key).maybeSingle();
  return Boolean(data);
}

async function markSent(client: SupabaseClient, userId: string, eventType: string, key: string, payload: Record<string, unknown>) {
  await client.from('notification_log').insert({
    user_id: userId,
    event_type: eventType,
    channel: 'email',
    payload,
    idempotency_key: key,
  });
}

export async function runVisioRemindersV2(client: SupabaseClient, now = new Date()) {
  if (!isNotifV2Enabled()) return { sent: 0, skipped: 'flag_off' as const };

  const lower = new Date(now.getTime() - 36 * 3600_000).toISOString();
  const upper = new Date(now.getTime() + 48 * 3600_000).toISOString();
  const { data: courses, error } = await client
    .from('courses')
    .select('id, title, starts_at, ends_at, timezone, course_format, course_language, is_published, created_at')
    .eq('course_format', 'online')
    .eq('is_published', true)
    .gte('starts_at', lower)
    .lte('starts_at', upper);
  if (error) throw error;

  const list = (courses ?? []) as CourseRow[];
  const twins: TwinCourse[] = list.map((c) => ({
    id: c.id,
    language: liveLang(c),
    startsAtIso: c.starts_at,
  }));
  const profiles = await visioProfiles(client);

  const emailBatch: Array<{ input: SendEmailInput; userId: string; key: string; eventType: string; payload: Record<string, unknown> }> = [];
  let inApp = 0;

  for (const course of list) {
    const twin = findTwin(
      { id: course.id, language: liveLang(course), startsAtIso: course.starts_at },
      twins,
    );
    const publishedAt = course.created_at ?? course.starts_at;

    for (const profile of profiles) {
      if (
        !shouldNotifyForTwinSlot(profile, { id: course.id, language: liveLang(course), startsAtIso: course.starts_at }, twin) ||
        !isVisioLiveRecipient(profile, liveLang(course))
      ) {
        continue;
      }
      const tz = profile.display_timezone?.trim() || 'Europe/Paris';
      const locale = profileLocale(profile);
      const time = formatInUserTimezone(new Date(course.starts_at), tz, locale, 'HH:mm');
      const join = joinUrl(course.id);
      const payload = {
        title: course.title,
        courseTitle: course.title,
        courseTime: time,
        joinUrl: join,
        hint: A_VALIDER_LOT2.liveJoinHint[locale],
      };

      const eveOk =
        isEveReminderWindow(now, course.starts_at, tz) &&
        shouldSendEveForLatePublish(publishedAt, course.starts_at, now);
      if (eveOk) {
        const key = `course.visio.reminder_J-1:${course.id}:${profile.id}`;
        if (!(await alreadySent(client, key))) {
          const subject = A_VALIDER_LOT2.liveEveSubject[locale](time, course.title);
          const email = renderV2Email(locale === 'es' ? 'A02' : 'A01', {
            locale,
            timeZone: tz,
            firstName: formatEmailFirstName(profile.first_name ?? '') || undefined,
            live: liveOf(course),
            joinUrl: join,
          });
          emailBatch.push({
            input: { to: '', subject: email.subject, html: email.html },
            userId: profile.id,
            key,
            eventType: 'course.visio.reminder_J-1',
            payload,
          });
          await dispatch(client, {
            event_type: 'course.visio.reminder_J-1',
            user_id: profile.id,
            payload: { ...payload, title: subject, body: A_VALIDER_LOT2.liveEvePreview[locale] },
            channel_hints: ['in_app', 'push'],
            idempotency_key: `${key}:inapp`,
          });
          inApp += 1;
        }
      }

      if (isOneHourReminderWindow(now, course.starts_at)) {
        const mins = oneHourCopyMinutes(now, course.starts_at);
        const key = `course.visio.reminder_H-1:${course.id}:${course.starts_at}:${profile.id}`;
        if (!(await alreadySent(client, key))) {
          const subject =
            mins < 50
              ? A_VALIDER_LOT2.liveOneHourSoonSubject[locale](mins, course.title)
              : A_VALIDER_LOT2.liveOneHourSubject[locale](course.title);
          const email = renderV2Email('A03', {
            locale,
            timeZone: tz,
            firstName: formatEmailFirstName(profile.first_name ?? '') || undefined,
            live: liveOf(course),
            joinUrl: join,
          });
          emailBatch.push({
            input: { to: '', subject: email.subject, html: email.html },
            userId: profile.id,
            key,
            eventType: 'course.visio.reminder_H-1',
            payload: { ...payload, minutes: mins },
          });
          await dispatch(client, {
            event_type: 'course.visio.reminder_H-1',
            user_id: profile.id,
            payload: { ...payload, title: subject, body: A_VALIDER_LOT2.liveJoinHint[locale] },
            channel_hints: ['in_app', 'push'],
            idempotency_key: `${key}:inapp`,
          });
          inApp += 1;
        }
      }
    }
  }

  const resolved: SendEmailInput[] = [];
  const meta: typeof emailBatch = [];
  for (const item of emailBatch) {
    const { data } = await client.auth.admin.getUserById(item.userId);
    const email = data.user?.email?.trim();
    if (!email) continue;
    resolved.push({ ...item.input, to: email });
    meta.push(item);
  }

  const results = resolved.length ? await sendEmailBatch(resolved) : [];
  let emailed = 0;
  for (let i = 0; i < results.length; i++) {
    if (!results[i]?.ok) continue;
    const item = meta[i];
    await markSent(client, item.userId, item.eventType, item.key, item.payload);
    emailed += 1;
  }

  return { sent: emailed + inApp, emailed, inApp };
}

export async function dispatchVisioCancelledV2(
  client: SupabaseClient,
  course: CourseRow,
  now = new Date(),
) {
  if (!isNotifV2Enabled()) return { sent: 0, skipped: 'flag_off' as const };
  const lastMinute = minutesUntilStart(course.starts_at, now) < 24 * 60;
  const profiles = await visioProfiles(client);
  let sent = 0;
  for (const profile of profiles) {
    if (!isVisioLiveRecipient(profile, liveLang(course))) continue;
    const locale = profileLocale(profile);
    const tz = profile.display_timezone?.trim() || 'Europe/Paris';
    const when = formatInUserTimezone(new Date(course.starts_at), tz, locale, 'HH:mm');
    const title = lastMinute
      ? A_VALIDER_LOT2.liveCancelledLastMinute[locale]
      : A_VALIDER_LOT2.liveCancelledSubject[locale](when);
    await dispatch(client, {
      event_type: 'course.visio.cancelled',
      user_id: profile.id,
      payload: { title, body: title, courseTitle: course.title, joinUrl: joinUrl(course.id) },
      channel_hints: ['in_app', 'email', 'push'],
      idempotency_key: `course.visio.cancelled:${course.id}:${profile.id}`,
    });
    sent += 1;
  }
  return { sent };
}

export async function dispatchVisioScheduleChangedV2(
  client: SupabaseClient,
  course: CourseRow,
  previousStartsAt: string,
) {
  if (!isNotifV2Enabled()) return { sent: 0, skipped: 'flag_off' as const };
  if (previousStartsAt === course.starts_at) return { sent: 0 };
  const eveKeyPrefix = `course.visio.reminder_J-1:${course.id}:`;
  const { data: eveLogs } = await client
    .from('notification_log')
    .select('id')
    .like('idempotency_key', `${eveKeyPrefix}%`)
    .limit(1);
  if (!eveLogs?.length) return { sent: 0 };

  // La clé « 1 h avant » contient l'horaire : un nouvel horaire déclenche naturellement un nouveau rappel.

  const profiles = await visioProfiles(client);
  let sent = 0;
  for (const profile of profiles) {
    if (!isVisioLiveRecipient(profile, liveLang(course))) continue;
    const locale = profileLocale(profile);
    await dispatch(client, {
      event_type: 'course.visio.schedule_changed',
      user_id: profile.id,
      payload: {
        title: A_VALIDER_LOT2.liveScheduleChanged[locale],
        body: A_VALIDER_LOT2.liveScheduleChanged[locale],
        courseTitle: course.title,
        joinUrl: joinUrl(course.id),
        previousStartsAt,
        startsAt: course.starts_at,
      },
      channel_hints: ['in_app', 'email'],
      idempotency_key: `course.visio.schedule_changed:${course.id}:${course.starts_at}:${profile.id}`,
    });
    sent += 1;
  }
  return { sent };
}

export async function runMissingReplayAlertsV2(client: SupabaseClient, now = new Date()) {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const cutoff24h = new Date(now.getTime() - 24 * 3600000).toISOString();
  const { data: courses, error } = await client
    .from('courses')
    .select('id, title, ends_at')
    .eq('course_format', 'online')
    .eq('is_published', true)
    .lt('ends_at', cutoff24h)
    .gte('ends_at', sevenDaysAgo);
  if (error) throw error;
  const { data: admins } = await client.from('profiles').select('id').eq('role', 'admin');
  const adminIds = ((admins ?? []) as { id: string }[]).map((a) => a.id);
  let alerted = 0;
  for (const course of (courses ?? []) as { id: string; title: string; ends_at: string }[]) {
    const { count } = await client.from('video_recordings').select('*', { count: 'exact', head: true }).eq('course_id', course.id);
    if ((count ?? 0) > 0) continue;
    const keyBase = `admin.replay_missing:${course.id}`;
    const { data: already } = await client.from('notification_log').select('id').like('idempotency_key', `${keyBase}%`).limit(1);
    if (already && already.length > 0) continue;
    for (const adminId of adminIds) {
      await dispatch(client, {
        event_type: 'admin.replay_missing',
        user_id: adminId,
        payload: {
          title: A_VALIDER_LOT2.replayMissingAdmin.fr(course.title),
          body: A_VALIDER_LOT2.replayMissingAdmin.fr(course.title),
          courseId: course.id,
        },
        channel_hints: ['in_app', 'email'],
        idempotency_key: `${keyBase}:${adminId}`,
      });
    }
    alerted += 1;
  }
  return { alerted };
}
