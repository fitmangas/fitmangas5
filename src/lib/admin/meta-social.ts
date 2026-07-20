import { absolutePublicUrl, type SocialPost } from '@/lib/admin/social-comms';
import type { MetaSocialConnection } from '@/lib/admin/social-comms';

const GRAPH = 'https://graph.facebook.com/v21.0';

async function graphJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = data.error as { message?: string } | undefined;
    throw new Error(err?.message || `Erreur Meta ${res.status}`);
  }
  return data;
}

export function metaAppConfigured() {
  return Boolean(process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim());
}

export function buildMetaOAuthUrl(state: string) {
  const appId = process.env.META_APP_ID?.trim();
  const redirect = `${(process.env.NEXT_PUBLIC_APP_URL || 'https://fitmangas.com').replace(/\/$/, '')}/api/admin/community/meta/callback`;
  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'instagram_basic',
    'instagram_content_publish',
    'business_management',
  ].join(',');
  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${encodeURIComponent(appId || '')}&redirect_uri=${encodeURIComponent(redirect)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopes)}&response_type=code`;
}

export async function exchangeMetaCodeForConnection(code: string): Promise<MetaSocialConnection> {
  const appId = process.env.META_APP_ID!.trim();
  const appSecret = process.env.META_APP_SECRET!.trim();
  const redirect = `${(process.env.NEXT_PUBLIC_APP_URL || 'https://fitmangas.com').replace(/\/$/, '')}/api/admin/community/meta/callback`;

  const tokenData = await graphJson(
    `${GRAPH}/oauth/access_token?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirect)}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`,
  );
  const shortToken = String(tokenData.access_token || '');
  if (!shortToken) throw new Error('Token Meta manquant.');

  const longData = await graphJson(
    `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(shortToken)}`,
  );
  const userToken = String(longData.access_token || shortToken);

  const pagesData = await graphJson(`${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(userToken)}`);
  const pages = Array.isArray(pagesData.data) ? (pagesData.data as Array<Record<string, unknown>>) : [];
  const page = pages[0];
  if (!page) throw new Error('Aucune Page Facebook trouvée sur ce compte.');

  const ig = page.instagram_business_account as { id?: string; username?: string } | undefined;
  const expiresIn = typeof longData.expires_in === 'number' ? longData.expires_in : null;

  return {
    connected: true,
    pageId: String(page.id),
    pageName: typeof page.name === 'string' ? page.name : null,
    igUserId: ig?.id ? String(ig.id) : null,
    igUsername: ig?.username ? String(ig.username) : null,
    accessToken: String(page.access_token || userToken),
    tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    updatedAt: new Date().toISOString(),
  };
}

function publicImageUrl(post: SocialPost) {
  if (!post.imagePath) throw new Error('Ce post n’a pas d’image à publier.');
  return absolutePublicUrl(post.imagePath);
}

function captionForPublish(post: SocialPost) {
  const hashtags = post.hashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' ');
  return [post.caption, post.cta, hashtags].filter(Boolean).join('\n\n');
}

/** Publie immédiatement sur Instagram (compte pro lié à la Page). */
export async function publishInstagramNow(connection: MetaSocialConnection, post: SocialPost) {
  if (!connection.accessToken || !connection.igUserId) {
    throw new Error('Instagram non connecté (IG User ID manquant).');
  }
  const imageUrl = publicImageUrl(post);
  const caption = captionForPublish(post);
  const create = await graphJson(
    `${GRAPH}/${connection.igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: connection.accessToken,
      }),
    },
  );
  const creationId = String(create.id || '');
  if (!creationId) throw new Error('Création média Instagram échouée.');

  // Instagram a besoin d’un court délai avant publish parfois
  await new Promise((r) => setTimeout(r, 2500));

  const published = await graphJson(`${GRAPH}/${connection.igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: connection.accessToken,
    }),
  });
  return String(published.id || creationId);
}

/** Publie ou programme un post Facebook Page. */
export async function publishFacebookPost(
  connection: MetaSocialConnection,
  post: SocialPost,
  options?: { schedule?: boolean },
) {
  if (!connection.accessToken || !connection.pageId) {
    throw new Error('Facebook Page non connectée.');
  }
  const message = captionForPublish(post);
  const body: Record<string, unknown> = {
    message,
    access_token: connection.accessToken,
  };

  if (post.imagePath) {
    body.url = publicImageUrl(post);
  }

  if (options?.schedule && post.plannedAt) {
    const ts = Math.floor(new Date(post.plannedAt).getTime() / 1000);
    const min = Math.floor(Date.now() / 1000) + 600;
    if (ts > min) {
      body.published = false;
      body.scheduled_publish_time = ts;
    }
  }

  const endpoint = post.imagePath
    ? `${GRAPH}/${connection.pageId}/photos`
    : `${GRAPH}/${connection.pageId}/feed`;

  const published = await graphJson(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return String(published.id || published.post_id || '');
}
