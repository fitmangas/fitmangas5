import { canBypassClientRestrictionsForAdmin } from '@/lib/access-control';
import { getDemoClientMode } from '@/lib/demo-client-mode';
import { getReplayBrandCoverSrc } from '@/lib/replay-brand-cover';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { persistRecordingDurations, probeVimeoPlaybackMany } from '@/lib/vimeo-playback';

export type ReplayLibraryItem = {
  recordingId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseDescription: string | null;
  replayTitle: string | null;
  /** Couverture de marque (pas une frame Vimeo/Jibri). */
  coverImageUrl: string;
  durationSeconds: number | null;
  startsAt: string;
  endsAt: string;
  vimeoVideoId: string | null;
  /** false uniquement si l’asset Vimeo n’est pas réellement lisible. */
  isPlayable: boolean;
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
};

type RecordingRow = {
  id: string;
  title: string | null;
  duration_seconds: number | null;
  vimeo_video_id: string | null;
  embed_url: string | null;
  courses: CourseEmbed | CourseEmbed[] | null;
};

function resolveCourse(row: RecordingRow): CourseEmbed | null {
  const c = row.courses;
  if (Array.isArray(c)) return c[0] ?? null;
  return c ?? null;
}

function mapAndFilter(
  rows: RecordingRow[] | null,
  options?: { demoAdminShowUpcomingWithReplay?: boolean; hiddenVimeoIds?: Set<string> },
): ReplayLibraryItem[] {
  const now = Date.now();
  const relax = options?.demoAdminShowUpcomingWithReplay === true;
  const hidden = options?.hiddenVimeoIds ?? new Set<string>();
  const list: ReplayLibraryItem[] = [];
  for (const row of rows ?? []) {
    const c = resolveCourse(row);
    if (!c?.is_published) continue;
    const end = new Date(c.ends_at).getTime();
    if (!relax && (Number.isNaN(end) || end >= now)) continue;
    const vimeoId = row.vimeo_video_id?.trim() ?? '';
    if (vimeoId && hidden.has(vimeoId)) continue;
    const embed = row.embed_url?.trim() ?? '';
    if (!vimeoId && !embed) continue;
    list.push({
      recordingId: row.id,
      courseId: c.id,
      courseTitle: c.title,
      courseSlug: c.slug,
      courseDescription: c.description ?? null,
      replayTitle: row.title,
      coverImageUrl: getReplayBrandCoverSrc(vimeoId || row.id),
      durationSeconds: row.duration_seconds,
      startsAt: c.starts_at,
      endsAt: c.ends_at,
      vimeoVideoId: vimeoId || null,
      isPlayable: true,
    });
  }
  list.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  return list;
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

/** Complète les durées manquantes + filtre les assets Vimeo non lisibles. */
async function enrichAndFilterPlayable(list: ReplayLibraryItem[]): Promise<ReplayLibraryItem[]> {
  const ids = list.map((i) => i.vimeoVideoId).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return list.filter((i) => i.isPlayable);

  const probes = await probeVimeoPlaybackMany(ids);
  const durationUpdates: Array<{ recordingId: string; durationSeconds: number }> = [];

  const next: ReplayLibraryItem[] = [];
  for (const item of list) {
    const vid = item.vimeoVideoId;
    if (!vid) {
      next.push(item);
      continue;
    }
    const probe = probes.get(vid);
    if (probe && !probe.isPlayable) continue;
    let durationSeconds = item.durationSeconds;
    if (probe?.durationSeconds && probe.durationSeconds > 0) {
      if (!durationSeconds || durationSeconds <= 0) {
        durationUpdates.push({ recordingId: item.recordingId, durationSeconds: probe.durationSeconds });
      }
      durationSeconds = probe.durationSeconds;
    }
    next.push({ ...item, durationSeconds, isPlayable: true });
  }

  void persistRecordingDurations(durationUpdates);
  return next;
}

export async function getReplayLibraryForUser(userId: string): Promise<ReplayLibraryItem[]> {
  const [adminBypass, demo, hiddenVimeoIds] = await Promise.all([
    canBypassClientRestrictionsForAdmin(userId),
    getDemoClientMode(),
    loadHiddenStandaloneVimeoIds(),
  ]);

  const selectCols =
    'id, title, duration_seconds, vimeo_video_id, embed_url, courses ( id, title, slug, description, starts_at, ends_at, is_published )';

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

  let list = mapAndFilter(rows, {
    demoAdminShowUpcomingWithReplay: demo && adminBypass,
    hiddenVimeoIds,
  });
  list = await enrichAndFilterPlayable(list);
  return attachReplayExtras(userId, list);
}

/** Première entrée lisible (déjà filtrée) — helper pour le hero. */
export function pickFeaturedReplay(items: ReplayLibraryItem[]): ReplayLibraryItem | null {
  return items.find((i) => i.isPlayable) ?? null;
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
