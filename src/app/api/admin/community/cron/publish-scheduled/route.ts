import { NextResponse } from 'next/server';

import { processDueSocialPostsAction } from '@/app/admin/community/actions';
import { verifyCronSecret } from '@/lib/blog/cron-secret';

/** Hobby autorise jusqu’à 300s — Reels Meta demandent souvent 30–90s + reprise. */
export const maxDuration = 120;

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
    // Pas de recover replays ici : ça volait le budget temps et faisait rater les publications IG.
    const result = await processDueSocialPostsAction();
    console.info('[community publish-scheduled]', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[community publish-scheduled]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur.' },
      { status: 500 },
    );
  }
}
