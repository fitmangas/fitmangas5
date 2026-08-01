import { CommunityManagerBoard } from '@/components/Admin/community/CommunityManagerBoard';
import { requireAdmin } from '@/lib/auth/require-admin';
import { getAlejandraDoubleProfile, isAlejandraDoubleEnabled } from '@/lib/admin/alejandra-double';
import { metaAppConfigured } from '@/lib/admin/meta-social';
import { getMetaSocialConnection, getSocialCommsBoard } from '@/lib/admin/social-comms';
import { loadPillarHistory, recentThemeLabels } from '@/lib/admin/social-pillars';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export default async function AdminCommunityPage() {
  await requireAdmin();
  const [board, meta, alejandraDouble, pillarHistory] = await Promise.all([
    getSocialCommsBoard(),
    getMetaSocialConnection(),
    getAlejandraDoubleProfile(),
    loadPillarHistory(),
  ]);

  const lastPlan = pillarHistory.weekPlans?.[0];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <CommunityManagerBoard
        board={board}
        meta={meta}
        metaAppReady={metaAppConfigured()}
        alejandraDouble={alejandraDouble}
        doubleUiEnabled={isAlejandraDoubleEnabled()}
        pillarHistoryLabels={recentThemeLabels(pillarHistory, 8)}
        weekMixLabel={lastPlan?.mixLabel ?? null}
      />
    </main>
  );
}
