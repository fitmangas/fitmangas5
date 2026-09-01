'use client';

import Link from 'next/link';

import type { AdminVideosSection } from '@/lib/admin-videos-page';

type Props = {
  section: AdminVideosSection;
  replaysPendingCount: number;
  libraryPendingCount: number;
};

export function AdminVideosSectionToggle({ section, replaysPendingCount, libraryPendingCount }: Props) {
  const replaysHref =
    replaysPendingCount > 0 ? '/admin/videos?section=replays#course-replays-pending' : '/admin/videos?section=replays';
  const libraryHref =
    libraryPendingCount > 0 ? '/admin/videos?section=library#vimeo-pending-section' : '/admin/videos?section=library';

  return (
    <div className="mt-6 flex rounded-full border border-white/55 bg-white/60 p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <Link
        href={replaysHref}
        className={`relative flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] transition-all ${
          section === 'replays'
            ? 'bg-[#C45D3E] text-[#FFF8F0] shadow-[0_6px_18px_rgba(196,93,62,0.35)]'
            : 'text-luxury-muted hover:text-luxury-ink'
        }`}
      >
        Replays
        {replaysPendingCount > 0 ? (
          <span className="rounded-full bg-[#FF9F0A] px-2 py-0.5 text-[10px] font-bold text-white">
            {replaysPendingCount > 9 ? '9+' : replaysPendingCount}
          </span>
        ) : null}
      </Link>
      <Link
        href={libraryHref}
        className={`relative flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] transition-all ${
          section === 'library'
            ? 'bg-[#C45D3E] text-[#FFF8F0] shadow-[0_6px_18px_rgba(196,93,62,0.35)]'
            : 'text-luxury-muted hover:text-luxury-ink'
        }`}
      >
        Bibliothèque
        {libraryPendingCount > 0 ? (
          <span className="rounded-full bg-[#FF9F0A] px-2 py-0.5 text-[10px] font-bold text-white">
            {libraryPendingCount > 9 ? '9+' : libraryPendingCount}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
