import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { WEARABLES_V2_ENABLED } from '@/lib/self-knowledge/wearables';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const APP = (process.env.NEXT_PUBLIC_APP_URL || 'https://fitmangas.com').replace(/\/$/, '');

export async function GET(req: Request) {
  if (!WEARABLES_V2_ENABLED) {
    return NextResponse.redirect(`${APP}/compte/connaissance-de-soi/corps?wearable=off`);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const jar = await cookies();
  const expected = jar.get('fm_wearable_oauth_state')?.value;

  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(`${APP}/compte/connaissance-de-soi/corps?wearable=error`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${APP}/?compte=connexion-requise`);

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${APP}/compte/connaissance-de-soi/corps?wearable=missing_keys`);
  }

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${APP}/compte/connaissance-de-soi/corps?wearable=token_fail`);
  }

  const token = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    athlete?: { id?: number };
  };

  const admin = createAdminClient();
  await admin.from('wearable_connections').upsert(
    {
      profile_id: user.id,
      provider: 'strava',
      access_token: token.access_token ?? null,
      refresh_token: token.refresh_token ?? null,
      token_expires_at: token.expires_at
        ? new Date(token.expires_at * 1000).toISOString()
        : null,
      external_user_id: token.athlete?.id != null ? String(token.athlete.id) : null,
      status: 'connected',
      connected_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id,provider' },
  );

  const res = NextResponse.redirect(`${APP}/compte/connaissance-de-soi/corps?wearable=strava_ok`);
  res.cookies.delete('fm_wearable_oauth_state');
  res.cookies.delete('fm_wearable_provider');
  return res;
}
