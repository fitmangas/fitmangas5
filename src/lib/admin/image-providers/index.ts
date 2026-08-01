import { BrandBackgroundProvider } from '@/lib/admin/image-providers/brand-background-provider';
import { GeminiImageProvider } from '@/lib/admin/image-providers/gemini-image-provider';
import {
  LibraryImageProvider,
  type LibraryFolderId,
} from '@/lib/admin/image-providers/library-provider';
import {
  isImageGenerateSuccess,
  type ImageGenerateResult,
  type ImageProvider,
  type ImageSize,
} from '@/lib/admin/image-providers/types';

export type ImageProviderName = 'gemini' | 'brand' | 'library';

const DEFAULT_ORDER: ImageProviderName[] = ['gemini', 'brand', 'library'];

export function parseImageProviderOrder(raw?: string | null): ImageProviderName[] {
  const source = (raw ?? process.env.IMAGE_PROVIDER_ORDER ?? 'gemini,brand,library').trim();
  const allowed = new Set<ImageProviderName>(['gemini', 'brand', 'library']);
  const parsed = source
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ImageProviderName => allowed.has(s as ImageProviderName));
  return parsed.length ? parsed : [...DEFAULT_ORDER];
}

export function buildImageProviders(opts?: {
  order?: ImageProviderName[];
  usedLibraryPaths?: Set<string>;
  libraryFolder?: LibraryFolderId;
  libraryThemeHint?: string;
  librarySeed?: number;
}): ImageProvider[] {
  const order = opts?.order ?? parseImageProviderOrder();
  const providers: ImageProvider[] = [];
  for (const name of order) {
    if (name === 'gemini') providers.push(new GeminiImageProvider());
    else if (name === 'brand') providers.push(new BrandBackgroundProvider());
    else if (name === 'library') {
      providers.push(
        new LibraryImageProvider({
          usedPaths: opts?.usedLibraryPaths,
          folder: opts?.libraryFolder,
          themeHint: opts?.libraryThemeHint,
          seed: opts?.librarySeed,
        }),
      );
    }
  }
  return providers;
}

/**
 * Essaie les providers dans l’ordre. JAMAIS de fallback silencieux :
 * si tout échoue, retourne la raison exacte de chaque tentative.
 */
export async function generateWithImageProviderCascade(
  prompt: string,
  size: ImageSize,
  opts?: {
    order?: ImageProviderName[];
    usedLibraryPaths?: Set<string>;
    libraryFolder?: LibraryFolderId;
    libraryThemeHint?: string;
    librarySeed?: number;
    /** Si true, saute les providers non disponibles sans les compter comme erreur soft. */
    skipUnavailable?: boolean;
  },
): Promise<
  | (Extract<ImageGenerateResult, { buffer: Buffer }> & { attempts: string[] })
  | { error: string; attempts: string[] }
> {
  const providers = buildImageProviders(opts);
  const attempts: string[] = [];
  const skipUnavailable = opts?.skipUnavailable !== false;

  if (!providers.length) {
    return {
      error: 'génération image indisponible : aucun provider configuré (IMAGE_PROVIDER_ORDER).',
      attempts,
    };
  }

  for (const provider of providers) {
    const available = await provider.isAvailable();
    if (!available) {
      const msg = `${provider.name}: indisponible`;
      attempts.push(msg);
      if (skipUnavailable) continue;
      continue;
    }

    const result = await provider.generate(prompt, size);
    if (isImageGenerateSuccess(result)) {
      // Bibliothèque vide buffer + publicPath = succès chemin local
      if (result.publicPath && result.buffer.length === 0) {
        return { ...result, attempts };
      }
      if (result.buffer.length > 0 || result.publicPath) {
        return { ...result, attempts };
      }
      attempts.push(`${provider.name}: buffer vide`);
      continue;
    }
    attempts.push(`${provider.name}: ${result.error}`);
  }

  const reason = attempts.length ? attempts.join(' → ') : 'aucun provider disponible';
  return {
    error: `génération image indisponible : ${reason}. Propose la bibliothèque (public/library/).`,
    attempts,
  };
}

export {
  BrandBackgroundProvider,
  GeminiImageProvider,
  LibraryImageProvider,
  isImageGenerateSuccess,
};
export type { ImageProvider, ImageSize, ImageGenerateResult, LibraryFolderId };
