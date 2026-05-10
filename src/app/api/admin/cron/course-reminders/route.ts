import { NextResponse } from 'next/server';

import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { runCourseCycles } from '@/lib/notifications/phase2';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const result = await runCourseCycles(createAdminClient());
    return NextResponse.json(result);
  } catch (error) {
    console.error('[course reminders cron]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
