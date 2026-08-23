import { absolutePublicUrl, facebookPermalinkUrl, type SocialPost } from '@/lib/admin/social-comms';
import type { MetaSocialConnection } from '@/lib/admin/social-comms';
import { captionForPublish } from '@/lib/admin/social-cm-playbook';
import { resolveMetaPublishImageUrls } from '@/lib/admin/social-publish-image';

export { captionForPublish } from '@/lib/admin/social-cm-playbook';

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

function resolveImagePaths(post: SocialPost): string[] {
  if (post.format === 'carousel') {
    const slides = (post.carouselPaths || []).map((p) => p.trim()).filter(Boolean);
    if (slides.length) return slides;
  }
  if (post.imagePath?.trim()) return [post.imagePath.trim()];
  return [];
}

/** Préfère post_id (permalink feed) à id (photo/vidéo seule). */
function metaFeedPublishId(data: Record<string, unknown>): string {
  if (data.post_id != null && String(data.post_id).trim()) return String(data.post_id);
  if (data.id != null && String(data.id).trim()) return String(data.id);
  return '';
}

/** Annule un post Facebook programmé (brouillon Meta visible admin seulement). */
export async function cancelFacebookScheduledPost(connection: MetaSocialConnection, externalId: string) {
  if (!connection.accessToken || !connection.pageId) {
    throw new Error('Facebook Page non connectée.');
  }
  const raw = externalId.trim();
  if (!raw) return false;
  const postId = raw.includes('_') ? raw : `${connection.pageId}_${raw}`;
  await graphJson(`${GRAPH}/${encodeURIComponent(postId)}?access_token=${encodeURIComponent(connection.accessToken)}`, {
    method: 'DELETE',
  });
  return true;
}

