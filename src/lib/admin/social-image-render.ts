import type { SocialPost } from '@/lib/admin/social-comms';
import { creamTopCropRows } from '@/lib/admin/social-image-letterbox';

export const SOCIAL_LOGO_PATH = '/logo.png';
/** Instagram feed / carousel portrait (4:5). */
export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1350;

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
    // ~12% de la largeur, marge 4% — logo entier, jamais coupé
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
  post: Pick<SocialPost, 'overlayText' | 'carouselSlideTitles' | 'useOverlay' | 'format' | 'hookTitle' | 'title'>,
  slideIndex = 0,
): string {
  const titles = post.carouselSlideTitles ?? [];
  if (post.format === 'carousel' && titles[slideIndex]?.trim()) {
    return titles[slideIndex]!.trim().toLocaleUpperCase('fr-FR');
  }
  const overlay = (post.overlayText || '').trim();
  if (overlay) return overlay.toLocaleUpperCase('fr-FR');
  if (slideIndex === 0) {
    const hook = (post.hookTitle || post.title || '').trim();
    if (hook) return hook.toLocaleUpperCase('fr-FR');
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

  if (isPrecomposedCta) {
    const scale = Math.min(EXPORT_WIDTH / img.width, EXPORT_HEIGHT / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.fillStyle = '#2a2420';
    ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
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
      // Recadrage optionnel — on garde l’image entière
    }
    const scale = Math.max(EXPORT_WIDTH / sw, EXPORT_HEIGHT / sh);
    const w = sw * scale;
    const h = sh * scale;
    const dx = (EXPORT_WIDTH - w) / 2;
    const dy =
      post.format === 'carousel' && slideIndex === 0
        ? 0
        : (EXPORT_HEIGHT - h) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, w, h);
  }

  const overlayText = resolveSlideOverlayText(post, slideIndex);
  const burnOverlay = post.useOverlay || post.format === 'carousel';

  if (burnOverlay && overlayText) {
    const gradient = ctx.createLinearGradient(0, EXPORT_HEIGHT * 0.55, 0, EXPORT_HEIGHT);
    gradient.addColorStop(0, 'rgba(30,24,20,0)');
    gradient.addColorStop(1, 'rgba(30,24,20,0.82)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

    ctx.fillStyle = '#fffaf5';
    ctx.font = '600 52px Georgia, serif';
    ctx.textAlign = 'center';
    const lines = wrapText(ctx, overlayText, EXPORT_WIDTH * 0.86);
    const anchorBottom = isPrecomposedCta ? 210 : 140;
    const startY = EXPORT_HEIGHT - anchorBottom - (lines.length - 1) * 58;
    lines.forEach((item, index) => {
      ctx.fillText(item, EXPORT_WIDTH / 2, startY + index * 58);
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
