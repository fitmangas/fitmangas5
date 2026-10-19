import { notFound } from 'next/navigation';

import { AdminSanteV2 } from '@/components/Notifications/v2/AdminSanteV2';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';
import { HEARTBEAT_JOBS, isHeartbeatLate } from '@/lib/notifications/v2/heartbeats';
import { countDigestBacklog } from '@/lib/notifications/v2/cutoff';

export default async function AdminSantePage() {
  if (!isNotifV2Enabled()) notFound();
  await requireAdmin();
  const admin = createAdminClient();
  let backlog = 0;
  let heartbeats: Array<{ job: string; last_run_at: string | null; late: boolean }> = [];
  let noLiveAlert = false;
  try {
    const counts = await countDigestBacklog(admin);
    backlog = counts.reduce((s, r) => s + r.n, 0);
    const { data: beats } = await admin.from('cron_heartbeats').select('job, last_run_at');
    heartbeats = Object.keys(HEARTBEAT_JOBS).map((job) => {
      const row = (beats ?? []).find((b) => (b as { job: string }).job === job) as { last_run_at?: string } | undefined;
      return {
        job,
        last_run_at: row?.last_run_at ?? null,
        late: isHeartbeatLate(row?.last_run_at, HEARTBEAT_JOBS[job as keyof typeof HEARTBEAT_JOBS]),
      };
    });
    const until = new Date(Date.now() + 7 * 86400000).toISOString();
    const { count } = await admin
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('course_format', 'online')
      .eq('is_published', true)
      .gte('starts_at', new Date().toISOString())
      .lte('starts_at', until);
    noLiveAlert = (count ?? 0) === 0;
  } catch (e) {
    console.error('[admin/sante]', e);
  }

  return (
    <AdminSanteV2
      noLiveAlert={noLiveAlert}
      backlog={backlog}
      heartbeats={heartbeats}
      sent7d={{ email: 0, fail: 0, push: 0 }}
      errors={[]}
    />
  );
}
