import { NextResponse } from 'next/server';

import { processDueSocialPostsInternal } from '@/lib/admin/social-publish-due';
import { verifyAnyCronSecret } from '@/lib/blog/cron-secret';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeHeartbeat } from '@/lib/notifications/v2/heartbeats';

export const maxDuration = 120;

async function handle(request: Request) {
  if (!(await verifyAnyCronSecret(request))) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  try {
    const social = await processDueSocialPostsInternal();
    try {
      await writeHeartbeat(createAdminClient(), 'social', { due: social.due, published: social.published });
    } catch (e) {
      console.error('[cron/social] heartbeat', e);
    }
    return NextResponse.json({ success: true, social });
  } catch (error) {
    console.error('[cron/social]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
