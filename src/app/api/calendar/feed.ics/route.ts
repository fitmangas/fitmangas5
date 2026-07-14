import {
  buildCalendarFeedIcs,
  isCalendarFeedEligible,
  loadCalendarFeedCourses,
} from '@/lib/calendar-feed-build';
import { verifyCalendarFeedToken } from '@/lib/calendar-feed-token';
import { createAdminClient } from '@/lib/supabase/admin';

const ICS_HEADERS = {
  'Content-Type': 'text/calendar; charset=utf-8',
  'Content-Disposition': 'inline; filename="fitmangas-mobile.ics"',
  'Cache-Control': 'no-store',
} as const;

/**
 * Flux principal d’abonnement Apple / Google.
 * Format d’URL attendu : /api/calendar/feed.ics?token=<jeton>
 * (identique à la version antérieure qui ouvrait directement la validation iOS)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim();
  if (!token) {
    return new Response('Token manquant.', { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const signedUserId = verifyCalendarFeedToken(token);
    if (signedUserId) {
      const eligible = await isCalendarFeedEligible(admin, signedUserId);
      if (!eligible) {
        return new Response('Flux indisponible.', { status: 404 });
      }
      const courses = await loadCalendarFeedCourses(admin, signedUserId);
      return icsResponse(buildCalendarFeedIcs(courses));
    }

    // Compat anciens jetons stockés en base (si encore actifs)
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, calendar_sync_enabled')
      .eq('calendar_sync_token', token)
      .maybeSingle();

    if (profileError || !profile?.id || !profile.calendar_sync_enabled) {
      return new Response('Flux indisponible.', { status: 404 });
    }

    const eligible = await isCalendarFeedEligible(admin, profile.id);
    if (!eligible) {
      return new Response('Flux indisponible.', { status: 404 });
    }

    const courses = await loadCalendarFeedCourses(admin, profile.id);
    return icsResponse(buildCalendarFeedIcs(courses));
  } catch (error) {
    console.error('[api/calendar/feed.ics]', error);
    return new Response('Impossible de générer le calendrier.', { status: 500 });
  }
}

/** Certains clients sondent d’abord en HEAD avant de télécharger le .ics */
export async function HEAD(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim();
  if (!token) {
    return new Response(null, { status: 400, headers: ICS_HEADERS });
  }
  return new Response(null, { status: 200, headers: ICS_HEADERS });
}

function icsResponse(body: string) {
  return new Response(body, {
    status: 200,
    headers: ICS_HEADERS,
  });
}
