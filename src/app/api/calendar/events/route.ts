import { NextResponse } from 'next/server';
import { getCoursesForUser, getUserTier } from '@/lib/access-control';
import { requireAuthenticatedUser } from '@/lib/api-auth';
import { getUtcFortnightWindow, isCoursePast, isWithinFortnight } from '@/lib/calendar-window';

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  try {
    const window = getUtcFortnightWindow();
    const now = new Date();

    const [tier, courses] = await Promise.all([
      getUserTier(auth.user.id),
      getCoursesForUser(auth.user.id),
    ]);

    const filtered = courses.filter((course) => {
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
