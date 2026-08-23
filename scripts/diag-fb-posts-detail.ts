import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnvLocal();

const GRAPH = 'https://graph.facebook.com/v21.0';

async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await admin.from('admin_settings').select('value').eq('key', 'meta_social_connection').maybeSingle();
  const meta = JSON.parse(String(data?.value || '{}')) as { accessToken?: string; pageId?: string };
  const token = meta.accessToken!;
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();

  for (const [label, id] of [
    ['REEL', '1087144864082490'],
    ['FEED', '1036919722314677'],
    ['CAROUSEL_SCHED', '1036922022314447'],
  ]) {
    const fields =
      'id,created_time,updated_time,is_published,published,privacy,status,permalink_url,message,scheduled_publish_time,attachments{media_type,subattachments}';
    const r = await fetch(`${GRAPH}/${id}?fields=${fields}&access_token=${encodeURIComponent(token)}`);
    console.log(`\n=== ${label} ${id} ===`);
    console.log(JSON.stringify(await r.json(), null, 2));
  }

  const reelStatus = await fetch(
    `${GRAPH}/1087144864082490?fields=status,published,is_published,post_id&access_token=${encodeURIComponent(token)}`,
  );
  console.log('\n=== REEL STATUS ===');
  console.log(JSON.stringify(await reelStatus.json(), null, 2));

  const debugToken = appId && appSecret ? `${appId}|${appSecret}` : token;
  const debug = await fetch(
    `${GRAPH}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(debugToken)}`,
  );
  console.log('\n=== DEBUG TOKEN ===');
  console.log(JSON.stringify(await debug.json(), null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
