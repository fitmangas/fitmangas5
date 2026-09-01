import type { ReactNode } from 'react';

import {
  AdminCourseReplaysPending,
  type PendingCourseReplayCard,
} from '@/components/Admin/AdminCourseReplaysPending';
import {
  AdminCourseReplaysManaged,
  type ManagedCourseReplayCard,
} from '@/components/Admin/AdminCourseReplaysManaged';
import { AdminDeadReplaysBanner } from '@/components/Admin/AdminDeadReplaysBanner';
import { AdminRecoverOrphanReplaysButton } from '@/components/Admin/AdminRecoverOrphanReplaysButton';
import { AdminVimeoLibraryClient } from '@/components/Admin/AdminVimeoLibraryClient';
import { AdminVideosSectionToggle } from '@/components/Admin/AdminVideosSectionToggle';
import { recoverOrphanCourseReplays } from '@/lib/replay-recover-orphans';
import { listDeadApprovedReplays } from '@/lib/replay-recovery';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeFolderLabelForGroup, sortFolderKeys } from '@/lib/vimeo-folder';
import { probeVimeoPlaybackMany } from '@/lib/vimeo-playback';
import type { AdminVimeoVideoCard } from '@/types/vimeo';

type RecordingRow = {
  id: string;
  vimeo_video_id: string;
  title: string | null;
  thumbnail_url: string | null;
  embed_url: string | null;
  duration_seconds: number | null;
  upload_status: string;
  created_at: string;
  course_id: string;
  is_ready?: boolean;
  courses:
    | { title: string; starts_at: string }
    | { title: string; starts_at: string }[]
    | null;
};

type VimeoRow = {
  id: string;
  vimeo_video_id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  validation_status: string;
  created_at: string;
  vimeo_folder_name?: string | null;
  embed_url?: string | null;
  published_at?: string | null;
  scheduled_publication_at?: string | null;
  rejection_reason?: string | null;
  is_hidden?: boolean | null;
  hidden_at?: string | null;
};

function resolveCourse(row: RecordingRow) {
  const c = row.courses;
  if (Array.isArray(c)) return c[0] ?? null;
  return c;
}

function toReplayCard(row: RecordingRow): PendingCourseReplayCard | null {
  const course = resolveCourse(row);
  if (!course) return null;
  return {
    id: row.id,
    vimeo_video_id: row.vimeo_video_id,
    title: row.title,
    thumbnail_url: row.thumbnail_url,
    embed_url: row.embed_url,
    duration_seconds: row.duration_seconds,
    upload_status: row.upload_status,
    created_at: row.created_at,
    course_id: row.course_id,
    course_title: course.title,
    course_starts_at: course.starts_at,
  };
}

function toVimeoCard(r: VimeoRow): AdminVimeoVideoCard {
  return {
    id: r.id,
    vimeo_video_id: r.vimeo_video_id,
    title: r.title,
    description: r.description,
    thumbnail_url: r.thumbnail_url,
    duration_seconds: r.duration_seconds,
    embed_url: r.embed_url ?? null,
    validation_status: r.validation_status as AdminVimeoVideoCard['validation_status'],
    vimeo_folder_name: r.vimeo_folder_name ?? null,
    published_at: r.published_at ?? null,
    scheduled_publication_at: r.scheduled_publication_at ?? null,
    rejection_reason: r.rejection_reason ?? null,
    is_hidden: r.is_hidden === true,
    hidden_at: r.hidden_at ?? null,
    created_at: r.created_at,
  };
}

function groupByFolder(items: VimeoRow[]): Map<string, VimeoRow[]> {
  const m = new Map<string, VimeoRow[]>();
  for (const item of items) {
    const key = normalizeFolderLabelForGroup(item.vimeo_folder_name ?? null);
    const arr = m.get(key) ?? [];
    arr.push(item);
    m.set(key, arr);
  }
  return m;
}

export type AdminVideosSection = 'replays' | 'library';

