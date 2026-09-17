import { NextResponse } from 'next/server';

import { processDueSocialPostsAction } from '@/app/admin/community/actions';
import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { runCourseCycles } from '@/lib/notifications/phase2';
import { createAdminClient } from '@/lib/supabase/admin';

/** Appelé ~toutes les 10 min via cron-job.org — filet fiable hors Vercel Hobby. */
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    // Publications IG dues en premier (prioritaire vs rappels cours).
    let social: Awaited<ReturnType<typeof processDueSocialPostsAction>> | { error: string };
    try {
      social = await processDueSocialPostsAction();
      console.info('[course reminders cron] social', social);
    } catch (e) {
      console.error('[course reminders cron] social', e);
      social = { error: e instanceof Error ? e.message : 'social failed' };
    }

    const result = await runCourseCycles(createAdminClient());
    return NextResponse.json({ ...result, social });
  } catch (error) {
    console.error('[course reminders cron]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
