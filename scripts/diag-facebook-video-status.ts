/**
 * Deep-dive statut vidéo FB ID 2125096858435957
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    let k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnvLocal();

const GRAPH = 'https://graph.facebook.com/v21.0';
const VIDEO_ID = '2125096858435957';

async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await admin.from('admin_settings').select('value').eq('key', 'meta_social_connection').maybeSingle();
  const meta = JSON.parse(String(data?.value || '{}')) as {
    accessToken?: string;
    pageId?: string;
  };
  const token = meta.accessToken!;
  const pageId = meta.pageId!;

  const fields = [
    'id',
    'title',
    'description',
    'created_time',
    'updated_time',
    'permalink_url',
    'length',
    'from',
    'status',
    'published',
    'privacy',
    'is_published',
    'is_instagram_eligible',
    'content_category',
    'embeddable',
    'format',
    'picture',
    'source',
    'post_id',
    'live_status',
  ].join(',');

  const res = await fetch(`${GRAPH}/${VIDEO_ID}?fields=${fields}&access_token=${encodeURIComponent(token)}`);
  const body = await res.json();
  console.log('VIDEO DETAIL', JSON.stringify({ http: res.status, body }, null, 2));

  // status endpoint sometimes separate
  const st = await fetch(`${GRAPH}/${VIDEO_ID}?fields=status&access_token=${encodeURIComponent(token)}`);
  console.log('STATUS ONLY', JSON.stringify(await st.json(), null, 2));

  // Check if there's a related page post
  const posts = await fetch(
    `${GRAPH}/${pageId}/published_posts?fields=id,message,created_time,permalink_url,status_type,is_published,attachments{media_type,url,target}&limit=10&access_token=${encodeURIComponent(token)}`,
  );
  console.log('PUBLISHED_POSTS', JSON.stringify({ http: posts.status, body: await posts.json() }, null, 2));

  const unpub = await fetch(
    `${GRAPH}/${pageId}/videos?fields=id,title,created_time,permalink_url,published,is_published,status&limit=10&access_token=${encodeURIComponent(token)}`,
  );
  console.log('VIDEOS LIST', JSON.stringify({ http: unpub.status, body: await unpub.json() }, null, 2));

  // Permissions debug
  const debug = await fetch(`${GRAPH}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`);
  console.log('DEBUG TOKEN', JSON.stringify(await debug.json(), null, 2));

  // Try page reels edge if exists
  for (const edge of ['video_reels', 'reels', 'vids']) {
    const r = await fetch(`${GRAPH}/${pageId}/${edge}?limit=5&access_token=${encodeURIComponent(token)}`);
    const j = await r.json();
    console.log(`EDGE ${edge}`, JSON.stringify({ http: r.status, body: j }, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
