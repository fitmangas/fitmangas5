import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/require-admin';
import { isAcquisitionModuleEnabled } from '@/lib/acquisition/feature-flag';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAcquisitionPage({ searchParams }: PageProps) {
  await requireAdmin();

  if (!isAcquisitionModuleEnabled()) {
    redirect('/admin/croissance?tab=publications');
  }

  const params = await searchParams;
  const q = new URLSearchParams();
  q.set('tab', firstParam(params.conversation) ? 'conversations' : 'overview');
  for (const [key, value] of Object.entries(params)) {
    if (value == null || key === 'tab') continue;
    const v = Array.isArray(value) ? value[0]! : value;
    q.set(key, v);
  }
  redirect(`/admin/croissance?${q.toString()}`);
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
