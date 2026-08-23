/**
 * Republie le Reel archivé via l’API officielle video_reels et met à jour le board.
 * Usage: npx tsx scripts/fix-fb-reel-mirror.ts
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import {
  absolutePublicUrl,
  parseSocialCommsBoard,
  SOCIAL_COMMS_SETTING_KEY,
  type SocialCommsBoard,
} from '../src/lib/admin/social-comms';
import { captionForPublish } from '../src/lib/admin/social-cm-playbook';
import { getMetaSocialConnection } from '../src/lib/admin/social-comms';
import { publishFacebookPost } from '../src/lib/admin/meta-social';

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

async function main() {
  const connection = await getMetaSocialConnection();
  if (!connection.connected) throw new Error('Meta non connecté');

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await admin
    .from('admin_settings')
    .select('value')
    .eq('key', SOCIAL_COMMS_SETTING_KEY)
    .maybeSingle();
  if (error) throw error;
  const board = parseSocialCommsBoard(JSON.parse(String(data?.value || '{}')));
  const post = board.posts.find((p) => p.id === 'sp_mscy1nwv_l41h23');
  if (!post) throw new Error('Post introuvable');
  console.log('Publishing reel via video_reels…', {
    id: post.id,
    video: post.editedVideoPath ? absolutePublicUrl(post.editedVideoPath) : null,
    captionPreview: captionForPublish(post).slice(0, 120),
  });

  const facebookExternalId = await publishFacebookPost(connection, post, { schedule: false });
  console.log('OK facebookExternalId=', facebookExternalId);

  const next: SocialCommsBoard = {
    ...board,
    posts: board.posts.map((p) =>
      p.id === post.id
        ? { ...p, facebookExternalId, alsoPublishFacebook: true, updatedAt: new Date().toISOString() }
        : p,
    ),
  };
  const { error: saveErr } = await admin.from('admin_settings').upsert(
    { key: SOCIAL_COMMS_SETTING_KEY, value: JSON.stringify({ version: 2, posts: next.posts, lastGeneratedAt: next.lastGeneratedAt }) },
    { onConflict: 'key' },
  );
  if (saveErr) throw saveErr;
  console.log('Board mis à jour. Vérifie https://www.facebook.com/reel/' + facebookExternalId + '/');
  console.log('Ou Meta Business Suite → Publications / Reels de la Page Fit.mangas');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
