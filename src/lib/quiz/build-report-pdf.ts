import { jsPDF } from 'jspdf';

import { DISC_LETTER_COLOR, DISC_LETTER_LABEL, type DiscLetter } from '@/lib/quiz/disc-palette';
import { QUIZ_CARD_BY_SLUG, QUIZ_SECTION_IMAGES } from '@/lib/quiz/media';
import type { QuizDefinition, QuizLocale, QuizResult, QuizScore } from '@/lib/quiz/types';

const CREAM: [number, number, number] = [255, 250, 245];
const INK: [number, number, number] = [29, 29, 31];
const MUTED: [number, number, number] = [90, 85, 80];
const LINE: [number, number, number] = [220, 210, 200];
const TERRACOTTA: [number, number, number] = [196, 93, 62];

const MARGIN = 16;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TOP = 18;
const BOTTOM = PAGE_H - 16;
const LINE_H = 5;

type Slice = { letter: DiscLetter; percent: number; label: string; color: string };

/** Image déjà croppée, ratio exact = wPx/hPx. */
type PdfImg = { dataUrl: string; wPx: number; hPx: number };

type PdfCtx = {
  doc: jsPDF;
  y: number;
  accent: [number, number, number];
  locale: QuizLocale;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function fillPage(doc: jsPDF) {
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
}

function drawFooter(doc: jsPDF, page: number, total: number, locale: QuizLocale) {
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, PAGE_H - 11, PAGE_W - MARGIN, PAGE_H - 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  const left = locale === 'es' ? 'FitMangas · Perfil de disciplina' : 'FitMangas · Profil de discipline';
  doc.text(left, MARGIN, PAGE_H - 6);
  doc.text(`${page} / ${total}`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
}

function wrap(doc: jsPDF, text: string, maxW: number): string[] {
  return doc.splitTextToSize(text, maxW) as string[];
}

/** Parse object-position CSS "50% 18%" → focus 0–1. */
export function parseFocusY(objectPosition?: string): number {
  if (!objectPosition) return 0.2;
  const parts = objectPosition.trim().split(/\s+/);
  const yPart = parts[1] ?? parts[0] ?? '20%';
  const n = parseFloat(yPart);
  if (Number.isNaN(n)) return 0.2;
  return Math.min(1, Math.max(0, n / 100));
}

/**
 * Charge une image et la recadre (cover) au ratio demandé — jamais déformée.
 * aspect = largeur / hauteur (ex. 4/5 portrait, 2.4 bannière web).
 */
export async function loadCroppedJpeg(
  path: string,
  aspect: number,
  focusY = 0.2,
  maxEdge = 1400,
): Promise<PdfImg | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    const srcAspect = bmp.width / bmp.height;

    let sx = 0;
    let sy = 0;
    let sw = bmp.width;
    let sh = bmp.height;

    if (srcAspect > aspect) {
      // Source trop large → crop horizontal
      sw = Math.round(bmp.height * aspect);
      sx = Math.round((bmp.width - sw) / 2);
    } else {
      // Source trop haute → crop vertical (focus Y)
      sh = Math.round(bmp.width / aspect);
      const maxSy = bmp.height - sh;
      sy = Math.round(maxSy * focusY);
      sy = Math.min(maxSy, Math.max(0, sy));
    }

    const scale = Math.min(1, maxEdge / Math.max(sw, sh));
    const wPx = Math.max(1, Math.round(sw * scale));
    const hPx = Math.max(1, Math.round(sh * scale));

    const canvas = document.createElement('canvas');
    canvas.width = wPx;
    canvas.height = hPx;
    const c = canvas.getContext('2d');
    if (!c) {
      bmp.close();
      return null;
    }
    c.drawImage(bmp, sx, sy, sw, sh, 0, 0, wPx, hPx);
    bmp.close();
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.86), wPx, hPx };
  } catch {
    return null;
  }
}

/** Place une image dans une boîte max sans déformer. Retourne hauteur mm utilisée. */
export function placeImage(
  doc: jsPDF,
  img: PdfImg,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
): { w: number; h: number } {
  const aspect = img.wPx / img.hPx;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  doc.addImage(img.dataUrl, 'JPEG', x, y, w, h);
  return { w, h };
}

function newPage(ctx: PdfCtx) {
  ctx.doc.addPage();
  fillPage(ctx.doc);
  ctx.y = TOP;
}

