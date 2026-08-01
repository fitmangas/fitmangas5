import { AdminNotificationsPageClient } from '@/components/Admin/AdminNotificationsPageClient';
import { requireAdmin } from '@/lib/auth/require-admin';
import { loadNotificationObservability } from '@/lib/admin/notification-observability';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  await requireAdmin();
  const summary = await loadNotificationObservability('month');

  return <AdminNotificationsPageClient initialSummary={summary} />;
}
