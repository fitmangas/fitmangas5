import { requireAdmin } from '@/lib/auth/require-admin';
import {
  AdminVideosLibraryPanel,
  AdminVideosPageShell,
  AdminVideosReplaysPanel,
  loadAdminVideosPage,
} from '@/lib/admin-videos-page';

type SearchParams = Promise<{ section?: string }>;

export default async function AdminVideosPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const section = sp.section === 'library' ? 'library' : 'replays';
  const data = await loadAdminVideosPage(section);

  return (
    <AdminVideosPageShell
      section={section}
      replaysPendingCount={data.replaysPendingCount}
      libraryPendingCount={data.libraryPendingCount}
    >
      {section === 'library' ? (
        <AdminVideosLibraryPanel vimeo={data.vimeo} />
      ) : (
        <AdminVideosReplaysPanel
          pending={data.pending}
          approved={data.approved}
          deadReplayCount={data.deadReplayCount}
        />
      )}
    </AdminVideosPageShell>
  );
}
