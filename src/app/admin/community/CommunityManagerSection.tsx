import { CommunityManagerBoard } from '@/components/Admin/community/CommunityManagerBoard';

import { loadCommunityBoardProps } from './load-community-board';

export async function CommunityManagerSection() {
  const props = await loadCommunityBoardProps();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-2 sm:px-6">
      {props.boardLoadError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Board CM indisponible : {props.boardLoadError}
        </div>
      ) : null}
      <CommunityManagerBoard
        board={props.board}
        meta={props.meta}
        metaAppReady={props.metaAppReady}
        alejandraDouble={props.alejandraDouble}
        doubleUiEnabled={props.doubleUiEnabled}
        pillarHistoryLabels={props.pillarHistoryLabels}
        weekMixLabel={props.weekMixLabel}
      />
    </div>
  );
}
