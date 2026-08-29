import type { SocialPost } from '@/lib/admin/social-comms';
import { creamTopCropRows } from '@/lib/admin/social-image-letterbox';
import {
  isLibraryImagePath,
  normalizeOverlayForRender,
  OVERLAY_FONT_CSS_STACK,
  OVERLAY_FONT_PUBLIC_PATH,
  OVERLAY_FONT_SIZE,
  OVERLAY_LINE_HEIGHT,
  OVERLAY_MAX_WIDTH_RATIO,
} from '@/lib/admin/social-overlay-text-shared';
import {
  CAROUSEL_SLIDE_COUNT,
  isOverlayReviewMarker,
} from '@/lib/admin/social-cm-playbook';

export const SOCIAL_LOGO_PATH = '/logo.png';
/** Instagram feed / carousel portrait (4:5). */
export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1350;

const EXPORT_BG = '#2a2420';

let overlayFontLoaded: Promise<void> | null = null;

async function ensureOverlayFont(): Promise<void> {
  if (typeof document === 'undefined') return;
  if (overlayFontLoaded) return overlayFontLoaded;
  if (!('FontFace' in window)) {
    overlayFontLoaded = Promise.resolve();
    return overlayFontLoaded;
  }
  const href = OVERLAY_FONT_PUBLIC_PATH;
  overlayFontLoaded = (async () => {
    try {
      const face = new FontFace('FitMangasSocialOverlay', `url(${href})`, { weight: '700', style: 'normal' });
      const loaded = await face.load();
      document.fonts.add(loaded);
    } catch {
      // Helvetica / Arial fallback côté canvas
    }
  })();
  return overlayFontLoaded;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Chargement image impossible'));
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const numbered = text.match(/^(\d+[.)]\s+)(.+)$/);
  const prefix = numbered ? numbered[1]! : '';
  const words = (numbered ? numbered[2]! : text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  const push = () => {
    if (!line) return;
    lines.push(lines.length === 0 && prefix ? `${prefix}${line}` : line);
    line = '';
  };
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    const measured = lines.length === 0 && prefix ? `${prefix}${test}` : test;
    if (ctx.measureText(measured).width > maxWidth && line) {
      push();
      line = word;
    } else {
      line = test;
    }
  }
  push();
  return lines.slice(0, 4);
}

/** Retire le fond noir du logo PNG pour un rendu transparent sur photo. */
function drawLogoTransparent(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const off = document.createElement('canvas');
  off.width = logo.width;
  off.height = logo.height;
  const octx = off.getContext('2d');
  if (!octx) {
    ctx.drawImage(logo, x, y, w, h);
    return;
  }
  octx.drawImage(logo, 0, 0);
  const imageData = octx.getImageData(0, 0, off.width, off.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    if (r < 40 && g < 40 && b < 40) {
      data[i + 3] = 0;
    }
  }
  octx.putImageData(imageData, 0, 0);
  ctx.drawImage(off, x, y, w, h);
}

