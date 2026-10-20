import { notFound } from 'next/navigation';

import { AdminSanteV2 } from '@/components/Notifications/v2/AdminSanteV2';
import { requireAdmin } from '@/lib/auth/require-admin';
import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';
import { loadSanteData } from '@/lib/notifications/v2/sante-data';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminSantePage() {
  if (!isNotifV2Enabled()) notFound();
  await requireAdmin();
  const data = await loadSanteData(createAdminClient());
  return <AdminSanteV2 data={data} />;
}
