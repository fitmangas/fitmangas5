import { NextResponse } from 'next/server';

import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { recoverOrphanCourseReplays } from '@/lib/replay-recover-orphans';

/** Scan Vimeo toutes les 15 min — relie les replays uploadés mais pas encore en « En attente ». */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const result = await recoverOrphanCourseReplays({ lookbackDays: 45 });
    if (result.linked > 0) {
      console.info('[replay-recover cron]', {
        linked: result.linked,
        failed: result.failed,
        stillMissing: result.stillMissingRecent.length,
      });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[replay-recover cron]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
