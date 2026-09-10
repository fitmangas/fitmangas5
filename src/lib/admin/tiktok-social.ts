import { createAdminClient } from '@/lib/supabase/admin';
import { absolutePublicUrl, type SocialPost } from '@/lib/admin/social-comms';
import { captionForPublish } from '@/lib/admin/social-cm-playbook';

const TIKTOK_AUTH = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_API = 'https://open.tiktokapis.com';

export type TikTokSocialConnection = {
  connected: boolean;
  openId: string | null;
  displayName: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  refreshExpiresAt: string | null;
  scope: string | null;
  updatedAt: string | null;
};

export const TIKTOK_SOCIAL_SETTING_KEY = 'tiktok_social_connection';
export const EMPTY_TIKTOK_CONNECTION: TikTokSocialConnection = {
  connected: false,
  openId: null,
  displayName: null,
  accessToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  refreshExpiresAt: null,
  scope: null,
  updatedAt: null,
};

export function tiktokAppConfigured() {
  return Boolean(process.env.TIKTOK_CLIENT_KEY?.trim() && process.env.TIKTOK_CLIENT_SECRET?.trim());
}

export function tiktokMissingConnectors(): string[] {
  const missing: string[] = [];
  if (!process.env.TIKTOK_CLIENT_KEY?.trim()) missing.push('TIKTOK_CLIENT_KEY');
  if (!process.env.TIKTOK_CLIENT_SECRET?.trim()) missing.push('TIKTOK_CLIENT_SECRET');
  return missing;
}

function tiktokRedirectUri() {
  return `${(process.env.NEXT_PUBLIC_APP_URL || 'https://fitmangas.com').replace(/\/$/, '')}/api/admin/community/tiktok/callback`;
}

export function buildTikTokOAuthUrl(state: string) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim() || '';
  const scopes = ['user.info.basic', 'video.upload', 'video.publish'].join(',');
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: scopes,
    response_type: 'code',
    redirect_uri: tiktokRedirectUri(),
    state,
  });
  return `${TIKTOK_AUTH}?${params.toString()}`;
}

async function tiktokJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = data.error as { message?: string; code?: string } | undefined;
    const nested = data.error as string | undefined;
    throw new Error(
      (typeof err === 'object' && err?.message) ||
        (typeof nested === 'string' ? nested : null) ||
        `Erreur TikTok HTTP ${res.status}`,
    );
  }
  const topError = data.error as { code?: string; message?: string } | undefined;
  if (topError && typeof topError === 'object' && topError.code && topError.code !== 'ok') {
    throw new Error(topError.message || `TikTok error ${topError.code}`);
  }
  return data;
}

export function parseTikTokConnection(raw: unknown): TikTokSocialConnection {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_TIKTOK_CONNECTION };
  const row = raw as Record<string, unknown>;
  return {
    connected: Boolean(row.connected && row.accessToken),
    openId: typeof row.openId === 'string' ? row.openId : null,
    displayName: typeof row.displayName === 'string' ? row.displayName : null,
    accessToken: typeof row.accessToken === 'string' ? row.accessToken : null,
    refreshToken: typeof row.refreshToken === 'string' ? row.refreshToken : null,
    tokenExpiresAt: typeof row.tokenExpiresAt === 'string' ? row.tokenExpiresAt : null,
    refreshExpiresAt: typeof row.refreshExpiresAt === 'string' ? row.refreshExpiresAt : null,
    scope: typeof row.scope === 'string' ? row.scope : null,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : null,
  };
}

