import { getUtcFortnightWindow, isCoursePast, isWithinFortnight } from '@/lib/calendar-window';
import { getCoursesForUser } from '@/lib/access-control';
import type { SmartCourse } from '@/lib/domain/calendar-types';
import { createClient } from '@/lib/supabase/server';

import { effectiveAccessForUi } from '@/lib/calendar-course-ui';

export type NextAppointment = {
  courseId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  enrollmentStatus: string;
  /** Données alignées sur le calendrier client (modale, Jitsi, CTA). */
  smartCourse?: SmartCourse;
} | null;

export type MonthlyProgress = {
  followedCount: number;
  goal: number;
};

export async function getNextAppointment(userId: string): Promise<NextAppointment> {
  const supabase = await createClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const window = getUtcFortnightWindow();

  const [{ data: rows, error }, calendarCourses] = await Promise.all([
    supabase
      .from('enrollments')
      .select('status, courses ( id, title, starts_at, ends_at )')
      .eq('user_id', userId)
      .in('status', ['booked', 'waitlist']),
    getCoursesForUser(userId),
  ]);

  const smartById = new Map<string, SmartCourse>();
  for (const c of calendarCourses) {
    smartById.set(c.id, c);
  }

  type Row = {
    status: string;
    courses: { id: string; title: string; starts_at: string; ends_at: string } | null | Array<{ id: string; title: string; starts_at: string; ends_at: string }>;
  };

  type RowAppt = NonNullable<NextAppointment>;
  const enrollmentUpcoming: RowAppt[] = [];
  if (!error && rows?.length) {
    for (const r of rows as Row[]) {
      const c = Array.isArray(r.courses) ? r.courses[0] : r.courses;
      if (!c?.id || !c.ends_at) continue;
      if (new Date(c.ends_at).toISOString() <= nowIso) continue;
      enrollmentUpcoming.push({
        courseId: c.id,
        title: c.title,
        startsAt: c.starts_at,
        endsAt: c.ends_at,
        enrollmentStatus: r.status,
        smartCourse: smartById.get(c.id),
      });
    }
  }

  /** Ordre de préférence à date égale : réservation confirmée > liste d’attente > accès abonnement. */
  function enrollmentRank(status: string): number {
    if (status === 'booked') return 0;
    if (status === 'waitlist') return 1;
    return 2;
  }

  const calendarCandidates: RowAppt[] = [];
  for (const course of calendarCourses) {
    if (isCoursePast(course.ends_at, now)) continue;
    if (!isWithinFortnight(course.starts_at, window)) continue;
    const access = effectiveAccessForUi(course);
    if (access === 'locked') continue;
    calendarCandidates.push({
      courseId: course.id,
      title: course.title,
      startsAt: course.starts_at,
      endsAt: course.ends_at,
      enrollmentStatus: access === 'full' ? 'calendar_full' : 'calendar_preview',
      smartCourse: course,
    });
  }

  const pool: RowAppt[] = [...enrollmentUpcoming, ...calendarCandidates];
  if (!pool.length) return null;

  pool.sort((a, b) => {
    const ta = new Date(a.startsAt).getTime();
    const tb = new Date(b.startsAt).getTime();
    if (ta !== tb) return ta - tb;
    const ra =
      a.enrollmentStatus === 'booked' || a.enrollmentStatus === 'waitlist'
        ? enrollmentRank(a.enrollmentStatus)
        : a.enrollmentStatus === 'calendar_full'
          ? 2
          : 3;
    const rb =
      b.enrollmentStatus === 'booked' || b.enrollmentStatus === 'waitlist'
        ? enrollmentRank(b.enrollmentStatus)
        : b.enrollmentStatus === 'calendar_full'
          ? 2
          : 3;
    return ra - rb;
  });

  return pool[0];
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
