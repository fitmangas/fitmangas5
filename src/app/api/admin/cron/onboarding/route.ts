import { NextResponse } from 'next/server';

import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { runOnboardingCycle, runWinBackCycle } from '@/lib/notifications/phase2';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const client = createAdminClient();
    const [onboarding, winBack] = await Promise.all([runOnboardingCycle(client), runWinBackCycle(client)]);
    return NextResponse.json({ onboarding, winBack });
  } catch (error) {
    console.error('[onboarding cron]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
