/**
 * Probe Meta Ads readiness from existing tokens (no spend).
 * Usage: set -a && source .env.local && set +a && npx tsx scripts/probe-meta-ads.ts
 */
import { createClient } from '@supabase/supabase-js';

async function inspect(
  admin: ReturnType<typeof createClient>,
  key: string,
  appId: string,
  appSecret: string,
) {
  const { data } = await admin.from('admin_settings').select('value').eq('key', key).maybeSingle();
  if (!data?.value) {
    console.log(key, 'MISSING');
    return;
  }
  const c =
    typeof data.value === 'string'
      ? (JSON.parse(data.value) as Record<string, unknown>)
      : (data.value as Record<string, unknown>);
  const token = String(c.accessToken || '');
  console.log('\n===', key, '===');
  console.log('prefix', token.slice(0, 6), 'len', token.length, 'pageId', c.pageId);
  if (!token) return;

  const appToken = `${appId}|${appSecret}`;
  const dbg = await fetch(
    `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(appToken)}`,
  );
  const dbgJ = (await dbg.json()) as {
    data?: {
      is_valid?: boolean;
      scopes?: string[];
      granular_scopes?: Array<{ scope: string }>;
      type?: string;
      app_id?: string;
    };
    error?: { message: string };
  };
  if (dbgJ.error) console.log('debug_error', dbgJ.error.message);
  const scopes =
    dbgJ.data?.scopes ?? dbgJ.data?.granular_scopes?.map((g) => g.scope) ?? [];
  console.log('valid', dbgJ.data?.is_valid, 'type', dbgJ.data?.type, 'app', dbgJ.data?.app_id);
  console.log('scopes', scopes.join(', ') || '(none)');
  console.log('ads_read', scopes.includes('ads_read'));
  console.log('ads_management', scopes.includes('ads_management'));
  console.log('business_management', scopes.includes('business_management'));

  for (const path of ['/me/adaccounts', '/me/businesses']) {
    const r = await fetch(
      `https://graph.facebook.com/v21.0${path}?fields=id,name,account_id,account_status&limit=10&access_token=${encodeURIComponent(token)}`,
    );
    const j = await r.json();
    console.log(path, r.status, JSON.stringify(j).slice(0, 500));
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!url || !key) throw new Error('Supabase env manquant');
  if (!appId || !appSecret) throw new Error('META_APP_ID/SECRET manquant');
  const admin = createClient(url, key);
  await inspect(admin, 'meta_social_connection', appId, appSecret);
  await inspect(admin, 'acquisition_meta_connection', appId, appSecret);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
