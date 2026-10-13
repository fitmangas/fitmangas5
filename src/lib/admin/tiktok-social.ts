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

export function tiktokHasDirectPostScope(connection: TikTokSocialConnection): boolean {
  const scope = (connection.scope || '').toLowerCase();
  return scope.split(/[,\s]+/).includes('video.publish');
}

export function buildTikTokOAuthUrl(state: string) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim() || '';
  // video.publish = Direct Post public. Ne le demander que si le scope est ouvert sur l’app TikTok
  // (sinon OAuth peut échouer). Voir docs/TIKTOK_APP_REVIEW.md.
  const requestPublish =
    process.env.TIKTOK_REQUEST_VIDEO_PUBLISH?.trim() === '1' ||
    process.env.TIKTOK_REQUEST_VIDEO_PUBLISH?.trim()?.toLowerCase() === 'true';
  const scopes = [
    'user.info.basic',
    'video.upload',
    ...(requestPublish ? (['video.publish'] as const) : []),
  ].join(',');
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
  options?: {
    onTokenRefreshed?: (next: TikTokSocialConnection) => Promise<void>;
    /** Poll status (2 s chacun). Cron : ~12 (24 s). Manuel : 45. */
    maxPollAttempts?: number;
    /**
     * Si true (défaut cron) : après upload OK, un statut PROCESSING_* suffit —
     * TikTok finit en async. Évite de tuer le cron Meta/YouTube.
     */
    acceptProcessingAsSuccess?: boolean;
  },
): Promise<{
  publishId: string;
  connection: TikTokSocialConnection;
  status: string;
  privacyLevel: string;
}> {
  if (post.format !== 'reel') {
    throw new Error('TikTok auto : réservé aux Reels (MP4). Carousel/feed restent IG+FB.');
  }
  if (!post.editedVideoPath) {
    throw new Error('MP4 manquant : impossible de publier sur TikTok.');
  }
  if (!tiktokHasDirectPostScope(connection)) {
    throw new Error(
      `TikTok sans scope video.publish — reconnecte OAuth (Direct Post). ${tiktokConnectorStatusMessage(connection)}`,
    );
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

  // TikTok FILE_UPLOAD : chunks (sauf le dernier) ≥ 5 MiB, chunk ≤ 64 MiB.
  // Sous 64 MiB → 1 seul chunk (évite « total chunk count is invalid »).
  const MIN_CHUNK = 5 * 1024 * 1024;
  const MAX_CHUNK = 64 * 1024 * 1024;
  const PREFERRED_CHUNK = 10 * 1024 * 1024;
  let chunkSize: number;
  let totalChunkCount: number;
  if (videoSize <= MAX_CHUNK) {
    chunkSize = videoSize;
    totalChunkCount = 1;
  } else {
    chunkSize = PREFERRED_CHUNK;
    totalChunkCount = Math.ceil(videoSize / chunkSize);
    // Garantir que tous les chunks pleins font ≥ 5 MiB
    if (chunkSize < MIN_CHUNK) {
      chunkSize = MIN_CHUNK;
      totalChunkCount = Math.ceil(videoSize / chunkSize);
    }
  }
  const title = captionForPublish(post).slice(0, 2200);
  const maxPollAttempts = Math.max(1, options?.maxPollAttempts ?? 45);
  const acceptProcessingAsSuccess = options?.acceptProcessingAsSuccess !== false;

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
  const preferredOrder = [
    'PUBLIC_TO_EVERYONE',
    'MUTUAL_FOLLOW_FRIENDS',
    'FOLLOWER_OF_CREATOR',
    'SELF_ONLY',
  ];
  const privacyCandidates = [
    ...preferredOrder.filter((p) => privacyOptions.includes(p)),
    ...privacyOptions.filter((p) => !preferredOrder.includes(p)),
    ...(privacyOptions.length ? [] : (['SELF_ONLY'] as const)),
  ];

  const sourceInfo = {
    source: 'FILE_UPLOAD' as const,
    video_size: videoSize,
    chunk_size: chunkSize,
    total_chunk_count: totalChunkCount,
  };

  let publishId = '';
  let uploadUrl = '';
  let privacyLevel = privacyCandidates[0] || 'SELF_ONLY';
  let lastInitError: Error | null = null;

  for (const candidate of privacyCandidates) {
    try {
      const init = await tiktokJson(`${TIKTOK_API}/v2/post/publish/video/init/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          post_info: {
            title,
            privacy_level: candidate,
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            // Content Posting API : pas d’image cover custom — frame à 1 s.
            video_cover_timestamp_ms: 1000,
          },
          source_info: sourceInfo,
        }),
      });
      const initData = (init.data || {}) as { publish_id?: string; upload_url?: string };
      publishId = String(initData.publish_id || '');
      uploadUrl = String(initData.upload_url || '');
      if (publishId && uploadUrl) {
        privacyLevel = candidate;
        lastInitError = null;
        break;
      }
      lastInitError = new Error('TikTok init échoué (pas de publish_id / upload_url).');
    } catch (e) {
      lastInitError = e instanceof Error ? e : new Error('TikTok init échoué');
      const msg = lastInitError.message.toLowerCase();
      // Guidelines / audit : retenter un niveau plus restreint (SELF_ONLY = inbox créateur).
      if (
        msg.includes('guideline') ||
        msg.includes('unaudited') ||
        msg.includes('privacy_level') ||
        msg.includes('not authorized')
      ) {
        continue;
      }
      throw lastInitError;
    }
  }

  // Filet : sans audit Content Posting, Direct Post est souvent refusé → Inbox (brouillon créateur).
  if (!publishId || !uploadUrl) {
    try {
      const inboxInit = await tiktokJson(`${TIKTOK_API}/v2/post/publish/inbox/video/init/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({ source_info: sourceInfo }),
      });
      const inboxData = (inboxInit.data || {}) as { publish_id?: string; upload_url?: string };
      publishId = String(inboxData.publish_id || '');
      uploadUrl = String(inboxData.upload_url || '');
      privacyLevel = 'INBOX';
      if (!publishId || !uploadUrl) {
        throw new Error('TikTok inbox init échoué (pas de publish_id / upload_url).');
      }
    } catch (inboxError) {
      const inboxMsg = inboxError instanceof Error ? inboxError.message : 'inbox échoué';
      throw new Error(
        `TikTok Direct Post refusé (${lastInitError?.message || 'guidelines'}). Inbox aussi : ${inboxMsg}. Lancer l’audit Content Posting : https://developers.tiktok.com/doc/content-sharing-guidelines/`,
      );
    }
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
  for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
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
    if (
      acceptProcessingAsSuccess &&
      (status === 'PROCESSING_UPLOAD' ||
        status === 'PROCESSING_DOWNLOAD' ||
        status === 'SEND_TO_USER_INBOX') &&
      attempt >= Math.min(2, maxPollAttempts - 1)
    ) {
      // Upload accepté côté TikTok — le cron ne doit pas attendre 90 s.
      break;
    }
  }
  if (status === 'FAILED') {
    throw new Error('TikTok publication échouée.');
  }
  if (status !== 'PUBLISH_COMPLETE' && !acceptProcessingAsSuccess) {
    throw new Error(`TikTok : timeout (dernier statut ${status || 'inconnu'}).`);
  }
  if (
    status !== 'PUBLISH_COMPLETE' &&
    status !== 'PROCESSING_UPLOAD' &&
    status !== 'PROCESSING_DOWNLOAD' &&
    status !== 'SEND_TO_USER_INBOX'
  ) {
    throw new Error(`TikTok : statut inattendu ${status || 'inconnu'}.`);
  }

  return { publishId, connection: conn, status, privacyLevel };
}

export function tiktokConnectorStatusMessage(connection: TikTokSocialConnection): string {
  const missing = tiktokMissingConnectors();
  if (missing.length) {
    return `Connecteurs TikTok manquants : ${missing.join(', ')} (Vercel + .env.local). Puis app developers.tiktok.com → Content Posting API + scopes video.upload / video.publish (audit TikTok requis pour le public). Voir docs/TIKTOK_APP_REVIEW.md.`;
  }
  if (!connection.connected) {
    return 'Clés TikTok présentes — App Live OK. Connecte @fit.mangas via OAuth (scopes video.upload + video.publish). docs/TIKTOK_APP_REVIEW.md';
  }
  const name = connection.displayName ? ` (${connection.displayName})` : '';
  if (!tiktokHasDirectPostScope(connection)) {
    return `TikTok connecté${name} — scope video.publish absent : déconnecte puis reconnecte TikTok dans le CM (ancien token = upload seul). docs/TIKTOK_APP_REVIEW.md`;
  }
  return `TikTok connecté${name} — scopes OK. Public Direct Post si audit Content Posting passé ; sinon filet Inbox auto.`;
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
