import {
  buildCalendarFeedIcs,
  isCalendarFeedEligible,
  loadCalendarFeedCourses,
} from '@/lib/calendar-feed-build';
import { verifyCalendarFeedToken } from '@/lib/calendar-feed-token';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{ token: string }>;
};

/**
 * GET /api/calendar/feed/[token].ics
 * Flux ICS d’abonnement (sans cookies) — jeton HMAC signé.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { token: rawToken } = await context.params;
  const userId = verifyCalendarFeedToken(rawToken ?? '');
  if (!userId) {
    return new Response('Flux indisponible.', { status: 404 });
  }

  try {
    const admin = createAdminClient();
    const eligible = await isCalendarFeedEligible(admin, userId);
    if (!eligible) {
      return new Response('Flux indisponible.', { status: 404 });
    }

    const courses = await loadCalendarFeedCourses(admin, userId);
    const body = buildCalendarFeedIcs(courses);

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="fitmangas.ics"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[api/calendar/feed]', error);
    return new Response('Impossible de générer le calendrier.', { status: 500 });
  }
}
