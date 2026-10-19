import { NextResponse } from 'next/server';

import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { snapshotPreviousMonthForActiveUsers } from '@/lib/self-knowledge/progress-monthly';

/**
 * Snapshot mensuel progression — brancher sur cron 1er du mois.
 * Auth : CRON_SECRET (Vercel l’envoie en Authorization: Bearer).
 */
export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const n = await snapshotPreviousMonthForActiveUsers();
  return NextResponse.json({ ok: true, snapshotted: n });
}
