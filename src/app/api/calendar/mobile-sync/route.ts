import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/api-auth';
import { isCalendarFeedEligible } from '@/lib/calendar-feed-build';
import {
  calendarFeedGoogleSubscribeUrl,
  calendarFeedHttpsUrl,
  calendarFeedWebcalUrl,
  createCalendarFeedToken,
  getCalendarFeedSecret,
} from '@/lib/calendar-feed-token';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Renvoie les URL d’abonnement calendrier (jeton signé, sans écriture en base).
 * Remplace l’ancienne synchro qui tentait de stocker un token dans profiles
 * (colonnes non autorisées en UPDATE depuis le durcissement sécurité).
 */
async function buildSubscribePayload(userId: string) {
  if (!getCalendarFeedSecret()) {
    return {
      response: NextResponse.json(
        { error: 'Configuration calendrier incomplète sur le serveur.' },
        { status: 503 },
      ),
    };
  }

  const admin = createAdminClient();
  const eligible = await isCalendarFeedEligible(admin, userId);
  if (!eligible) {
    return {
      response: NextResponse.json(
        {
          error:
            'Abonnement calendrier indisponible : compte inactif, banni ou sans abonnement / accès en cours.',
        },
        { status: 403 },
      ),
    };
  }

  const token = createCalendarFeedToken(userId);
  const httpsUrl = calendarFeedHttpsUrl(token);
  const webcalUrl = calendarFeedWebcalUrl(token);
  const googleUrl = calendarFeedGoogleSubscribeUrl(token);

  return {
    response: null as null,
    payload: {
      enabled: true,
      httpsUrl,
      webcalUrl,
      googleUrl,
      /** @deprecated alias pour compat UI */
      feedUrl: httpsUrl,
    },
  };
}

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  try {
    const result = await buildSubscribePayload(auth.user.id);
    if (result.response) return result.response;
    return NextResponse.json(result.payload);
  } catch (error) {
    console.error('[api/calendar/mobile-sync] GET', error);
    return NextResponse.json(
      { error: 'Impossible de préparer l’abonnement calendrier. Réessaie dans un instant.' },
      { status: 500 },
    );
  }
}

/** Active / renvoie l’abonnement (plus d’écriture profiles). body.enabled=false → juste confirme). */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  let enabled = true;
  try {
    const body = (await request.json()) as { enabled?: unknown };
    if (typeof body?.enabled === 'boolean') enabled = body.enabled;
  } catch {
    // corps optionnel
  }

  if (!enabled) {
    return NextResponse.json({
      enabled: false,
      httpsUrl: null,
      webcalUrl: null,
      googleUrl: null,
      feedUrl: null,
    });
  }

  try {
    const result = await buildSubscribePayload(auth.user.id);
    if (result.response) return result.response;
    return NextResponse.json(result.payload);
  } catch (error) {
    console.error('[api/calendar/mobile-sync] POST', error);
    return NextResponse.json(
      { error: 'Impossible de préparer l’abonnement calendrier. Réessaie dans un instant.' },
      { status: 500 },
    );
  }
}
