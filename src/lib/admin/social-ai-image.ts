import { createAdminClient } from '@/lib/supabase/admin';

import {
  generateWithImageProviderCascade,
  parseImageProviderOrder,
  type ImageProviderName,
} from '@/lib/admin/image-providers';
import {
  folderForTheme,
  pickLibraryPath,
  type LibraryFolderId,
} from '@/lib/admin/image-providers/library-provider';
import {
  generateWithAlejandraPhota,
  getAlejandraDoubleProfile,
  isAlejandraDoubleEnabled,
  isPhotaDoubleReady,
} from '@/lib/admin/alejandra-double';
import { resolveGeminiApiKey } from '@/lib/admin/image-providers/gemini-image-provider';
import { buildEditorialImagePrompt } from '@/lib/admin/social-image-prompt';
import type { SocialImageSource, SocialLocale, SocialPost } from '@/lib/admin/social-comms';

export type SocialImageProvider = 'library' | 'gemini' | 'brand' | 'phota' | 'unsplash' | 'none';

export { resolveGeminiApiKey };

export function buildSocialImageScenePrompt(
  post: Pick<SocialPost, 'title' | 'caption' | 'imageHint' | 'network' | 'format' | 'overlayText' | 'useOverlay'> & {
    locale?: SocialLocale;
  },
  feedback = '',
  variationSeed = 0,
): string {
  const scene =
    post.imageHint?.trim() ||
    `Pilates wellness scene related to: ${post.title}. ${post.caption.slice(0, 160)}`;
  const forCarousel = post.format === 'carousel' || Boolean(post.useOverlay);
  const base = buildEditorialImagePrompt({
    sceneHint: scene,
    seed: variationSeed,
    forCarousel,
  });
  return `${base}${feedback ? ` Apply these corrections: ${feedback}` : ''}`.trim();
}

export type GeneratedImageMeta = {
  path: string;
  publicUrl: string;
  date: string;
  pillar: string | null;
  theme: string;
  prompt: string;
  provider: string;
  postId: string;
};

const GENEREES_MANIFEST_KEY = 'library_generees_manifest';

async function appendGenereesManifest(entry: GeneratedImageMeta): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('admin_settings').select('value').eq('key', GENEREES_MANIFEST_KEY).maybeSingle();
    let entries: GeneratedImageMeta[] = [];
    if (data?.value) {
      try {
        const parsed = JSON.parse(String(data.value)) as { entries?: GeneratedImageMeta[] };
        entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      } catch {
        entries = [];
      }
    }
    entries = [entry, ...entries].slice(0, 500);
    await admin.from('admin_settings').upsert(
      { key: GENEREES_MANIFEST_KEY, value: JSON.stringify({ version: 1, entries }) },
      { onConflict: 'key' },
    );
  } catch (e) {
    console.warn('[generees-manifest]', e);
  }
}

/** Upload + archivage dans library/generees (storage) + métadonnées. */
export async function uploadSocialGeneratedImage(
  buffer: Buffer,
  postId: string,
  meta?: { prompt?: string; provider?: string; pillar?: string | null; theme?: string },
): Promise<string> {
  const admin = createAdminClient();
  const stamp = Date.now();
  const storagePath = `library/generees/${postId}-${stamp}.jpg`;
  // Toujours JPEG valide (Gemini peut renvoyer PNG / WebP → Bad Request Supabase).
  let jpeg = buffer;
  try {
    const sharp = (await import('sharp')).default;
    jpeg = await sharp(buffer).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  } catch {
    jpeg = buffer;
  }
  const { error } = await admin.storage.from('avatars').upload(storagePath, jpeg, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw new Error(`Upload image : ${error.message}`);
  const { data } = admin.storage.from('avatars').getPublicUrl(storagePath);
  const publicUrl = data.publicUrl;

  // Best-effort local mirror (dev) — no-op / non-fatal on Vercel read-only FS
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const dir = path.join(process.cwd(), 'public', 'library', 'generees');
    await fs.mkdir(dir, { recursive: true });
    const fileName = `${postId}-${stamp}.jpg`;
    await fs.writeFile(path.join(dir, fileName), jpeg);
  } catch {
    // ignore
  }

  await appendGenereesManifest({
    path: `/library/generees/${postId}-${stamp}.jpg`,
    publicUrl,
    date: new Date().toISOString(),
    pillar: meta?.pillar ?? null,
    theme: meta?.theme || '',
    prompt: (meta?.prompt || '').slice(0, 1200),
    provider: meta?.provider || 'gemini',
    postId,
  });

  return publicUrl;
}