async function drawLogo(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number) {
  try {
    const logo = await loadImage(SOCIAL_LOGO_PATH);
    const maxW = canvasW * 0.12;
    const maxH = canvasH * 0.08;
    const scale = Math.min(maxW / logo.width, maxH / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    const x = canvasW * 0.04;
    const y = canvasH * 0.035;
    drawLogoTransparent(ctx, logo, x, y, w, h);
  } catch {
    // Logo optionnel
  }
}

export function isCarouselCtaSlide(
  post: Pick<SocialPost, 'format' | 'carouselPaths'>,
  imagePath: string,
  slideIndex = 0,
): boolean {
  if (post.format !== 'carousel') return false;
  if (/[-_]cta[-_]/i.test(imagePath)) return true;
  const paths = post.carouselPaths ?? [];
  return Boolean(paths.length && slideIndex === paths.length - 1 && /cta|dashboard/i.test(imagePath));
}

export function resolveSlideOverlayText(
  post: Pick<SocialPost, 'overlayText' | 'carouselSlideTitles' | 'useOverlay' | 'format' | 'hookTitle' | 'title' | 'locale'>,
  slideIndex = 0,
): string {
  const titles = post.carouselSlideTitles ?? [];
  if (post.format === 'carousel' && titles[slideIndex]?.trim()) {
    const raw = titles[slideIndex]!.trim();
    if (isOverlayReviewMarker(raw)) {
      if (slideIndex === CAROUSEL_SLIDE_COUNT - 1) {
        const fallback =
          post.locale === 'es'
            ? 'PRUEBA 7 DÍAS — TE ESPERAMOS EN VISIO'
            : "ESSAI 7 JOURS — ON T'ATTEND EN VISIO";
        return normalizeOverlayForRender(fallback);
      }
      return '';
    }
    return normalizeOverlayForRender(raw);
  }
  const overlay = (post.overlayText || '').trim();
  if (overlay) return normalizeOverlayForRender(overlay);
  if (slideIndex === 0) {
    const hook = (post.hookTitle || post.title || '').trim();
    if (hook) return normalizeOverlayForRender(hook);
  }
  return '';
}

/** Rendu canvas partagé (preview + téléchargement) — ratio 4:5 Instagram. */
export async function renderSocialPostCanvas(
  post: SocialPost,
  options?: { slideIndex?: number; imagePathOverride?: string | null },
): Promise<HTMLCanvasElement> {
  const imagePath = options?.imagePathOverride || post.imagePath;
  if (!imagePath) throw new Error('Aucune image');

  const slideIndex = options?.slideIndex ?? 0;
  const img = await loadImage(imagePath);
  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponible');

  const isPrecomposedCta = isCarouselCtaSlide(post, imagePath, slideIndex);
  const isCoverLibrary = post.format === 'carousel' && slideIndex === 0 && isLibraryImagePath(imagePath);

  if (isPrecomposedCta) {
    ctx.fillStyle = EXPORT_BG;
    ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    const scale = Math.min(EXPORT_WIDTH / img.width, EXPORT_HEIGHT / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (EXPORT_WIDTH - w) / 2, (EXPORT_HEIGHT - h) / 2, w, h);
  } else if (isCoverLibrary) {
    ctx.fillStyle = EXPORT_BG;
    ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    const scale = Math.min(EXPORT_WIDTH / img.width, EXPORT_HEIGHT / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (EXPORT_WIDTH - w) / 2, (EXPORT_HEIGHT - h) / 2, w, h);
  } else {
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;
    try {
      const probe = document.createElement('canvas');
      probe.width = img.width;
      probe.height = img.height;
      const pctx = probe.getContext('2d');
      if (pctx) {
        pctx.drawImage(img, 0, 0);
        const sampled = pctx.getImageData(0, 0, img.width, img.height);
        const cropTop = creamTopCropRows(sampled.data, img.width, img.height, 4);
        if (cropTop > 0) {
          sy = cropTop;
          sh = img.height - cropTop;
        }
      }
    } catch {
      // Recadrage optionnel
    }
    const scale = Math.max(EXPORT_WIDTH / sw, EXPORT_HEIGHT / sh);
    const w = sw * scale;
    const h = sh * scale;
    const dx = (EXPORT_WIDTH - w) / 2;
    const dy = post.format === 'carousel' && slideIndex === 0 ? 0 : (EXPORT_HEIGHT - h) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, w, h);
  }

  const overlayText = resolveSlideOverlayText(post, slideIndex);
  const burnOverlay = post.useOverlay || post.format === 'carousel';

  if (burnOverlay && overlayText) {
    await ensureOverlayFont();

    const gradient = ctx.createLinearGradient(0, EXPORT_HEIGHT * 0.55, 0, EXPORT_HEIGHT);
    gradient.addColorStop(0, 'rgba(30,24,20,0)');
    gradient.addColorStop(1, 'rgba(30,24,20,0.82)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

    ctx.font = `600 ${OVERLAY_FONT_SIZE}px ${OVERLAY_FONT_CSS_STACK}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const lines = wrapText(ctx, overlayText, EXPORT_WIDTH * OVERLAY_MAX_WIDTH_RATIO);
    const anchorBottom = isPrecomposedCta ? 210 : 140;
    const startY = EXPORT_HEIGHT - anchorBottom - (lines.length - 1) * OVERLAY_LINE_HEIGHT;
    lines.forEach((item, index) => {
      const y = startY + index * OVERLAY_LINE_HEIGHT;
      ctx.fillStyle = '#fffaf5';
      ctx.fillText(item, EXPORT_WIDTH / 2, y);
    });
  }

  if (!isPrecomposedCta) {
    await drawLogo(ctx, EXPORT_WIDTH, EXPORT_HEIGHT);
  }
  return canvas;
}

export async function renderSocialPostDataUrl(
  post: SocialPost,
  options?: { slideIndex?: number; imagePathOverride?: string | null },
): Promise<string> {
  const canvas = await renderSocialPostCanvas(post, options);
  return canvas.toDataURL('image/png');
}

export async function downloadSocialPostImage(post: SocialPost, slideIndex = 0) {
  const path =
    post.format === 'carousel' && post.carouselPaths?.[slideIndex]
      ? post.carouselPaths[slideIndex]
      : post.imagePath;
  const canvas = await renderSocialPostCanvas(post, { slideIndex, imagePathOverride: path });
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Export image échoué');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitmangas-${post.id}${post.format === 'carousel' ? `-s${slideIndex + 1}` : ''}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
