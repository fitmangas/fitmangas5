import { DISC_LETTER_COLOR, DISC_LETTER_LABEL, type DiscLetter } from '@/lib/quiz/disc-palette';
import type { QuizDefinition, QuizLocale, QuizResult, QuizScore } from '@/lib/quiz/types';

const W = 1080;
const H = 1350; // 4:5 — Stories crop + posts IG

type ShareCardArgs = {
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
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  // Fond crème
  ctx.fillStyle = '#FFFAF5';
  ctx.fillRect(0, 0, W, H);

  // Bande accent haut
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 16);

  // Logo
  const logo = await loadImage('/logo.png');
  if (logo) {
    ctx.drawImage(logo, 64, 56, 72, 72);
  }
  ctx.fillStyle = '#C45D3E';
  ctx.font = '700 36px Inter, system-ui, sans-serif';
  ctx.fillText('FitMangas', logo ? 152 : 64, 104);

  // Kicker
  ctx.fillStyle = '#C45D3E';
  ctx.font = '700 22px Inter, system-ui, sans-serif';
  const kicker = locale === 'es' ? 'MI PERFIL DE DISCIPLINA' : 'MON PROFIL DE DISCIPLINE';
  ctx.fillText(kicker, 64, 200);

  // Carte profil
  roundRect(ctx, 64, 240, W - 128, 320, 36);
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 28px Inter, system-ui, sans-serif';
  ctx.fillText(`${colorLabel}  ·  ${letter}`, 100, 310);

  ctx.font = '700 64px Inter, system-ui, sans-serif';
  const nameLines = wrapCanvas(ctx, styleName, W - 220, 2);
  let nameY = 390;
  for (const line of nameLines) {
    ctx.fillText(line, 100, nameY);
    nameY += 72;
  }

  ctx.font = '600 42px Inter, system-ui, sans-serif';
  ctx.fillText(`${primaryPct} %`, 100, 520);

  // Tagline
  ctx.fillStyle = '#1D1D1F';
  ctx.font = '400 32px Inter, system-ui, sans-serif';
  const tagLines = wrapCanvas(ctx, result.tagline[locale], W - 128, 3);
  let tagY = 620;
  for (const line of tagLines) {
    ctx.fillText(line, 64, tagY);
    tagY += 44;
  }

  // Mix mini-bars
  let barY = 780;
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  for (const row of score.ranked.slice(0, 4)) {
    const profile = args.quiz.results.find((r) => r.id === row.id);
    if (!profile?.letter) continue;
    const L = profile.letter as DiscLetter;
    const c = DISC_LETTER_COLOR[L];
    ctx.fillStyle = '#1D1D1F';
    ctx.fillText(`${DISC_LETTER_LABEL[locale][L].short}  ${row.percent}%`, 64, barY);
    ctx.fillStyle = '#E8DFD6';
    roundRect(ctx, 64, barY + 12, W - 128, 18, 9);
    ctx.fill();
    ctx.fillStyle = c;
    const bw = Math.max(18, ((W - 128) * row.percent) / 100);
    roundRect(ctx, 64, barY + 12, bw, 18, 9);
    ctx.fill();
    barY += 70;
  }

  if (secondary && secondaryLetter) {
    ctx.fillStyle = '#5A5550';
    ctx.font = '400 24px Inter, system-ui, sans-serif';
    const secLabel =
      locale === 'es'
        ? `2.ª : ${DISC_LETTER_LABEL[locale][secondaryLetter].short} · ${secondaryPct}%`
        : `2e : ${DISC_LETTER_LABEL[locale][secondaryLetter].short} · ${secondaryPct}%`;
    ctx.fillText(secLabel, 64, barY + 10);
  }

  // Pied
  ctx.fillStyle = accent;
  ctx.fillRect(0, H - 120, W, 120);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 28px Inter, system-ui, sans-serif';
  ctx.fillText('fitmangas.com', 64, H - 55);
  ctx.font = '400 22px Inter, system-ui, sans-serif';
  ctx.fillText(locale === 'es' ? 'Pilates & Barre en visio' : 'Pilates & Barre en visio', 64, H - 28);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG failed'));
    }, 'image/png');
  });
}

export async function shareOrDownloadCard(args: ShareCardArgs & { shareText: string }) {
  const blob = await buildShareCardPng(args);
  const filename = `fitmangas-profil-${args.result.letter ?? 'x'}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: args.result.styleName?.[args.locale] ?? args.result.title[args.locale],
        text: args.shareText,
      });
      return 'shared' as const;
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return 'cancelled' as const;
  }

  // Fallback : télécharger l’image + copier le texte
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  try {
    await navigator.clipboard.writeText(`${args.shareText}\nhttps://fitmangas.com`);
  } catch {
    /* ignore */
  }
  return 'downloaded' as const;
}
