import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/api-auth';
import { gateCalendarSyncForUser } from '@/lib/calendar-sync-eligibility';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

function appUrlFromEnv() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function webcalUrlForToken(token: string) {
  const base = appUrlFromEnv();
  const httpUrl = `${base}/api/calendar/feed.ics?token=${encodeURIComponent(token)}`;
  return httpUrl.replace(/^https?:\/\//, 'webcal://');
}

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('calendar_sync_enabled, calendar_sync_token')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Impossible de lire le statut de synchronisation.' }, { status: 500 });
  }

  let enabled = data?.calendar_sync_enabled === true;
  const token = data?.calendar_sync_token ?? null;

  if (enabled) {
    const admin = createAdminClient();
    const gate = await gateCalendarSyncForUser(admin, auth.user.id);
    enabled = gate.ok;
  }

  return NextResponse.json({
    enabled,
    webcalUrl: enabled && token ? webcalUrlForToken(token) : null,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const enabled =
    typeof body === 'object' && body !== null && 'enabled' in body && typeof (body as { enabled: unknown }).enabled === 'boolean'
      ? (body as { enabled: boolean }).enabled
      : null;

  if (enabled == null) {
    return NextResponse.json({ error: 'Champ "enabled" requis.' }, { status: 400 });
  }

  if (enabled) {
    const admin = createAdminClient();
    const gate = await gateCalendarSyncForUser(admin, auth.user.id);
    if (!gate.ok) {
      return NextResponse.json(
        { error: 'Synchronisation indisponible : compte inactif, banni ou sans abonnement / accès en cours.' },
        { status: 403 },
      );
    }
  }

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from('profiles')
    .select('calendar_sync_token')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (currentError) {
    return NextResponse.json({ error: 'Impossible de mettre à jour la synchronisation.' }, { status: 500 });
  }

  const token = current?.calendar_sync_token || crypto.randomUUID();
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      calendar_sync_enabled: enabled,
      calendar_sync_token: token,
    })
    .eq('id', auth.user.id);

  if (updateError) {
    return NextResponse.json({ error: 'Mise à jour impossible.' }, { status: 500 });
  }

  return NextResponse.json({
    enabled,
    webcalUrl: webcalUrlForToken(token),
  });
}
