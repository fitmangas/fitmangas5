import { NextResponse } from 'next/server';

import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { runDueFollowups } from '@/lib/acquisition/engine/repository';
import { isAcquisitionModuleEnabled } from '@/lib/acquisition/feature-flag';

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

  if (!isAcquisitionModuleEnabled()) {
    return NextResponse.json({ skipped: true, reason: 'ACQUISITION_MODULE_ENABLED=false' });
  }

  try {
    const result = await runDueFollowups(40);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[acquisition run-followups]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