/** Image-to-image : ajuste une image existante via Gemini + prompt de correction. */
export async function refineSocialAiImage(
  post: Pick<
    SocialPost,
    'id' | 'title' | 'caption' | 'imageHint' | 'network' | 'format' | 'overlayText' | 'useOverlay' | 'locale' | 'imagePath'
  > & { pillarId?: string | null },
  feedback: string,
): Promise<
  | { ok: true; imagePath: string; prompt: string; provider: SocialImageProvider }
  | { ok: false; error: string }
> {
  const note = feedback.trim();
  if (!note) return { ok: false, error: 'Indique une correction (ex. : cadrage plus serré, moins de mains…).' };
  if (!post.imagePath) return { ok: false, error: 'Aucune image source à corriger.' };

  const apiKey = resolveGeminiApiKey();
  if (!apiKey) return { ok: false, error: 'GEMINI_API_KEY manquante.' };

  try {
    const src = post.imagePath.startsWith('http')
      ? post.imagePath
      : `${(process.env.NEXT_PUBLIC_APP_URL || 'https://fitmangas.com').replace(/\/$/, '')}${post.imagePath.startsWith('/') ? '' : '/'}${post.imagePath}`;
    const imgRes = await fetch(src);
    if (!imgRes.ok) return { ok: false, error: `Impossible de charger l’image source (${imgRes.status}).` };
    const bytes = Buffer.from(await imgRes.arrayBuffer());
    const mime = imgRes.headers.get('content-type') || 'image/jpeg';
    const prompt = buildSocialImageScenePrompt(post, note, post.id.length + 17);
    const { GeminiImageProvider } = await import('@/lib/admin/image-providers/gemini-image-provider');
    const gemini = new GeminiImageProvider();
    const result = await gemini.generate(prompt, { width: 1080, height: 1350 }, {
      referenceImageBase64: bytes.toString('base64'),
      referenceMimeType: mime,
    });
    if ('error' in result) return { ok: false, error: result.error };
    const imagePath = await uploadSocialGeneratedImage(result.buffer, `${post.id}-fix`, {
      prompt,
      provider: 'gemini',
      pillar: post.pillarId ?? null,
      theme: post.imageHint || post.title,
    });
    return { ok: true, imagePath, prompt, provider: 'gemini' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function imageSourceFromProvider(provider: SocialImageProvider): SocialImageSource {
  if (provider === 'gemini' || provider === 'phota' || provider === 'brand') return 'ai';
  if (provider === 'library') return 'library';
  if (provider === 'unsplash') return 'unsplash';
  return 'none';
}

export { socialImageProviderLabel } from '@/lib/admin/social-comms';

function mapCascadeProvider(name: string): SocialImageProvider {
  if (name === 'gemini' || name === 'brand' || name === 'library' || name === 'phota') return name;
  return 'none';
}

/**
 * Cascade image via IMAGE_PROVIDER_ORDER (défaut gemini,brand,library).
 * Unsplash interdit sur Instagram. Pollinations supprimé.
 */
export async function generateSocialPhotoForPost(
  post: Pick<
    SocialPost,
    'id' | 'title' | 'caption' | 'imageHint' | 'network' | 'format' | 'overlayText' | 'useOverlay' | 'locale'
  >,
  opts: {
    feedback?: string;
    variationSeed?: number;
    usedLibraryPaths: Set<string>;
    usedUnsplashIds?: Set<string>;
    preferLibrary?: boolean;
    allowUnsplash?: boolean;
    forceNanoBanana?: boolean;
    libraryFolder?: LibraryFolderId;
    libraryThemeHint?: string;
    order?: ImageProviderName[];
  },
): Promise<
  | { ok: true; imagePath: string; prompt: string; provider: SocialImageProvider; photoId?: string }
  | { ok: false; error: string }
> {
  const variationSeed = opts.variationSeed ?? 1;
  const feedback = opts.feedback ?? '';
  const prompt = buildSocialImageScenePrompt(post, feedback, variationSeed);
  const size = { width: 1080, height: 1350 };
  const themeHint = opts.libraryThemeHint || post.imageHint || post.title;
  const folder = opts.libraryFolder || folderForTheme(themeHint);

  if (isAlejandraDoubleEnabled() && !(post.format === 'feed' && !opts.forceNanoBanana)) {
    const doubleProfile = await getAlejandraDoubleProfile();
    if (isPhotaDoubleReady(doubleProfile)) {
      const phota = await generateWithAlejandraPhota(doubleProfile, prompt);
      if (phota.ok) {
        const imagePath = await uploadSocialGeneratedImage(phota.buffer, post.id, {
          prompt,
          provider: 'phota',
          theme: themeHint,
        });
        return { ok: true, imagePath, prompt, provider: 'phota' };
      }
    }
  }

  let order = opts.order ?? parseImageProviderOrder();
  if (opts.preferLibrary) {
    order = ['library', ...order.filter((n) => n !== 'library')];
  }
  if (opts.forceNanoBanana || (post.format === 'carousel' && !opts.preferLibrary)) {
    order = ['gemini', ...order.filter((n) => n !== 'gemini')];
  }

  // Feed = vraie photo bibliothèque uniquement (identité Alejandra), jamais IA.
  if (opts.preferLibrary !== false && post.format === 'feed' && !opts.forceNanoBanana) {
    const libPath = pickLibraryPath({
      usedPaths: opts.usedLibraryPaths,
      seed: variationSeed + post.id.length,
      folder: folder === 'produit-captures' ? 'portraits' : folder,
      themeHint,
    });
    if (libPath) {
      opts.usedLibraryPaths.add(libPath);
      return { ok: true, imagePath: libPath, prompt, provider: 'library' };
    }
    return { ok: false, error: 'Feed : aucune photo bibliothèque disponible pour ce thème.' };
  }

  const cascade = await generateWithImageProviderCascade(prompt, size, {
    order,
    usedLibraryPaths: opts.usedLibraryPaths,
    libraryFolder: folder,
    libraryThemeHint: themeHint,
    librarySeed: variationSeed + post.id.length,
  });

  if ('error' in cascade) {
    // Jamais de biblio silencieuse pour masquer un échec IA.
    // Photo biblio uniquement si explicitement demandée (preferLibrary / feed).
    console.error('[social-ai-image] cascade image échouée — pas de fallback biblio silencieux', cascade.error);
    return { ok: false, error: cascade.error };
  }

  if (cascade.publicPath) {
    opts.usedLibraryPaths.add(cascade.publicPath);
    return {
      ok: true,
      imagePath: cascade.publicPath,
      prompt,
      provider: mapCascadeProvider(cascade.provider),
    };
  }

  if (cascade.buffer.length > 0) {
    const imagePath = await uploadSocialGeneratedImage(cascade.buffer, post.id, {
      prompt,
      provider: cascade.provider,
      theme: themeHint,
    });
    return {
      ok: true,
      imagePath,
      prompt,
      provider: mapCascadeProvider(cascade.provider),
    };
  }

  return {
    ok: false,
    error: `génération image indisponible : ${cascade.attempts?.join(' → ') || 'échec inconnu'}. Propose la bibliothèque.`,
  };
}

export async function generateSocialAiImage(
  post: Pick<
    SocialPost,
    'id' | 'title' | 'caption' | 'imageHint' | 'network' | 'format' | 'overlayText' | 'useOverlay' | 'locale'
  >,
  feedback = '',
  variationSeed = 0,
) {
  return generateSocialPhotoForPost(post, {
    feedback,
    variationSeed,
    usedLibraryPaths: new Set(),
    preferLibrary: false,
    forceNanoBanana: true,
    allowUnsplash: false,
  });
}

export function collectUsedUnsplashIdsFromPosts(_posts: Array<{ imagePath: string | null }>): Set<string> {
  return new Set();
}
