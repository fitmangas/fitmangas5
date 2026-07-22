/**
 * Re-upload des 3 replays récupérés depuis ~/Downloads/fitmangas-replays/
 * vers Vimeo (upload TUS complet par chunks), poll jusqu'à playable, relink DB.
 *
 * Usage :
 *   NODE_OPTIONS='--max-old-space-size=8192' npx tsx --env-file=.env.local scripts/reupload-recovered-replays.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { stat } from 'node:fs/promises';

import { createAdminClient } from '../src/lib/supabase/admin';
import { getVideoMetadata } from '../src/lib/vimeo';
import { probeVimeoPlayback } from '../src/lib/vimeo-playback';

const VIMEO_API_BASE = 'https://api.vimeo.com';
const TUS_VERSION = '1.0.0';
const CHUNK_SIZE = 64 * 1024 * 1024; // 64 Mo
const POLL_MS = 15_000;
const POLL_MAX = 120; // ~30 min max par vidéo

const REFERENCE_VIMEO_ID = '1208500328';

const REFERENCE_PRIVACY = {
  view: 'unlisted' as const,
  embed: 'public' as const,
  download: true,
  add: true,
  comments: 'anybody' as const,
};

type Job = {
  filePath: string;
  oldVimeoId: string;
  recordingId: string;
  courseId: string;
  title: string;
  displayTitle: string;
};

const JOBS: Job[] = [
  {
    filePath: path.join(process.env.HOME || '', 'Downloads/fitmangas-replays/replay-13juil.mp4'),
    oldVimeoId: '1209607090',
    recordingId: '8f54b07d-f495-421e-bdf8-da9704a2398a',
    courseId: '2b4fbf93-5f05-4d4b-b1ab-0b8c18aa533a',
    title: 'fitmangas-pilates-mat-202607131830_2026-07-13-18-32-28.mp4',
    displayTitle: 'Replay 13 juillet — Pilates Mat',
  },
  {
    filePath: path.join(process.env.HOME || '', 'Downloads/fitmangas-replays/replay-15juil.mp4'),
    oldVimeoId: '1210279092',
    recordingId: 'b4eef5e3-31d3-4b72-b121-9feccdbefb9f',
    courseId: '4e27337d-8cb1-490a-9ece-806194e11f4a',
    title: 'fitmangas-renfo-core-202607151900_2026-07-15-19-13-40.mp4',
    displayTitle: 'Replay 15 juillet — Renfo Core',
  },
  {
    filePath: path.join(process.env.HOME || '', 'Downloads/fitmangas-replays/replay-16juil.mp4'),
    oldVimeoId: '1210577239',
    recordingId: 'ed1d8898-599d-4efe-af8b-0ca2b1a21c3d',
    courseId: 'c3602d52-5a3a-4d9b-9ae9-7908c6bc9d73',
    title: 'fitmangas-pilates-mat-202607161900_2026-07-16-19-04-07.mp4',
    displayTitle: 'Replay 16 juillet — Pilates Mat',
  },
];

function getToken(): string {
  const t = process.env.VIMEO_ACCESS_TOKEN?.trim();
  if (!t) throw new Error('VIMEO_ACCESS_TOKEN manquant');
  return t;
}

function headers(extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: 'application/vnd.vimeo.*+json;version=3.4',
    ...extra,
  };
}

function extractId(uri: string): string {
  const m = uri.match(/\/videos\/(\d+)/);
  if (!m) throw new Error(`URI Vimeo invalide: ${uri}`);
  return m[1]!;
}

/** Upload TUS complet par chunks (évite OOM + garantit offset final = size). */
async function uploadCompleteTus(filePath: string, name: string, description: string): Promise<{ vimeoId: string; vimeoUri: string }> {
  const fileStats = await stat(filePath);
  const totalSize = fileStats.size;
  console.log(`  Init TUS (${(totalSize / 1024 / 1024 / 1024).toFixed(2)} Go)…`);

  const initRes = await fetch(`${VIMEO_API_BASE}/me/videos`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      upload: { approach: 'tus', size: String(totalSize) },
      name,
      description,
      privacy: REFERENCE_PRIVACY,
    }),
  });
  if (!initRes.ok) throw new Error(`Init upload ${initRes.status}: ${await initRes.text()}`);

  const initJson = (await initRes.json()) as { uri: string; upload?: { upload_link?: string } };
  const uploadLink = initJson.upload?.upload_link;
  if (!uploadLink) throw new Error('upload_link absent');

  let offset = 0;
  const fd = fs.openSync(filePath, 'r');
  try {
    while (offset < totalSize) {
      const chunkLen = Math.min(CHUNK_SIZE, totalSize - offset);
      const buffer = Buffer.alloc(chunkLen);
      fs.readSync(fd, buffer, 0, chunkLen, offset);

      let patchRes: Response | null = null;
      let lastErr: unknown = null;
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        try {
          patchRes = await fetch(uploadLink, {
            method: 'PATCH',
            headers: {
              'Tus-Resumable': TUS_VERSION,
              'Upload-Offset': String(offset),
              'Content-Type': 'application/offset+octet-stream',
            },
            body: buffer,
          });
          break;
        } catch (e) {
          lastErr = e;
          const wait = attempt * 3000;
          console.warn(`\n  PATCH retry ${attempt}/5 après erreur réseau (${wait}ms)…`);
          await new Promise((r) => setTimeout(r, wait));
        }
      }
      if (!patchRes) {
        throw new Error(`PATCH offset ${offset} fetch failed: ${lastErr instanceof Error ? lastErr.message : lastErr}`);
      }

      if (!(patchRes.status === 204 || patchRes.ok)) {
        throw new Error(`PATCH offset ${offset} failed ${patchRes.status}: ${await patchRes.text()}`);
      }

      const newOffset = patchRes.headers.get('Upload-Offset');
      offset = newOffset ? parseInt(newOffset, 10) : offset + chunkLen;
      const pct = Math.round((offset / totalSize) * 100);
      process.stdout.write(`\r  Upload ${pct}% (${(offset / 1024 / 1024).toFixed(0)} / ${(totalSize / 1024 / 1024).toFixed(0)} Mo)`);
    }
    console.log('\n  Upload terminé.');
  } finally {
    fs.closeSync(fd);
  }

  if (offset !== totalSize) {
    throw new Error(`Upload incomplet: offset=${offset} size=${totalSize}`);
  }

  const vimeoUri = initJson.uri;
  return { vimeoId: extractId(vimeoUri), vimeoUri };
}

