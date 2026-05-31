import { NextResponse } from 'next/server';

import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { runCourseCycles, runPhase2DailyJobs } from '@/lib/notifications/phase2';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const courseReminders = await runCourseCycles(admin);
    const result = await runPhase2DailyJobs(admin);
    return NextResponse.json({ courseReminders, ...result });
  } catch (error) {
    console.error('[daily jobs]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
