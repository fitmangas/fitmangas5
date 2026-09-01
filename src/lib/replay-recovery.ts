import fs from 'node:fs';
import path from 'node:path';

import { parseJibriRecordingFileName } from '@/lib/jibri-recording-filename';
import { createAdminClient } from '@/lib/supabase/admin';
import { getVideoMetadata } from '@/lib/vimeo';
import { probeVimeoPlayback, probeVimeoPlaybackMany } from '@/lib/vimeo-playback';
import { applyVimeoPrivacy, uploadMp4ToVimeoChunked } from '@/lib/vimeo-tus-chunked';

const POLL_MS = 15_000;
const POLL_MAX = 120;
const MIN_MP4_BYTES = 50 * 1024 * 1024; // 50 Mo — ignore les bouts Jibri < 3 min

export type DeadReplayRow = {
  id: string;
  course_id: string;
  vimeo_video_id: string;
  title: string | null;
  validation_status: string;
  is_ready: boolean;
  courseTitle: string;
};

export type ReplayRecoveryResult = {
  probedAlive: number;
  uploaded: number;
  skippedNoFile: number;
  failed: number;
  details: string[];
};

function normalizeMp4Name(name: string): string {
  const n = name.trim().toLowerCase();
  return n.endsWith('.mp4') ? n : `${n}.mp4`;
}

export function defaultRecoverDir(): string {
  const base = process.env.VIDEO_RECORDINGS_DIR?.trim() || path.join(process.cwd(), 'recordings-local');
  return path.join(base, 'recover');
}

/** Indexe les MP4 locaux par nom Jibri normalisé. */
export function indexLocalRecoverMp4(recoverDir: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!fs.existsSync(recoverDir)) return out;
  for (const name of fs.readdirSync(recoverDir)) {
    if (!name.toLowerCase().endsWith('.mp4')) continue;
    const full = path.join(recoverDir, name);
    try {
      const st = fs.statSync(full);
      if (!st.isFile() || st.size < MIN_MP4_BYTES) continue;
    } catch {
      continue;
    }
    out.set(normalizeMp4Name(name), full);
  }
  return out;
}

export async function listDeadApprovedReplays(): Promise<DeadReplayRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('video_recordings')
    .select('id, course_id, vimeo_video_id, title, validation_status, is_ready, courses ( title )')
    .eq('validation_status', 'approved')
    .eq('is_ready', true);
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    course_id: string;
    vimeo_video_id: string;
    title: string | null;
    validation_status: string;
    is_ready: boolean;
    courses: { title: string } | { title: string }[] | null;
  }>;

  const ids = rows.map((r) => String(r.vimeo_video_id));
  const probes = await probeVimeoPlaybackMany(ids);

  return rows
    .filter((r) => probes.get(String(r.vimeo_video_id))?.confidence === 'unavailable')
    .map((r) => {
      const c = Array.isArray(r.courses) ? r.courses[0] : r.courses;
      return {
        id: r.id,
        course_id: r.course_id,
        vimeo_video_id: String(r.vimeo_video_id),
        title: r.title,
        validation_status: r.validation_status,
        is_ready: r.is_ready,
        courseTitle: c?.title ?? '?',
      };
    });
}

