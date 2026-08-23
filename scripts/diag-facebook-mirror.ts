/**
 * Diagnostic miroir Facebook — sans secrets en clair.
 * Usage: npx tsx scripts/diag-facebook-mirror.ts
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { absolutePublicUrl, parseSocialCommsBoard } from '../src/lib/admin/social-comms';

function loadEnvLocal() {
  const raw = readFileSync('.env.local', 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvLocal();

const GRAPH = 'https://graph.facebook.com/v21.0';

async function graph(path: string, token: string, init?: RequestInit) {
  const sep = path.includes('?') ? '&' : '?';
  const url = path.startsWith('http') ? path : `${GRAPH}${path}${sep}access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, init);
  const data = (await res.json()) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env manquante');

  const admin = createClient(url, key);
  const { data: metaRow, error: metaErr } = await admin
    .from('admin_settings')
    .select('value')
    .eq('key', 'meta_social_connection')
    .maybeSingle();
  if (metaErr) throw metaErr;

  const meta = metaRow?.value ? (JSON.parse(String(metaRow.value)) as Record<string, unknown>) : {};
  const pageId = String(meta.pageId || '');
  const igUserId = String(meta.igUserId || '');
  const token = String(meta.accessToken || '');
  const pageName = String(meta.pageName || '');
  const igUsername = String(meta.igUsername || '');
  const expires = meta.tokenExpiresAt ? String(meta.tokenExpiresAt) : null;

  console.log('=== META CONNECTION ===');
  console.log({
    connected: Boolean(token && pageId),
    pageId,
    pageName,
    igUserId,
    igUsername,
    pageIdEqualsIgUserId: Boolean(pageId && igUserId && pageId === igUserId),
    tokenPresent: Boolean(token),
    tokenPrefix: token ? `${token.slice(0, 8)}…` : null,
    tokenExpiresAt: expires,
    tokenExpired: expires ? new Date(expires).getTime() < Date.now() : null,
  });

  if (token && pageId) {
    const me = await graph(`/${pageId}?fields=id,name,fan_count`, token);
    console.log('=== PAGE LOOKUP ===', { ok: me.ok, status: me.status, data: me.data });
    const feed = await graph(`/${pageId}/feed?fields=id,message,created_time,permalink_url&limit=5`, token);
    console.log(
      '=== PAGE FEED (5) ===',
      feed.ok
        ? {
            ok: true,
            items: Array.isArray((feed.data as { data?: unknown }).data)
              ? ((feed.data as { data: Array<Record<string, unknown>> }).data || []).map((p) => ({
                  id: p.id,
                  created_time: p.created_time,
                  permalink_url: p.permalink_url,
                  messagePreview: String(p.message || '').slice(0, 80),
                }))
              : [],
          }
        : feed,
    );
    const videos = await graph(
      `/${pageId}/videos?fields=id,title,description,created_time,permalink_url&limit=5`,
      token,
    );
    console.log(
      '=== PAGE VIDEOS (5) ===',
      videos.ok
        ? {
            ok: true,
            items: Array.isArray((videos.data as { data?: unknown }).data)
              ? ((videos.data as { data: Array<Record<string, unknown>> }).data || []).map((p) => ({
                  id: p.id,
                  title: p.title,
                  created_time: p.created_time,
                  permalink_url: p.permalink_url,
                  descriptionPreview: String(p.description || '').slice(0, 80),
                }))
              : [],
          }
        : videos,
    );
  }

  const { data: boardRow, error: boardErr } = await admin
    .from('admin_settings')
    .select('value')
    .eq('key', 'social_comms_board')
    .maybeSingle();
  if (boardErr) throw boardErr;
  const board = parseSocialCommsBoard(JSON.parse(String(boardRow?.value || '{}')));
  const published = board.posts.filter(
    (p) => p.network === 'instagram' && p.alsoPublishFacebook && (p.status === 'published' || p.status === 'scheduled'),
  );

  console.log('=== POSTS IG+FB ===');
  for (const p of published) {
    const videoUrl = p.editedVideoPath ? absolutePublicUrl(p.editedVideoPath) : null;
    let videoHead: { status?: number; contentType?: string | null; ok?: boolean; error?: string } = {};
    if (videoUrl) {
      try {
        const res = await fetch(videoUrl, { method: 'HEAD' });
        videoHead = { ok: res.ok, status: res.status, contentType: res.headers.get('content-type') };
      } catch (e) {
        videoHead = { error: e instanceof Error ? e.message : 'head failed' };
      }
    }

    let fbLookup: unknown = null;
    if (token && p.facebookExternalId) {
      fbLookup = await graph(
        `/${p.facebookExternalId}?fields=id,message,description,created_time,permalink_url`,
        token,
      );
    }

    console.log({
      id: p.id,
      status: p.status,
      format: p.format,
      titlePreview: (p.hookTitle || p.title || '').slice(0, 60),
      metaExternalId: p.metaExternalId,
      facebookExternalId: p.facebookExternalId,
      editedVideoPath: p.editedVideoPath,
      videoUrl,
      videoHead,
      fbLookup,
    });
  }

  const liveTry = process.argv.includes('--try-publish');
  const target = published.find((p) => p.status === 'published' && p.format === 'reel' && p.editedVideoPath);
  if (liveTry && target && token && pageId) {
    const videoUrl = absolutePublicUrl(target.editedVideoPath!);
    console.log('=== TRY FB VIDEO PUBLISH (live attempt) ===', { postId: target.id, videoUrl });
    const attempt = await fetch(`${GRAPH}/${pageId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: token,
        file_url: videoUrl,
        description: 'FitMangas diagnostic mirror test — ignore/delete',
        title: 'FitMangas diag',
      }),
    });
    const attemptData = await attempt.json();
    console.log('=== TRY RESULT ===', { http: attempt.status, body: attemptData });
  } else if (!liveTry) {
    console.log('=== (passe --try-publish pour tenter un upload FB réel) ===');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
