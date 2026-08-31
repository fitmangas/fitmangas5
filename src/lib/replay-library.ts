import { canBypassClientRestrictionsForAdmin } from '@/lib/access-control';
import type { CourseLanguage } from '@/lib/course-language';
import { isCourseLanguage } from '@/lib/course-language';
import { getReplayBrandCoverSrc } from '@/lib/replay-brand-cover';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { persistRecordingDurations, probeVimeoPlaybackMany } from '@/lib/vimeo-playback';

export type ReplayPlaybackStatus = 'ready' | 'unavailable' | 'unknown';

export type ReplayLibraryItem = {
  recordingId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseDescription: string | null;
  /** Langue du cours (drapeau vignette) — même champ que /live. */
  courseLanguage: CourseLanguage | null;
  replayTitle: string | null;
  coverImageUrl: string;
  durationSeconds: number | null;
  startsAt: string;
  endsAt: string;
  vimeoVideoId: string | null;
  /** true UNIQUEMENT si la sonde Vimeo a confirmé la lecture. */
  isPlayable: boolean;
  playbackStatus: ReplayPlaybackStatus;
  isFavorite?: boolean;
  progressSeconds?: number | null;
};

type CourseEmbed = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  is_published: boolean;
  course_language?: string | null;
};

type RecordingRow = {
  id: string;
  title: string | null;
  duration_seconds: number | null;
  vimeo_video_id: string | null;
  embed_url: string | null;
  created_at?: string;
  courses: CourseEmbed | CourseEmbed[] | null;
};

function resolveCourse(row: RecordingRow): CourseEmbed | null {
  const c = row.courses;
  if (Array.isArray(c)) return c[0] ?? null;
  return c ?? null;
}

function mapAndFilter(
  rows: RecordingRow[] | null,
  options?: { hiddenVimeoIds?: Set<string> },
): { items: ReplayLibraryItem[]; createdAtByRecordingId: Map<string, string> } {
  const now = Date.now();
  const hidden = options?.hiddenVimeoIds ?? new Set<string>();
  const list: ReplayLibraryItem[] = [];
  const createdAtByRecordingId = new Map<string, string>();
  for (const row of rows ?? []) {
    const c = resolveCourse(row);
    if (!c?.is_published) continue;
    const end = new Date(c.ends_at).getTime();
    if (Number.isNaN(end) || end >= now) continue;
    const vimeoId = row.vimeo_video_id?.trim() ?? '';
    if (vimeoId && hidden.has(vimeoId)) continue;
    const embed = row.embed_url?.trim() ?? '';
    if (!vimeoId && !embed) continue;
    if (row.created_at) createdAtByRecordingId.set(row.id, row.created_at);
    list.push({
      recordingId: row.id,
      courseId: c.id,
      courseTitle: c.title,
      courseSlug: c.slug,
      courseDescription: c.description ?? null,
      courseLanguage: isCourseLanguage(c.course_language) ? c.course_language : null,
      replayTitle: row.title,
      coverImageUrl: getReplayBrandCoverSrc(vimeoId || row.id),
      durationSeconds: row.duration_seconds,
      startsAt: c.starts_at,
      endsAt: c.ends_at,
      vimeoVideoId: vimeoId || null,
      isPlayable: false,
      playbackStatus: 'unknown',
    });
  }
  list.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  return {
    items: dedupeByCourseId(list, createdAtByRecordingId),
    createdAtByRecordingId,
  };
}

/** Un seul replay visible par séance — garde l’enregistrement le plus ancien. */
function dedupeByCourseId(list: ReplayLibraryItem[], createdAtByRecordingId: Map<string, string>): ReplayLibraryItem[] {
  const seen = new Map<string, ReplayLibraryItem>();
  for (const item of list) {
    const prev = seen.get(item.courseId);
    if (!prev) {
      seen.set(item.courseId, item);
      continue;
    }
    const prevAt = createdAtByRecordingId.get(prev.recordingId) ?? '';
    const curAt = createdAtByRecordingId.get(item.recordingId) ?? '';
    if (curAt && prevAt && curAt < prevAt) {
      seen.set(item.courseId, item);
    }
  }
  return [...seen.values()].sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
}

async function loadHiddenStandaloneVimeoIds(): Promise<Set<string>> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('standalone_vimeo_videos')
      .select('vimeo_video_id')
      .eq('is_hidden', true);
    if (error) {
      console.error('[replay-library] hidden standalone', error);
      return new Set();
    }
    return new Set(
      (data ?? [])
        .map((r) => (typeof r.vimeo_video_id === 'string' ? r.vimeo_video_id.trim() : ''))
        .filter(Boolean),
    );
  } catch (e) {
    console.error('[replay-library] hidden standalone', e);
    return new Set();
  }
}

