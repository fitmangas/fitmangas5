import { collectUsedPhotoIdsFromUrls, extractUnsplashPhotoId } from '@/lib/blog/blog-image-fetcher';
import { createAdminClient } from '@/lib/supabase/admin';

import { SOCIAL_EDITORIAL_IMAGE_BASE_PROMPT } from '@/lib/admin/social-cm-playbook';
import {
  pickUnusedLibraryImage,
  type SocialImageSource,
  type SocialPost,
} from '@/lib/admin/social-comms';

const GEMINI_IMAGE_MODELS = [
  'gemini-3.1-flash-image-preview',
  'gemini-3.1-flash-image',
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
] as const;

const SOCIAL_UNSPLASH_QUERIES = [
  'pilates mat woman studio cream wellness editorial portrait',
  'pilates instructor alignment woman mat beige natural light',
  'wellness pilates stretching woman soft light studio',
  'barre pilates woman terracotta cream minimalist',
] as const;

export type SocialImageProvider = 'library' | 'gemini' | 'pollinations' | 'unsplash';

export function buildSocialImageScenePrompt(
  post: Pick<SocialPost, 'title' | 'caption' | 'imageHint' | 'network' | 'format'>,
  feedback = '',
  variationSeed = 0,
): string {
  const scene =
    post.imageHint?.trim() ||
    `Pilates wellness scene related to: ${post.title}. ${post.caption.slice(0, 200)}`;

  return `${SOCIAL_EDITORIAL_IMAGE_BASE_PROMPT}

Unique variation #${variationSeed} for ${post.network} ${post.format}:
${scene}
${feedback ? `Apply these corrections: ${feedback}` : ''}`.trim();
}

function isQuotaHttpStatus(status: number): boolean {
  return status === 429 || status === 403;
}

async function extractImageBytesFromGeminiContent(data: Record<string, unknown>): Promise<Buffer | null> {
  const candidates = data.candidates as Array<{ content?: { parts?: Array<Record<string, unknown>> } }> | undefined;
  for (const part of candidates?.[0]?.content?.parts ?? []) {
    const inline = part.inlineData as { data?: string } | undefined;
    if (inline?.data) return Buffer.from(inline.data, 'base64');
  }
  return null;
}

async function generateWithGeminiImageModel(apiKey: string, prompt: string): Promise<Buffer | null> {
  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ['IMAGE'],
              imageConfig: { aspectRatio: '4:5' },
            },
          }),
        },
      );
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        console.warn('[social-ai-image] gemini', model, res.status, JSON.stringify(data).slice(0, 180));
        continue;
      }
      const bytes = await extractImageBytesFromGeminiContent(data);
      if (bytes?.length) return bytes;
    } catch (e) {
      console.warn('[social-ai-image] gemini', model, e);
    }
  }
  return null;
}

async function generateWithPollinations(prompt: string, seed: number): Promise<Buffer | null> {
  try {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 900))}?width=1080&height=1350&seed=${seed}&nologo=true&enhance=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 1000 ? buf : null;
  } catch (e) {
    console.warn('[social-ai-image] pollinations', e);
    return null;
  }
}

type UnsplashSearchResult = { urls?: { regular?: string; small?: string } };

