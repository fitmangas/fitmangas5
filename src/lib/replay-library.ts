import { getLivePrivilegesTruthful } from '@/lib/access-control';
import { getDemoClientMode } from '@/lib/demo-client-mode';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type ReplayLibraryItem = {
  recordingId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  replayTitle: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  startsAt: string;
  endsAt: string;
  isFavorite?: boolean;
  progressSeconds?: number | null;
};

type CourseEmbed = {
  id: string;
  title: string;
  slug: string;
  starts_at: string;
  ends_at: string;
  is_published: boolean;
};

/** PostgREST peut renvoyer une ligne jointe soit comme objet soit comme tableau. */
type RecordingRow = {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  courses: CourseEmbed | CourseEmbed[] | null;
};

function resolveCourse(row: RecordingRow): CourseEmbed | null {
  const c = row.courses;
  if (Array.isArray(c)) return c[0] ?? null;
  return c ?? null;
}

function mapAndFilter(
  rows: RecordingRow[] | null,
  options?: { demoAdminShowUpcomingWithReplay?: boolean },
): ReplayLibraryItem[] {
  const now = Date.now();
  const relax = options?.demoAdminShowUpcomingWithReplay === true;
  const list: ReplayLibraryItem[] = [];
  for (const row of rows ?? []) {
    const c = resolveCourse(row);
    if (!c?.is_published) continue;
    const end = new Date(c.ends_at).getTime();
    if (!relax && (Number.isNaN(end) || end >= now)) continue;
    list.push({
      recordingId: row.id,
      courseId: c.id,
      courseTitle: c.title,
      courseSlug: c.slug,
      replayTitle: row.title,
      thumbnailUrl: row.thumbnail_url,
      durationSeconds: row.duration_seconds,
      startsAt: c.starts_at,
      endsAt: c.ends_at,
    });
  }
  list.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  return list;
}

/**
 * Replays accessibles pour l’utilisateur (RLS). En mode démo admin, vue élève élargie via service role.
 */
export async function getReplayLibraryForUser(userId: string): Promise<ReplayLibraryItem[]> {
  const truth = await getLivePrivilegesTruthful(userId);
  const demo = await getDemoClientMode();

  const selectCols =
    'id, title, thumbnail_url, duration_seconds, courses ( id, title, slug, starts_at, ends_at, is_published )';

  let list: ReplayLibraryItem[];

  if (truth.isAdmin && demo) {
    const admin = createAdminClient();
    const { data, error } = await admin.from('video_recordings').select(selectCols).eq('is_ready', true);
    if (error) throw new Error(error.message);
    /* En démo : montrer aussi les replays prêts avant la fin officielle du cours (ex. « Test live » pour présentation). */
    list = mapAndFilter(data as unknown as RecordingRow[] | null, { demoAdminShowUpcomingWithReplay: true });
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase.from('video_recordings').select(selectCols).eq('is_ready', true);

    if (error) throw new Error(error.message);
    list = mapAndFilter(data as unknown as RecordingRow[] | null);
  }

  return attachReplayExtras(userId, list);
}

async function attachReplayExtras(userId: string, list: ReplayLibraryItem[]): Promise<ReplayLibraryItem[]> {
  const ids = list.map((i) => i.recordingId);
  if (ids.length === 0) return list;

  const supabase = await createClient();

  const [favRes, progRes] = await Promise.all([
    supabase.from('replay_favorites').select('recording_id').eq('user_id', userId).in('recording_id', ids),
    supabase.from('replay_playback_progress').select('recording_id, position_seconds').eq('user_id', userId).in('recording_id', ids),
  ]);

  if (favRes.error || progRes.error) {
    return list;
  }

  const favSet = new Set((favRes.data ?? []).map((r: { recording_id: string }) => r.recording_id));
  const progMap = new Map(
    (progRes.data ?? []).map((r: { recording_id: string; position_seconds: number }) => [r.recording_id, r.position_seconds]),
  );

  return list.map((item) => ({
    ...item,
    isFavorite: favSet.has(item.recordingId),
    progressSeconds: progMap.get(item.recordingId) ?? null,
  }));
}
