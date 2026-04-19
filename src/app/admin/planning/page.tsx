import { PlanningCourseTable, type PlanningCourseRow } from '@/components/Admin/PlanningCourseTable';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminPlanningPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('courses')
    .select('id, title, starts_at, ends_at, course_format, course_category')
    .order('starts_at', { ascending: true });

  const courses = (data ?? []) as PlanningCourseRow[];

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-neutral-900">Planning global</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Vue liste de toutes les séances — ajuste début / fin puis enregistre.
          </p>
          {error ? <p className="mt-2 text-sm text-red-600">{error.message}</p> : null}
        </header>
        <PlanningCourseTable courses={courses} />
      </div>
    </div>
  );
}
