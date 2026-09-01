import { createAdminClient } from '@/lib/supabase/admin';
import { probeVimeoPlaybackMany } from '@/lib/vimeo-playback';

async function main() {
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('video_recordings')
    .select('id, vimeo_video_id, title, validation_status, is_ready, course_id')
    .eq('validation_status', 'approved')
    .eq('is_ready', true);
  if (error) throw error;

  const ids = (rows ?? []).map((r) => String(r.vimeo_video_id)).filter(Boolean);
  console.log('Approved+ready recordings:', rows?.length ?? 0);

  const probes = await probeVimeoPlaybackMany(ids);
  let confirmed = 0;
  let unavailable = 0;
  let unknown = 0;
  const bad: string[] = [];

  for (const row of rows ?? []) {
    const vid = String(row.vimeo_video_id);
    const p = probes.get(vid);
    if (!p) {
      unknown += 1;
      bad.push(`${vid} no-probe ${row.title}`);
      continue;
    }
    if (p.isPlayable && p.confidence === 'confirmed') confirmed += 1;
    else if (p.confidence === 'unavailable') {
      unavailable += 1;
      bad.push(`${vid} ${p.status} ${row.title}`);
    } else {
      unknown += 1;
      bad.push(`${vid} ${p.status}/${p.confidence} ${row.title}`);
    }
  }

  console.log({ confirmed, unavailable, unknown });
  console.log('Sample issues:');
  for (const line of bad.slice(0, 15)) console.log(' ', line);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
