import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/require-admin';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCommunityPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const q = new URLSearchParams();
  q.set('tab', 'publications');
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    q.set(key, Array.isArray(value) ? value[0]! : value);
  }
  redirect(`/admin/croissance?${q.toString()}`);
}
