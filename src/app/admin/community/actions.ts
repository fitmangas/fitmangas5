'use server';

import { GoogleGenAI } from '@google/genai';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import {
  buildMetaOAuthUrl,
  exchangeMetaCodeForConnection,
  metaAppConfigured,
  publishFacebookPost,
  publishInstagramNow,
} from '@/lib/admin/meta-social';
import {
  createSocialPostId,
  emptyMetaConnection,
  getMetaSocialConnection,
  getSocialCommsBoard,
  pickLibraryImage,
  saveMetaSocialConnection,
  saveSocialCommsBoard,
  SOCIAL_LIBRARY_IMAGES,
  type MetaSocialConnection,
  type SocialCommsBoard,
  type SocialNetwork,
  type SocialPost,
  type SocialPostFormat,
  type SocialPostStatus,
} from '@/lib/admin/social-comms';
import { SEO_PILLAR_PAGES } from '@/lib/seo-pillar-pages';
import { createAdminClient } from '@/lib/supabase/admin';

function revalidateCommunity() {
  revalidatePath('/admin/community');
  revalidatePath('/admin');
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('JSON introuvable');
  }
}

async function loadGenerationContext() {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const [{ data: articles }, { data: courses }] = await Promise.all([
    admin
      .from('blog_articles')
      .select('title_fr, slug_fr, description_fr, seo_keywords')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(8),
    admin
      .from('courses')
      .select('title, starts_at, course_language')
      .eq('is_published', true)
      .gte('ends_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(5),
  ]);

  return {
    articles: (articles ?? []).map((row) => ({
      title: row.title_fr,
      slug: row.slug_fr,
      description: row.description_fr,
      keywords: row.seo_keywords,
      url: `https://fitmangas.com/blog/${row.slug_fr}`,
    })),
    courses: (courses ?? []).map((row) => ({
      title: row.title,
      startsAt: row.starts_at,
      language: row.course_language,
    })),
    pillars: SEO_PILLAR_PAGES.map((page) => ({
      title: page.shortTitle,
      url: `https://fitmangas.com/${page.slug}`,
      description: page.description,
    })),
    images: SOCIAL_LIBRARY_IMAGES,
  };
}

export async function updateSocialPostStatusAction(postId: string, status: SocialPostStatus) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId ? { ...post, status, updatedAt: new Date().toISOString() } : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function markAllSocialPostsReadyAction() {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const now = new Date().toISOString();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.status === 'idea' || post.status === 'ready'
        ? { ...post, status: 'ready' as const, updatedAt: now }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostCaptionAction(postId: string, caption: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            caption: caption.trim(),
            updatedAt: new Date().toISOString(),
            status: post.status === 'idea' ? 'ready' : post.status,
          }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostScheduleAction(postId: string, plannedAt: string | null) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            plannedAt,
            updatedAt: new Date().toISOString(),
            // La date seule ne programme pas Meta : il faut cliquer « Programmer ».
          }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostImageAction(postId: string, imagePath: string | null) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const safe =
    imagePath && (SOCIAL_LIBRARY_IMAGES as readonly string[]).includes(imagePath) ? imagePath : imagePath === null ? null : pickLibraryImage();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId ? { ...post, imagePath: safe, updatedAt: new Date().toISOString() } : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostOverlayAction(postId: string, overlayText: string, useOverlay: boolean) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            overlayText: overlayText.trim().slice(0, 90) || post.title,
            useOverlay,
            updatedAt: new Date().toISOString(),
          }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function deleteSocialPostAction(postId: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.filter((post) => post.id !== postId),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function saveMetaConnectionManualAction(input: {
  pageId: string;
  pageName?: string;
  igUserId?: string;
  igUsername?: string;
  accessToken: string;
}) {
  await requireAdmin();
  const connection: MetaSocialConnection = {
    connected: true,
    pageId: input.pageId.trim(),
    pageName: input.pageName?.trim() || null,
    igUserId: input.igUserId?.trim() || null,
    igUsername: input.igUsername?.trim() || null,
    accessToken: input.accessToken.trim(),
    tokenExpiresAt: null,
    updatedAt: new Date().toISOString(),
  };
  if (!connection.pageId || !connection.accessToken) {
    return { ok: false as const, error: 'Page ID et token sont obligatoires.' };
  }
  await saveMetaSocialConnection(connection);
  revalidateCommunity();
  return { ok: true as const };
}

export async function disconnectMetaAction() {
  await requireAdmin();
  await saveMetaSocialConnection(emptyMetaConnection());
  revalidateCommunity();
  return { ok: true as const };
}

export async function getMetaConnectUrlAction() {
  await requireAdmin();
  if (!metaAppConfigured()) {
    return { ok: false as const, error: 'Ajoute META_APP_ID et META_APP_SECRET dans Vercel/.env.' };
  }
  const state = `fm_${Date.now().toString(36)}`;
  return { ok: true as const, url: buildMetaOAuthUrl(state) };
}

export async function completeMetaOAuthAction(code: string) {
  await requireAdmin();
  try {
    const connection = await exchangeMetaCodeForConnection(code);
    await saveMetaSocialConnection(connection);
    revalidateCommunity();
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'Connexion Meta échouée.' };
  }
}

