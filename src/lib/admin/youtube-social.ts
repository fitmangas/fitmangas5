import { createAdminClient } from '@/lib/supabase/admin';
import { absolutePublicUrl, type SocialPost } from '@/lib/admin/social-comms';
import { captionForPublish } from '@/lib/admin/social-cm-playbook';

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const YOUTUBE_UPLOAD = 'https://www.googleapis.com/upload/youtube/v3/videos';
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

export type YouTubeSocialConnection = {
  connected: boolean;
  channelId: string | null;
  channelTitle: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  scope: string | null;
  updatedAt: string | null;
};

export const YOUTUBE_SOCIAL_SETTING_KEY = 'youtube_social_connection';
export const EMPTY_YOUTUBE_CONNECTION: YouTubeSocialConnection = {
  connected: false,
  channelId: null,
  channelTitle: null,
  accessToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  scope: null,
  updatedAt: null,
};

const YT_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

export function youtubeAppConfigured() {
  return Boolean(
    (process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID)?.trim() &&
      (process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET)?.trim(),
  );
}

export function youtubeMissingConnectors(): string[] {
  const missing: string[] = [];
  if (!(process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID)?.trim()) {
    missing.push('YOUTUBE_CLIENT_ID');
  }
  if (!(process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET)?.trim()) {
    missing.push('YOUTUBE_CLIENT_SECRET');
  }
  return missing;
}

function youtubeClientId() {
  return (process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '').trim();
}

function youtubeClientSecret() {
  return (process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim();
}

function youtubeRedirectUri() {
  return `${(process.env.NEXT_PUBLIC_APP_URL || 'https://fitmangas.com').replace(/\/$/, '')}/api/admin/community/youtube/callback`;
}

export function buildYouTubeOAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: youtubeClientId(),
    redirect_uri: youtubeRedirectUri(),
    response_type: 'code',
    scope: YT_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

export function parseYouTubeConnection(raw: unknown): YouTubeSocialConnection {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_YOUTUBE_CONNECTION };
  const row = raw as Record<string, unknown>;
  return {
    connected: Boolean(row.connected && row.accessToken),
    channelId: typeof row.channelId === 'string' ? row.channelId : null,
    channelTitle: typeof row.channelTitle === 'string' ? row.channelTitle : null,
    accessToken: typeof row.accessToken === 'string' ? row.accessToken : null,
    refreshToken: typeof row.refreshToken === 'string' ? row.refreshToken : null,
    tokenExpiresAt: typeof row.tokenExpiresAt === 'string' ? row.tokenExpiresAt : null,
    scope: typeof row.scope === 'string' ? row.scope : null,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : null,
  };
}

async function fetchChannelInfo(accessToken: string): Promise<{ id: string | null; title: string | null }> {
  const res = await fetch(`${YOUTUBE_API}/channels?part=snippet&mine=true`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as {
    items?: Array<{ id?: string; snippet?: { title?: string } }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `YouTube channels HTTP ${res.status}`);
  }
  const item = data.items?.[0];
  return { id: item?.id || null, title: item?.snippet?.title || null };
}