export async function exchangeTikTokCodeForConnection(code: string): Promise<TikTokSocialConnection> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY!.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!.trim();
  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: tiktokRedirectUri(),
  });
  const data = await tiktokJson(`${TIKTOK_API}/v2/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const accessToken = String(data.access_token || '');
  const refreshToken = String(data.refresh_token || '');
  if (!accessToken) throw new Error('Token TikTok manquant après OAuth.');
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 86400;
  const refreshExpiresIn =
    typeof data.refresh_expires_in === 'number' ? data.refresh_expires_in : 365 * 86400;

  let displayName: string | null = null;
  try {
    const me = await tiktokJson(`${TIKTOK_API}/v2/user/info/?fields=display_name,open_id`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = (me.data as { user?: { display_name?: string } } | undefined)?.user;
    displayName = user?.display_name ? String(user.display_name) : null;
  } catch {
    displayName = null;
  }

  return {
    connected: true,
    openId: typeof data.open_id === 'string' ? data.open_id : null,
    displayName,
    accessToken,
    refreshToken: refreshToken || null,
    tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    refreshExpiresAt: new Date(Date.now() + refreshExpiresIn * 1000).toISOString(),
    scope: typeof data.scope === 'string' ? data.scope : null,
    updatedAt: new Date().toISOString(),
  };
}

export async function refreshTikTokConnection(
  connection: TikTokSocialConnection,
): Promise<TikTokSocialConnection> {
  if (!connection.refreshToken) return connection;
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
  if (!clientKey || !clientSecret) return connection;

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: connection.refreshToken,
  });
  const data = await tiktokJson(`${TIKTOK_API}/v2/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const accessToken = String(data.access_token || '');
  if (!accessToken) throw new Error('Refresh TikTok échoué (pas de access_token).');
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 86400;
  const refreshExpiresIn =
    typeof data.refresh_expires_in === 'number' ? data.refresh_expires_in : 365 * 86400;
  return {
    ...connection,
    connected: true,
    accessToken,
    refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : connection.refreshToken,
    tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    refreshExpiresAt: new Date(Date.now() + refreshExpiresIn * 1000).toISOString(),
    openId: typeof data.open_id === 'string' ? data.open_id : connection.openId,
    scope: typeof data.scope === 'string' ? data.scope : connection.scope,
    updatedAt: new Date().toISOString(),
  };
}

async function ensureFreshToken(
  connection: TikTokSocialConnection,
  onRefreshed?: (next: TikTokSocialConnection) => Promise<void>,
): Promise<TikTokSocialConnection> {
  if (!connection.accessToken) throw new Error('TikTok non connecté.');
  const expiresAt = connection.tokenExpiresAt ? new Date(connection.tokenExpiresAt).getTime() : 0;
  if (expiresAt && expiresAt > Date.now() + 5 * 60_000) return connection;
  const next = await refreshTikTokConnection(connection);
  if (onRefreshed) await onRefreshed(next);
  return next;
}

