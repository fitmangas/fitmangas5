'use server';

import { GoogleGenAI } from '@google/genai';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import {
  createSocialPostId,
  getSocialCommsBoard,
  saveSocialCommsBoard,
  SOCIAL_LIBRARY_IMAGES,
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
  const next: SocialCommsBoard = {
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId ? { ...post, status, updatedAt: new Date().toISOString() } : post,
    ),
  };
  await saveSocialCommsBoard(next);
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostCaptionAction(postId: string, caption: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const next: SocialCommsBoard = {
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? { ...post, caption: caption.trim(), updatedAt: new Date().toISOString(), status: post.status === 'idea' ? 'ready' : post.status }
        : post,
    ),
  };
  await saveSocialCommsBoard(next);
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

export async function generateSocialWeekPlanAction(networks: SocialNetwork[] = ['instagram', 'whatsapp', 'facebook']) {
  await requireAdmin();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false as const, error: 'GEMINI_API_KEY manquant.' };

  const context = await loadGenerationContext();
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const ai = new GoogleGenAI({ apiKey });
  const safeNetworks = networks.filter((network) =>
    network === 'instagram' || network === 'whatsapp' || network === 'facebook' || network === 'tiktok',
  );
  const targetNetworks = safeNetworks.length ? safeNetworks : (['instagram', 'whatsapp', 'facebook'] as SocialNetwork[]);

  const prompt = `Tu es community manager pour FitMangas, studio de Pilates/Barre en visio (Alejandra).
Objectif: préparer un plan de publications RÉSEAUX SOCIAUX pour les 7 prochains jours.
Ne parle PAS de SEO blog. Concentre-toi sur engagement, confiance, et conversion douce vers l'offre visio.

Réseaux à couvrir: ${targetNetworks.join(', ')}.
Contexte disponible (JSON):
${JSON.stringify(context, null, 2)}

Règles:
- 6 à 9 posts maximum au total
- Mix utile: preuve sociale / conseil pratique / coulisses coach / rappel live / invitation offre
- Instagram: captions naturelles, 3-8 hashtags max, pas de spam
- WhatsApp communauté: ton chaleureux, plus court, 0 hashtag, CTA simple
- Facebook: un peu plus long, clair, lien utile
- TikTok seulement si demandé: hook court + idée de tournage
- Utilise UNIQUEMENT des imagePath présentes dans context.images quand tu proposes une image
- Chaque post doit avoir whyItWorks (1 phrase)
- plannedAt en ISO (jours répartis sur 7 jours à partir d'aujourd'hui)
- format parmi: feed, story, reel, carousel, text
- status toujours "idea"
- sourceType parmi: ai, blog, pillar, course
- Réponds UNIQUEMENT en JSON valide:
{
  "posts": [
    {
      "network": "instagram",
      "format": "feed",
      "title": "...",
      "caption": "...",
      "hashtags": ["pilates", "..."],
      "cta": "...",
      "imageHint": "...",
      "imagePath": "/library/...",
      "plannedAt": "2026-07-16T18:00:00.000Z",
      "sourceType": "blog",
      "sourceRef": "https://fitmangas.com/blog/...",
      "whyItWorks": "..."
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const text = response.text?.trim();
    if (!text) return { ok: false as const, error: 'Réponse vide de Gemini.' };

    const parsed = extractJsonObject(text) as { posts?: unknown[] };
    const now = new Date().toISOString();
    const generated: SocialPost[] = (parsed.posts ?? [])
      .map((raw) => {
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
        const imagePath =
          typeof row.imagePath === 'string' && (SOCIAL_LIBRARY_IMAGES as readonly string[]).includes(row.imagePath)
            ? row.imagePath
            : null;
        const post: SocialPost = {
          id: createSocialPostId(),
          network,
          format: format as SocialPostFormat,
          title: typeof row.title === 'string' ? row.title.slice(0, 120) : 'Post FitMangas',
          caption: typeof row.caption === 'string' ? row.caption.slice(0, 2200) : '',
          hashtags: Array.isArray(row.hashtags) ? row.hashtags.map(String).filter(Boolean).slice(0, 10) : [],
          cta: typeof row.cta === 'string' ? row.cta.slice(0, 180) : '',
          imageHint: typeof row.imageHint === 'string' ? row.imageHint.slice(0, 220) : '',
          imagePath,
          plannedAt: typeof row.plannedAt === 'string' ? row.plannedAt : null,
          status: 'idea',
          sourceType:
            row.sourceType === 'blog' || row.sourceType === 'pillar' || row.sourceType === 'course' || row.sourceType === 'ai'
              ? row.sourceType
              : 'ai',
          sourceRef: typeof row.sourceRef === 'string' ? row.sourceRef : null,
          whyItWorks: typeof row.whyItWorks === 'string' ? row.whyItWorks.slice(0, 240) : '',
          createdAt: now,
          updatedAt: now,
        };
        return post;
      })
      .filter((post): post is SocialPost => Boolean(post));

    if (!generated.length) return { ok: false as const, error: 'Aucun post exploitable généré.' };

    const board = await getSocialCommsBoard();
    const next: SocialCommsBoard = {
      version: 1,
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
