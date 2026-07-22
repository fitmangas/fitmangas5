/**
 * Re-upload les MP4 récupérés (recordings-local/recover) vers Vimeo,
 * puis met à jour video_recordings (même course_id) avec le nouvel ID.
 *
 * Prérequis : fichiers présents via scripts/recover-jibri-stuck-replays.sh
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/reupload-stuck-course-replays.ts
 */

import fs from 'node:fs';
import path from 'node:path';

import { createAdminClient } from '../src/lib/supabase/admin';
import { uploadToVimeo } from '../src/lib/vimeo';

const RECOVER_DIR = process.env.VIDEO_RECORDINGS_DIR?.trim()
  ? path.join(process.env.VIDEO_RECORDINGS_DIR.trim(), 'recover')
  : path.join(process.cwd(), 'recordings-local/recover');

/** Ancien vimeo_id stuck → préfixe fichier attendu */
const STUCK: Array<{ oldVimeoId: string; filePrefix: string }> = [
  { oldVimeoId: '1210577239', filePrefix: 'fitmangas-pilates-mat-202607161900' },
  { oldVimeoId: '1210279092', filePrefix: 'fitmangas-renfo-core-202607151900' },
  { oldVimeoId: '1209607090', filePrefix: 'fitmangas-pilates-mat-202607131830' },
];

function findLocalMp4(prefix: string): string | null {
  if (!fs.existsSync(RECOVER_DIR)) return null;
  const hit = fs.readdirSync(RECOVER_DIR).find((name) => name.startsWith(prefix) && name.endsWith('.mp4'));
  return hit ? path.join(RECOVER_DIR, hit) : null;
}

async function main() {
  const admin = createAdminClient();
  console.log('Dossier recover:', RECOVER_DIR);

  for (const item of STUCK) {
    console.log('\n===', item.oldVimeoId, item.filePrefix);
    const filePath = findLocalMp4(item.filePrefix);
    if (!filePath) {
      console.error('MP4 local manquant — lance d’abord recover-jibri-stuck-replays.sh');
      continue;
    }

    const { data: row, error } = await admin
      .from('video_recordings')
      .select('id, course_id, title, validation_status, is_ready')
      .eq('vimeo_video_id', item.oldVimeoId)
      .maybeSingle();
    if (error) throw error;
    if (!row) {
      console.error('Pas de ligne video_recordings pour', item.oldVimeoId);
      continue;
    }

    console.log('Upload Vimeo…', path.basename(filePath));
    const uploaded = await uploadToVimeo(
      filePath,
      row.title || path.basename(filePath),
      `Replay FitMangas (re-upload) course ${row.course_id}`,
    );
    console.log('Nouveau Vimeo ID:', uploaded.vimeoId);

    const { error: updErr } = await admin
      .from('video_recordings')
      .update({
        vimeo_video_id: uploaded.vimeoId,
        vimeo_uri: uploaded.vimeoUri,
        embed_url: `https://player.vimeo.com/video/${uploaded.vimeoId}`,
        upload_status: 'ready',
        // reste approved + is_ready si déjà validé — la sonde client le montrera dès que playable
        is_ready: row.validation_status === 'approved' ? true : false,
        available_at: row.validation_status === 'approved' ? new Date().toISOString() : null,
        metadata: { recovered_from: item.oldVimeoId, recovered_at: new Date().toISOString() },
      })
      .eq('id', row.id);
    if (updErr) throw updErr;

    console.log('OK — recording', row.id, '→', uploaded.vimeoId);
  }

  console.log('\nTerminé. Vérifie /admin/replays puis /compte/replays (attendre le transcodage Vimeo ~quelques min).');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
