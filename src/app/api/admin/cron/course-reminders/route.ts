import { NextResponse } from 'next/server';

import { processDueSocialPostsInternal } from '@/lib/admin/social-publish-due';
import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { runCourseCycles } from '@/lib/notifications/phase2';
import { createAdminClient } from '@/lib/supabase/admin';
import { alertCronLagIfNeeded, writeHeartbeat } from '@/lib/notifications/v2/heartbeats';

/** Appelé ~toutes les 10 min via cron-job.org — filet fiable hors Vercel Hobby. */
export const maxDuration = 120;

async function handle(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    // Publications IG dues en premier (prioritaire vs rappels cours).
    let social: Awaited<ReturnType<typeof processDueSocialPostsInternal>> | { error: string };
    try {
      social = await processDueSocialPostsInternal();
      console.info('[course reminders cron] social', social);
    } catch (e) {
      console.error('[course reminders cron] social', e);
      social = { error: e instanceof Error ? e.message : 'social failed' };
    }

    const admin = createAdminClient();
    const result = await runCourseCycles(admin);
    try {
      const { data } = await admin.from('cron_heartbeats').select('job, last_run_at').eq('job', 'course-reminders').maybeSingle();
      await alertCronLagIfNeeded(admin, 'course-reminders', (data as { last_run_at?: string } | null)?.last_run_at ?? null);
      await writeHeartbeat(admin, 'course-reminders', result);
    } catch (e) {
      console.error('[course reminders cron] heartbeat', e);
    }
    return NextResponse.json({ ...result, social });
  } catch (error) {
    console.error('[course reminders cron]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
