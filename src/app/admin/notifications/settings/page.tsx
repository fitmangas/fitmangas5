import { redirect } from 'next/navigation';

/** Ancienne URL — regroupée dans /admin/inbox */
export default function AdminNotificationSettingsRedirectPage() {
  redirect('/admin/inbox?tab=settings');
}
