import { NextResponse } from 'next/server';

import { syncSocialPostInsights } from '@/lib/admin/social-insights-sync';
import { verifyCronSecret } from '@/lib/blog/cron-secret';

/** Cron Insights IG — désactivé tant que SOCIAL_INSIGHTS_SYNC_ENABLED ≠ true. */
export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  try {
    const result = await syncSocialPostInsights();
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    console.error('[community insights-sync]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
