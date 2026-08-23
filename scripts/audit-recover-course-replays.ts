/**
 * Audit séances vs video_recordings vs compte Vimeo, puis relie les replays
 * déjà uploadés mais jamais ingérés (ils n’apparaissent pas en validation).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/audit-recover-course-replays.ts
 *   npx tsx --env-file=.env.local scripts/audit-recover-course-replays.ts --apply
 */

import { formatInTimeZone } from 'date-fns-tz';

import {
  findCourseIdForJibriRecording,
  parseJibriParisStartAt,
  parseJibriRecordingFileName,
  slugifyCourseTitle,
  type ParsedJibriRecordingFileName,
} from '@/lib/jibri-recording-filename';
import { COACH_PUBLISH_TIMEZONE } from '@/lib/notifications/timezone';
import { probeVimeoPlayback } from '@/lib/vimeo-playback';
import { createAdminClient } from '@/lib/supabase/admin';
import { listAllMeVideos, syncVideoRecording, type VimeoVideoMetadata } from '@/lib/vimeo';

const APPLY = process.argv.includes('--apply');
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
  title: string | null;
  validation_status: string | null;
  upload_status: string | null;
  is_ready: boolean | null;
  created_at: string;
};

function parisLabel(iso: string): string {
  return formatInTimeZone(new Date(iso), COACH_PUBLISH_TIMEZONE, 'dd/MM HH:mm');
}

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
    const { data } = await admin.from('courses').select('id, title, slug, course_format, is_published, starts_at, ends_at').eq('id', tight).maybeSingle();
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