function ensure(ctx: PdfCtx, needed: number) {
  if (ctx.y + needed > BOTTOM) newPage(ctx);
}

function writeLines(
  ctx: PdfCtx,
  lines: string[],
  opts: { x?: number; size?: number; color?: [number, number, number]; bold?: boolean; lineH?: number } = {},
) {
  const x = opts.x ?? MARGIN;
  const size = opts.size ?? 9.5;
  const color = opts.color ?? MUTED;
  const lineH = opts.lineH ?? LINE_H;
  ctx.doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
  ctx.doc.setFontSize(size);
  ctx.doc.setTextColor(...color);
  for (const line of lines) {
    ensure(ctx, lineH + 0.5);
    ctx.doc.text(line, x, ctx.y);
    ctx.y += lineH;
  }
}

function sectionTitle(ctx: PdfCtx, title: string, color: [number, number, number] = TERRACOTTA) {
  ensure(ctx, 16);
  ctx.doc.setFillColor(...color);
  ctx.doc.rect(MARGIN, ctx.y, 20, 1.4, 'F');
  ctx.y += 6;
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(10);
  ctx.doc.setTextColor(...color);
  ctx.doc.text(title.toUpperCase(), MARGIN, ctx.y);
  ctx.y += 7;
}

function addParagraphs(ctx: PdfCtx, items: string[]) {
  for (const item of items) {
    const lines = wrap(ctx.doc, item, CONTENT_W);
    ensure(ctx, lines.length * LINE_H + 3);
    writeLines(ctx, lines);
    ctx.y += 3;
  }
}

function addBullets(ctx: PdfCtx, items: string[], accent: [number, number, number]) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const lines = wrap(ctx.doc, item, CONTENT_W - 10);
    ensure(ctx, lines.length * LINE_H + 4);
    ctx.doc.setFillColor(...accent);
    ctx.doc.circle(MARGIN + 3.5, ctx.y - 1, 3.2, 'F');
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setFontSize(7);
    ctx.doc.setTextColor(255, 255, 255);
    ctx.doc.text(String(i + 1).padStart(2, '0'), MARGIN + 3.5, ctx.y + 0.4, { align: 'center' });
    writeLines(ctx, lines, { x: MARGIN + 9 });
    ctx.y += 3;
  }
}

/** Bannière type SectionBanner web : pleine largeur, hauteur = ratio crop (jamais étiré). */
function addWebBanner(
  ctx: PdfCtx,
  img: PdfImg | null,
  caption: string,
  accent: [number, number, number],
) {
  if (!img) return;
  const aspect = img.wPx / img.hPx;
  const w = CONTENT_W;
  const h = w / aspect; // ~70 mm pour aspect 2.55
  ensure(ctx, h + 6);
  ctx.doc.addImage(img.dataUrl, 'JPEG', MARGIN, ctx.y, w, h);
  ctx.doc.setFillColor(...accent);
  const pillW = Math.min(72, CONTENT_W * 0.48);
  ctx.doc.roundedRect(MARGIN + 4, ctx.y + h - 12, pillW, 8, 2, 2, 'F');
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(7);
  ctx.doc.setTextColor(255, 255, 255);
  ctx.doc.text(caption.toUpperCase().slice(0, 32), MARGIN + 7, ctx.y + h - 6.5);
  ctx.y += h + 5;
}

function renderDonutJpeg(slices: Slice[]): PdfImg {
  const size = 640;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#FFFAF5';
  c.fillRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const rOut = 220;
  const rIn = 118;
  let angle = -Math.PI / 2;
  const total = Math.max(1, slices.reduce((s, x) => s + Math.max(0, x.percent), 0));
  for (const slice of slices) {
    const sweep = (Math.max(0, slice.percent) / total) * Math.PI * 2;
    if (sweep <= 0.001) continue;
    c.beginPath();
    c.moveTo(cx, cy);
    c.arc(cx, cy, rOut, angle, angle + sweep);
    c.closePath();
    c.fillStyle = slice.color;
    c.fill();
    angle += sweep;
  }
  c.globalCompositeOperation = 'destination-out';
  c.beginPath();
  c.arc(cx, cy, rIn, 0, Math.PI * 2);
  c.fill();
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#FFFAF5';
  c.beginPath();
  c.arc(cx, cy, rIn - 2, 0, Math.PI * 2);
  c.fill();
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.92), wPx: size, hPx: size };
}

