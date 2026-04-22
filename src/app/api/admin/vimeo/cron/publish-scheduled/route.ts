import { NextResponse } from 'next/server';

import { publishDueScheduledVideos } from '@/lib/vimeo-scheduling-service';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  if (url.searchParams.get('secret') === secret) return true;

  return false;
}

/** GET — appelé par cron externe (Vercel / GitHub Actions / systemd) toutes les minutes. */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ ok: false, error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await publishDueScheduledVideos(admin);
    return NextResponse.json({
      ok: true,
      published: result.published,
      errors: result.errors,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur cron.';
    console.error('[vimeo cron]', e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
