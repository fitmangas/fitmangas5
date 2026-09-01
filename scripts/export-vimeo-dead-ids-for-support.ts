/**
 * Exporte la liste des IDs Vimeo supprimés pour ticket support Vimeo.
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/export-vimeo-dead-ids-for-support.ts > ~/Desktop/vimeo-replays-perdus.txt
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createAdminClient } from '@/lib/supabase/admin';
import { probeVimeoPlaybackMany } from '@/lib/vimeo-playback';

async function main() {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('video_recordings')
    .select('vimeo_video_id, title, validation_status, courses ( title, starts_at )')
    .eq('validation_status', 'approved')
    .eq('is_ready', true)
    .order('created_at');

  const ids = (rows ?? []).map((r) => String(r.vimeo_video_id));
  const probes = await probeVimeoPlaybackMany(ids);

  const lines: string[] = [
    'FitMangas — demande de restauration vidéos supprimées par erreur',
    `Date export : ${new Date().toISOString()}`,
    `Compte : fitmangas.com (live visio Pilates/Barre)`,
    '',
    'Bonjour,',
    '',
    'Environ 28 vidéos de replay de cours en ligne ont été supprimées définitivement par erreur',
    '(elles n’apparaissent plus dans « Supprimés récemment »).',
    'Merci de vérifier si une restauration côté serveur est possible.',
    '',
    'Liste des vidéos concernées (ID Vimeo | séance | fichier) :',
    '',
  ];

  let n = 0;
  for (const row of rows ?? []) {
    const vid = String(row.vimeo_video_id);
    const p = probes.get(vid);
    if (p?.confidence !== 'unavailable') continue;
    n += 1;
    const c = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    lines.push(`${n}. ${vid} | ${c?.title ?? '?'} | ${c?.starts_at?.slice(0, 10) ?? '?'} | ${row.title ?? ''}`);
  }

  lines.push('', `Total : ${n} vidéos.`, '', 'Merci,');

  const out = join(process.env.HOME || '.', 'Desktop', 'vimeo-replays-perdus.txt');
  const text = lines.join('\n');
  writeFileSync(out, text, 'utf8');
  console.log(text);
  console.log(`\n→ Fichier écrit : ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
