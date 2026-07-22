import type { SocialPost } from '@/lib/admin/social-comms';

export const SOCIAL_LOGO_PATH = '/logo.png';
const EXPORT_SIZE = 1080;

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
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
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

async function drawLogo(ctx: CanvasRenderingContext2D, size: number) {
  try {
    const logo = await loadImage(SOCIAL_LOGO_PATH);
    const maxW = size * 0.16;
    const scale = Math.min(maxW / logo.width, maxW / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    drawLogoTransparent(ctx, logo, size * 0.05, size * 0.05, w, h);
  } catch {
    // Logo optionnel
  }
}

/** Rendu canvas partagé (preview + téléchargement). */
export async function renderSocialPostCanvas(post: SocialPost): Promise<HTMLCanvasElement> {
  if (!post.imagePath) throw new Error('Aucune image');

  const img = await loadImage(post.imagePath);
  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponible');

  const scale = Math.max(EXPORT_SIZE / img.width, EXPORT_SIZE / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (EXPORT_SIZE - w) / 2, (EXPORT_SIZE - h) / 2, w, h);

  const overlayText = (post.overlayText || post.title).trim();

  if (post.useOverlay && overlayText) {
    const gradient = ctx.createLinearGradient(0, EXPORT_SIZE * 0.45, 0, EXPORT_SIZE);
    gradient.addColorStop(0, 'rgba(30,24,20,0)');
    gradient.addColorStop(1, 'rgba(30,24,20,0.78)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);

    ctx.fillStyle = '#fffaf5';
    ctx.font = '600 54px Georgia, serif';
    ctx.textAlign = 'center';
    const lines = wrapText(ctx, overlayText, EXPORT_SIZE * 0.82);
    const startY = EXPORT_SIZE - 160 - (lines.length - 1) * 62;
    lines.forEach((item, index) => {
      ctx.fillText(item, EXPORT_SIZE / 2, startY + index * 62);
    });
  }

  await drawLogo(ctx, EXPORT_SIZE);
  return canvas;
}

export async function renderSocialPostDataUrl(post: SocialPost): Promise<string> {
  const canvas = await renderSocialPostCanvas(post);
  return canvas.toDataURL('image/png');
}

export async function downloadSocialPostImage(post: SocialPost) {
  const canvas = await renderSocialPostCanvas(post);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Export image échoué');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitmangas-${post.id}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