export async function loadAdminVideosPage(section: AdminVideosSection) {
  const admin = createAdminClient();
  const selectCols =
    'id, vimeo_video_id, title, thumbnail_url, embed_url, duration_seconds, upload_status, created_at, course_id, is_ready, courses ( title, starts_at )';

  void recoverOrphanCourseReplays({ lookbackDays: 45 }).catch((err) => {
    console.error('[admin/videos] silent recover', err);
  });

  const [pendingRes, approvedRes, vimeoRes, deadReplays] = await Promise.all([
    admin
      .from('video_recordings')
      .select(selectCols)
      .eq('validation_status', 'pending')
      .order('created_at', { ascending: false }),
    admin
      .from('video_recordings')
      .select(selectCols)
      .eq('validation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(80),
    admin.from('standalone_vimeo_videos').select('*').order('created_at', { ascending: false }),
    listDeadApprovedReplays().catch((err) => {
      console.error('[admin/videos] dead replays probe', err);
      return [];
    }),
  ]);

  const pending: PendingCourseReplayCard[] = [];
  for (const row of (pendingRes.data ?? []) as RecordingRow[]) {
    const card = toReplayCard(row);
    if (card) pending.push(card);
  }

  const approvedRows = (approvedRes.data ?? []) as RecordingRow[];
  const probeIds = approvedRows.map((r) => String(r.vimeo_video_id)).filter(Boolean);
  const probes = probeIds.length > 0 ? await probeVimeoPlaybackMany(probeIds) : new Map();

  const approved: ManagedCourseReplayCard[] = [];
  for (const row of approvedRows) {
    const card = toReplayCard(row);
    if (!card) continue;
    const probe = probes.get(String(row.vimeo_video_id));
    approved.push({
      ...card,
      is_ready: row.is_ready === true,
      vimeoPlayable: probe?.isPlayable ?? null,
      vimeoStatus:
        probe?.confidence === 'unavailable'
          ? '404'
          : probe?.confidence === 'confirmed'
            ? 'ok'
            : probe
              ? 'unknown'
              : null,
    });
  }

  const vimeoList = (vimeoRes.data ?? []) as VimeoRow[];
  const awaiting = vimeoList
    .filter((r) => r.validation_status === 'pending' || r.validation_status === 'scheduled')
    .map(toVimeoCard);
  const published = vimeoList.filter((r) => r.validation_status === 'published');
  const rejected = vimeoList.filter((r) => r.validation_status === 'rejected').map(toVimeoCard);

  const publishedByFolder = groupByFolder(published);
  const publishedFolderKeys = sortFolderKeys([...publishedByFolder.keys()]);
  const publishedSerialized: Record<string, AdminVimeoVideoCard[]> = {};
  for (const key of publishedFolderKeys) {
    publishedSerialized[key] = (publishedByFolder.get(key) ?? []).map(toVimeoCard);
  }

  return {
    section,
    pending,
    approved,
    deadReplayCount: deadReplays.length,
    vimeo: {
      awaiting,
      publishedByFolder: publishedSerialized,
      publishedFolderKeys,
      rejected,
      fetchError: vimeoRes.error?.message ?? null,
    },
    replaysPendingCount: pending.length,
    libraryPendingCount: awaiting.length,
  };
}

export function AdminVideosReplaysPanel({
  pending,
  approved,
  deadReplayCount,
}: {
  pending: PendingCourseReplayCard[];
  approved: ManagedCourseReplayCard[];
  deadReplayCount: number;
}) {
  return (
    <>
      {deadReplayCount > 0 ? <AdminDeadReplaysBanner count={deadReplayCount} /> : null}
      <AdminCourseReplaysPending pending={pending} />
      <AdminRecoverOrphanReplaysButton />
      <AdminCourseReplaysManaged items={approved} />
    </>
  );
}

export function AdminVideosLibraryPanel({
  vimeo,
}: {
  vimeo: {
    awaiting: AdminVimeoVideoCard[];
    publishedByFolder: Record<string, AdminVimeoVideoCard[]>;
    publishedFolderKeys: string[];
    rejected: AdminVimeoVideoCard[];
    fetchError?: string | null;
  };
}) {
  return (
    <AdminVimeoLibraryClient
      awaiting={vimeo.awaiting}
      publishedByFolder={vimeo.publishedByFolder}
      publishedFolderKeys={vimeo.publishedFolderKeys}
      rejected={vimeo.rejected}
      fetchError={vimeo.fetchError}
      embedded
    />
  );
}

export function AdminVideosPageShell({
  section,
  replaysPendingCount,
  libraryPendingCount,
  children,
}: {
  section: AdminVideosSection;
  replaysPendingCount: number;
  libraryPendingCount: number;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen px-6 py-10 md:py-14">
      <div className={`mx-auto ${section === 'library' ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-luxury-ink md:text-3xl">Vidéos</h1>
          <p className="mt-2 max-w-2xl text-sm text-luxury-muted">
            Replays des séances live et bibliothèque Vimeo à la demande — validation manuelle avant publication
            cliente.
          </p>
          <AdminVideosSectionToggle
            section={section}
            replaysPendingCount={replaysPendingCount}
            libraryPendingCount={libraryPendingCount}
          />
        </header>
        {children}
      </div>
    </div>
  );
}
