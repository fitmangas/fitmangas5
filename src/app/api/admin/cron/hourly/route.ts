import { NextResponse } from 'next/server';

import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { createAdminClient } from '@/lib/supabase/admin';
import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';
import { writeHeartbeat, alertCronLagIfNeeded } from '@/lib/notifications/v2/heartbeats';
import { processDigestQueue } from '@/lib/notifications/phase3';
import { enqueueProgramSessionReminders } from '@/lib/programmes/reminders';

export const maxDuration = 120;

async function handle(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  const admin = createAdminClient();
  const results: Record<string, unknown> = { flag: isNotifV2Enabled() };

  try {
    const digest = await processDigestQueue(admin);
    results.digest = digest;
  } catch (e) {
    console.error('[cron/hourly] digest', e);
    results.digest = { error: e instanceof Error ? e.message : 'digest' };
  }

  try {
    results.programSessions = await enqueueProgramSessionReminders(admin);
  } catch (e) {
    console.error('[cron/hourly] program sessions', e);
    results.programSessions = { error: e instanceof Error ? e.message : 'program' };
  }

  try {
    const { data } = await admin.from('cron_heartbeats').select('job, last_run_at');
    for (const row of data ?? []) {
      const job = (row as { job: string; last_run_at: string }).job;
      if (job === 'course-reminders' || job === 'social' || job === 'hourly' || job === 'daily-jobs') {
        await alertCronLagIfNeeded(admin, job, (row as { last_run_at: string }).last_run_at);
      }
    }
    results.lagCheck = 'ok';
  } catch (e) {
    console.error('[cron/hourly] lag', e);
    results.lagCheck = { error: e instanceof Error ? e.message : 'lag' };
  }

  try {
    await writeHeartbeat(admin, 'hourly', results);
  } catch (e) {
    console.error('[cron/hourly] heartbeat', e);
  }

  return NextResponse.json({ success: true, ...results });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
