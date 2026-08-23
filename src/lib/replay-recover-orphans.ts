import {
  findCourseIdForJibriRecording,
  parseJibriParisStartAt,
  parseJibriRecordingFileName,
  slugifyCourseTitle,
  type ParsedJibriRecordingFileName,
} from '@/lib/jibri-recording-filename';
import { createAdminClient } from '@/lib/supabase/admin';
import { listAllMeVideos, syncVideoRecording, type VimeoVideoMetadata } from '@/lib/vimeo';

const LOOKBACK_DAYS = 90;
const RECOVERY_WINDOW_MS = 3 * 60 * 60 * 1000;

const JIBRI_TITLE_RE =
  /fitmangas-(.+)-(\d{12})_\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}(?:\.mp4)?/i;

type CourseRow = {
  id: string;
  title: string;
  slug: string;
  course_format: string;
  is_published: boolean;
  starts_at: string;
  ends_at: string;
};

type RecRow = {
  id: string;
  course_id: string | null;
  vimeo_video_id: string | null;
};

function parseJibriFromAnyName(name: string | null | undefined): ParsedJibriRecordingFileName | null {
  if (!name) return null;
  const asFile = parseJibriRecordingFileName(name.endsWith('.mp4') ? name : `${name}.mp4`);
  if (asFile) return asFile;
  const match = name.match(JIBRI_TITLE_RE);
  if (!match?.[1] || !match[2]) return null;
  const startsAtParis = parseJibriParisStartAt(match[2]);
  if (!startsAtParis) return null;
  return { slug: match[1].trim().toLowerCase(), startsAtParis, dateBlock: match[2] };
}

async function findCourseLoose(
  admin: ReturnType<typeof createAdminClient>,
  parsed: ParsedJibriRecordingFileName,
): Promise<CourseRow | null> {
  const tight = await findCourseIdForJibriRecording(admin, parsed);
  if (tight) {
    const { data } = await admin
      .from('courses')
      .select('id, title, slug, course_format, is_published, starts_at, ends_at')
      .eq('id', tight)
      .maybeSingle();
    return (data as CourseRow | null) ?? null;
  }

  const windowStart = new Date(parsed.startsAtParis.getTime() - RECOVERY_WINDOW_MS).toISOString();
  const windowEnd = new Date(parsed.startsAtParis.getTime() + RECOVERY_WINDOW_MS).toISOString();
  const { data: rows, error } = await admin
    .from('courses')
    .select('id, title, slug, course_format, is_published, starts_at, ends_at')
    .eq('course_format', 'online')
    .gte('starts_at', windowStart)
    .lte('starts_at', windowEnd);
  if (error) throw error;
  const slugNorm = parsed.slug.toLowerCase();
  const hit = (rows ?? []).find((row) => {
    const course = row as CourseRow;
    if (String(course.slug ?? '').trim().toLowerCase() === slugNorm) return true;
    return slugifyCourseTitle(course.title) === slugNorm;
  });
  return (hit as CourseRow | undefined) ?? null;
}

export type OrphanReplayRecoverResult = {
  linked: number;
  skippedAlreadyLinked: number;
  failed: number;
  stillMissingRecent: Array<{ id: string; title: string; starts_at: string }>;
  recovered: Array<{ courseTitle: string; vimeoId: string }>;
  errors: string[];
};

