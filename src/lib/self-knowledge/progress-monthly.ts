import { createAdminClient } from '@/lib/supabase/admin';
import { getMonthlySessionGoal } from '@/lib/compte/monthly-goal';

export type MemberProgressMonth = {
  year_month: string;
  lives: number;
  replay_hours: number;
  sessions: number;
  goal: number;
  goal_ratio: number;
  active_weeks: number;
};

function yearMonthFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthBounds(yearMonth: string): { start: string; end: string } {
  const [y, m] = yearMonth.split('-').map(Number);
  const start = new Date(y!, m! - 1, 1);
  const end = new Date(y!, m!, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Calcule et upsert le snapshot d’un mois pour un user (admin). */
export async function upsertMemberProgressMonth(
  userId: string,
  yearMonth: string,
): Promise<MemberProgressMonth | null> {
  const admin = createAdminClient();
  const goal = getMonthlySessionGoal();
  const { start, end } = monthBounds(yearMonth);
  const now = new Date();

  const [{ data: liveRows }, { data: replayRows }] = await Promise.all([
    admin
      .from('enrollments')
      .select('status, courses ( starts_at, ends_at )')
      .eq('user_id', userId)
      .in('status', ['booked', 'attended']),
    admin
      .from('replay_playback_progress')
      .select('recording_id, position_seconds, updated_at')
      .eq('user_id', userId),
  ]);

  let lives = 0;
  const liveDates: Date[] = [];
  for (const row of liveRows ?? []) {
    const raw = row.courses as
      | { starts_at?: string; ends_at?: string }
      | { starts_at?: string; ends_at?: string }[]
      | null;
    const course = Array.isArray(raw) ? raw[0] : raw;
    if (!course?.ends_at) continue;
    const endAt = new Date(course.ends_at);
    if (Number.isNaN(endAt.getTime()) || endAt >= now) continue;
    const iso = endAt.toISOString();
    if (iso < start || iso >= end) continue;
    lives += 1;
    liveDates.push(endAt);
  }

  const byRecording = new Map<string, number>();
  const replayDates: Date[] = [];
  for (const row of replayRows ?? []) {
    if (!row.recording_id || !row.updated_at) continue;
    if (row.updated_at < start || row.updated_at >= end) continue;
    const pos = Math.max(0, Number(row.position_seconds) || 0);
    byRecording.set(row.recording_id, Math.max(byRecording.get(row.recording_id) ?? 0, pos));
    replayDates.push(new Date(row.updated_at));
  }
  const replaySeconds = Array.from(byRecording.values()).reduce((s, v) => s + v, 0);
  const replay_hours = Math.round((replaySeconds / 3600) * 10) / 10;

  const active_weeks = new Set(
    [...liveDates, ...replayDates].map((d) => {
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const week = Math.floor((d.getTime() - jan1.getTime()) / 86400000 / 7) + 1;
      return `${d.getFullYear()}-W${week}`;
    }),
  ).size;

  const sessions = lives;
  const goal_ratio = goal > 0 ? Math.min(2, sessions / goal) : 0;

  const payload = {
    user_id: userId,
    year_month: yearMonth,
    lives,
    replay_hours,
    sessions,
    goal,
    goal_ratio,
    active_weeks,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from('member_progress_monthly')
    .upsert(payload, { onConflict: 'user_id,year_month' })
    .select('year_month, lives, replay_hours, sessions, goal, goal_ratio, active_weeks')
    .maybeSingle();

  if (error) {
    console.error('[progress-monthly] upsert', error);
    return null;
  }
  return data as MemberProgressMonth;
}

/** Snapshot du mois courant + liste historique (crée le mois courant si absent). */
export async function listMemberProgressHistory(
  userId: string,
  limit = 12,
): Promise<MemberProgressMonth[]> {
  const admin = createAdminClient();
  const currentYm = yearMonthFromDate(new Date());
  await upsertMemberProgressMonth(userId, currentYm);

  const { data, error } = await admin
    .from('member_progress_monthly')
    .select('year_month, lives, replay_hours, sessions, goal, goal_ratio, active_weeks')
    .eq('user_id', userId)
    .order('year_month', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[progress-monthly] list', error);
    return [];
  }
  return (data ?? []) as MemberProgressMonth[];
}

/** Cron : snapshot mois précédent pour tous les profils ayant eu de l’activité. */
export async function snapshotPreviousMonthForActiveUsers(): Promise<number> {
  const admin = createAdminClient();
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const ym = yearMonthFromDate(prev);
  const { start, end } = monthBounds(ym);

  const [{ data: enrollUsers }, { data: replayUsers }] = await Promise.all([
    admin.from('enrollments').select('user_id').in('status', ['booked', 'attended']).limit(5000),
    admin
      .from('replay_playback_progress')
      .select('user_id')
      .gte('updated_at', start)
      .lt('updated_at', end)
      .limit(5000),
  ]);

  const ids = new Set<string>();
  for (const r of enrollUsers ?? []) if (r.user_id) ids.add(r.user_id);
  for (const r of replayUsers ?? []) if (r.user_id) ids.add(r.user_id);

  let n = 0;
  for (const id of ids) {
    const row = await upsertMemberProgressMonth(id, ym);
    if (row) n += 1;
  }
  return n;
}

/** Streak doux : semaines consécutives avec ≥1 activité (live ou replay). */
export async function computeConsistencyStreak(userId: string): Promise<number> {
  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const [{ data: liveRows }, { data: replayRows }] = await Promise.all([
    admin
      .from('enrollments')
      .select('courses ( ends_at )')
      .eq('user_id', userId)
      .in('status', ['booked', 'attended']),
    admin
      .from('replay_playback_progress')
      .select('updated_at')
      .eq('user_id', userId)
      .gte('updated_at', since.toISOString()),
  ]);

  const weeks = new Set<string>();
  for (const row of liveRows ?? []) {
    const raw = row.courses as { ends_at?: string } | { ends_at?: string }[] | null;
    const course = Array.isArray(raw) ? raw[0] : raw;
    if (!course?.ends_at) continue;
    const d = new Date(course.ends_at);
    if (d < since) continue;
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.floor((d.getTime() - jan1.getTime()) / 86400000 / 7) + 1;
    weeks.add(`${d.getFullYear()}-W${week}`);
  }
  for (const row of replayRows ?? []) {
    if (!row.updated_at) continue;
    const d = new Date(row.updated_at);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.floor((d.getTime() - jan1.getTime()) / 86400000 / 7) + 1;
    weeks.add(`${d.getFullYear()}-W${week}`);
  }

  const sorted = Array.from(weeks).sort().reverse();
  if (!sorted.length) return 0;

  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  let cursorWeek = Math.floor((now.getTime() - jan1.getTime()) / 86400000 / 7) + 1;
  let cursorYear = now.getFullYear();
  let streak = 0;

  for (;;) {
    const key = `${cursorYear}-W${cursorWeek}`;
    if (!weeks.has(key)) break;
    streak += 1;
    cursorWeek -= 1;
    if (cursorWeek < 1) {
      cursorYear -= 1;
      cursorWeek = 52;
    }
    if (streak > 52) break;
  }
  return streak;
}