async function generateWithUnsplash(
  post: Pick<SocialPost, 'title' | 'imageHint'>,
  variationSeed: number,
  excludedPhotoIds: Set<string>,
): Promise<{ imageUrl: string; photoId: string } | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!key) return null;

  const hint = post.imageHint?.trim();
  const query = (
    hint && hint.length > 12
      ? `${hint} pilates wellness`
      : `${SOCIAL_UNSPLASH_QUERIES[variationSeed % SOCIAL_UNSPLASH_QUERIES.length]} ${post.title}`
  ).slice(0, 100);

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30&page=${1 + (variationSeed % 5)}&orientation=portrait`,
    {
      headers: {
        Authorization: `Client-ID ${key}`,
        'Accept-Version': 'v1',
      },
    },
  );

  if (isQuotaHttpStatus(res.status) || !res.ok) {
    console.warn('[social-ai-image] unsplash', res.status);
    return null;
  }

  const data = (await res.json()) as { results?: UnsplashSearchResult[] };
  for (const result of data.results ?? []) {
    const imageUrl = result.urls?.regular ?? result.urls?.small ?? null;
    if (!imageUrl) continue;
    const photoId = extractUnsplashPhotoId(imageUrl);
    if (!photoId || excludedPhotoIds.has(photoId)) continue;
    return { imageUrl, photoId };
  }
  return null;
}

export async function uploadSocialGeneratedImage(buffer: Buffer, postId: string): Promise<string> {
  const admin = createAdminClient();
  const path = `social/${postId}-${Date.now()}.jpg`;
  const { error } = await admin.storage.from('avatars').upload(path, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw new Error(`Upload image : ${error.message}`);
  const { data } = admin.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export function imageSourceFromProvider(provider: SocialImageProvider): SocialImageSource {
  if (provider === 'gemini') return 'ai';
  if (provider === 'library') return 'library';
  if (provider === 'unsplash') return 'unsplash';
  return 'pollinations';
}

/**
 * Cascade photo Feed/Carousel/WhatsApp :
 * 1. Bibliothèque réelle (non réutilisée)
 * 2. Gemini Image
 * 3. Pollinations
 * 4. Unsplash (dernier recours — jamais pour Reels)
 */
export async function generateSocialPhotoForPost(
  post: Pick<SocialPost, 'id' | 'title' | 'caption' | 'imageHint' | 'network' | 'format'>,
  opts: {
    feedback?: string;
    variationSeed?: number;
    usedLibraryPaths: Set<string>;
    usedUnsplashIds: Set<string>;
    /** Prefer library first (default true). Set false to force AI regen. */
    preferLibrary?: boolean;
    allowUnsplash?: boolean;
  },
): Promise<
  | { ok: true; imagePath: string; prompt: string; provider: SocialImageProvider; photoId?: string }
  | { ok: false; error: string }
> {
  const variationSeed = opts.variationSeed ?? 1;
  const feedback = opts.feedback ?? '';
  const preferLibrary = opts.preferLibrary !== false;
  const allowUnsplash = opts.allowUnsplash !== false && post.format !== 'reel';
  const prompt = buildSocialImageScenePrompt(post, feedback, variationSeed);

  if (preferLibrary) {
    const libraryPath = pickUnusedLibraryImage(opts.usedLibraryPaths, variationSeed + post.id.length);
    if (libraryPath) {
      opts.usedLibraryPaths.add(libraryPath);
      return { ok: true, imagePath: libraryPath, prompt, provider: 'library' };
    }
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey) {
    const bytes = await generateWithGeminiImageModel(apiKey, prompt);
    if (bytes?.length) {
      const imagePath = await uploadSocialGeneratedImage(bytes, post.id);
      return { ok: true, imagePath, prompt, provider: 'gemini' };
    }
  }

  const seed = Math.abs(variationSeed * 997 + post.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const pollBytes = await generateWithPollinations(prompt, seed);
  if (pollBytes?.length) {
    const imagePath = await uploadSocialGeneratedImage(pollBytes, post.id);
    return { ok: true, imagePath, prompt, provider: 'pollinations' };
  }

  if (allowUnsplash) {
    const unsplash = await generateWithUnsplash(post, variationSeed, opts.usedUnsplashIds);
    if (unsplash) {
      opts.usedUnsplashIds.add(unsplash.photoId);
      return {
        ok: true,
        imagePath: unsplash.imageUrl,
        prompt,
        provider: 'unsplash',
        photoId: unsplash.photoId,
      };
    }
  }

  return {
    ok: false,
    error: 'Aucune image (bibliothèque saturée + Gemini/Pollinations/Unsplash indisponibles).',
  };
}

/** Compat : regénération IA (saute la bibliothèque). */
export async function generateSocialAiImage(
  post: Pick<SocialPost, 'id' | 'title' | 'caption' | 'imageHint' | 'network' | 'format'>,
  feedback = '',
  variationSeed = 0,
  excludedPhotoIds: Set<string> = new Set(),
) {
  return generateSocialPhotoForPost(post, {
    feedback,
    variationSeed,
    usedLibraryPaths: new Set(),
    usedUnsplashIds: excludedPhotoIds,
    preferLibrary: false,
    allowUnsplash: post.format !== 'reel',
  });
}

export function collectUsedUnsplashIdsFromPosts(posts: Array<{ imagePath: string | null }>): Set<string> {
  return collectUsedPhotoIdsFromUrls(posts.map((p) => p.imagePath));
}
