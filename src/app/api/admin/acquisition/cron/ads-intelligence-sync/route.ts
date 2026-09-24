import { NextResponse } from 'next/server';

import { runAdsIntelligenceSync } from '@/lib/acquisition/ads/sync-intelligence';
import { verifyCronSecret } from '@/lib/blog/cron-secret';

/** Sync quotidienne Ads + organique → snapshots (lecture seule, 0 €). */
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
    const result = await runAdsIntelligenceSync('cron');
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    console.error('[ads intelligence-sync]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
