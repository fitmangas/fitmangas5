'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import {
  buildMetaOAuthUrl,
  exchangeMetaCodeForConnection,
  metaAppConfigured,
  publishFacebookPost,
  publishInstagramNow,
} from '@/lib/admin/meta-social';
import { collectUsedUnsplashIdsFromPosts, generateSocialAiImage, generateSocialPhotoForPost, imageSourceFromProvider } from '@/lib/admin/social-ai-image';
import { CAPTION_BY_FORMAT, SOCIAL_CM_GUIDELINES } from '@/lib/admin/social-cm-playbook';
import {
  buildWeeklySlots,
  plannedAtParis,
  weekPlanSummary,
} from '@/lib/admin/social-week-planner';
import { parisScheduleToIso } from '@/lib/admin/social-paris-time';
import {
  collectUsedLibraryPaths,
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
import { runBlogAiCascade } from '@/lib/blog/ai-providers';
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
          }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostParisScheduleAction(postId: string, date: string, hour: number) {
  await requireAdmin();
  const plannedAt = parisScheduleToIso(date, hour);
  return updateSocialPostScheduleAction(postId, plannedAt);
}

export async function updateSocialPostImageAction(postId: string, imagePath: string | null) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const isAllowed =
    imagePath === null ||
    (SOCIAL_LIBRARY_IMAGES as readonly string[]).includes(imagePath) ||
    imagePath.startsWith('http') ||
    imagePath.startsWith('/library/social/');
  const safe = isAllowed ? imagePath : pickLibraryImage();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            imagePath: safe,
            imageSource: safe && safe.startsWith('http') ? ('ai' as const) : post.imageSource,
            updatedAt: new Date().toISOString(),
          }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostImageFeedbackAction(postId: string, feedback: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? { ...post, imageFeedback: feedback.trim().slice(0, 500), updatedAt: new Date().toISOString() }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function generateSocialImageAction(postId: string, feedbackOverride?: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((item) => item.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };

  const feedback = (feedbackOverride ?? post.imageFeedback).trim();
  const result = await generateSocialAiImage(post, feedback, post.id.length);
  if (!result.ok) return result;

  const source =
    result.provider === 'gemini'
      ? ('ai' as const)
      : result.provider === 'unsplash'
        ? ('unsplash' as const)
        : result.provider === 'library'
          ? ('library' as const)
          : ('pollinations' as const);

  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((item) =>
      item.id === postId
        ? {
            ...item,
            imagePath: result.imagePath,
            imageSource: source,
            aiImagePrompt: result.prompt,
            imageFeedback: '',
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  });
  revalidateCommunity();
  return {
    ok: true as const,
    message: `Image régénérée (${result.provider}).`,
  };
}

export async function updateSocialPostReelBriefAction(
  postId: string,
  input: { hookTitle?: string; reelScript?: string; shotList?: string },
) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            hookTitle: input.hookTitle !== undefined ? input.hookTitle.trim().slice(0, 90) : post.hookTitle,
            reelScript: input.reelScript !== undefined ? input.reelScript.trim().slice(0, 2000) : post.reelScript,
            shotList: input.shotList !== undefined ? input.shotList.trim().slice(0, 800) : post.shotList,
            updatedAt: new Date().toISOString(),
          }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function attachSocialRawVideoAction(postId: string, rawVideoPath: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((p) => p.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };
  if (post.format !== 'reel') return { ok: false as const, error: 'Upload vidéo réservé aux Reels.' };

  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((item) =>
      item.id === postId
        ? {
            ...item,
            rawVideoPath,
            videoStatus: 'raw_uploaded',
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  });
  revalidateCommunity();
  return { ok: true as const, message: 'Vidéo brute enregistrée (référence). Monte-la sur ton Mac avec Claude + HyperFrames local.' };
}

/** MP4 déjà monté sur le Mac (Claude + HyperFrames local) → prêt à publier. */
export async function attachSocialEditedVideoAction(postId: string, editedVideoPath: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((p) => p.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };
  if (post.format !== 'reel') return { ok: false as const, error: 'Upload montage réservé aux Reels.' };

  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((item) =>
      item.id === postId
        ? {
            ...item,
            editedVideoPath,
            videoStatus: 'edited',
            status: item.status === 'idea' ? 'ready' : item.status,
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  });
  revalidateCommunity();
  return { ok: true as const, message: 'MP4 monté importé. Prêt à publier / programmer.' };
}

