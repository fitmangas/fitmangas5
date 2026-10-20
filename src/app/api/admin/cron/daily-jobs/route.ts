import { NextResponse } from 'next/server';

import { processDueSocialPostsInternal } from '@/lib/admin/social-publish-due';
import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { runCourseCycles, runPhase2DailyJobs } from '@/lib/notifications/phase2';
import { recoverOrphanCourseReplays } from '@/lib/replay-recover-orphans';
import { createAdminClient } from '@/lib/supabase/admin';
import { alertCronLagIfNeeded, writeHeartbeat } from '@/lib/notifications/v2/heartbeats';

export const maxDuration = 300;

async function handle(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    // Social en premier : prioritaire vs jobs lourds (reminders / Vimeo recover).
    const social = await processDueSocialPostsInternal();
    const admin = createAdminClient();
    const courseReminders = await runCourseCycles(admin);
    const result = await runPhase2DailyJobs(admin);
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
    try {
      const { data } = await admin.from('cron_heartbeats').select('job, last_run_at');
      for (const row of data ?? []) {
        const job = (row as { job: string }).job;
        if (job === 'course-reminders' || job === 'social' || job === 'hourly' || job === 'daily-jobs') {
          await alertCronLagIfNeeded(admin, job, (row as { last_run_at: string }).last_run_at);
        }
      }
      await writeHeartbeat(admin, 'daily-jobs', { courseReminders, social });
    } catch (e) {
      console.error('[daily jobs] heartbeat', e);
    }
    return NextResponse.json({ courseReminders, ...result, social, replayRecover });
  } catch (error) {
    console.error('[daily jobs]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
