import { NextResponse } from 'next/server';

import { processDueSocialPostsAction } from '@/app/admin/community/actions';
import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { runCourseCycles, runPhase2DailyJobs } from '@/lib/notifications/phase2';
import { recoverOrphanCourseReplays } from '@/lib/replay-recover-orphans';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const courseReminders = await runCourseCycles(admin);
    const result = await runPhase2DailyJobs(admin);
    const social = await processDueSocialPostsAction();
    let replayRecover: Awaited<ReturnType<typeof recoverOrphanCourseReplays>> | { error: string };
    try {
      replayRecover = await recoverOrphanCourseReplays({ lookbackDays: 45 });
      if (replayRecover.linked > 0 || replayRecover.stillMissingRecent.length > 0) {
        console.info('[daily jobs] replay recover', {
          linked: replayRecover.linked,
          stillMissingRecent: replayRecover.stillMissingRecent.length,
        });
      }
    } catch (e) {
      console.error('[daily jobs] replay recover', e);
      replayRecover = { error: e instanceof Error ? e.message : 'recover failed' };
    }
    return NextResponse.json({ courseReminders, ...result, social, replayRecover });
  } catch (error) {
    console.error('[daily jobs]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
