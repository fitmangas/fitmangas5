import {
  AdminCoursesManager,
  type AdminCourseRow,
  type CourseRecordingSummary,
} from '@/components/Admin/AdminCoursesManager';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminCoursesPage() {
  await requireAdmin();

  let rows: AdminCourseRow[] = [];
  let recordingsByCourseId: Record<string, CourseRecordingSummary> = {};

  try {
    const admin = createAdminClient();
    const [coursesRes, recordingsRes] = await Promise.all([
      admin
        .from('courses')
        .select(
          'id, slug, title, description, course_format, course_category, starts_at, ends_at, timezone, capacity_max, location, live_url, jitsi_link, replay_url, spotify_playlist_url, is_published, created_at',
        )
        .order('starts_at', { ascending: true }),
      admin
        .from('video_recordings')
        .select('course_id, validation_status, created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (coursesRes.error) {
      console.error('[admin/courses]', coursesRes.error);
    } else {
      rows = (coursesRes.data ?? []) as AdminCourseRow[];
    }

    if (recordingsRes.error) {
      console.error('[admin/courses] recordings', recordingsRes.error);
    } else {
      for (const rec of (recordingsRes.data ?? []) as {
        course_id: string;
        validation_status: CourseRecordingSummary['validation_status'];
      }[]) {
        if (!recordingsByCourseId[rec.course_id]) {
          recordingsByCourseId[rec.course_id] = { validation_status: rec.validation_status };
        }
      }
    }
  } catch (e) {
    console.error('[admin/courses] createAdminClient', e);
  }

  return (
    <div className="mx-auto max-w-6xl min-w-0 w-full">
      <AdminCoursesManager courses={rows} recordingsByCourseId={recordingsByCourseId} />
    </div>
  );
}
