/**
 * Restaure des replays en validated + client SANS notifications.
 * Désactive trg_notify_replay_ready le temps de l’update (à lancer via Supabase SQL
 * ou ce script si DATABASE_URL / exec_sql disponible).
 *
 * Usage ciblé (IDs issus d’une dé-validation accidentelle) :
 *   npx tsx --env-file=.env.local scripts/restore-replays-silent-bulk.ts
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { approveCourseReplaysSilentBulk } from '@/lib/replay-admin';

async function main() {
  const admin = createAdminClient();

  const { data: pending, error } = await admin
    .from('video_recordings')
    .select('id')
    .eq('validation_status', 'pending');
  if (error) throw error;

  const ids = (pending ?? []).map((r) => String(r.id));
  if (ids.length === 0) {
    console.log('Aucun replay pending à restaurer.');
    return;
  }

  console.warn(
    `⚠️  ${ids.length} replay(s) pending — exécute d’abord dans Supabase :\n` +
      `ALTER TABLE public.video_recordings DISABLE TRIGGER trg_notify_replay_ready;`,
  );

  const result = await approveCourseReplaysSilentBulk(admin, ids);
  console.log('Résultat:', result);
  console.warn(
    'Puis réactive : ALTER TABLE public.video_recordings ENABLE TRIGGER trg_notify_replay_ready;',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