function renderRadarJpeg(slices: Slice[]): PdfImg {
  const size = 640;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#FFFAF5';
  c.fillRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const rMax = 200;
  const order: DiscLetter[] = ['D', 'E', 'A', 'M'];
  const byLetter = Object.fromEntries(slices.map((s) => [s.letter, s])) as Record<DiscLetter, Slice>;

  for (const ring of [0.25, 0.5, 0.75, 1]) {
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 4;
      const x = cx + Math.cos(a) * rMax * ring;
      const y = cy + Math.sin(a) * rMax * ring;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
    c.strokeStyle = 'rgba(29,29,31,0.12)';
    c.lineWidth = 2;
    c.stroke();
  }

  c.font = '700 28px Inter, system-ui, sans-serif';
  for (let i = 0; i < 4; i++) {
    const L = order[i]!;
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 4;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(a) * rMax, cy + Math.sin(a) * rMax);
    c.strokeStyle = 'rgba(29,29,31,0.14)';
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = DISC_LETTER_COLOR[L];
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(L, cx + Math.cos(a) * (rMax + 32), cy + Math.sin(a) * (rMax + 32));
  }

  c.beginPath();
  for (let i = 0; i < 4; i++) {
    const L = order[i]!;
    const pct = byLetter[L]?.percent ?? 0;
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 4;
    const r = rMax * (pct / 100);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.closePath();
  const primary = slices[0];
  c.fillStyle = primary ? `${primary.color}44` : 'rgba(196,93,62,0.25)';
  c.fill();
  c.strokeStyle = primary?.color ?? '#C45D3E';
  c.lineWidth = 5;
  c.stroke();

  return { dataUrl: canvas.toDataURL('image/jpeg', 0.92), wPx: size, hPx: size };
}

