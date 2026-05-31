import {
  AdminCourseReplaysPending,
  type PendingCourseReplayCard,
} from '@/components/Admin/AdminCourseReplaysPending';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

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

export default async function AdminCourseReplaysPage() {
  await requireAdmin();

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('video_recordings')
    .select(
      'id, vimeo_video_id, title, thumbnail_url, embed_url, duration_seconds, upload_status, created_at, course_id, courses ( title, starts_at )',
    )
    .eq('validation_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/replays]', error);
  }

  const pending: PendingCourseReplayCard[] = [];
  for (const row of (rows ?? []) as RecordingRow[]) {
    const course = resolveCourse(row);
    if (!course) continue;
    pending.push({
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
    });
  }

  return (
    <div className="min-h-screen px-6 py-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10">
          <h1 className="text-2xl font-semibold text-luxury-ink md:text-3xl">Replays séances</h1>
          <p className="mt-2 max-w-xl text-sm text-luxury-muted">
            Validez les replays des lives avant publication dans l’espace cliente. Les emails et notifications partent
            à la validation.
          </p>
        </header>
        <AdminCourseReplaysPending pending={pending} />
      </div>
    </div>
  );
}