async function waitUntilPlayable(vimeoId: string): Promise<void> {
  for (let i = 0; i < POLL_MAX; i += 1) {
    const probe = await probeVimeoPlayback(vimeoId);
    if (probe.isPlayable && probe.confidence === 'confirmed') return;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error(`Vimeo ${vimeoId} non playable après ${POLL_MAX} tentatives`);
}

/** Met à jour la ligne existante (même enregistrement validé) — sans notification. */
export async function relinkRecordingToNewVimeo(params: {
  recordingId: string;
  oldVimeoId: string;
  newVimeoId: string;
  title: string;
}): Promise<void> {
  const admin = createAdminClient();
  const meta = await getVideoMetadata(params.newVimeoId);
  const prev = await admin.from('video_recordings').select('metadata').eq('id', params.recordingId).maybeSingle();
  const prevMeta =
    prev.data?.metadata && typeof prev.data.metadata === 'object' && !Array.isArray(prev.data.metadata)
      ? (prev.data.metadata as Record<string, unknown>)
      : {};

  const { error } = await admin
    .from('video_recordings')
    .update({
      vimeo_video_id: meta.vimeoId,
      vimeo_uri: meta.vimeoUri,
      title: params.title,
      embed_url: meta.embedUrl ?? meta.link ?? `https://player.vimeo.com/video/${meta.vimeoId}`,
      thumbnail_url: meta.thumbnailUrl,
      duration_seconds: meta.durationSeconds,
      privacy_view: meta.privacyView ?? 'unlisted',
      upload_status: 'ready',
      validation_status: 'approved',
      is_ready: true,
      metadata: {
        ...prevMeta,
        recovered_from_vimeo_id: params.oldVimeoId,
        recovered_at: new Date().toISOString(),
        recovery_method: 'mp4_reupload',
      },
    })
    .eq('id', params.recordingId);
  if (error) throw error;
}

export async function recoverDeadReplaysFromLocalMp4(opts?: {
  recoverDir?: string;
  dryRun?: boolean;
  limit?: number;
}): Promise<ReplayRecoveryResult> {
  const recoverDir = opts?.recoverDir ?? defaultRecoverDir();
  const dryRun = opts?.dryRun === true;
  const result: ReplayRecoveryResult = {
    probedAlive: 0,
    uploaded: 0,
    skippedNoFile: 0,
    failed: 0,
    details: [],
  };

  const dead = await listDeadApprovedReplays();
  if (dead.length === 0) {
    result.details.push('Aucun replay validé avec Vimeo 404.');
    return result;
  }

  const local = indexLocalRecoverMp4(recoverDir);
  result.details.push(`${dead.length} replay(s) mort(s), ${local.size} MP4 local(aux) ≥50Mo dans ${recoverDir}`);

  const queue = opts?.limit ? dead.slice(0, opts.limit) : dead;

  for (const row of queue) {
    const key = normalizeMp4Name(String(row.title ?? ''));
    const filePath = local.get(key);

    // Re-probe : peut-être restauré depuis la corbeille Vimeo entre-temps
    const live = await probeVimeoPlayback(row.vimeo_video_id);
    if (live.isPlayable && live.confidence === 'confirmed') {
      result.probedAlive += 1;
      result.details.push(`OK Vimeo restauré: ${row.courseTitle} (${row.vimeo_video_id})`);
      continue;
    }

    if (!filePath) {
      result.skippedNoFile += 1;
      result.details.push(`MANQUE MP4: ${row.courseTitle} — ${key || row.title}`);
      continue;
    }

    const parsed = parseJibriRecordingFileName(path.basename(filePath));
    const displayTitle = parsed
      ? `Replay FitMangas — ${row.courseTitle}`
      : row.courseTitle;

    result.details.push(`UPLOAD ${row.courseTitle} ← ${path.basename(filePath)}`);

    if (dryRun) {
      result.uploaded += 1;
      continue;
    }

    try {
      const { vimeoId } = await uploadMp4ToVimeoChunked(
        filePath,
        String(row.title ?? path.basename(filePath)),
        displayTitle,
        {
          onProgress: (pct) => process.stdout.write(`\r  ${row.courseTitle} ${pct}%`),
        },
      );
      process.stdout.write('\n');
      await applyVimeoPrivacy(vimeoId);
      await waitUntilPlayable(vimeoId);
      await relinkRecordingToNewVimeo({
        recordingId: row.id,
        oldVimeoId: row.vimeo_video_id,
        newVimeoId: vimeoId,
        title: String(row.title ?? path.basename(filePath)),
      });
      result.uploaded += 1;
      result.details.push(`  → relink ${row.vimeo_video_id} → ${vimeoId}`);
    } catch (e) {
      result.failed += 1;
      result.details.push(`  ÉCHEC ${row.courseTitle}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return result;
}

/** Sonde tous les replays morts — utile après restauration manuelle corbeille Vimeo. */
export async function probeDeadReplaysForRestore(): Promise<{
  stillDead: number;
  restored: DeadReplayRow[];
}> {
  const dead = await listDeadApprovedReplays();
  const restored: DeadReplayRow[] = [];
  for (const row of dead) {
    const probe = await probeVimeoPlayback(row.vimeo_video_id);
    if (probe.isPlayable && probe.confidence === 'confirmed') {
      restored.push(row);
    }
  }
  return { stillDead: dead.length - restored.length, restored };
}
