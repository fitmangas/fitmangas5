/**
 * Diagnostic ponctuel : app Meta + derniers Reels FB (sans logger le token).
 * Usage: npx tsx scripts/diagnose-meta-fb-visibility.ts
 */
import { createAdminClient } from '@/lib/supabase/admin';

async function main() {
  const admin = createAdminClient();
  const { data } = await admin.from('admin_settings').select('value').eq('key', 'meta_social_connection').maybeSingle();
  const conn = JSON.parse(String(data?.value || '{}')) as {
    accessToken?: string;
    pageId?: string;
    pageName?: string;
    igUserId?: string;
  };
  const token = conn.accessToken || '';
  const pageId = conn.pageId || '';
  if (!token) {
    console.log(JSON.stringify({ ok: false, error: 'no token' }));
    return;
  }

  async function g(path: string) {
    const url = path.startsWith('http')
      ? path
      : `https://graph.facebook.com/v21.0/${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    return (await res.json()) as Record<string, unknown>;
  }

  const debug = await g(`debug_token?input_token=${encodeURIComponent(token)}`);
  const debugData = (debug.data || {}) as Record<string, unknown>;
  const appId = debugData.app_id ? String(debugData.app_id) : null;

  let appName: string | null = null;
  let appError: string | null = null;
  if (appId) {
    const appInfo = await g(`${appId}?fields=id,name`);
    if (typeof appInfo.name === 'string') appName = appInfo.name;
    else {
      const err = appInfo.error as { message?: string } | undefined;
      appError = err?.message || 'lecture app impossible';
    }
  }

  const boardRes = await admin.from('admin_settings').select('value').eq('key', 'social_comms_board').maybeSingle();
  const board = JSON.parse(String(boardRes.data?.value || '{}')) as {
    posts?: Array<{
      id: string;
      title: string;
      format: string;
      facebookExternalId?: string | null;
      updatedAt?: string;
    }>;
  };
  const recent = (board.posts || [])
    .filter((p) => p.facebookExternalId && p.format === 'reel')
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .slice(0, 3);

  const checks = [];
  for (const p of recent) {
    const info = await g(
      `${p.facebookExternalId}?fields=id,published,privacy,from,permalink_url,status,timeline_visibility`,
    );
    const err = info.error as { message?: string } | undefined;
    checks.push({
      title: p.title,
      fbId: p.facebookExternalId,
      published: info.published,
      privacy: info.privacy,
      from: info.from,
      permalink: info.permalink_url,
      status: info.status,
      timeline_visibility: info.timeline_visibility,
      error: err?.message,
    });
  }

  const page = await g(`${pageId}?fields=id,name,is_published,fan_count,link`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        pageId,
        pageName: conn.pageName,
        igUserId: conn.igUserId,
        tokenValid: Boolean(debugData.is_valid),
        tokenType: debugData.type || null,
        appId,
        appName,
        appError,
        scopes: Array.isArray(debugData.scopes) ? (debugData.scopes as string[]).slice(0, 25) : null,
        page,
        recentReels: checks,
        hint:
          'Si « Publicado por FitMangas Community 2 » et seuls les admins voient le post : passer l’app Meta en mode Live (developers.facebook.com → App → App Review / Live).',
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