/** Publie un Reel FitMangas sur TikTok (Direct Post, FILE_UPLOAD). */
export async function publishTikTokReel(
  connection: TikTokSocialConnection,
  post: SocialPost,
  options?: { onTokenRefreshed?: (next: TikTokSocialConnection) => Promise<void> },
): Promise<{ publishId: string; connection: TikTokSocialConnection }> {
  if (post.format !== 'reel') {
    throw new Error('TikTok auto : réservé aux Reels (MP4). Carousel/feed restent IG+FB.');
  }
  if (!post.editedVideoPath) {
    throw new Error('MP4 manquant : impossible de publier sur TikTok.');
  }

  let conn = await ensureFreshToken(connection, options?.onTokenRefreshed);
  const token = conn.accessToken!;
  const videoUrl = absolutePublicUrl(post.editedVideoPath);
  const sourceRes = await fetch(videoUrl);
  if (!sourceRes.ok) {
    throw new Error(`Impossible de télécharger le MP4 pour TikTok (HTTP ${sourceRes.status}).`);
  }
  const fileBuffer = Buffer.from(await sourceRes.arrayBuffer());
  const videoSize = fileBuffer.byteLength;
  if (videoSize < 10_000) throw new Error('MP4 trop petit / invalide pour TikTok.');

  const chunkSize = Math.min(10_000_000, videoSize);
  const totalChunkCount = Math.max(1, Math.ceil(videoSize / chunkSize));
  const title = captionForPublish(post).slice(0, 2200);

  const creator = await tiktokJson(`${TIKTOK_API}/v2/post/publish/creator_info/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: '{}',
  });
  const creatorData = (creator.data || {}) as {
    privacy_level_options?: string[];
  };
  const privacyOptions = Array.isArray(creatorData.privacy_level_options)
    ? creatorData.privacy_level_options
    : [];
  const privacyLevel =
    privacyOptions.find((p) => p === 'PUBLIC_TO_EVERYONE') ||
    privacyOptions[0] ||
    'SELF_ONLY';

  const init = await tiktokJson(`${TIKTOK_API}/v2/post/publish/video/init/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title,
        privacy_level: privacyLevel,
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: chunkSize,
        total_chunk_count: totalChunkCount,
      },
    }),
  });

  const initData = (init.data || {}) as { publish_id?: string; upload_url?: string };
  const publishId = String(initData.publish_id || '');
  const uploadUrl = String(initData.upload_url || '');
  if (!publishId || !uploadUrl) {
    throw new Error('TikTok init échoué (pas de publish_id / upload_url).');
  }

  for (let i = 0; i < totalChunkCount; i += 1) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, videoSize);
    const chunk = fileBuffer.subarray(start, end);
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(chunk.byteLength),
        'Content-Range': `bytes ${start}-${end - 1}/${videoSize}`,
      },
      body: chunk,
    });
    if (!put.ok) {
      const text = await put.text().catch(() => '');
      throw new Error(`TikTok upload chunk ${i + 1}/${totalChunkCount} échoué (HTTP ${put.status}) ${text.slice(0, 160)}`);
    }
  }

  let status = 'PROCESSING_UPLOAD';
  for (let attempt = 0; attempt < 45; attempt += 1) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await tiktokJson(`${TIKTOK_API}/v2/post/publish/status/fetch/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ publish_id: publishId }),
    });
    const st = (statusRes.data || {}) as { status?: string; fail_reason?: string };
    status = String(st.status || '');
    if (status === 'PUBLISH_COMPLETE') break;
    if (status === 'FAILED') {
      throw new Error(`TikTok publication échouée : ${st.fail_reason || 'FAILED'}`);
    }
  }
  if (status !== 'PUBLISH_COMPLETE') {
    throw new Error(`TikTok : timeout (dernier statut ${status || 'inconnu'}).`);
  }

  return { publishId, connection: conn };
}

export function tiktokConnectorStatusMessage(connection: TikTokSocialConnection): string {
  const missing = tiktokMissingConnectors();
  if (missing.length) {
    return `Connecteurs TikTok manquants : ${missing.join(', ')} (Vercel + .env.local). Puis app developers.tiktok.com → Content Posting API + scopes video.upload / video.publish (audit TikTok requis pour le public).`;
  }
  if (!connection.connected) {
    return 'Clés TikTok présentes — connecte le compte @FitMangas via OAuth TikTok.';
  }
  return `TikTok connecté${connection.displayName ? ` (${connection.displayName})` : ''}.`;
}

export async function getTikTokSocialConnection(): Promise<TikTokSocialConnection> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_settings')
      .select('value')
      .eq('key', TIKTOK_SOCIAL_SETTING_KEY)
      .maybeSingle();
    if (error || !data?.value) return { ...EMPTY_TIKTOK_CONNECTION };
    return parseTikTokConnection(JSON.parse(String(data.value)));
  } catch {
    return { ...EMPTY_TIKTOK_CONNECTION };
  }
}

export async function saveTikTokSocialConnection(connection: TikTokSocialConnection): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from('admin_settings').upsert(
    {
      key: TIKTOK_SOCIAL_SETTING_KEY,
      value: JSON.stringify({
        ...connection,
        connected: Boolean(connection.accessToken),
      }),
    },
    { onConflict: 'key' },
  );
  if (error) throw new Error(error.message);
}