async function enrichAndFilterPlayable(list: ReplayLibraryItem[]): Promise<ReplayLibraryItem[]> {
  const ids = list.map((i) => i.vimeoVideoId).filter((id): id is string => Boolean(id));
  if (ids.length === 0) {
    return list.map((i) =>
      i.vimeoVideoId ? i : { ...i, isPlayable: true, playbackStatus: 'ready' as const },
    );
  }

  const probes = await probeVimeoPlaybackMany(ids);
  const durationUpdates: Array<{ recordingId: string; durationSeconds: number }> = [];
  const next: ReplayLibraryItem[] = [];

  for (const item of list) {
    const vid = item.vimeoVideoId;
    if (!vid) {
      next.push({ ...item, isPlayable: true, playbackStatus: 'ready' });
      continue;
    }
    const probe = probes.get(vid);
    if (!probe) {
      next.push({ ...item, isPlayable: false, playbackStatus: 'unknown' });
      continue;
    }

    let durationSeconds = item.durationSeconds;
    if (probe.durationSeconds && probe.durationSeconds > 0) {
      if (!durationSeconds || durationSeconds <= 0) {
        durationUpdates.push({ recordingId: item.recordingId, durationSeconds: probe.durationSeconds });
      }
      durationSeconds = probe.durationSeconds;
    }

    if (probe.isPlayable && probe.confidence === 'confirmed') {
      next.push({ ...item, durationSeconds, isPlayable: true, playbackStatus: 'ready' });
      continue;
    }

    // Sonde en échec / token manquant : garder la vignette avec statut « unknown »
    // (pas de lecteur cassé). Confirmé non playable : ne pas afficher.
    if (probe.confidence === 'unknown') {
      next.push({ ...item, durationSeconds, isPlayable: false, playbackStatus: 'unknown' });
    }
  }

  void persistRecordingDurations(durationUpdates);
  return next;
}

export async function getReplayLibraryForUser(userId: string): Promise<ReplayLibraryItem[]> {
  const [adminBypass, hiddenVimeoIds] = await Promise.all([
    canBypassClientRestrictionsForAdmin(userId),
    loadHiddenStandaloneVimeoIds(),
  ]);

  const selectCols =
    'id, title, duration_seconds, vimeo_video_id, embed_url, created_at, courses ( id, title, slug, description, starts_at, ends_at, is_published, course_language )';

  let rows: RecordingRow[] | null = null;

  if (adminBypass) {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('video_recordings')
      .select(selectCols)
      .eq('is_ready', true)
      .eq('validation_status', 'approved');
    if (error) throw new Error(error.message);
    rows = data as unknown as RecordingRow[] | null;
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('video_recordings')
      .select(selectCols)
      .eq('is_ready', true)
      .eq('validation_status', 'approved');
    if (error) throw new Error(error.message);
    rows = data as unknown as RecordingRow[] | null;
  }

  const mapped = mapAndFilter(rows, { hiddenVimeoIds });
  let list = mapped.items;
  list = await enrichAndFilterPlayable(list);
  return attachReplayExtras(userId, list);
}

export function pickFeaturedReplay(items: ReplayLibraryItem[]): ReplayLibraryItem | null {
  return items.find((i) => i.isPlayable && i.playbackStatus === 'ready') ?? null;
}

async function attachReplayExtras(userId: string, list: ReplayLibraryItem[]): Promise<ReplayLibraryItem[]> {
  const ids = list.map((i) => i.recordingId);
  if (ids.length === 0) return list;

  const supabase = await createClient();

  const [favRes, progRes] = await Promise.all([
    supabase.from('replay_favorites').select('recording_id').eq('user_id', userId).in('recording_id', ids),
    supabase
      .from('replay_playback_progress')
      .select('recording_id, position_seconds')
      .eq('user_id', userId)
      .in('recording_id', ids),
  ]);

  if (favRes.error || progRes.error) {
    return list;
  }

  const favSet = new Set((favRes.data ?? []).map((r: { recording_id: string }) => r.recording_id));
  const progMap = new Map(
    (progRes.data ?? []).map((r: { recording_id: string; position_seconds: number }) => [
      r.recording_id,
      r.position_seconds,
    ]),
  );

  return list.map((item) => ({
    ...item,
    isFavorite: favSet.has(item.recordingId),
    progressSeconds: progMap.get(item.recordingId) ?? null,
  }));
}
