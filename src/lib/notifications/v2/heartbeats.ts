import type { SupabaseClient } from '@supabase/supabase-js';

import { sendEmail } from '@/lib/email/send';
import { A_VALIDER_LOT2 } from '@/content/a-valider';

export const HEARTBEAT_JOBS = {
  'course-reminders': 10 * 60 * 1000,
  social: 10 * 60 * 1000,
  hourly: 60 * 60 * 1000,
  'daily-jobs': 24 * 60 * 60 * 1000,
} as const;

export type HeartbeatJob = keyof typeof HEARTBEAT_JOBS;

export async function writeHeartbeat(
  client: SupabaseClient,
  job: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  const { error } = await client.from('cron_heartbeats').upsert(
    {
      job,
      last_run_at: new Date().toISOString(),
      meta: extra ?? {},
    },
    { onConflict: 'job' },
  );
  if (error) {
    console.error('[cron-heartbeat] écriture impossible', job, error.message);
  }
}

export function isHeartbeatLate(lastRunAt: string | null | undefined, expectedMs: number, now = new Date()): boolean {
  if (!lastRunAt) return true;
  return now.getTime() - Date.parse(lastRunAt) > expectedMs * 2;
}

const LAG_IDEM_PREFIX = 'admin.cron_lag';

export async function alertCronLagIfNeeded(
  client: SupabaseClient,
  job: HeartbeatJob,
  lastRunAt: string | null | undefined,
  now = new Date(),
): Promise<boolean> {
  if (!isHeartbeatLate(lastRunAt, HEARTBEAT_JOBS[job], now)) return false;
  const dayKey = now.toISOString().slice(0, 10);
  const idempotencyKey = `${LAG_IDEM_PREFIX}:${job}:${dayKey}`;
  const { data: already } = await client.from('notification_log').select('id').eq('idempotency_key', idempotencyKey).maybeSingle();
  if (already) return false;
  const to = process.env.ADMIN_ALERT_EMAIL?.trim();
  if (to) {
    await sendEmail({
      to,
      subject: A_VALIDER_LOT2.cronLag.fr(job),
      html: `<p>${A_VALIDER_LOT2.cronLag.fr(job)}</p><p>Dernier passage : ${lastRunAt ?? 'jamais'}.</p>`,
    });
  }
  await client.from('notification_log').insert({
    user_id: null,
    event_type: 'admin.cron_lag',
    channel: 'email',
    payload: { job, lastRunAt },
    idempotency_key: idempotencyKey,
  });
  return true;
}
