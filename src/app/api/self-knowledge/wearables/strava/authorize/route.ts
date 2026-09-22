import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';

import { WEARABLES_V2_ENABLED, stravaAuthorizeUrl } from '@/lib/self-knowledge/wearables';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  if (!WEARABLES_V2_ENABLED) {
    return NextResponse.json(
      { error: 'Wearables désactivés. Fournis les clés Strava puis active le flag.' },
      { status: 503 },
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/?compte=connexion-requise', process.env.NEXT_PUBLIC_APP_URL || 'https://fitmangas.com'));

  const state = randomBytes(16).toString('hex');
  const url = stravaAuthorizeUrl(state);
  if (!url) {
    return NextResponse.json({ error: 'STRAVA_CLIENT_ID manquant' }, { status: 500 });
  }

  const res = NextResponse.redirect(url);
  res.cookies.set('fm_wearable_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  res.cookies.set('fm_wearable_provider', 'strava', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return res;
}
