import { NextResponse } from 'next/server';
import { getCoursesForUser, getUserTier } from '@/lib/access-control';
import { requireAuthenticatedUser } from '@/lib/api-auth';
import { getUtcFortnightWindow, isCoursePast, isWithinFortnight } from '@/lib/calendar-window';

/** `?depuis=<ISO>` (planning v3) : inclut aussi les lives déjà passés depuis cette date (≤ 8 jours), pour « Voir le replay ». */
function parseSince(raw: string | null, now: Date): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const min = now.getTime() - 8 * 24 * 60 * 60 * 1000;
  if (d.getTime() < min || d.getTime() > now.getTime()) return null;
  return d;
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  try {
    const window = getUtcFortnightWindow();
    const now = new Date();
    const since = parseSince(new URL(request.url).searchParams.get("depuis"), now);

    const [tier, courses] = await Promise.all([
      getUserTier(auth.user.id),
      getCoursesForUser(auth.user.id),
    ]);

    const filtered = courses.filter((course) => {
      if (since) {
        const start = new Date(course.starts_at).getTime();
        return start >= since.getTime() && start < window.endExclusive.getTime();
      }
      if (!isWithinFortnight(course.starts_at, window)) return false;
      if (isCoursePast(course.ends_at, now)) return false;
      return true;
    });

    return NextResponse.json({
      tier,
      events: filtered,
      meta: {
        total: filtered.length,
        windowStart: window.start.toISOString(),
        windowEndExclusive: window.endExclusive.toISOString(),
        fortNightDays: 14,
      },
    });
  } catch (error) {
    console.error('[api/calendar/events]', error);
    return NextResponse.json({ error: 'Impossible de charger les événements.' }, { status: 500 });
  }
}
