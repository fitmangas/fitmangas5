import { NextResponse } from 'next/server';

import { processDueSocialPostsAction } from '@/app/admin/community/actions';
import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { recoverOrphanCourseReplays } from '@/lib/replay-recover-orphans';

export async function GET(request: Request) {
  return handlePublish(request);
}

export async function POST(request: Request) {
  return handlePublish(request);
}

async function handlePublish(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    let replayRecover: Awaited<ReturnType<typeof recoverOrphanCourseReplays>> | { error: string };
    try {
      replayRecover = await recoverOrphanCourseReplays({ lookbackDays: 45 });
    } catch (e) {
      console.error('[community publish-scheduled] replay recover', e);
      replayRecover = { error: e instanceof Error ? e.message : 'recover failed' };
    }

    const result = await processDueSocialPostsAction();
    return NextResponse.json({ ...result, replayRecover });
  } catch (error) {
    console.error('[community publish-scheduled]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
