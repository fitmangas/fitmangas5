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

  const clientId = process.env.FITBIT_CLIENT_ID;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${APP}/compte/connaissance-de-soi/corps?wearable=missing_keys`);
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const redirectUri = `${APP}/api/self-knowledge/wearables/fitbit/callback`;
  const body = new URLSearchParams({
    client_id: clientId,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${APP}/compte/connaissance-de-soi/corps?wearable=token_fail`);
  }

  const token = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user_id?: string;
  };

  const admin = createAdminClient();
  await admin.from('wearable_connections').upsert(
    {
      profile_id: user.id,
      provider: 'fitbit',
      access_token: token.access_token ?? null,
      refresh_token: token.refresh_token ?? null,
      token_expires_at: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
      external_user_id: token.user_id ?? null,
      status: 'connected',
      connected_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id,provider' },
  );

  const res = NextResponse.redirect(`${APP}/compte/connaissance-de-soi/corps?wearable=fitbit_ok`);
  res.cookies.delete('fm_wearable_oauth_state');
  return res;
}
