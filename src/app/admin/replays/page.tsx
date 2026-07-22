import {
  AdminCourseReplaysPending,
  type PendingCourseReplayCard,
} from '@/components/Admin/AdminCourseReplaysPending';
import {
  AdminCourseReplaysManaged,
  type ManagedCourseReplayCard,
} from '@/components/Admin/AdminCourseReplaysManaged';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { probeVimeoPlaybackMany } from '@/lib/vimeo-playback';

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

function resolveCourse(row: RecordingRow) {
  const c = row.courses;
  if (Array.isArray(c)) return c[0] ?? null;
  return c;
}

function toCard(row: RecordingRow): PendingCourseReplayCard | null {
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

export default async function AdminCourseReplaysPage() {
  await requireAdmin();

  const admin = createAdminClient();
  const selectCols =
    'id, vimeo_video_id, title, thumbnail_url, embed_url, duration_seconds, upload_status, created_at, course_id, is_ready, courses ( title, starts_at )';

  const [pendingRes, approvedRes] = await Promise.all([
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
  ]);

  if (pendingRes.error) console.error('[admin/replays] pending', pendingRes.error);
  if (approvedRes.error) console.error('[admin/replays] approved', approvedRes.error);

  const pending: PendingCourseReplayCard[] = [];
  for (const row of (pendingRes.data ?? []) as RecordingRow[]) {
    const card = toCard(row);
    if (card) pending.push(card);
  }

  const approvedRows = (approvedRes.data ?? []) as RecordingRow[];
  const probes = await probeVimeoPlaybackMany(
    approvedRows.map((r) => r.vimeo_video_id).filter(Boolean),
  );

  const approved: ManagedCourseReplayCard[] = [];
  for (const row of approvedRows) {
    const card = toCard(row);
    if (!card) continue;
    const probe = probes.get(String(row.vimeo_video_id).trim());
    approved.push({
      ...card,
      is_ready: row.is_ready === true,
      vimeoPlayable: probe ? probe.isPlayable : null,
      vimeoStatus: probe?.status ?? null,
    });
  }

  const brokenCount = approved.filter((item) => item.vimeoPlayable === false).length;

  return (
    <div className="min-h-screen px-6 py-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10">
          <h1 className="text-2xl font-semibold text-luxury-ink md:text-3xl">Replays séances</h1>
          <p className="mt-2 max-w-xl text-sm text-luxury-muted">
            Validez les replays des lives avant publication dans l’espace cliente. Les emails et notifications partent
            à la validation. Les replays déjà validés restent visibles ici pour les masquer ou les réafficher.
          </p>
          {brokenCount > 0 ? (
            <p className="mt-3 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {brokenCount} replay(s) validé(s) mais <strong>non lisible(s) sur Vimeo</strong> (upload incomplet ou
              fichier manquant). Ils n’apparaissent pas côté cliente tant que l’asset n’est pas re-uploadé.
            </p>
          ) : null}
        </header>
        <AdminCourseReplaysPending pending={pending} />
        <AdminCourseReplaysManaged items={approved} />
      </div>
    </div>
  );
}
