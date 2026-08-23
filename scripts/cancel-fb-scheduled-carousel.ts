/**
 * Supprime le post Facebook programmé « fantôme » (ancien flux schedule FB natif).
 * Usage: npx tsx scripts/cancel-fb-scheduled-carousel.ts
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

import { cancelFacebookScheduledPost } from '../src/lib/admin/meta-social';
import {
  getMetaSocialConnection,
  parseSocialCommsBoard,
  SOCIAL_COMMS_SETTING_KEY,
  type SocialCommsBoard,
} from '../src/lib/admin/social-comms';

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

const GHOST_POST_ID = '1036922022314447';
const BOARD_POST_ID = 'sp_mscy1nwy_wyc4c5';

async function main() {
  const connection = await getMetaSocialConnection();
  if (!connection.connected) throw new Error('Meta non connecté');

  console.log('Annulation du post FB programmé', GHOST_POST_ID, '…');
  await cancelFacebookScheduledPost(connection, GHOST_POST_ID);
  console.log('OK — post programmé supprimé côté Meta.');

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await admin
    .from('admin_settings')
    .select('value')
    .eq('key', SOCIAL_COMMS_SETTING_KEY)
    .maybeSingle();
  if (error) throw error;

  const board = parseSocialCommsBoard(JSON.parse(String(data?.value || '{}')));
  const next: SocialCommsBoard = {
    ...board,
    posts: board.posts.map((p) =>
      p.id === BOARD_POST_ID ? { ...p, facebookExternalId: null, updatedAt: new Date().toISOString() } : p,
    ),
  };
  await admin.from('admin_settings').upsert(
    {
      key: SOCIAL_COMMS_SETTING_KEY,
      value: JSON.stringify({ version: 2, posts: next.posts, lastGeneratedAt: next.lastGeneratedAt }),
    },
    { onConflict: 'key' },
  );
  console.log('Board nettoyé — facebookExternalId retiré pour le carousel', BOARD_POST_ID);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
