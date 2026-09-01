/**
 * Récupère les replays morts (Vimeo 404) :
 * 1. --probe  : vérifie si la corbeille Vimeo a été restaurée (mêmes IDs)
 * 2. --dry-run / défaut : liste MP4 manquants vs dispo
 * 3. --upload : re-upload MP4 locaux + relink silencieux
 *
 * Prérequis upload :
 *   bash scripts/vps/pull-all-jibri-mp4.sh
 *   (ou restauration Vimeo → --probe)
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/recover-dead-replays-from-mp4.ts --probe
 *   npx tsx --env-file=.env.local scripts/recover-dead-replays-from-mp4.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/recover-dead-replays-from-mp4.ts --upload
 *   npx tsx --env-file=.env.local scripts/recover-dead-replays-from-mp4.ts --upload --limit=1
 */
import {
  defaultRecoverDir,
  indexLocalRecoverMp4,
  listDeadApprovedReplays,
  probeDeadReplaysForRestore,
  recoverDeadReplaysFromLocalMp4,
} from '@/lib/replay-recovery';
import { probeVimeoPlaybackMany } from '@/lib/vimeo-playback';

async function main() {
  const probeOnly = process.argv.includes('--probe');
  const dryRun = process.argv.includes('--dry-run') || (!process.argv.includes('--upload') && !probeOnly);
  const upload = process.argv.includes('--upload');
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1] ?? '', 10) : undefined;

  if (probeOnly) {
    const { stillDead, restored } = await probeDeadReplaysForRestore();
    console.log(`Encore morts: ${stillDead}  |  Restaurés (corbeille Vimeo): ${restored.length}`);
    for (const r of restored) {
      console.log(`  ✓ ${r.courseTitle} ${r.vimeo_video_id}`);
    }
    if (stillDead > 0) {
      console.log('\nSi tu viens de restaurer sur Vimeo, attends 1–2 min et relance --probe.');
    }
    return;
  }

  const dead = await listDeadApprovedReplays();
  const local = indexLocalRecoverMp4(defaultRecoverDir());
  console.log(`Replays Vimeo 404: ${dead.length}`);
  console.log(`MP4 locaux (≥50Mo): ${local.size} dans ${defaultRecoverDir()}\n`);

  for (const row of dead) {
    const key = (row.title ?? '').trim().toLowerCase();
    const has = local.has(key.endsWith('.mp4') ? key : `${key}.mp4`);
    console.log(`${has ? '✓ MP4' : '✗ manque'}  ${row.courseTitle.padEnd(22)}  ${row.title?.slice(0, 55) ?? ''}`);
  }

  if (dryRun && !upload) {
    console.log('\nDry-run. Lance --upload après pull VPS ou restauration corbeille Vimeo.');
    console.log('Corbeille Vimeo (30 j) : vimeo.com → Bibliothèque → Supprimés récemment → Restaurer.');
    return;
  }

  const result = await recoverDeadReplaysFromLocalMp4({ dryRun: false, limit });
  console.log('\n=== Résultat ===');
  console.log(JSON.stringify(result, null, 2));

  const ids = dead.map((d) => d.vimeo_video_id);
  const after = await probeVimeoPlaybackMany(ids);
  let playable = 0;
  for (const id of ids) {
    const p = after.get(id);
    if (p?.isPlayable && p.confidence === 'confirmed') playable += 1;
  }
  console.log(`\nPlayable après opération (anciens IDs): ${playable}/${ids.length}`);
  console.log('Note: après re-upload, les nouveaux IDs Vimeo sont sur les mêmes lignes DB.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
