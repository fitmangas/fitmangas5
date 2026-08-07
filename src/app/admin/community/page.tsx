import { CommunityManagerBoard } from '@/components/Admin/community/CommunityManagerBoard';
import { requireAdmin } from '@/lib/auth/require-admin';
import { getAlejandraDoubleProfile, isAlejandraDoubleEnabled } from '@/lib/admin/alejandra-double';
import { metaAppConfigured } from '@/lib/admin/meta-social';
import {
  getMetaSocialConnection,
  getSocialCommsBoard,
  SocialCommsBoardLoadError,
  emptySocialCommsBoard,
} from '@/lib/admin/social-comms';
import { loadPillarHistory, recentThemeLabels } from '@/lib/admin/social-pillars';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export default async function AdminCommunityPage() {
  await requireAdmin();

  let board = emptySocialCommsBoard();
  let boardLoadError: string | null = null;
  try {
    board = await getSocialCommsBoard();
  } catch (e) {
    boardLoadError =
      e instanceof SocialCommsBoardLoadError
        ? e.message
        : e instanceof Error
          ? e.message
          : 'Board CM indisponible.';
  }

  const [meta, alejandraDouble, pillarHistory] = await Promise.all([
    getMetaSocialConnection(),
    getAlejandraDoubleProfile(),
    loadPillarHistory(),
  ]);

  const lastPlan = pillarHistory.weekPlans?.[0];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      {boardLoadError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Board CM indisponible : {boardLoadError}
        </div>
      ) : null}
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
