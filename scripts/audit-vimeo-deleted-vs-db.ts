/**
 * Liste les vidéos Vimeo (y compris filter=deleted) et compare aux replays morts en base.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { probeVimeoPlaybackMany } from '@/lib/vimeo-playback';

const VIMEO_API_BASE = 'https://api.vimeo.com';
const FIELDS =
  'uri,name,description,link,created_time,duration,transcode.status,privacy.view';

function token() {
  const t = process.env.VIMEO_ACCESS_TOKEN?.trim();
  if (!t) throw new Error('VIMEO_ACCESS_TOKEN manquant');
  return t;
}

function idFromUri(uri: string): string {
  return uri.match(/\/videos\/(\d+)/)?.[1] ?? uri;
}

async function listVideos(filter?: string) {
  const out: Array<{ id: string; name: string; duration: number | null; created: string | null }> = [];
  let url: string | null = `${VIMEO_API_BASE}/me/videos?fields=${encodeURIComponent(FIELDS)}&per_page=50${filter ? `&filter=${filter}` : ''}`;
  let guard = 0;
  while (url && guard < 20) {
    guard += 1;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token()}`, Accept: 'application/vnd.vimeo.*+json;version=3.4' },
    });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    const json = (await res.json()) as {
      data?: Array<{ uri: string; name: string | null; duration: number | null; created_time?: string }>;
      paging?: { next?: string };
    };
    for (const v of json.data ?? []) {
      out.push({
        id: idFromUri(v.uri),
        name: v.name ?? '',
        duration: v.duration,
        created: v.created_time ?? null,
      });
    }
    const next = json.paging?.next?.trim();
    url = next ? new URL(next, VIMEO_API_BASE).toString() : null;
  }
  return out;
}

async function main() {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('video_recordings')
    .select('id, vimeo_video_id, title, courses(title)')
    .eq('validation_status', 'approved')
    .eq('is_ready', true);

  const ids = (rows ?? []).map((r) => String(r.vimeo_video_id));
  const probes = await probeVimeoPlaybackMany(ids);
  const dead = (rows ?? []).filter((r) => probes.get(String(r.vimeo_video_id))?.confidence === 'unavailable');

  console.log('Replays morts en base:', dead.length);

  for (const filter of [undefined, 'deleted'] as const) {
    const label = filter ?? 'all';
    const vids = await listVideos(filter);
    const jibri = vids.filter((v) => v.name.startsWith('fitmangas-'));
    console.log(`\n=== Vimeo filter=${label} total=${vids.length} jibri=${jibri.length} ===`);
    for (const v of jibri) {
      console.log(`  ${v.id}  ${Math.round((v.duration ?? 0) / 60)}min  ${v.name.slice(0, 65)}`);
    }

    const deadTitles = new Set(dead.map((d) => String(d.title ?? '').trim().toLowerCase()));
    const byName = new Map(vids.map((v) => [v.name.trim().toLowerCase(), v]));
    let matches = 0;
    for (const d of dead) {
      const t = String(d.title ?? '').trim().toLowerCase();
      const hit = byName.get(t);
      if (hit && hit.id !== String(d.vimeo_video_id)) {
        matches += 1;
        const c = Array.isArray(d.courses) ? d.courses[0] : d.courses;
        console.log(`  MATCH ${c?.title}: ${d.vimeo_video_id} → ${hit.id}`);
      }
    }
    console.log(`  Relinks possibles par titre exact: ${matches}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
