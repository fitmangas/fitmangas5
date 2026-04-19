/**
 * Synchronise video_recordings depuis un vimeoId déjà uploadé.
 * Usage: npx tsx --env-file=.env.local scripts/sync-video-from-vimeo.ts <courseUUID> <vimeoId>
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { syncVideoRecording } from '@/lib/vimeo';

async function main() {
  const courseId = process.argv[2]?.trim();
  const vimeoId = process.argv[3]?.trim();
  if (!courseId || !vimeoId) {
    console.error('Usage: npx tsx --env-file=.env.local scripts/sync-video-from-vimeo.ts <courseUUID> <vimeoId>');
    process.exit(1);
  }

  const meta = await syncVideoRecording({ courseId, vimeoId, createdBy: null });
  console.log('sync OK:', { embedUrl: meta.embedUrl ?? meta.link, isReady: meta.isReady });

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('video_recordings')
    .select('*')
    .eq('course_id', courseId)
    .eq('vimeo_video_id', vimeoId)
    .maybeSingle();

  if (error) throw error;
  console.log('\nLigne video_recordings:');
  console.log(JSON.stringify(row, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
