import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

import { uploadSocialGeneratedImage } from '@/lib/admin/social-ai-image';
import { absolutePublicUrl, type SocialPost } from '@/lib/admin/social-comms';
import { creamTopCropRows } from '@/lib/admin/social-image-letterbox';
import { isCarouselCtaSlide, resolveSlideOverlayText } from '@/lib/admin/social-image-render';
import {
  buildOverlaySvg,
  isLibraryImagePath,
  normalizeOverlayForRender,
} from '@/lib/admin/social-overlay-text.server';

export { wrapOverlayLines } from '@/lib/admin/social-overlay-text-shared';

export const PUBLISH_EXPORT_WIDTH = 1080;
export const PUBLISH_EXPORT_HEIGHT = 1350;

const EXPORT_BG = { r: 42, g: 36, b: 32 } as const;

function resolvePublicFile(publicPath: string): string {
  const rel = publicPath.replace(/^\//, '');
  return path.join(process.cwd(), 'public', rel);
}

async function loadSourceBuffer(imagePath: string): Promise<Buffer> {
  if (imagePath.startsWith('http')) {
    const res = await fetch(imagePath);
    if (!res.ok) throw new Error(`Image source inaccessible (HTTP ${res.status}).`);
    return Buffer.from(await res.arrayBuffer());
  }
  const local = resolvePublicFile(imagePath);
  if (fs.existsSync(local)) return fs.readFileSync(local);
  const remote = absolutePublicUrl(imagePath);
  const res = await fetch(remote);
  if (!res.ok) throw new Error(`Image source inaccessible : ${remote}`);
  return Buffer.from(await res.arrayBuffer());
}

function shouldBurnOverlay(post: SocialPost, slideIndex: number): boolean {
  if (post.format !== 'carousel' && !post.useOverlay) return false;
  return Boolean(resolveSlideOverlayText(post, slideIndex));
}

async function buildPhotoBase(
  post: SocialPost,
  source: Buffer,
  imagePath: string,
  slideIndex: number,
  w: number,
  h: number,
): Promise<Buffer> {
  const isCoverLibrary = post.format === 'carousel' && slideIndex === 0 && isLibraryImagePath(imagePath);

  if (isCoverLibrary) {
    return sharp(source)
      .resize(w, h, { fit: 'inside', background: EXPORT_BG })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
  }

  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cropTop = creamTopCropRows(raw.data, raw.info.width, raw.info.height, raw.info.channels);
  const cropped =
    cropTop > 0
      ? await sharp(source)
          .extract({
            left: 0,
            top: cropTop,
            width: raw.info.width,
            height: raw.info.height - cropTop,
          })
          .toBuffer()
      : source;

  const cropPosition = post.format === 'carousel' && slideIndex === 0 ? 'north' : 'center';
  return sharp(cropped)
    .resize(w, h, { fit: 'cover', position: cropPosition })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

/** Compose 4:5 + dégradé + texte + logo (aligné preview admin). */
export async function composeSocialPublishImageBuffer(
  post: SocialPost,
  imagePath: string,
  slideIndex = 0,
): Promise<Buffer> {
  const source = await loadSourceBuffer(imagePath);
  const w = PUBLISH_EXPORT_WIDTH;
  const h = PUBLISH_EXPORT_HEIGHT;

  const ctaSlide = isCarouselCtaSlide(post, imagePath, slideIndex);
  let base: Buffer;
  if (ctaSlide) {
    const { composeCarouselCtaSlideBuffer } = await import('@/lib/admin/compose-carousel-cta');
    base = await composeCarouselCtaSlideBuffer();
  } else {
    base = await buildPhotoBase(post, source, imagePath, slideIndex, w, h);
  }

  const overlayText = resolveSlideOverlayText(post, slideIndex);
  if (!shouldBurnOverlay(post, slideIndex) || !overlayText) {
    return ctaSlide ? base : composeWithLogo(base);
  }

  const gradientSvg = buildOverlaySvg(
    w,
    h,
    normalizeOverlayForRender(overlayText),
    ctaSlide ? { anchorBottom: 210 } : undefined,
  );
  const withText = await sharp(base)
    .composite([{ input: gradientSvg, top: 0, left: 0 }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  return ctaSlide ? withText : composeWithLogo(withText);
}

async function composeWithLogo(baseJpeg: Buffer): Promise<Buffer> {
  const logoAbs = resolvePublicFile('/logo.png');
  if (!fs.existsSync(logoAbs)) return baseJpeg;

  const logoW = Math.round(PUBLISH_EXPORT_WIDTH * 0.12);
  const logoH = Math.round(PUBLISH_EXPORT_HEIGHT * 0.08);
  const logo = await sharp(logoAbs).resize(logoW, logoH, { fit: 'inside' }).png().toBuffer();

  return sharp(baseJpeg)
    .composite([
      {
        input: logo,
        top: Math.round(PUBLISH_EXPORT_HEIGHT * 0.035),
        left: Math.round(PUBLISH_EXPORT_WIDTH * 0.04),
      },
    ])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

/** URL publique prête pour Meta (overlay brûlé si activé). */
export async function resolveMetaPublishImageUrl(
  post: SocialPost,
  imagePath: string,
  slideIndex = 0,
): Promise<string> {
  const trimmed = imagePath.trim();
  if (!trimmed) throw new Error('Chemin image vide.');

  if (post.format !== 'carousel' && !shouldBurnOverlay(post, slideIndex)) {
    return absolutePublicUrl(trimmed);
  }

  const buffer = await composeSocialPublishImageBuffer(post, trimmed, slideIndex);
  const publicUrl = await uploadSocialGeneratedImage(buffer, `${post.id}-pub-s${slideIndex}`, {
    provider: 'publish-overlay',
    theme: 'meta-publish',
    prompt: resolveSlideOverlayText(post, slideIndex),
  });
  return publicUrl;
}

/** Liste d’URLs image pour publication feed / carousel. */
export async function resolveMetaPublishImageUrls(post: SocialPost): Promise<string[]> {
  const paths =
    post.format === 'carousel'
      ? (post.carouselPaths ?? []).map((p) => p.trim()).filter(Boolean)
      : post.imagePath?.trim()
        ? [post.imagePath.trim()]
        : [];

  if (!paths.length) throw new Error('Ce post n’a pas d’image à publier.');

  const urls: string[] = [];
  for (let i = 0; i < paths.length && i < 10; i += 1) {
    urls.push(await resolveMetaPublishImageUrl(post, paths[i]!, i));
  }
  return urls;
}