async function main() {
  const admin = createAdminClient();
  const now = new Date();
  const since = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  console.log(APPLY ? 'MODE: APPLY (liaison pending)' : 'MODE: AUDIT (aucune écriture)');
  console.log(`Fenêtre: ${LOOKBACK_DAYS} jours (depuis ${since})\n`);

  const [{ data: courses, error: cErr }, { data: recs, error: rErr }, { data: standalone, error: sErr }] =
    await Promise.all([
      admin
        .from('courses')
        .select('id, title, slug, course_format, is_published, starts_at, ends_at')
        .lt('ends_at', now.toISOString())
        .gte('starts_at', since)
        .order('starts_at', { ascending: false }),
      admin
        .from('video_recordings')
        .select('id, course_id, vimeo_video_id, title, validation_status, upload_status, is_ready, created_at')
        .order('created_at', { ascending: false }),
      admin.from('standalone_vimeo_videos').select('vimeo_video_id, title, validation_status, created_at'),
    ]);
  if (cErr) throw cErr;
  if (rErr) throw rErr;
  if (sErr) throw sErr;

  const allCourses = (courses ?? []) as CourseRow[];
  const recordings = (recs ?? []) as RecRow[];
  const recsByCourse = new Map<string, RecRow[]>();
  const recVimeoIds = new Set<string>();
  for (const rec of recordings) {
    if (rec.vimeo_video_id) recVimeoIds.add(rec.vimeo_video_id);
    if (!rec.course_id) continue;
    const list = recsByCourse.get(rec.course_id) ?? [];
    list.push(rec);
    recsByCourse.set(rec.course_id, list);
  }

  const online = allCourses.filter((c) => c.course_format === 'online');
  const onsite = allCourses.filter((c) => c.course_format !== 'online');
  const missingOnline = online.filter((c) => !recsByCourse.has(c.id));
  const withReplay = online.filter((c) => recsByCourse.has(c.id));

  const byStatus: Record<string, number> = {};
  for (const rec of recordings) {
    const key = rec.validation_status ?? 'null';
    byStatus[key] = (byStatus[key] ?? 0) + 1;
  }

  console.log('=== SYNTHÈSE SÉANCES (90 j) ===');
  console.log(`Historique visio: ${online.length}  |  présentiel: ${onsite.length}`);
  console.log(`Visio AVEC ligne replay: ${withReplay.length}`);
  console.log(`Visio SANS replay (absentes de la validation): ${missingOnline.length}`);
  console.log('video_recordings par statut:', byStatus);
  console.log(`standalone_vimeo_videos: ${standalone?.length ?? 0}\n`);

  console.log('=== VISIO SANS REPLAY ===');
  for (const c of missingOnline) {
    console.log(`- ${parisLabel(c.starts_at)}  ${c.title}  [${c.is_published ? 'publié' : 'brouillon'}]  ${c.id}`);
  }

  const rejected = recordings.filter((r) => r.validation_status === 'rejected');
  if (rejected.length) {
    console.log('\n=== REJETS (invisibles en validation) ===');
    for (const r of rejected) {
      console.log(`- ${r.title}  vimeo=${r.vimeo_video_id}  course=${r.course_id}`);
    }
  }

  const stuck = recordings.filter(
    (r) => r.validation_status === 'pending' && (r.upload_status === 'transcoding' || r.upload_status === 'uploading'),
  );
  if (stuck.length) {
    console.log('\n=== PENDING TRANSCODING (sonde Vimeo) ===');
    for (const r of stuck) {
      const probe = r.vimeo_video_id ? await probeVimeoPlayback(r.vimeo_video_id) : null;
      console.log(
        `- ${r.title}  vimeo=${r.vimeo_video_id}  db=${r.upload_status}  probe=${probe?.status ?? 'n/a'} playable=${probe?.isPlayable ?? false}`,
      );
    }
  }

  console.log('\n=== SCAN COMPTE VIMEO ===');
  const vimeoVideos = await listAllMeVideos();
  console.log(`Vidéos Vimeo: ${vimeoVideos.length}`);

  const jibriOnVimeo: Array<{ video: VimeoVideoMetadata; parsed: ParsedJibriRecordingFileName }> = [];
  for (const video of vimeoVideos) {
    const parsed = parseJibriFromAnyName(video.title) ?? parseJibriFromAnyName(video.description);
    if (parsed) jibriOnVimeo.push({ video, parsed });
  }
  console.log(`Titres type Jibri (fitmangas-…-YYYYMMDDHHMM_…): ${jibriOnVimeo.length}`);

  type RecoverPlan = {
    course: CourseRow;
    vimeoId: string;
    title: string | null;
    alreadyLinked: boolean;
    reason: string;
  };
  const plan: RecoverPlan[] = [];
  const claimedCourses = new Set<string>();

  for (const { video, parsed } of jibriOnVimeo) {
    const already = recVimeoIds.has(video.vimeoId);
    const course = await findCourseLoose(admin, parsed);
    if (!course) {
      console.log(`  Vimeo ${video.vimeoId} « ${video.title} » → aucun cours (slug=${parsed.slug} ${parsed.dateBlock})`);
      continue;
    }
    if (recsByCourse.has(course.id) || claimedCourses.has(course.id)) {
      if (!already) {
        console.log(`  Vimeo ${video.vimeoId} « ${video.title} » → cours déjà lié (${course.title} ${parisLabel(course.starts_at)})`);
      }
      continue;
    }
    claimedCourses.add(course.id);
    plan.push({
      course,
      vimeoId: video.vimeoId,
      title: video.title,
      alreadyLinked: already,
      reason: `match Jibri ${parsed.slug} ${parsed.dateBlock}`,
    });
  }

  const unmatchedAfterJibri = missingOnline.filter((c) => !plan.some((p) => p.course.id === c.id));
  for (const course of unmatchedAfterJibri) {
    const wantSlug = slugifyCourseTitle(course.title);
    const startMs = new Date(course.starts_at).getTime();
    const candidates = vimeoVideos.filter((video) => {
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
        vimeoId: candidates[0].vimeoId,
        title: candidates[0].title,
        alreadyLinked: false,
        reason: `match date±6h + titre « ${candidates[0].title} »`,
      });
    } else if (candidates.length > 1) {
      console.log(
        `  Ambigu ${course.title} ${parisLabel(course.starts_at)} → ${candidates.map((v) => `${v.vimeoId}:${v.title}`).join(' | ')}`,
      );
    }
  }

  console.log(`\n=== RÉCUPÉRABLES (${plan.length}) ===`);
  for (const item of plan) {
    console.log(
      `- ${parisLabel(item.course.starts_at)}  ${item.course.title}  ← Vimeo ${item.vimeoId}  (${item.reason})  « ${item.title} »`,
    );
  }

  const stillMissing = missingOnline.filter((c) => !plan.some((p) => p.course.id === c.id));
  console.log(`\n=== TOUJOURS MANQUANTS (${stillMissing.length}) — pas de fichier Vimeo rattachable ===`);
  for (const c of stillMissing) {
    console.log(`- ${parisLabel(c.starts_at)}  ${c.title}`);
  }

  if (!APPLY) {
    console.log('\nRelance avec --apply pour créer les lignes pending (validation admin).');
    return;
  }

  console.log('\n=== APPLY ===');
  let ok = 0;
  let fail = 0;
  for (const item of plan) {
    if (item.alreadyLinked) {
      console.log('skip déjà lié', item.vimeoId);
      continue;
    }
    try {
      await syncVideoRecording({ courseId: item.course.id, vimeoId: item.vimeoId, createdBy: null });
      console.log('OK pending', item.course.title, item.vimeoId);
      ok += 1;
    } catch (e) {
      fail += 1;
      console.error('FAIL', item.vimeoId, e instanceof Error ? e.message : e);
    }
  }
  console.log(`\nLiés: ${ok}  échecs: ${fail}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
