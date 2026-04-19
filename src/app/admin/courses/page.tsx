import {
  AdminCoursesManager,
  type AdminCourseRow,
} from '@/components/Admin/AdminCoursesManager';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminCoursesPage() {
  await requireAdmin();

  let rows: AdminCourseRow[] = [];

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('courses')
      .select(
        'id, slug, title, description, course_format, course_category, starts_at, ends_at, timezone, capacity_max, location, live_url, jitsi_link, replay_url, spotify_playlist_url, is_published, created_at',
      )
      .order('starts_at', { ascending: true });

    if (error) {
      console.error('[admin/courses]', error);
    } else {
      rows = (data ?? []) as AdminCourseRow[];
    }
  } catch (e) {
    console.error('[admin/courses] createAdminClient', e);
  }

  return (
    <div className="min-h-screen px-6 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <AdminCoursesManager courses={rows} />
      </div>
    </div>
  );
}
