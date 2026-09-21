import { DISC_LETTER_COLOR, DISC_LETTER_LABEL, type DiscLetter } from '@/lib/quiz/disc-palette';
import type { QuizDefinition, QuizLocale, QuizResult, QuizScore } from '@/lib/quiz/types';

/** Canvas total : marge pour ombre + coins arrondis visibles. */
const OUTER_W = 1080;
const OUTER_H = 1350;
const PAD = 48;
const CARD_R = 48;
const INNER_W = OUTER_W - PAD * 2;
const INNER_H = OUTER_H - PAD * 2;

export type ShareCardArgs = {
  quiz: QuizDefinition;
  result: QuizResult;
  score: QuizScore;
  locale: QuizLocale;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.length > 0) {
    const last = lines[maxLines - 1];
    if (last && !text.endsWith(last)) {
      lines[maxLines - 1] = `${last.replace(/\s+\S*$/, '')}…`;
    }
  }
  return lines;
}

export async function buildShareCardPng(args: ShareCardArgs): Promise<Blob> {
  const { result, score, locale } = args;
  const letter = (result.letter as DiscLetter | undefined) ?? 'D';
  const accent = DISC_LETTER_COLOR[letter];
  const styleName = result.styleName?.[locale] ?? result.title[locale];
  const colorLabel = DISC_LETTER_LABEL[locale][letter].short;
  const primaryPct = score.percents[result.id] ?? 0;
  const secondary = score.secondaryId ? args.quiz.results.find((r) => r.id === score.secondaryId) : null;
  const secondaryLetter = (secondary?.letter as DiscLetter | undefined) ?? null;
  const secondaryPct = secondary ? score.percents[secondary.id] ?? 0 : 0;

  const canvas = document.createElement('canvas');
  canvas.width = OUTER_W;
  canvas.height = OUTER_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  // Fond transparent doux (zone hors carte)
  ctx.clearRect(0, 0, OUTER_W, OUTER_H);
  ctx.fillStyle = '#F3EDE6';
  ctx.fillRect(0, 0, OUTER_W, OUTER_H);

  const ix = PAD;
  const iy = PAD;

  // Ombre portée
  ctx.save();
  ctx.shadowColor = 'rgba(28, 24, 20, 0.28)';
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 22;
  roundRect(ctx, ix, iy, INNER_W, INNER_H, CARD_R);
  ctx.fillStyle = '#FFFAF5';
  ctx.fill();
  ctx.restore();

  // Clip carte
  ctx.save();
  roundRect(ctx, ix, iy, INNER_W, INNER_H, CARD_R);
  ctx.clip();

  // Fond crème carte
  ctx.fillStyle = '#FFFAF5';
  ctx.fillRect(ix, iy, INNER_W, INNER_H);

  // Bande accent haut (arrondie via clip)
  ctx.fillStyle = accent;
  ctx.fillRect(ix, iy, INNER_W, 14);

  const contentX = ix + 56;
  const contentW = INNER_W - 112;

  // Logo
  const logo = await loadImage('/logo.png');
  if (logo) {
    ctx.drawImage(logo, contentX, iy + 44, 64, 64);
  }
  ctx.fillStyle = '#C45D3E';
  ctx.font = '700 34px Inter, system-ui, sans-serif';
  ctx.fillText('FitMangas', logo ? contentX + 80 : contentX, iy + 88);

  // Kicker
  ctx.fillStyle = '#C45D3E';
  ctx.font = '700 20px Inter, system-ui, sans-serif';
  const kicker = locale === 'es' ? 'MI PERFIL DE DISCIPLINA' : 'MON PROFIL DE DISCIPLINE';
  ctx.fillText(kicker, contentX, iy + 160);

  // Carte profil (ombre interne légère)
  const profileY = iy + 190;
  const profileH = 280;
  ctx.save();
  ctx.shadowColor = 'rgba(28, 24, 20, 0.18)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, contentX, profileY, contentW, profileH, 32);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.restore();

  // Reflet translucide
  roundRect(ctx, contentX, profileY, contentW, profileH, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 26px Inter, system-ui, sans-serif';
  ctx.fillText(`${colorLabel}  ·  ${letter}`, contentX + 36, profileY + 56);

  ctx.font = '700 58px Inter, system-ui, sans-serif';
  const nameLines = wrapCanvas(ctx, styleName, contentW - 80, 2);
  let nameY = profileY + 130;
  for (const line of nameLines) {
    ctx.fillText(line, contentX + 36, nameY);
    nameY += 64;
  }

  ctx.font = '600 40px Inter, system-ui, sans-serif';
  ctx.fillText(`${primaryPct} %`, contentX + 36, profileY + 240);

  // Tagline
  ctx.fillStyle = '#1D1D1F';
  ctx.font = '400 28px Inter, system-ui, sans-serif';
  const tagLines = wrapCanvas(ctx, result.tagline[locale], contentW, 3);
  let tagY = profileY + profileH + 48;
  for (const line of tagLines) {
    ctx.fillText(line, contentX, tagY);
    tagY += 38;
  }

  // Mix bars
  let barY = tagY + 36;
  ctx.font = '600 20px Inter, system-ui, sans-serif';
  for (const row of score.ranked.slice(0, 4)) {
    const profile = args.quiz.results.find((r) => r.id === row.id);
    if (!profile?.letter) continue;
    const L = profile.letter as DiscLetter;
    const c = DISC_LETTER_COLOR[L];
    ctx.fillStyle = '#1D1D1F';
    ctx.fillText(`${DISC_LETTER_LABEL[locale][L].short}  ${row.percent}%`, contentX, barY);

    roundRect(ctx, contentX, barY + 14, contentW, 16, 8);
    ctx.fillStyle = '#EDE4DA';
    ctx.fill();

    const bw = row.percent <= 0 ? 0 : Math.max(16, (contentW * row.percent) / 100);
    if (bw > 0) {
      roundRect(ctx, contentX, barY + 14, bw, 16, 8);
      ctx.fillStyle = c;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(contentX + 8, barY + 22, 7, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
    }
    barY += 62;
  }

  if (secondary && secondaryLetter) {
    ctx.fillStyle = '#6B6560';
    ctx.font = '400 22px Inter, system-ui, sans-serif';
    const secLabel =
      locale === 'es'
        ? `2.ª : ${DISC_LETTER_LABEL[locale][secondaryLetter].short} · ${secondaryPct}%`
        : `2e : ${DISC_LETTER_LABEL[locale][secondaryLetter].short} · ${secondaryPct}%`;
    ctx.fillText(secLabel, contentX, barY + 8);
  }

  // Pied
  const footH = 100;
  ctx.fillStyle = accent;
  ctx.fillRect(ix, iy + INNER_H - footH, INNER_W, footH);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 26px Inter, system-ui, sans-serif';
  ctx.fillText('fitmangas.com', contentX, iy + INNER_H - 48);
  ctx.font = '400 20px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('Pilates & Barre en visio', contentX, iy + INNER_H - 22);

  ctx.restore();

  // Contour subtil carte
  roundRect(ctx, ix, iy, INNER_W, INNER_H, CARD_R);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 2;
  ctx.stroke();

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG failed'));
    }, 'image/png');
  });
}

export function downloadShareBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

export async function shareFileNative(file: File, text: string, title: string) {
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text });
    return true;
  }
  return false;
}
