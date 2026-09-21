/**
 * Vérifie en live les tokens Meta stockés (acquisition + CM).
 * Usage: npx tsx scripts/check-meta-tokens.ts
 */
import { createClient } from '@supabase/supabase-js';

async function checkKey(
  admin: ReturnType<typeof createClient>,
  key: string,
) {
  const { data } = await admin.from('admin_settings').select('value').eq('key', key).maybeSingle();
  if (!data?.value) {
    console.log(key, 'MISSING');
    return;
  }
  const c = JSON.parse(String(data.value)) as Record<string, unknown>;
  const token = String(c.accessToken || '');
  console.log('\n===', key, '===');
  console.log(
    'pageId',
    c.pageId,
    'igUserId',
    c.igUserId,
    'distinct',
    c.pageId !== c.igUserId,
  );
  console.log(
    'tokenPrefix',
    token.slice(0, 8),
    'expires',
    c.tokenExpiresAt || c.dataAccessExpiresAt || null,
    'updated',
    c.updatedAt,
  );
  if (!token) return;

  const isIg = token.startsWith('IGAA') || token.startsWith('IGAV');
  const base = isIg ? 'https://graph.instagram.com/v21.0' : 'https://graph.facebook.com/v21.0';

  const me = await fetch(
    `${base}/me?fields=id,name,username&access_token=${encodeURIComponent(token)}`,
  );
  const meJ = (await me.json()) as Record<string, unknown>;
  console.log('me', isIg ? 'IG' : 'FB', me.status, JSON.stringify(meJ).slice(0, 220));

  if (c.igUserId) {
    const ig = await fetch(
      `${base}/${String(c.igUserId)}?fields=id,username&access_token=${encodeURIComponent(token)}`,
    );
    const igJ = (await ig.json()) as Record<string, unknown>;
    console.log('igUser', ig.status, JSON.stringify(igJ).slice(0, 220));
  }

  if (c.pageId && !isIg) {
    const page = await fetch(
      `https://graph.facebook.com/v21.0/${String(c.pageId)}?fields=id,name&access_token=${encodeURIComponent(token)}`,
    );
    const pageJ = (await page.json()) as Record<string, unknown>;
    console.log('page', page.status, JSON.stringify(pageJ).slice(0, 220));
  }

  // debug_token si on a app id/secret
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (appId && appSecret) {
    const appToken = `${appId}|${appSecret}`;
    const dbg = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(appToken)}`,
    );
    const dbgJ = (await dbg.json()) as {
      data?: { is_valid?: boolean; expires_at?: number; data_access_expires_at?: number; error?: unknown };
      error?: { message?: string };
    };
    const d = dbgJ.data;
    console.log(
      'debug_token',
      dbg.status,
      d
        ? {
            is_valid: d.is_valid,
            expires_at: d.expires_at
              ? new Date(d.expires_at * 1000).toISOString()
              : d.expires_at,
            data_access_expires_at: d.data_access_expires_at
              ? new Date(d.data_access_expires_at * 1000).toISOString()
              : d.data_access_expires_at,
          }
        : dbgJ.error ?? dbgJ,
    );
  } else {
    console.log('debug_token skipped (META_APP_ID/SECRET absents)');
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env manquant');
  const admin = createClient(url, key);
  await checkKey(admin, 'acquisition_meta_connection');
  await checkKey(admin, 'meta_social_connection');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