/** Scanne Vimeo et crée des lignes pending pour les fichiers Jibri orphelins. */
export async function recoverOrphanCourseReplays(opts?: {
  lookbackDays?: number;
  dryRun?: boolean;
}): Promise<OrphanReplayRecoverResult> {
  const lookbackDays = opts?.lookbackDays ?? LOOKBACK_DAYS;
  const dryRun = opts?.dryRun === true;
  const admin = createAdminClient();
  const now = new Date();
  const since = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: courses, error: cErr }, { data: recs, error: rErr }] = await Promise.all([
    admin
      .from('courses')
      .select('id, title, slug, course_format, is_published, starts_at, ends_at')
      .eq('course_format', 'online')
      .lt('ends_at', now.toISOString())
      .gte('starts_at', since)
      .order('starts_at', { ascending: false }),
    admin.from('video_recordings').select('id, course_id, vimeo_video_id'),
  ]);
  if (cErr) throw cErr;
  if (rErr) throw rErr;

  const allCourses = (courses ?? []) as CourseRow[];
  const recordings = (recs ?? []) as RecRow[];
  const recsByCourse = new Set<string>();
  const recVimeoIds = new Set<string>();
  for (const rec of recordings) {
    if (rec.vimeo_video_id) recVimeoIds.add(rec.vimeo_video_id);
    if (rec.course_id) recsByCourse.add(rec.course_id);
  }

  const missingOnline = allCourses.filter((c) => !recsByCourse.has(c.id));
  const vimeoVideos = await listAllMeVideos();

  type PlanItem = { course: CourseRow; vimeoId: string; title: string | null; alreadyLinked: boolean };
  const plan: PlanItem[] = [];
  const claimedCourses = new Set<string>();

  for (const video of vimeoVideos) {
    const parsed = parseJibriFromAnyName(video.title) ?? parseJibriFromAnyName(video.description);
    if (!parsed) continue;
    const already = recVimeoIds.has(video.vimeoId);
    const course = await findCourseLoose(admin, parsed);
    if (!course) continue;
    if (recsByCourse.has(course.id) || claimedCourses.has(course.id)) continue;
    claimedCourses.add(course.id);
    plan.push({ course, vimeoId: video.vimeoId, title: video.title, alreadyLinked: already });
  }

  const unmatched = missingOnline.filter((c) => !plan.some((p) => p.course.id === c.id));
  for (const course of unmatched) {
    const wantSlug = slugifyCourseTitle(course.title);
    const startMs = new Date(course.starts_at).getTime();
    const candidates = vimeoVideos.filter((video: VimeoVideoMetadata) => {
      if (recVimeoIds.has(video.vimeoId)) return false;
      if (plan.some((p) => p.vimeoId === video.vimeoId)) return false;
      const created = video.createdTime ? new Date(video.createdTime).getTime() : NaN;
      if (!Number.isFinite(created)) return false;
      if (Math.abs(created - startMs) > 6 * 60 * 60 * 1000) return false;
      const t = slugifyCourseTitle(video.title ?? '');
      return t.includes(wantSlug) || wantSlug.includes(t) || t.includes('fitmangas');
    });
    if (candidates.length === 1) {
      plan.push({
        course,
        vimeoId: candidates[0]!.vimeoId,
        title: candidates[0]!.title,
        alreadyLinked: false,
      });
    }
  }

  const result: OrphanReplayRecoverResult = {
    linked: 0,
    skippedAlreadyLinked: 0,
    failed: 0,
    stillMissingRecent: [],
    recovered: [],
    errors: [],
  };

  if (!dryRun) {
    for (const item of plan) {
      if (item.alreadyLinked) {
        result.skippedAlreadyLinked += 1;
        continue;
      }
      try {
        await syncVideoRecording({ courseId: item.course.id, vimeoId: item.vimeoId, createdBy: null });
        result.linked += 1;
        result.recovered.push({ courseTitle: item.course.title, vimeoId: item.vimeoId });
      } catch (e) {
        result.failed += 1;
        result.errors.push(e instanceof Error ? e.message : String(e));
      }
    }
  }

  const recentSince = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString();
  const recoveredIds = new Set(plan.map((p) => p.course.id));
  result.stillMissingRecent = missingOnline
    .filter((c) => c.starts_at >= recentSince && !recoveredIds.has(c.id))
    .map((c) => ({ id: c.id, title: c.title, starts_at: c.starts_at }));

  return result;
}

/** Cours online terminés récents sans aucune ligne video_recordings. */
export async function listRecentCoursesWithoutRecording(days = 21): Promise<
  Array<{ id: string; title: string; starts_at: string }>
> {
  const admin = createAdminClient();
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: courses }, { data: recs }] = await Promise.all([
    admin
      .from('courses')
      .select('id, title, starts_at')
      .eq('course_format', 'online')
      .eq('is_published', true)
      .lt('ends_at', now.toISOString())
      .gte('starts_at', since)
      .order('starts_at', { ascending: false }),
    admin.from('video_recordings').select('course_id'),
  ]);
  const linked = new Set((recs ?? []).map((r) => r.course_id).filter(Boolean));
  return (courses ?? [])
    .filter((c) => !linked.has(c.id))
    .map((c) => ({ id: c.id, title: c.title, starts_at: c.starts_at }));
}