export async function publishSocialPostNowAction(postId: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((item) => item.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };

  if (post.network === 'whatsapp') {
    return {
      ok: false as const,
      error: 'WhatsApp communauté : copie le message et envoie-le manuellement (API communauté limitée).',
    };
  }
  if (post.network === 'tiktok') {
    return { ok: false as const, error: 'TikTok arrive plus tard.' };
  }

  const connection = await getMetaSocialConnection();
  if (!connection.connected || !connection.accessToken) {
    return { ok: false as const, error: 'Connecte d’abord Meta (Instagram/Facebook).' };
  }

  try {
    const externalId =
      post.network === 'instagram'
        ? await publishInstagramNow(connection, post)
        : await publishFacebookPost(connection, post, { schedule: false });

    await saveSocialCommsBoard({
      ...board,
      posts: board.posts.map((item) =>
        item.id === postId
          ? {
              ...item,
              status: 'published',
              metaExternalId: externalId,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    });
    revalidateCommunity();
    return { ok: true as const, externalId };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'Publication échouée.' };
  }
}

export async function scheduleSocialPostAction(postId: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((item) => item.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };
  if (!post.plannedAt) return { ok: false as const, error: 'Choisis d’abord une date/heure.' };

  if (post.network === 'facebook') {
    const connection = await getMetaSocialConnection();
    if (!connection.connected) return { ok: false as const, error: 'Connecte Meta d’abord.' };
    try {
      const externalId = await publishFacebookPost(connection, post, { schedule: true });
      await saveSocialCommsBoard({
        ...board,
        posts: board.posts.map((item) =>
          item.id === postId
            ? {
                ...item,
                status: 'scheduled',
                metaExternalId: externalId,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      });
      revalidateCommunity();
      return { ok: true as const, mode: 'facebook_native' as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : 'Programmation Facebook échouée.' };
    }
  }

  if (post.network === 'instagram') {
    await saveSocialCommsBoard({
      ...board,
      posts: board.posts.map((item) =>
        item.id === postId
          ? { ...item, status: 'scheduled', updatedAt: new Date().toISOString() }
          : item,
      ),
    });
    revalidateCommunity();
    return {
      ok: true as const,
      mode: 'instagram_queue' as const,
      message: 'Instagram programmé dans FitMangas. Le cron publiera à l’heure prévue.',
    };
  }

  if (post.network === 'whatsapp') {
    await saveSocialCommsBoard({
      ...board,
      posts: board.posts.map((item) =>
        item.id === postId ? { ...item, status: 'scheduled', updatedAt: new Date().toISOString() } : item,
      ),
    });
    revalidateCommunity();
    return {
      ok: true as const,
      mode: 'whatsapp_manual' as const,
      message:
        'WhatsApp programmé (semi-manuel) : à l’heure prévue, copie le texte depuis le bandeau « À envoyer » puis poste dans la communauté.',
    };
  }

  return { ok: false as const, error: 'Réseau non programmable pour l’instant.' };
}

/** Appelé par le cron : publie les posts Instagram “scheduled” dont l’heure est passée. */
export async function processDueSocialPostsAction() {
  const board = await getSocialCommsBoard();
  const connection = await getMetaSocialConnection();
  const now = Date.now();
  let published = 0;
  let nextPosts = [...board.posts];

  for (const post of board.posts) {
    if (post.status !== 'scheduled' || !post.plannedAt) continue;
    if (new Date(post.plannedAt).getTime() > now) continue;
    if (post.network !== 'instagram') continue;
    if (!connection.connected) continue;
    try {
      const externalId = await publishInstagramNow(connection, post);
      nextPosts = nextPosts.map((item) =>
        item.id === post.id
          ? { ...item, status: 'published', metaExternalId: externalId, updatedAt: new Date().toISOString() }
          : item,
      );
      published += 1;
    } catch (e) {
      console.error('[processDueSocialPostsAction]', post.id, e);
    }
  }

  if (published > 0) {
    await saveSocialCommsBoard({ ...board, posts: nextPosts });
    revalidateCommunity();
  }
  return { ok: true as const, published };
}

export async function generateSocialWeekPlanAction(networks: SocialNetwork[] = ['instagram', 'whatsapp', 'facebook']) {
  await requireAdmin();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false as const, error: 'GEMINI_API_KEY manquant.' };

  const context = await loadGenerationContext();
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const ai = new GoogleGenAI({ apiKey });
  const targetNetworks = networks.length ? networks : (['instagram', 'whatsapp', 'facebook'] as SocialNetwork[]);

  const prompt = `Tu es community manager pour FitMangas (Pilates/Barre en visio, Alejandra).
Prépare un plan de 7 jours pour: ${targetNetworks.join(', ')}.

Contexte JSON:
${JSON.stringify(context)}

Règles strictes:
- 6 à 9 posts max
- CHAQUE post Instagram/Facebook DOIT avoir un imagePath EXACTEMENT choisi dans context.images (copie-colle le chemin)
- WhatsApp peut être format "text" sans image
- captions FR, naturelles, pas de promesses médicales
- Instagram: 3-8 hashtags
- WhatsApp: 0 hashtag, message court communauté
- plannedAt ISO réparti sur 7 jours
- overlayText: titre court (max 8 mots) pour texte-sur-image
- Réponds UNIQUEMENT JSON: {"posts":[{network,format,title,caption,hashtags,cta,imageHint,imagePath,overlayText,plannedAt,sourceType,sourceRef,whyItWorks}]}`;

  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    const text = response.text?.trim();
    if (!text) return { ok: false as const, error: 'Réponse vide de Gemini.' };

    const parsed = extractJsonObject(text) as { posts?: unknown[] };
    const now = new Date().toISOString();
    const generated: SocialPost[] = (parsed.posts ?? [])
      .map((raw, index) => {
        if (!raw || typeof raw !== 'object') return null;
        const row = raw as Record<string, unknown>;
        const network = row.network;
        const format = row.format;
        if (
          (network !== 'instagram' && network !== 'whatsapp' && network !== 'facebook' && network !== 'tiktok') ||
          (format !== 'feed' && format !== 'story' && format !== 'reel' && format !== 'carousel' && format !== 'text')
        ) {
          return null;
        }
        const requestedImage = typeof row.imagePath === 'string' ? row.imagePath : null;
        const imagePath =
          network === 'whatsapp' && format === 'text'
            ? null
            : requestedImage && (SOCIAL_LIBRARY_IMAGES as readonly string[]).includes(requestedImage)
              ? requestedImage
              : pickLibraryImage(index + 3);

        const title = typeof row.title === 'string' ? row.title.slice(0, 120) : 'Post FitMangas';
        const post: SocialPost = {
          id: createSocialPostId(),
          network,
          format: format as SocialPostFormat,
          title,
          caption: typeof row.caption === 'string' ? row.caption.slice(0, 2200) : '',
          hashtags: Array.isArray(row.hashtags) ? row.hashtags.map(String).filter(Boolean).slice(0, 10) : [],
          cta: typeof row.cta === 'string' ? row.cta.slice(0, 180) : '',
          imageHint: typeof row.imageHint === 'string' ? row.imageHint.slice(0, 220) : '',
          imagePath,
          overlayText:
            typeof row.overlayText === 'string' && row.overlayText.trim()
              ? row.overlayText.trim().slice(0, 90)
              : title.slice(0, 90),
          useOverlay: network === 'instagram' || network === 'facebook',
          plannedAt: typeof row.plannedAt === 'string' ? row.plannedAt : null,
          status: 'idea',
          sourceType:
            row.sourceType === 'blog' || row.sourceType === 'pillar' || row.sourceType === 'course' || row.sourceType === 'ai'
              ? row.sourceType
              : 'ai',
          sourceRef: typeof row.sourceRef === 'string' ? row.sourceRef : null,
          whyItWorks: typeof row.whyItWorks === 'string' ? row.whyItWorks.slice(0, 240) : '',
          metaExternalId: null,
          createdAt: now,
          updatedAt: now,
        };
        return post;
      })
      .filter((post): post is SocialPost => Boolean(post));

    if (!generated.length) return { ok: false as const, error: 'Aucun post exploitable généré.' };

    const board = await getSocialCommsBoard();
    const next: SocialCommsBoard = {
      version: 2,
      lastGeneratedAt: now,
      posts: [...generated, ...board.posts].slice(0, 80),
    };
    await saveSocialCommsBoard(next);
    revalidateCommunity();
    return { ok: true as const, created: generated.length };
  } catch (e) {
    console.error('[generateSocialWeekPlanAction]', e);
    return { ok: false as const, error: e instanceof Error ? e.message : 'Erreur IA.' };
  }
}