async function applyReferencePrivacy(vimeoId: string) {
  const res = await fetch(`${VIMEO_API_BASE}/videos/${vimeoId}`, {
    method: 'PATCH',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ privacy: REFERENCE_PRIVACY }),
  });
  if (!res.ok) console.warn(`  Privacy patch warning ${res.status}: ${await res.text()}`);
}

async function waitUntilPlayable(vimeoId: string): Promise<void> {
  for (let i = 0; i < POLL_MAX; i += 1) {
    const probe = await probeVimeoPlayback(vimeoId);
    const status = probe.status ?? '?';
    process.stdout.write(`\r  Transcode… ${status} playable=${probe.isPlayable} (${i + 1}/${POLL_MAX})`);
    if (probe.isPlayable) {
      console.log('');
      return;
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error(`Vidéo ${vimeoId} non playable après ${POLL_MAX} polls`);
}

async function relinkRecording(job: Job, newVimeoId: string) {
  const admin = createAdminClient();

  const meta = await getVideoMetadata(newVimeoId);

  const { error } = await admin
    .from('video_recordings')
    .update({
      vimeo_video_id: meta.vimeoId,
      vimeo_uri: meta.vimeoUri,
      title: job.title,
      description: `Séance : ${job.displayTitle.split('—').pop()?.trim() ?? 'FitMangas'}`,
      embed_url: meta.embedUrl ?? meta.link ?? `https://player.vimeo.com/video/${meta.vimeoId}`,
      thumbnail_url: meta.thumbnailUrl,
      duration_seconds: meta.durationSeconds,
      privacy_view: meta.privacyView ?? 'unlisted',
      upload_status: 'ready',
      is_ready: true,
      metadata: {
        recovered_from: job.oldVimeoId,
        recovered_at: new Date().toISOString(),
        reupload_script: 'reupload-recovered-replays.ts',
      },
    })
    .eq('id', job.recordingId);

  if (error) throw error;
}

async function verifyClientVisibility(recordingIds: string[]) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('video_recordings')
    .select('id, vimeo_video_id, validation_status, is_ready, courses(title, starts_at, ends_at, is_published)')
    .in('id', recordingIds)
    .eq('validation_status', 'approved')
    .eq('is_ready', true);
  if (error) throw error;

  const now = Date.now();
  const results: Array<{ id: string; title: string; vimeoId: string; playable: boolean; visible: boolean }> = [];

  for (const row of data ?? []) {
    const c = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    const end = c?.ends_at ? new Date(c.ends_at).getTime() : 0;
    const courseOk = c?.is_published && end < now;
    const probe = await probeVimeoPlayback(String(row.vimeo_video_id));
    results.push({
      id: row.id,
      title: c?.title ?? '?',
      vimeoId: String(row.vimeo_video_id),
      playable: probe.isPlayable,
      visible: courseOk && probe.isPlayable,
    });
  }
  return results;
}

async function main() {
  console.log('=== Référence Vimeo', REFERENCE_VIMEO_ID, '===');
  console.log('Privacy:', JSON.stringify(REFERENCE_PRIVACY));

  const onlyId = process.env.ONLY_RECORDING_ID?.trim();
  const jobs = onlyId ? JOBS.filter((j) => j.recordingId === onlyId) : JOBS;
  if (onlyId && jobs.length === 0) {
    throw new Error(`ONLY_RECORDING_ID inconnu: ${onlyId}`);
  }

  for (const job of jobs) {
    if (!fs.existsSync(job.filePath)) {
      throw new Error(`Fichier manquant: ${job.filePath}`);
    }
    const st = await stat(job.filePath);
    console.log(`\n=== ${job.displayTitle} ===`);
    console.log(`  Fichier: ${job.filePath} (${(st.size / 1024 / 1024 / 1024).toFixed(2)} Go)`);
    console.log(`  Ligne DB: ${job.recordingId}`);
    console.log(`  Ancien Vimeo: ${job.oldVimeoId}`);

    const { vimeoId, vimeoUri } = await uploadCompleteTus(
      job.filePath,
      job.displayTitle,
      `Replay FitMangas — ${job.displayTitle}`,
    );
    console.log(`  Nouveau Vimeo: ${vimeoId} (${vimeoUri})`);

    await applyReferencePrivacy(vimeoId);
    await waitUntilPlayable(vimeoId);

    await relinkRecording(job, vimeoId);
    console.log(`  DB relink OK: ${job.oldVimeoId} → ${vimeoId}`);
  }

  console.log('\n=== Vérification finale ===');
  const checks = await verifyClientVisibility(jobs.map((j) => j.recordingId));
  console.table(checks);

  const allOk = checks.every((c) => c.playable && c.visible);
  if (!allOk) {
    console.error('Certaines vidéos ne passent pas encore la sonde client.');
    process.exit(1);
  }
  console.log('\nTous les replays sont playable et visibles côté client.');
}

main().catch((e) => {
  console.error('\nÉCHEC:', e instanceof Error ? e.message : e);
  process.exit(1);
});
