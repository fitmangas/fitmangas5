import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

import { uploadSocialGeneratedImage } from '@/lib/admin/social-ai-image';
import { absolutePublicUrl, type SocialPost } from '@/lib/admin/social-comms';
import { creamTopCropRows } from '@/lib/admin/social-image-letterbox';
import { isCarouselCtaSlide, resolveSlideOverlayText } from '@/lib/admin/social-image-render';

export const PUBLISH_EXPORT_WIDTH = 1080;
export const PUBLISH_EXPORT_HEIGHT = 1350;

const OVERLAY_FONT_FILES = [
  'PlayfairDisplay-SemiBold.ttf',
  'PlayfairDisplay-Variable.ttf',
];

function resolvePublicFile(publicPath: string): string {
  const rel = publicPath.replace(/^\//, '');
  return path.join(process.cwd(), 'public', rel);
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let cachedFontBase64: string | null = null;

/** Police embarquée — Vercel n’a pas Georgia, d’où les carrés blancs sur IG. */
function getOverlayFontBase64(): string {
  if (cachedFontBase64) return cachedFontBase64;
  for (const file of OVERLAY_FONT_FILES) {
    const fontPath = resolvePublicFile(`/fonts/${file}`);
    if (fs.existsSync(fontPath)) {
      cachedFontBase64 = fs.readFileSync(fontPath).toString('base64');
      return cachedFontBase64;
    }
  }
  throw new Error('Police overlay introuvable (public/fonts/PlayfairDisplay-*.ttf).');
}

export function wrapOverlayLines(text: string, maxChars = 36): string[] {
  const numbered = text.match(/^(\d+[.)]\s+)(.+)$/);
  const prefix = numbered ? numbered[1]! : '';
  const words = (numbered ? numbered[2]! : text).split(/\s+/).filter(Boolean);
  const firstBudget = Math.max(12, maxChars - prefix.length);
  const lines: string[] = [];
  let line = '';
  let budget = firstBudget;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > budget) {
      if (line) lines.push(lines.length === 0 && prefix ? `${prefix}${line}` : line);
      line = word;
      budget = maxChars;
    } else {
      line = test;
    }
  }
  if (line) lines.push(lines.length === 0 && prefix ? `${prefix}${line}` : line);
  return lines.slice(0, 4);
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

export function buildOverlaySvg(
  width: number,
  height: number,
  lines: string[],
  options?: { anchorBottom?: number },
): Buffer {
  const fontBase64 = getOverlayFontBase64();
  const anchorBottom = options?.anchorBottom ?? 140;
  const startY = height - anchorBottom - (lines.length - 1) * 58;
  const textSvg = lines
    .map(
      (line, index) =>
        `<text x="${width / 2}" y="${startY + index * 58}" text-anchor="middle" font-family="FitMangasOverlay, serif" font-size="52" font-weight="600" fill="#FFFAF5">${escapeXml(line)}</text>`,
    )
    .join('\n');

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style type="text/css"><![CDATA[
          @font-face {
            font-family: 'FitMangasOverlay';
            src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
            font-weight: 600;
            font-style: normal;
          }
        ]]></style>
        <linearGradient id="g" x1="0" y1="${Math.round(height * 0.55)}" x2="0" y2="${height}" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="rgba(30,24,20,0)"/>
          <stop offset="100%" stop-color="rgba(30,24,20,0.82)"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
      ${textSvg}
    </svg>
  `);
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
    base = await sharp(source)
      .resize(w, h, { fit: 'contain', background: { r: 42, g: 36, b: 32 } })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
  } else {
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
    base = await sharp(cropped)
      .resize(w, h, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
  }

  const overlayText = resolveSlideOverlayText(post, slideIndex);
  if (!shouldBurnOverlay(post, slideIndex) || !overlayText) {
    return ctaSlide ? base : composeWithLogo(base);
  }

  const lines = wrapOverlayLines(overlayText);
  const gradientSvg = buildOverlaySvg(w, h, lines, ctaSlide ? { anchorBottom: 210 } : undefined);
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