/** @deprecated Option API cloud retirée — montage = Claude Mac + HyperFrames local. */
export async function renderSocialReelMontageAction(_postId: string) {
  await requireAdmin();
  return {
    ok: false as const,
    error:
      'Le montage cloud dans FitMangas est désactivé. Monte sur ton Mac (Claude + HyperFrames local gratuit), puis importe le MP4 ici.',
  };
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateSocialWeekPlanAction(networks: SocialNetwork[] = ['instagram', 'whatsapp', 'facebook']) {
  await requireAdmin();

  const targetNetworks = networks.length ? networks : (['instagram', 'whatsapp', 'facebook'] as SocialNetwork[]);
  const slots = buildWeeklySlots(targetNetworks);
  if (!slots.length) {
    return { ok: false as const, error: 'Aucun réseau sélectionné pour la génération.' };
  }

  const context = await loadGenerationContext();
  const slotSpec = slots.map((slot, index) => {
    const band =
      slot.network === 'facebook'
        ? { min: 40, max: 120, ideal: '40-80' }
        : slot.network === 'whatsapp'
          ? { min: 180, max: 280, ideal: '180-280' }
          : CAPTION_BY_FORMAT[slot.format];
    return {
      slotId: index,
      network: slot.network,
      format: slot.format,
      mediaKind: slot.mediaKind,
      dayOffset: slot.dayOffset,
      parisHour:
        SOCIAL_CM_GUIDELINES[slot.network].bestHours[
          slot.slotIndex % SOCIAL_CM_GUIDELINES[slot.network].bestHours.length
        ],
      captionMin: 'min' in band ? band.min : 70,
      captionMax: 'max' in band ? band.max : 220,
      captionIdeal: 'ideal' in band ? band.ideal : `${band.idealMin}-${band.idealMax}`,
      hashtagIdeal: SOCIAL_CM_GUIDELINES[slot.network].hashtagIdeal,
      needsReelBrief: slot.mediaKind === 'video_brief',
      needsPhoto: slot.mediaKind === 'photo' || slot.mediaKind === 'carousel',
    };
  });

  const prompt = `Tu es community manager senior pour FitMangas (Pilates/Barre visio, coach Alejandra).

Contexte:
${JSON.stringify(context)}

Plan FIXE (${slots.length} posts) — tu ne choisis PAS réseau/format/horaire :
${JSON.stringify(slotSpec)}

Règles:
- EXACTEMENT ${slots.length} posts, un par slotId (ordre 0…${slots.length - 1})
- NE PAS renvoyer network, format, plannedAt, imagePath, whyItWorks
- REEL (mediaKind=video_brief):
  - caption 70–150 caractères (hook + CTA), PAS un pavé
  - hookTitle OBLIGATOIRE: gros titre viral FR MAJUSCULES max 8 mots (ex: "MAL AU DOS AU BUREAU ? 30 SEC")
  - reelScript: 4–6 phrases orales pour Alejandra (15–40 s)
  - shotList: 3 plans (face cam / démo / CTA)
  - imageHint: laisser vide ou "n/a"
- FEED photo marque: caption 100–180 car.
- CAROUSEL: caption 200–900 car., éducatif, hook dans les 125 premiers caractères
- FACEBOOK: 40–120 car., question ouverte, max 2 hashtags
- WHATSAPP: 180–280 car., 0 hashtag, ton communauté
- Hashtags dans le champ hashtags seulement
- useOverlay: false (sauf carousel slide 1 si utile)
- imageHint (feed/carousel/whatsapp) EN ANGLAIS: scène editorial Pilates unique 4:5 cream/beige/terracotta, no text
- Réponds UNIQUEMENT JSON: {"posts":[{slotId,title,caption,hashtags,cta,imageHint,overlayText,useOverlay,hookTitle,reelScript,shotList,sourceType,sourceRef}]}`;

  try {
    const aiResult = await runBlogAiCascade({
      system: 'Community manager FitMangas. JSON uniquement.',
      user: prompt,
      temperature: 0.7,
      maxOutputTokens: 8192,
    });

    if (!aiResult.ok) {
      return { ok: false as const, error: aiResult.detail || 'Génération texte impossible.' };
    }

    const parsed = extractJsonObject(aiResult.text) as { posts?: unknown[] };
    const now = new Date().toISOString();
    const rawPosts = Array.isArray(parsed.posts) ? parsed.posts : [];

    const generated: SocialPost[] = [];
    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[i]!;
      const row = (rawPosts.find((item) => {
        if (!item || typeof item !== 'object') return false;
        return (item as Record<string, unknown>).slotId === i;
      }) ?? rawPosts[i]) as Record<string, unknown> | undefined;
      if (!row || typeof row !== 'object') continue;

      const isReel = slot.mediaKind === 'video_brief';
      const band = CAPTION_BY_FORMAT[slot.format];
      const captionMax =
        slot.network === 'facebook' ? 120 : slot.network === 'whatsapp' ? 280 : band.max;
      const title =
        typeof row.title === 'string' ? row.title.slice(0, 120) : `Post ${SOCIAL_CM_GUIDELINES[slot.network].label}`;
      const hookTitle =
        typeof row.hookTitle === 'string' && row.hookTitle.trim()
          ? row.hookTitle.trim().slice(0, 90)
          : isReel
            ? title.slice(0, 90).toUpperCase()
            : '';

      generated.push({
        id: createSocialPostId(),
        network: slot.network,
        format: slot.format,
        title,
        caption: typeof row.caption === 'string' ? row.caption.slice(0, captionMax) : '',
        hashtags: Array.isArray(row.hashtags)
          ? row.hashtags.map(String).filter(Boolean).slice(0, SOCIAL_CM_GUIDELINES[slot.network].hashtagMax)
          : [],
        cta: typeof row.cta === 'string' ? row.cta.slice(0, 180) : '',
        imageHint: typeof row.imageHint === 'string' ? row.imageHint.slice(0, 500) : '',
        imagePath: null,
        imageSource: isReel ? 'none' : 'library',
        aiImagePrompt: '',
        imageFeedback: '',
        overlayText:
          typeof row.overlayText === 'string' && row.overlayText.trim()
            ? row.overlayText.trim().slice(0, 90)
            : title.slice(0, 90),
        useOverlay: row.useOverlay === true,
        hookTitle,
        reelScript: typeof row.reelScript === 'string' ? row.reelScript.slice(0, 2000) : '',
        shotList: typeof row.shotList === 'string' ? row.shotList.slice(0, 800) : '',
        rawVideoPath: null,
        editedVideoPath: null,
        videoStatus: isReel ? 'brief' : null,
        carouselPaths: [],
        plannedAt: plannedAtParis(slot.network, slot.dayOffset, slot.slotIndex),
        status: 'idea',
        sourceType:
          row.sourceType === 'blog' || row.sourceType === 'pillar' || row.sourceType === 'course' || row.sourceType === 'ai'
            ? row.sourceType
            : 'ai',
        sourceRef: typeof row.sourceRef === 'string' ? row.sourceRef : null,
        whyItWorks: '',
        metaExternalId: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (!generated.length) {
      return { ok: false as const, error: 'Aucun post exploitable généré.' };
    }

    const board = await getSocialCommsBoard();
    const usedLibrary = collectUsedLibraryPaths(board.posts);
    const usedUnsplash = collectUsedUnsplashIdsFromPosts(board.posts);

    let photosOk = 0;
    let photosFailed = 0;
    let reelsBrief = 0;

    for (let i = 0; i < generated.length; i += 1) {
      const post = generated[i]!;
      const slot = slots[i]!;

      if (slot.mediaKind === 'video_brief') {
        reelsBrief += 1;
        continue;
      }

      const count = slot.mediaKind === 'carousel' ? 3 : 1;
      const paths: string[] = [];
      for (let c = 0; c < count; c += 1) {
        const imageResult = await generateSocialPhotoForPost(post, {
          variationSeed: i * 10 + c + 1,
          usedLibraryPaths: usedLibrary,
          usedUnsplashIds: usedUnsplash,
          preferLibrary: true,
          allowUnsplash: true,
        });
        if (imageResult.ok) {
          paths.push(imageResult.imagePath);
          post.aiImagePrompt = imageResult.prompt;
          post.imageSource = imageSourceFromProvider(imageResult.provider);
          if (imageResult.provider === 'library') usedLibrary.add(imageResult.imagePath);
          if (imageResult.photoId) usedUnsplash.add(imageResult.photoId);
          photosOk += 1;
        } else {
          photosFailed += 1;
        }
        await sleep(800);
      }

      if (slot.mediaKind === 'carousel') {
        post.carouselPaths = paths;
        post.imagePath = paths[0] ?? null;
      } else {
        post.imagePath = paths[0] ?? null;
      }
    }

    const next: SocialCommsBoard = {
      version: 2,
      lastGeneratedAt: now,
      posts: [...generated, ...board.posts].slice(0, 80),
    };
    await saveSocialCommsBoard(next);
    revalidateCommunity();

    const summary = weekPlanSummary(targetNetworks);
    return {
      ok: true as const,
      created: generated.length,
      message: `Plan généré (${summary}). ${reelsBrief} briefs Reels (vidéo à filmer + montage). Photos: ${photosOk} ok${photosFailed ? `, ${photosFailed} échecs` : ''} (bibliothèque → Gemini → Pollinations → Unsplash).`,
    };
  } catch (e) {
    console.error('[generateSocialWeekPlanAction]', e);
    return { ok: false as const, error: e instanceof Error ? e.message : 'Erreur IA.' };
  }
}
