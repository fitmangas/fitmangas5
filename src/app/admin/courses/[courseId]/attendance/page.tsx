import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AttendanceMarking } from '@/components/Admin/AttendanceMarking';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function CourseAttendancePage({ params }: { params: Promise<{ courseId: string }> }) {
  await requireAdmin();
  const { courseId } = await params;
  const admin = createAdminClient();

  const { data: course } = await admin.from('courses').select('id, title, ends_at').eq('id', courseId).maybeSingle();
  if (!course) notFound();

  const { data: enrollments } = await admin.from('enrollments').select('id, user_id, status').eq('course_id', courseId);

  const userIds = [...new Set((enrollments ?? []).map((e) => e.user_id))];
  let profileMap = new Map<string, { first_name: string | null; last_name: string | null }>();
  if (userIds.length) {
    const { data: profiles } = await admin.from('profiles').select('id, first_name, last_name').in('id', userIds);
    for (const pr of profiles ?? []) {
      profileMap.set(pr.id, { first_name: pr.first_name, last_name: pr.last_name });
    }
  }

  const rows = (enrollments ?? []).map((e) => {
    const prof = profileMap.get(e.user_id);
    const name =
      [prof?.first_name, prof?.last_name].filter(Boolean).join(' ') || `Utilisateur ${e.user_id.slice(0, 8)}`;
    return {
      enrollmentId: e.id,
      userLabel: name,
      status: e.status as string,
    };
  });

  const ended = new Date(course.ends_at) < new Date();

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/admin/courses" className="text-sm text-neutral-600 underline">
          ← Séances
        </Link>
        <header className="rounded-lg border border-neutral-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-neutral-900">Pointage — {course.title}</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Fin de séance : {new Date(course.ends_at).toLocaleString('fr-FR')}
            {!ended ? (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                Séance pas encore terminée (pointage indicative)
              </span>
            ) : null}
          </p>
        </header>

        {!rows.length ? (
          <p className="text-sm text-neutral-600">Aucune inscription pour ce cours.</p>
        ) : (
          <AttendanceMarking rows={rows} />
        )}
      </div>
    </div>
  );
}
