import { createAdminClient } from '@/lib/supabase/admin';

function formatIcalUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcal(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toLocalDateParts(dateIso: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(dateIso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
  };
}

type AccessLevel = 'full' | 'preview' | 'locked';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim();
  if (!token) {
    return new Response('Token manquant.', { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, calendar_sync_enabled')
    .eq('calendar_sync_token', token)
    .maybeSingle();

  if (profileError || !profile?.id || !profile.calendar_sync_enabled) {
    return new Response('Flux indisponible.', { status: 404 });
  }

  const now = new Date();
  const horizon = new Date(now);
  horizon.setMonth(horizon.getMonth() + 6);

  const [{ data: tier }, { data: courses, error: courseError }, { data: enrollments }, { data: policies }] = await Promise.all([
    admin.rpc('current_customer_tier', { target_user_id: profile.id }),
    admin
      .from('courses')
      .select('id, title, description, starts_at, ends_at, timezone, location, live_url, jitsi_link, is_published')
      .eq('is_published', true)
      .gte('ends_at', now.toISOString())
      .lte('starts_at', horizon.toISOString())
      .order('starts_at', { ascending: true }),
    admin
      .from('enrollments')
      .select('course_id')
      .eq('user_id', profile.id)
      .in('status', ['booked', 'attended']),
    tier
      ? admin
          .from('access_policies')
          .select('course_format, course_category, access_level')
          .eq('tier', String(tier))
      : Promise.resolve({ data: [] as Array<{ course_format: string; course_category: string; access_level: AccessLevel }> }),
  ]);

  if (courseError) {
    return new Response('Impossible de charger les cours.', { status: 500 });
  }

  const enrolled = new Set((enrollments ?? []).map((e) => e.course_id));
  const policyMap = new Map<string, AccessLevel>();
  for (const p of policies ?? []) {
    policyMap.set(`${p.course_format}:${p.course_category}`, p.access_level as AccessLevel);
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const rows = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FitMangas//MobileSync//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FitMangas - Mes cours',
    'X-WR-TIMEZONE:Europe/Paris',
  ];

  for (const course of courses ?? []) {
    const key = `${course.course_format}:${course.course_category}`;
    const policyAccess = policyMap.get(key) ?? 'locked';
    const access = enrolled.has(course.id) ? 'full' : policyAccess;
    if (access !== 'full') continue;

    const startsAt = new Date(course.starts_at);
    const endsAt = new Date(course.ends_at);
    const tz = course.timezone || 'Europe/Paris';
    const liveLink = course.jitsi_link || course.live_url || `${appUrl}/live/${course.id}`;
    const descParts = [course.description?.trim() || 'Cours FitMangas', '', `Lien de connexion : ${liveLink}`];
    const desc = descParts.join('\n');
    const local = toLocalDateParts(course.starts_at, tz);
    const alarm9h = `${local.year}${local.month}${local.day}T090000`;

    rows.push('BEGIN:VEVENT');
    rows.push(`UID:${course.id}@fitmangas-mobile`);
    rows.push(`DTSTAMP:${formatIcalUtc(new Date())}`);
    rows.push(`DTSTART:${formatIcalUtc(startsAt)}`);
    rows.push(`DTEND:${formatIcalUtc(endsAt)}`);
    rows.push(`SUMMARY:${escapeIcal(course.title)}`);
    rows.push(`DESCRIPTION:${escapeIcal(desc)}`);
    rows.push(`URL:${escapeIcal(liveLink)}`);
    if (course.location) rows.push(`LOCATION:${escapeIcal(course.location)}`);
    rows.push('BEGIN:VALARM');
    rows.push('ACTION:DISPLAY');
    rows.push('DESCRIPTION:Rappel du cours (9h00)');
    rows.push(`TRIGGER;VALUE=DATE-TIME:${alarm9h}`);
    rows.push('END:VALARM');
    rows.push('BEGIN:VALARM');
    rows.push('ACTION:DISPLAY');
    rows.push('DESCRIPTION:Rappel du cours (1h avant)');
    rows.push('TRIGGER:-PT1H');
    rows.push('END:VALARM');
    rows.push('END:VEVENT');
  }

  rows.push('END:VCALENDAR');

  return new Response(rows.join('\r\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="fitmangas-mobile.ics"',
      'Cache-Control': 'no-store',
    },
  });
}