export async function exchangeYouTubeCodeForConnection(code: string): Promise<YouTubeSocialConnection> {
  const body = new URLSearchParams({
    code,
    client_id: youtubeClientId(),
    client_secret: youtubeClientSecret(),
    redirect_uri: youtubeRedirectUri(),
    grant_type: 'authorization_code',
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Token YouTube manquant après OAuth.');
  }
  const channel = await fetchChannelInfo(data.access_token);
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600;
  return {
    connected: true,
    channelId: channel.id,
    channelTitle: channel.title,
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    scope: data.scope || YT_SCOPES,
    updatedAt: new Date().toISOString(),
  };
}

export async function refreshYouTubeConnection(
  connection: YouTubeSocialConnection,
): Promise<YouTubeSocialConnection> {
  if (!connection.refreshToken) {
    throw new Error('YouTube : refresh token absent — reconnecte OAuth.');
  }
  const body = new URLSearchParams({
    client_id: youtubeClientId(),
    client_secret: youtubeClientSecret(),
    refresh_token: connection.refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Refresh YouTube échoué.');
  }
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600;
  return {
    ...connection,
    connected: true,
    accessToken: data.access_token,
    tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    scope: data.scope || connection.scope,
    updatedAt: new Date().toISOString(),
  };
}

async function ensureFreshToken(
  connection: YouTubeSocialConnection,
  onRefreshed?: (next: YouTubeSocialConnection) => Promise<void>,
): Promise<YouTubeSocialConnection> {
  if (!connection.accessToken) throw new Error('YouTube non connecté.');
  const expiresAt = connection.tokenExpiresAt ? new Date(connection.tokenExpiresAt).getTime() : 0;
  if (expiresAt && expiresAt > Date.now() + 5 * 60_000) return connection;
  const next = await refreshYouTubeConnection(connection);
  if (onRefreshed) await onRefreshed(next);
  return next;
}

/**
 * Description Shorts orientée conversion (pas de DM YouTube).
 * Lien essai 7j en haut (visible avant « plus ») + légende + hashtags.
 */
export function youtubeShortsDescription(post: SocialPost): string {
  const trialUrl = `${(process.env.NEXT_PUBLIC_APP_URL || 'https://fitmangas.com').replace(/\/$/, '')}/?utm_source=youtube&utm_medium=shorts&utm_campaign=cm_mirror`;
  const caption = captionForPublish(post);
  const hook = (post.hookTitle || post.title || '').trim();
  const lines = [
    hook && hook !== caption.slice(0, hook.length) ? hook : null,
    'Essai gratuit 7 jours — cours collectifs en visio, je te vois et je te corrige.',
    `Démarre ici → ${trialUrl}`,
    '',
    caption,
    '',
    '#Shorts #FitMangas #Pilates #Barre #CoursEnLigne',
  ].filter((line): line is string => line !== null);
  return lines.join('\n').slice(0, 4900);
}

/** Publie un Reel FitMangas sur YouTube (Shorts si vertical). */
export async function publishYouTubeReel(
  connection: YouTubeSocialConnection,
  post: SocialPost,
  options?: { onTokenRefreshed?: (next: YouTubeSocialConnection) => Promise<void> },
): Promise<{ videoId: string; connection: YouTubeSocialConnection }> {
  if (post.format !== 'reel') {
    throw new Error('YouTube auto : réservé aux Reels (MP4).');
  }
  if (!post.editedVideoPath) {
    throw new Error('MP4 manquant : impossible de publier sur YouTube.');
  }

  let conn = await ensureFreshToken(connection, options?.onTokenRefreshed);
  const token = conn.accessToken!;
  const videoUrl = absolutePublicUrl(post.editedVideoPath);
  const sourceRes = await fetch(videoUrl);
  if (!sourceRes.ok) {
    throw new Error(`Impossible de télécharger le MP4 pour YouTube (HTTP ${sourceRes.status}).`);
  }
  const fileBuffer = Buffer.from(await sourceRes.arrayBuffer());
  if (fileBuffer.byteLength < 10_000) throw new Error('MP4 trop petit / invalide pour YouTube.');

  const title = (post.hookTitle || post.title || 'FitMangas').slice(0, 90);
  const description = youtubeShortsDescription(post);

  const metadata = {
    snippet: {
      title,
      description,
      categoryId: '26',
      tags: ['FitMangas', 'Pilates', 'Barre', 'Shorts'],
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false,
    },
  };

  const initRes = await fetch(
    `${YOUTUBE_UPLOAD}?uploadType=resumable&part=snippet,status`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(fileBuffer.byteLength),
        'X-Upload-Content-Type': 'video/mp4',
      },
      body: JSON.stringify(metadata),
    },
  );
  if (!initRes.ok) {
    const errText = await initRes.text().catch(() => '');
    throw new Error(`YouTube init upload échoué (HTTP ${initRes.status}) ${errText.slice(0, 200)}`);
  }
  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) throw new Error('YouTube : pas d’URL d’upload resumable.');

  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'video/mp4',
      'Content-Length': String(fileBuffer.byteLength),
    },
    body: fileBuffer,
  });
  const putData = (await put.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (!put.ok || !putData.id) {
    throw new Error(
      putData.error?.message || `YouTube upload échoué (HTTP ${put.status})`,
    );
  }

  return { videoId: putData.id, connection: conn };
}

export function youtubeConnectorStatusMessage(connection: YouTubeSocialConnection): string {
  const missing = youtubeMissingConnectors();
  if (missing.length) {
    return `Connecteurs YouTube manquants : ${missing.join(', ')} (Vercel + .env.local). Google Cloud → OAuth client Web + YouTube Data API v3 activée. Redirect : /api/admin/community/youtube/callback`;
  }
  if (!connection.connected) {
    return 'Clés YouTube présentes — connecte la chaîne via OAuth Google.';
  }
  return `YouTube connecté${connection.channelTitle ? ` (${connection.channelTitle})` : ''}.`;
}

export async function getYouTubeSocialConnection(): Promise<YouTubeSocialConnection> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_settings')
      .select('value')
      .eq('key', YOUTUBE_SOCIAL_SETTING_KEY)
      .maybeSingle();
    if (error || !data?.value) return { ...EMPTY_YOUTUBE_CONNECTION };
    return parseYouTubeConnection(JSON.parse(String(data.value)));
  } catch {
    return { ...EMPTY_YOUTUBE_CONNECTION };
  }
}

export async function saveYouTubeSocialConnection(connection: YouTubeSocialConnection): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from('admin_settings').upsert(
    {
      key: YOUTUBE_SOCIAL_SETTING_KEY,
      value: JSON.stringify({
        ...connection,
        connected: Boolean(connection.accessToken),
      }),
    },
    { onConflict: 'key' },
  );
  if (error) throw new Error(error.message);
}
