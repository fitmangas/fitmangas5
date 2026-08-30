import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/require-admin';

export const dynamic = 'force-dynamic';

export default async function AdminMarketingPage() {
  await requireAdmin();
  redirect('/admin/croissance?tab=seo');
}
