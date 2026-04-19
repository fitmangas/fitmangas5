import { createClient } from '@/lib/supabase/server';

export type NextAppointment = {
  courseId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  enrollmentStatus: string;
} | null;

export type MonthlyProgress = {
  followedCount: number;
  goal: number;
};

export async function getNextAppointment(userId: string): Promise<NextAppointment> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from('enrollments')
    .select('status, courses ( id, title, starts_at, ends_at )')
    .eq('user_id', userId)
    .in('status', ['booked', 'waitlist']);

  if (error || !rows?.length) return null;

  type Row = {
    status: string;
    courses: { id: string; title: string; starts_at: string; ends_at: string } | null | Array<{ id: string; title: string; starts_at: string; ends_at: string }>;
  };

  type RowAppt = NonNullable<NextAppointment>;
  const upcoming: RowAppt[] = [];
  for (const r of rows as Row[]) {
    const c = Array.isArray(r.courses) ? r.courses[0] : r.courses;
    if (!c?.id || !c.ends_at) continue;
    if (new Date(c.ends_at).toISOString() <= nowIso) continue;
    upcoming.push({
      courseId: c.id,
      title: c.title,
      startsAt: c.starts_at,
      endsAt: c.ends_at,
      enrollmentStatus: r.status,
    });
  }

  if (!upcoming.length) return null;

  upcoming.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return upcoming[0];
}

/** Séances terminées dans le mois civil courant (inscription booked ou attended). */
export async function getMonthlyProgress(userId: string, goal: number): Promise<MonthlyProgress> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data: rows, error } = await supabase
    .from('enrollments')
    .select('courses ( ends_at )')
    .eq('user_id', userId)
    .in('status', ['booked', 'attended']);

  if (error || !rows?.length) {
    return { followedCount: 0, goal };
  }

  let n = 0;
  for (const e of rows) {
    const raw = e.courses as { ends_at: string } | { ends_at: string }[] | null;
    const c = Array.isArray(raw) ? raw[0] : raw;
    if (!c?.ends_at) continue;
    const end = new Date(c.ends_at);
    if (Number.isNaN(end.getTime()) || end >= now) continue;
    if (end >= monthStart && end < monthEnd) n += 1;
  }

  return { followedCount: n, goal };
}