/** Infos publication Facebook pour diagnostic UI. */
export async function fetchFacebookPublishInfo(
  connection: MetaSocialConnection,
  externalId: string,
  format: SocialPost['format'] = 'feed',
): Promise<{ ok: true; isPublished: boolean; createdTime: string | null; permalink: string | null } | { ok: false; error: string }> {
  if (!connection.accessToken || !connection.pageId || !externalId.trim()) {
    return { ok: false, error: 'ID Facebook manquant.' };
  }
  const token = connection.accessToken;
  const pageId = connection.pageId;
  try {
    if (format === 'reel') {
      const data = await graphJson(
        `${GRAPH}/${encodeURIComponent(externalId.trim())}?fields=id,published,privacy,permalink_url,post_id,status&access_token=${encodeURIComponent(token)}`,
      );
      const status = data.status as
        | { publishing_phase?: { publish_status?: string; publish_time?: string } }
        | undefined;
      const publishTime = status?.publishing_phase?.publish_time ?? null;
      return {
        ok: true,
        isPublished: data.published === true,
        createdTime: publishTime,
        permalink: typeof data.permalink_url === 'string' ? data.permalink_url : facebookPermalinkUrl(externalId, 'reel'),
      };
    }
    const postId = externalId.includes('_') ? externalId.trim() : `${pageId}_${externalId.trim()}`;
    const data = await graphJson(
      `${GRAPH}/${encodeURIComponent(postId)}?fields=id,created_time,is_published,permalink_url,scheduled_publish_time&access_token=${encodeURIComponent(token)}`,
    );
    return {
      ok: true,
      isPublished: data.is_published !== false,
      createdTime: typeof data.created_time === 'string' ? data.created_time : null,
      permalink: typeof data.permalink_url === 'string' ? data.permalink_url : facebookPermalinkUrl(externalId, format),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Lecture Facebook impossible.' };
  }
}

/** Vérifie qu’un post Facebook est bien en ligne (pas seulement programmé / brouillon). */
export async function verifyFacebookPublishId(
  connection: MetaSocialConnection,
  externalId: string,
  format: SocialPost['format'] = 'feed',
): Promise<boolean> {
  if (!connection.accessToken || !externalId.trim()) return false;
  try {
    const info = await fetchFacebookPublishInfo(connection, externalId, format);
    return info.ok && info.isPublished;
  } catch {
    return false;
  }
}

/** True si le média requis pour un miroir Facebook est prêt (évite un post texte fantôme). */
export function facebookMirrorMediaReady(post: SocialPost): boolean {
  if (post.format === 'reel') return Boolean(post.editedVideoPath);
  if (post.format === 'text') return true;
  return resolveImagePaths(post).length > 0;
}

/** Publie immédiatement sur Instagram (compte pro lié à la Page). */
export async function publishInstagramNow(connection: MetaSocialConnection, post: SocialPost) {
  if (!connection.accessToken || !connection.igUserId) {
    throw new Error('Instagram non connecté (IG User ID manquant).');
  }
  const caption = captionForPublish(post);
  const token = connection.accessToken;

  // Reel vidéo (MP4 monté public) — URL Storage telle quelle, aucun ré-encodage FitMangas.
  // Meta peut recompresser côté IG ; on ne touche pas au fichier.
  if (post.format === 'reel' && post.editedVideoPath) {
    const videoUrl = absolutePublicUrl(post.editedVideoPath);
    const create = await graphJson(`${GRAPH}/${connection.igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: videoUrl,
        caption,
        share_to_feed: true,
        access_token: token,
      }),
    });
    const creationId = String(create.id || '');
    if (!creationId) throw new Error('Création Reel Instagram échouée.');

    let ready = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await new Promise((r) => setTimeout(r, 3000));
      const status = await graphJson(
        `${GRAPH}/${creationId}?fields=status_code&access_token=${encodeURIComponent(token)}`,
      );
      const code = String(status.status_code || '');
      if (code === 'FINISHED') {
        ready = true;
        break;
      }
      if (code === 'ERROR' || code === 'EXPIRED') {
        throw new Error(`Upload Reel Instagram en erreur (${code}). Vérifie que le MP4 est public et en 9:16.`);
      }
    }
    if (!ready) throw new Error('Timeout : le Reel Instagram n’est pas prêt (réessaie dans 1 min).');

    const published = await graphJson(`${GRAPH}/${connection.igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: token,
      }),
    });
    return String(published.id || creationId);
  }

  if (post.format === 'reel' && !post.editedVideoPath) {
    throw new Error('Importe d’abord le MP4 monté avant de publier ce Reel.');
  }

  const imagePaths = resolveImagePaths(post);
  if (!imagePaths.length) {
    throw new Error('Ce post n’a pas d’image à publier.');
  }
  const publishImageUrls = await resolveMetaPublishImageUrls(post);

  // Carousel IG : plusieurs enfants + conteneur CAROUSEL
  if (post.format === 'carousel' && publishImageUrls.length >= 2) {
    const childIds: string[] = [];
    for (const imageUrl of publishImageUrls.slice(0, 10)) {
      const child = await graphJson(`${GRAPH}/${connection.igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          is_carousel_item: true,
          access_token: token,
        }),
      });
      const childId = String(child.id || '');
      if (!childId) throw new Error('Création slide carousel Instagram échouée.');
      childIds.push(childId);
    }
    const container = await graphJson(`${GRAPH}/${connection.igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: childIds.join(','),
        caption,
        access_token: token,
      }),
    });
    const creationId = String(container.id || '');
    if (!creationId) throw new Error('Création carousel Instagram échouée.');
    await new Promise((r) => setTimeout(r, 3500));
    const published = await graphJson(`${GRAPH}/${connection.igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: token,
      }),
    });
    return String(published.id || creationId);
  }

  const imageUrl = publishImageUrls[0]!;
  const create = await graphJson(`${GRAPH}/${connection.igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: token,
    }),
  });
  const creationId = String(create.id || '');
  if (!creationId) throw new Error('Création média Instagram échouée.');

  await new Promise((r) => setTimeout(r, 2500));

  const published = await graphJson(`${GRAPH}/${connection.igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: token,
    }),
  });
  return String(published.id || creationId);
}

/** Publie un Reel Facebook via l’API officielle video_reels (pas /videos — crée des Reels fantômes). */
async function publishFacebookReel(
  connection: MetaSocialConnection,
  post: SocialPost,
  message: string,
  options?: { schedule?: boolean },
) {
  const token = connection.accessToken!;
  const pageId = connection.pageId!;
  if (!post.editedVideoPath) {
    throw new Error('MP4 manquant : impossible de publier le miroir Facebook Reel.');
  }
  const videoUrl = absolutePublicUrl(post.editedVideoPath);

  // 1) Start upload session
  const start = await graphJson(`${GRAPH}/${pageId}/video_reels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      upload_phase: 'start',
      access_token: token,
    }),
  });
  const videoId = String(start.video_id || '');
  const uploadUrl = String(start.upload_url || '');
  if (!videoId || !uploadUrl) {
    throw new Error('Facebook Reels : démarrage upload échoué (pas de video_id).');
  }

  // 2) Upload : binaire préféré (meilleure fidélité) — fallback file_url si trop lourd / échec
  const sourceRes = await fetch(videoUrl);
  if (!sourceRes.ok) {
    throw new Error(`Impossible de télécharger le MP4 source (HTTP ${sourceRes.status}).`);
  }
  const fileBuffer = Buffer.from(await sourceRes.arrayBuffer());
  const fileSize = fileBuffer.byteLength;
  if (fileSize < 10_000) {
    throw new Error('MP4 source trop petit / invalide pour Facebook Reels.');
  }

  let uploadData: Record<string, unknown> = {};
  let uploadOk = false;

  // Upload binaire (évite une 2e récupération Meta via file_url, souvent plus compressée)
  try {
    const binaryRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `OAuth ${token}`,
        offset: '0',
        file_size: String(fileSize),
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    });
    uploadData = (await binaryRes.json().catch(() => ({}))) as Record<string, unknown>;
    uploadOk = binaryRes.ok && uploadData.success !== false;
  } catch {
    uploadOk = false;
  }

  if (!uploadOk) {
    const urlRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `OAuth ${token}`,
        file_url: videoUrl,
      },
    });
    uploadData = (await urlRes.json().catch(() => ({}))) as Record<string, unknown>;
    if (!urlRes.ok || uploadData.success === false) {
      const err = uploadData.error as { message?: string } | undefined;
      throw new Error(err?.message || `Facebook Reels upload échoué (HTTP ${urlRes.status}).`);
    }
  }

  // Attendre fin d’upload (le finish déclenche ensuite le traitement public)
  let uploadReady = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await graphJson(
      `${GRAPH}/${videoId}?fields=status&access_token=${encodeURIComponent(token)}`,
    );
    const status = statusRes.status as
      | {
          video_status?: string;
          uploading_phase?: { status?: string; error?: { message?: string } };
          processing_phase?: { error?: { message?: string } };
        }
      | undefined;
    if (status?.uploading_phase?.error?.message) {
      throw new Error(`Facebook Reels upload : ${status.uploading_phase.error.message}`);
    }
    if (status?.processing_phase?.error?.message) {
      throw new Error(`Facebook Reels traitement : ${status.processing_phase.error.message}`);
    }
    if (status?.uploading_phase?.status === 'complete' || status?.video_status === 'ready') {
      uploadReady = true;
      break;
    }
    if (status?.video_status === 'error') {
      throw new Error('Facebook Reels : statut vidéo = error après upload.');
    }
  }
  if (!uploadReady && uploadData.success !== true) {
    throw new Error('Facebook Reels : timeout — upload non confirmé.');
  }

  // 3) Finish / publish
  const finishBody: Record<string, unknown> = {
    access_token: token,
    upload_phase: 'finish',
    video_id: videoId,
    description: message,
    title: (post.hookTitle || post.title || 'FitMangas').slice(0, 255),
  };

  if (options?.schedule && post.plannedAt) {
    const ts = Math.floor(new Date(post.plannedAt).getTime() / 1000);
    const min = Math.floor(Date.now() / 1000) + 600;
    if (ts > min) {
      finishBody.video_state = 'SCHEDULED';
      finishBody.scheduled_publish_time = ts;
    } else {
      finishBody.video_state = 'PUBLISHED';
    }
  } else {
    finishBody.video_state = 'PUBLISHED';
  }

  const finish = await graphJson(`${GRAPH}/${pageId}/video_reels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(finishBody),
  });
  if (finish.success === false) {
    throw new Error('Facebook Reels : finish a renvoyé success=false.');
  }
  // Stocker l’ID vidéo (permalink /reel/{video_id}/), pas seulement post_id.
  return String(videoId || finish.video_id || finish.post_id || '');
}

/** Upload photos non publiées puis un seul post feed multi-images (carousel FB). */
async function publishFacebookMultiPhotoPost(
  connection: MetaSocialConnection,
  message: string,
  imageUrls: string[],
  scheduleBody: Record<string, unknown> = {},
): Promise<string> {
  const token = connection.accessToken!;
  const pageId = connection.pageId!;
  const urls = imageUrls.map((u) => u.trim()).filter(Boolean).slice(0, 10);
  if (urls.length < 2) {
    throw new Error('Carousel Facebook : au moins 2 slides requises.');
  }

  const mediaFbIds: string[] = [];
  for (const imageUrl of urls) {
    const photo = await graphJson(`${GRAPH}/${pageId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: token,
        url: imageUrl,
        published: false,
        no_story: true,
        temporary: true,
      }),
    });
    const mediaId = String(photo.id || '');
    if (!mediaId) throw new Error('Upload slide carousel Facebook échoué.');
    mediaFbIds.push(mediaId);
    // Meta peut rejeter attached_media si les photos ne sont pas encore indexées.
    await new Promise((r) => setTimeout(r, 800));
  }

  const published = await graphJson(`${GRAPH}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: token,
      message,
      attached_media: mediaFbIds.map((id) => ({ media_fbid: id })),
      ...scheduleBody,
    }),
  });
  const publishId = metaFeedPublishId(published);
  if (!publishId) throw new Error('Facebook n’a pas renvoyé d’ID pour le carousel.');
  return publishId;
}

/** Publie ou programme un post Facebook Page (image, carousel, vidéo publique, ou texte). */
export async function publishFacebookPost(
  connection: MetaSocialConnection,
  post: SocialPost,
  options?: { schedule?: boolean },
) {
  if (!connection.accessToken || !connection.pageId) {
    throw new Error('Facebook Page non connectée.');
  }
  if (connection.pageId && connection.igUserId && connection.pageId === connection.igUserId) {
    throw new Error(
      'Page Facebook ID = Instagram User ID (config invalide). Régénère le token Meta et sépare Page ID ≠ IG User ID.',
    );
  }

  const message = captionForPublish(post);
  const token = connection.accessToken;
  const scheduleBody: Record<string, unknown> = {};

  if (options?.schedule && post.plannedAt) {
    const ts = Math.floor(new Date(post.plannedAt).getTime() / 1000);
    const min = Math.floor(Date.now() / 1000) + 600;
    if (ts > min) {
      scheduleBody.published = false;
      scheduleBody.scheduled_publish_time = ts;
    }
  }

  // Reel → API officielle video_reels (l’ancien POST /videos créait des Reels fantômes invisibles)
  if (post.format === 'reel') {
    return publishFacebookReel(connection, post, message, options);
  }

  const imagePaths = resolveImagePaths(post);
  const publishImageUrls =
    post.format === 'text' || imagePaths.length === 0 ? [] : await resolveMetaPublishImageUrls(post);

  // Carousel / multi-images → un seul post feed avec toutes les slides
  if (post.format === 'carousel' || publishImageUrls.length >= 2) {
    if (publishImageUrls.length < 2) {
      throw new Error(
        `Carousel Facebook : ${publishImageUrls.length} slide(s) composée(s) — minimum 2. Vérifie les images avant publication.`,
      );
    }
    return publishFacebookMultiPhotoPost(connection, message, publishImageUrls, scheduleBody);
  }

  if (post.format !== 'text' && imagePaths.length === 0) {
    throw new Error('Visuel manquant : impossible de publier ce post sur Facebook (évite un post texte fantôme).');
  }

  if (publishImageUrls.length === 1) {
    const published = await graphJson(`${GRAPH}/${connection.pageId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: token,
        ...scheduleBody,
        url: publishImageUrls[0]!,
        caption: message,
      }),
    });
    const publishId = metaFeedPublishId(published);
    if (!publishId) throw new Error('Facebook n’a pas renvoyé d’ID de publication.');
    return publishId;
  }

  const published = await graphJson(`${GRAPH}/${connection.pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: token,
      ...scheduleBody,
      message,
    }),
  });
  const publishId = metaFeedPublishId(published);
  if (!publishId) throw new Error('Facebook n’a pas renvoyé d’ID de publication.');
  return publishId;
}
