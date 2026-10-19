import { notFound } from 'next/navigation';

import { OffrirClient } from '@/components/Gifts/OffrirClient';
import { isGiftsEnabled } from '@/lib/gifts/flag';
import { loadGiftPrices } from '@/lib/gifts/prices';
import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { isHeartbeatLate } from '@/lib/notifications/v2/heartbeats';

export default async function OffrirPage() {
  if (!isGiftsEnabled() && !isDevPreviewEnabled()) notFound();
  const prices = await loadGiftPrices();
  let emailDeliveryOn = false;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('cron_heartbeats').select('last_run_at').eq('job', 'course-reminders').maybeSingle();
    emailDeliveryOn = !isHeartbeatLate((data as { last_run_at?: string } | null)?.last_run_at ?? null, 10 * 60 * 1000);
  } catch {
    emailDeliveryOn = false;
  }
  return <OffrirClient prices={prices} emailDeliveryOn={emailDeliveryOn} />;
}
