import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { AdminProgrammesManager } from '@/components/Programmes/admin/AdminProgrammesManager';
import { loadAdminProgramDetail, loadAdminProgramList, loadAdminStats, loadAdminVideos } from '@/lib/programmes/admin-data';

export const dynamic = 'force-dynamic';

const TABS = ['info', 'weeks', 'tests', 'es'] as const;

/** B10 — éditeur des programmes (liste, contenu, séances, tests, textes ES, statistiques). */
export default async function AdminProgrammesPage({ searchParams }: { searchParams: Promise<{ p?: string; onglet?: string }> }) {
  if (!isProgrammesEnabled()) notFound();
  await requireAdmin();
  const sp = await searchParams;
  const admin = createAdminClient();
  const { items, tablesMissing } = await loadAdminProgramList(admin);
  const selectedId = items.find((p) => p.id === sp.p)?.id ?? items[0]?.id ?? null;
  const [detail, videos] = await Promise.all([selectedId ? loadAdminProgramDetail(admin, selectedId) : Promise.resolve(null), loadAdminVideos(admin)]);
  const stats = detail ? await loadAdminStats(admin, detail.id, detail.steps, new Map(videos.map((v) => [v.id, v.title]))) : null;
  const tab = (TABS as readonly string[]).includes(sp.onglet ?? '') ? (sp.onglet as (typeof TABS)[number]) : 'weeks';

  return (
    <AdminProgrammesManager
      key={detail?.id ?? 'none'}
      programs={items}
      detail={detail}
      videos={videos}
      stats={stats}
      tablesMissing={tablesMissing}
      initialTab={tab}
    />
  );
}
