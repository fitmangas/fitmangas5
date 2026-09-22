import { NextResponse } from 'next/server';

import { snapshotPreviousMonthForActiveUsers } from '@/lib/self-knowledge/progress-monthly';

/**
 * Snapshot mensuel progression — brancher sur cron 1er du mois.
 * Auth : CRON_SECRET ou header Vercel cron.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  const isVercelCron = Boolean(req.headers.get('x-vercel-cron'));
  if (secret && auth !== `Bearer ${secret}` && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const n = await snapshotPreviousMonthForActiveUsers();
  return NextResponse.json({ ok: true, snapshotted: n });
}
