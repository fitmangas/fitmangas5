import { NextResponse } from 'next/server';

import { processDueSocialPostsAction } from '@/app/admin/community/actions';
import { verifyCronSecret } from '@/lib/blog/cron-secret';

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
    const result = await processDueSocialPostsAction();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[community publish-scheduled]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
