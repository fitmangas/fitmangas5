import { getCoursesForUser, getUserTier } from '@/lib/access-control';
import { requireAuthenticatedUser } from '@/lib/api-auth';
import { getUtcFortnightWindow, isCoursePast, isWithinFortnight } from '@/lib/calendar-window';

function formatIcalDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcal(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  try {
    const [tier, courses] = await Promise.all([
      getUserTier(auth.user.id),
      getCoursesForUser(auth.user.id),
    ]);

    const monthlyTiers = new Set(['online_individual_monthly', 'online_group_monthly']);
    if (!tier || !monthlyTiers.has(tier)) {
      return new Response('Abonnement mensuel requis pour exporter le calendrier.', { status: 403 });
    }

    const window = getUtcFortnightWindow();
    const now = new Date();

    const events = courses.filter((course) => {
      if (course.access_type !== 'full') return false;
      if (!isWithinFortnight(course.starts_at, window)) return false;
      if (isCoursePast(course.ends_at, now)) return false;
      return true;
    });

    const stamp = formatIcalDate(new Date());
    const rows = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FitMangas//SmartCalendar//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    events.forEach((event) => {
      const startsAt = new Date(event.starts_at);
      const endsAt = new Date(event.ends_at);
      rows.push('BEGIN:VEVENT');
      rows.push(`UID:${event.id}@fitmangas`);
      rows.push(`DTSTAMP:${stamp}`);
      rows.push(`DTSTART:${formatIcalDate(startsAt)}`);
      rows.push(`DTEND:${formatIcalDate(endsAt)}`);
      rows.push(`SUMMARY:${escapeIcal(event.title)}`);
      rows.push(`DESCRIPTION:${escapeIcal(event.description ?? 'Cours Pilates FitMangas')}`);
      if (event.location) rows.push(`LOCATION:${escapeIcal(event.location)}`);
      rows.push('END:VEVENT');
    });

    rows.push('END:VCALENDAR');

    return new Response(rows.join('\r\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="fitmangas-calendar.ics"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[api/calendar/export-ical]', error);
    return new Response('Erreur export calendrier.', { status: 500 });
  }
}
