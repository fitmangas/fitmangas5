import type { SupabaseClient } from '@supabase/supabase-js';

import { hasMemberCourseAccessByUserId } from '@/lib/access-control';
import { appBaseUrl } from '@/lib/calendar-feed-token';

type AccessLevel = 'full' | 'preview' | 'locked';

export type CalendarFeedCourse = {
  id: string;
  title: string;
  description: string | null;
  course_format: string;
  course_category: string;
  starts_at: string;
  ends_at: string;
  timezone: string | null;
  location: string | null;
  live_url: string | null;
  jitsi_link: string | null;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** Instant absolu → AAAAMMJJTHHMMSSZ (UTC). Les apps convertissent à l’heure locale de la cliente. */
export function formatIcalUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` +
    `T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
  );
}

export function escapeIcalText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/** Plage : 7 derniers jours → 6 mois à venir. */
export function calendarFeedWindow(now = new Date()) {
  const past = new Date(now);
  past.setDate(past.getDate() - 7);
  const horizon = new Date(now);
  horizon.setMonth(horizon.getMonth() + 6);
  return { past, horizon };
}

/**
 * Éligibilité flux calendrier : même critère que l’accès cours membre
 * (`current_customer_tier` / profil admin), plus compte Auth non banni.
 * Plus de RPC calendrier parallèle (`customer_calendar_feed_eligible`).
 */
export async function isCalendarFeedEligible(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId);
  if (authError || !authData?.user) return false;

  const bannedUntil = authData.user.banned_until;
  if (bannedUntil != null && String(bannedUntil).trim() !== '') {
    const until = new Date(bannedUntil);
    if (!Number.isNaN(until.getTime()) && until > new Date()) return false;
  }

  try {
    return await hasMemberCourseAccessByUserId(userId);
  } catch (e) {
    console.error('[calendar-feed] member access', e);
    return false;
  }
}

export async function loadCalendarFeedCourses(
  admin: SupabaseClient,
  userId: string,
): Promise<CalendarFeedCourse[]> {
  const { past, horizon } = calendarFeedWindow();

  const { data: tier, error: tierError } = await admin.rpc('current_customer_tier', {
    target_user_id: userId,
  });
  if (tierError) {
    throw new Error(`Impossible de vérifier l’accès: ${tierError.message}`);
  }

  const [{ data: courses, error: courseError }, { data: enrollments }, { data: policies }] =
    await Promise.all([
      admin
        .from('courses')
        .select(
          'id, title, description, course_format, course_category, starts_at, ends_at, timezone, location, live_url, jitsi_link, is_published',
        )
        .eq('is_published', true)
        .gte('ends_at', past.toISOString())
        .lte('starts_at', horizon.toISOString())
        .order('starts_at', { ascending: true }),
      admin
        .from('enrollments')
        .select('course_id')
        .eq('user_id', userId)
        .in('status', ['booked', 'attended']),
      tier
        ? admin
            .from('access_policies')
            .select('course_format, course_category, access_level')
            .eq('tier', String(tier))
        : Promise.resolve({
            data: [] as Array<{ course_format: string; course_category: string; access_level: AccessLevel }>,
          }),
    ]);

  if (courseError) {
    throw new Error(`Impossible de charger les cours: ${courseError.message}`);
  }

  const enrolled = new Set((enrollments ?? []).map((e) => e.course_id));
  const policyMap = new Map<string, AccessLevel>();
  for (const p of policies ?? []) {
    policyMap.set(`${p.course_format}:${p.course_category}`, p.access_level as AccessLevel);
  }

  const out: CalendarFeedCourse[] = [];
  for (const course of courses ?? []) {
    const key = `${course.course_format}:${course.course_category}`;
    const policyAccess = policyMap.get(key) ?? 'locked';
    const access = enrolled.has(course.id) ? 'full' : policyAccess;
    if (access !== 'full') continue;
    out.push({
      id: course.id,
      title: course.title,
      description: course.description,
      course_format: course.course_format,
      course_category: course.course_category,
      starts_at: course.starts_at,
      ends_at: course.ends_at,
      timezone: course.timezone,
      location: course.location,
      live_url: course.live_url,
      jitsi_link: course.jitsi_link,
    });
  }
  return out;
}

/**
 * Génère un VCALENDAR valide (même sans cours).
 * Dates en UTC (Z) à partir des instants absolus en base → bonne heure locale partout.
 * UID stable par cours pour mises à jour / annulations sans doublons.
 */
export function buildCalendarFeedIcs(courses: CalendarFeedCourse[]): string {
  const stamp = formatIcalUtc(new Date());
  const appUrl = appBaseUrl();
  const rows = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FitMangas//MobileSync//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FitMangas - Mes cours',
    'X-WR-TIMEZONE:Europe/Paris',
  ];

  for (const course of courses) {
    const startsAt = new Date(course.starts_at);
    const endsAt = new Date(course.ends_at);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      console.error('[calendar-feed] horaires invalides', course.id);
      continue;
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      console.error('[calendar-feed] fin <= début', course.id);
      continue;
    }

    const liveLink = course.jitsi_link || course.live_url || `${appUrl}/live/${course.id}`;
    const desc = [course.description?.trim() || 'Cours FitMangas', '', `Lien de connexion : ${liveLink}`].join(
      '\n',
    );

    rows.push('BEGIN:VEVENT');
    rows.push(`UID:${course.id}@fitmangas-mobile`);
    rows.push(`DTSTAMP:${stamp}`);
    rows.push(`DTSTART:${formatIcalUtc(startsAt)}`);
    rows.push(`DTEND:${formatIcalUtc(endsAt)}`);
    rows.push(`SUMMARY:${escapeIcalText(course.title)}`);
    rows.push(`DESCRIPTION:${escapeIcalText(desc)}`);
    rows.push(`URL:${escapeIcalText(liveLink)}`);
    if (course.location?.trim()) {
      rows.push(`LOCATION:${escapeIcalText(course.location.trim())}`);
    }
    rows.push('BEGIN:VALARM');
    rows.push('ACTION:DISPLAY');
    rows.push('DESCRIPTION:Rappel FitMangas (30 min)');
    rows.push('TRIGGER:-PT30M');
    rows.push('END:VALARM');
    rows.push('END:VEVENT');
  }

  rows.push('END:VCALENDAR');
  return `${rows.join('\r\n')}\r\n`;
}
