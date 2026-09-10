import { getAlejandraDoubleProfile, isAlejandraDoubleEnabled } from '@/lib/admin/alejandra-double';
import { metaAppConfigured } from '@/lib/admin/meta-social';
import {
  getMetaAppLiveAck,
  getMetaSocialConnection,
  getSocialCommsBoard,
  SocialCommsBoardLoadError,
  emptySocialCommsBoard,
} from '@/lib/admin/social-comms';
import {
  getTikTokSocialConnection,
  tiktokAppConfigured,
  tiktokConnectorStatusMessage,
} from '@/lib/admin/tiktok-social';
import { loadPillarHistory, recentThemeLabels } from '@/lib/admin/social-pillars';

export async function loadCommunityBoardProps() {
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

  const [meta, tiktok, metaLiveAck, alejandraDouble, pillarHistory] = await Promise.all([
    getMetaSocialConnection(),
    getTikTokSocialConnection(),
    getMetaAppLiveAck(),
    getAlejandraDoubleProfile(),
    loadPillarHistory(),
  ]);

  const lastPlan = pillarHistory.weekPlans?.[0];

  return {
    board,
    boardLoadError,
    meta,
    metaAppReady: metaAppConfigured(),
    metaLiveAck,
    tiktok,
    tiktokAppReady: tiktokAppConfigured(),
    tiktokStatusMessage: tiktokConnectorStatusMessage(tiktok),
    alejandraDouble,
    doubleUiEnabled: isAlejandraDoubleEnabled(),
    pillarHistoryLabels: recentThemeLabels(pillarHistory, 8),
    weekMixLabel: lastPlan?.mixLabel ?? null,
  };
}