export async function buildDisciplineReportPdf(args: {
  quiz: QuizDefinition;
  result: QuizResult;
  score: QuizScore;
  locale: QuizLocale;
}): Promise<Blob> {
  const { quiz, result, score, locale } = args;
  const report = result.report;
  if (!report) throw new Error('Report missing');

  const letter = (result.letter as DiscLetter | undefined) ?? 'D';
  const accentHex = DISC_LETTER_COLOR[letter] ?? '#C45D3E';
  const accent = hexToRgb(accentHex);
  const styleName = result.styleName?.[locale] ?? result.title[locale];
  const colorLabel = DISC_LETTER_LABEL[locale][letter].short;
  const primaryPct = score.percents[result.id] ?? 0;
  const secondary = score.secondaryId ? quiz.results.find((r) => r.id === score.secondaryId) : null;
  const secondaryLetter = (secondary?.letter as DiscLetter | undefined) ?? null;
  const secondaryPct = secondary ? score.percents[secondary.id] ?? 0 : 0;
  const secondaryName = secondary?.styleName?.[locale] ?? secondary?.title[locale] ?? '';
  const card = QUIZ_CARD_BY_SLUG[quiz.slug];

  const slices: Slice[] = score.ranked
    .map((row) => {
      const profile = quiz.results.find((r) => r.id === row.id);
      if (!profile?.letter) return null;
      const L = profile.letter as DiscLetter;
      return {
        letter: L,
        percent: row.percent,
        label: DISC_LETTER_LABEL[locale][L].short,
        color: DISC_LETTER_COLOR[L],
      };
    })
    .filter(Boolean) as Slice[];

  // Bannière web ≈ 900×176 → aspect ~5.1 ; on utilise 2.6 pour lisibilité photo
  const BANNER_ASPECT = 2.55;

  const [logo, hero, howImg, forcesImg, stressImg, parlerImg, developImg] = await Promise.all([
    loadCroppedJpeg('/logo.png', 1, 0.5, 400),
    card ? loadCroppedJpeg(card.image, 4 / 5, 0.15, 1000) : Promise.resolve(null),
    loadCroppedJpeg(QUIZ_SECTION_IMAGES.how.src, BANNER_ASPECT, parseFocusY(QUIZ_SECTION_IMAGES.how.objectPosition)),
    loadCroppedJpeg(QUIZ_SECTION_IMAGES.forces.src, BANNER_ASPECT, parseFocusY(QUIZ_SECTION_IMAGES.forces.objectPosition)),
    loadCroppedJpeg(QUIZ_SECTION_IMAGES.stress.src, BANNER_ASPECT, parseFocusY(QUIZ_SECTION_IMAGES.stress.objectPosition)),
    loadCroppedJpeg(QUIZ_SECTION_IMAGES.parler.src, BANNER_ASPECT, parseFocusY(QUIZ_SECTION_IMAGES.parler.objectPosition)),
    loadCroppedJpeg(QUIZ_SECTION_IMAGES.develop.src, BANNER_ASPECT, parseFocusY(QUIZ_SECTION_IMAGES.develop.objectPosition)),
  ]);

  const donut = renderDonutJpeg(slices);
  const radar = renderRadarJpeg(slices);

  const L =
    locale === 'es'
      ? {
          kicker: 'EVALUACIÓN FITMANGAS',
          title: 'Tu perfil de disciplina',
          report: 'Tu informe',
          mix: 'Reparto',
          wheel: 'Parte de cada color',
          radar: 'Forma de tu mix',
          portrait: 'Quién eres aquí',
          how: 'Cómo funcionas',
          strengths: 'Tus fuerzas',
          limits: 'Tus límites',
          stress: 'Bajo estrés',
          fears: 'Tus miedos (útiles)',
          needs: 'Lo que necesitas para sostenerte',
          talk: 'Cómo hablarte',
          notalk: 'Lo que no hay que decirte',
          develop: 'Ejes de desarrollo',
          bridge: 'Y ahora',
          secondary: '2.ª color',
          note: 'Cuatro perfiles FitMangas (D · E · A · M). No es un test oficial Everything DiSC®.',
          cta: 'Probar el marco 7 días → fitmangas.com',
          not100: 'No eres 100 % de un solo color.',
        }
      : {
          kicker: 'ÉVALUATION FITMANGAS',
          title: 'Ton profil de discipline',
          report: 'Ton rapport',
          mix: 'Répartition',
          wheel: 'Part de chaque couleur',
          radar: 'Forme de ton mix',
          portrait: 'Qui tu es ici',
          how: 'Comment tu fonctionnes',
          strengths: 'Tes forces',
          limits: 'Tes limites — sans te juger',
          stress: 'Sous stress',
          fears: 'Tes peurs (utiles)',
          needs: 'Ce dont tu as besoin pour tenir',
          talk: 'Comment te parler',
          notalk: 'Ce qu’il ne faut pas te dire',
          develop: 'Axes de développement',
          bridge: 'Et maintenant',
          secondary: '2e couleur',
          note: 'Quatre profils FitMangas (D · E · A · M). Pas un test officiel Everything DiSC®.',
          cta: 'Tester le cadre 7 jours → fitmangas.com',
          not100: 'Tu n’es pas 100 % d’une seule couleur.',
        };

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  fillPage(doc);
  const ctx: PdfCtx = { doc, y: TOP, accent, locale };

  // ——— HERO (miroir page web) ———
  if (logo) {
    placeImage(doc, logo, MARGIN, 12, 12, 12);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TERRACOTTA);
  doc.text('FitMangas', logo ? MARGIN + 15 : MARGIN, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(L.kicker, MARGIN, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(L.report.toUpperCase(), MARGIN, 38);

  // Photo 4:5 + carte profil (même structure que le hero web)
  const heroTop = 44;
  const heroW = 68;
  const heroH = heroW / (4 / 5); // 85 mm — ratio exact, jamais compressé
  if (hero) {
    ctx.doc.addImage(hero.dataUrl, 'JPEG', MARGIN, heroTop, heroW, heroH);
  }
  const cardX = MARGIN + (hero ? heroW + 6 : 0);
  const cardW = CONTENT_W - (hero ? heroW + 6 : 0);
  doc.setFillColor(...accent);
  doc.roundedRect(cardX, heroTop, cardW, heroH, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${colorLabel} · ${letter}`, cardX + 8, heroTop + 16);
  doc.setFontSize(16);
  let ny = heroTop + 32;
  for (const line of wrap(doc, styleName, cardW - 16).slice(0, 2)) {
    doc.text(line, cardX + 8, ny);
    ny += 8;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(`${primaryPct} %`, cardX + 8, heroTop + heroH - 14);

  ctx.y = heroTop + heroH + 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  for (const line of wrap(doc, result.tagline[locale], CONTENT_W)) {
    doc.text(line, MARGIN, ctx.y);
    ctx.y += 5.5;
  }
  if (secondary && secondaryLetter) {
    ctx.y += 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(
      `${L.secondary} · ${DISC_LETTER_LABEL[locale][secondaryLetter].short} (${secondaryLetter}) — ${secondaryName} (${secondaryPct}%)`,
      MARGIN,
      ctx.y,
    );
    ctx.y += 5;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TERRACOTTA);
  doc.text(L.not100, MARGIN, ctx.y);
  ctx.y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(L.note, MARGIN, ctx.y);
  ctx.y += 10;

  // ——— MIX ———
  sectionTitle(ctx, L.mix);
  const chartSize = 62;
  ensure(ctx, chartSize + 14);
  placeImage(doc, donut, MARGIN, ctx.y, chartSize, chartSize);
  placeImage(doc, radar, MARGIN + chartSize + 10, ctx.y, chartSize, chartSize);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...TERRACOTTA);
  doc.text(L.wheel.toUpperCase(), MARGIN, ctx.y + chartSize + 5);
  doc.text(L.radar.toUpperCase(), MARGIN + chartSize + 10, ctx.y + chartSize + 5);
  ctx.y += chartSize + 12;

  for (const slice of slices) {
    ensure(ctx, 12);
    const c = hexToRgb(slice.color);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`${slice.label} (${slice.letter})`, MARGIN, ctx.y);
    doc.text(`${slice.percent} %`, PAGE_W - MARGIN, ctx.y, { align: 'right' });
    ctx.y += 3.5;
    doc.setFillColor(...LINE);
    doc.roundedRect(MARGIN, ctx.y, CONTENT_W, 4.5, 1.5, 1.5, 'F');
    const barW = slice.percent <= 0 ? 0 : Math.max(4, (CONTENT_W * slice.percent) / 100);
    if (barW > 0) {
      doc.setFillColor(...c);
      doc.roundedRect(MARGIN, ctx.y, barW, 4.5, 1.5, 1.5, 'F');
    } else {
      doc.setFillColor(...c);
      doc.circle(MARGIN + 2.5, ctx.y + 2.25, 2.2, 'F');
    }
    ctx.y += 10;
  }

  // ——— PORTRAIT (comme web : citation + suite) ———
  sectionTitle(ctx, L.portrait);
  const quote = report.portrait[locale][0] ?? '';
  const quoteLines = wrap(doc, quote, CONTENT_W - 8);
  ensure(ctx, quoteLines.length * 6 + 8);
  doc.setDrawColor(...accent);
  doc.setLineWidth(1.2);
  doc.line(MARGIN, ctx.y - 2, MARGIN, ctx.y + quoteLines.length * 6);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  for (const line of quoteLines) {
    doc.text(line, MARGIN + 5, ctx.y);
    ctx.y += 6;
  }
  ctx.y += 4;
  addParagraphs(ctx, report.portrait[locale].slice(1));

  // ——— HOW ———
  sectionTitle(ctx, L.how);
  addWebBanner(ctx, howImg, L.how, accent);
  addBullets(ctx, report.howYouWork[locale], accent);

  // ——— FORCES / LIMITES ———
  sectionTitle(ctx, L.strengths, [107, 143, 113]);
  addWebBanner(ctx, forcesImg, L.strengths, [107, 143, 113]);
  addParagraphs(ctx, report.strengths[locale]);
  sectionTitle(ctx, L.limits, [91, 124, 141]);
  addBullets(ctx, report.limits[locale], [91, 124, 141]);

  // ——— STRESS / PEURS / BESOINS ———
  sectionTitle(ctx, L.stress);
  addWebBanner(ctx, stressImg, L.stress, accent);
  addParagraphs(ctx, report.underStress[locale]);
  sectionTitle(ctx, L.fears);
  addBullets(ctx, report.fears[locale], accent);
  sectionTitle(ctx, L.needs);
  addParagraphs(ctx, report.needs[locale]);

  // ——— PARLER ———
  sectionTitle(ctx, L.talk);
  addWebBanner(ctx, parlerImg, L.talk, accent);
  addBullets(ctx, report.howToTalk[locale], accent);
  sectionTitle(ctx, L.notalk);
  addParagraphs(ctx, report.howNotToTalk[locale]);

  // ——— DEVELOP / BRIDGE ———
  sectionTitle(ctx, L.develop);
  addWebBanner(ctx, developImg, L.develop, accent);
  addParagraphs(ctx, report.develop[locale]);
  sectionTitle(ctx, L.bridge);
  addParagraphs(ctx, [result.bridge[locale]]);
  ensure(ctx, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TERRACOTTA);
  doc.text(L.cta, MARGIN, ctx.y);

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total, locale);
  }

  return doc.output('blob');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
