import { jsPDF } from 'jspdf';

import { DISC_LETTER_COLOR, DISC_LETTER_LABEL, type DiscLetter } from '@/lib/quiz/disc-palette';
import { QUIZ_CARD_BY_SLUG, QUIZ_SECTION_IMAGES } from '@/lib/quiz/media';
import type { QuizDefinition, QuizLocale, QuizResult, QuizScore } from '@/lib/quiz/types';

const CREAM: [number, number, number] = [255, 250, 245];
const INK: [number, number, number] = [29, 29, 31];
const MUTED: [number, number, number] = [90, 85, 80];
const LINE: [number, number, number] = [220, 210, 200];
const TERRACOTTA: [number, number, number] = [196, 93, 62];

const MARGIN = 14;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TOP = 16;
const BOTTOM = PAGE_H - 18;
const LINE_H = 4.8;

type Slice = { letter: DiscLetter; percent: number; label: string; color: string };

type PdfCtx = {
  doc: jsPDF;
  y: number;
  pagesWithFooter: boolean[];
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
  doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  const left = locale === 'es' ? 'FitMangas · Perfil de disciplina' : 'FitMangas · Profil de discipline';
  doc.text(left, MARGIN, PAGE_H - 6.5);
  doc.text(`${page} / ${total}`, PAGE_W - MARGIN, PAGE_H - 6.5, { align: 'right' });
}

function wrap(doc: jsPDF, text: string, maxW: number): string[] {
  return doc.splitTextToSize(text, maxW) as string[];
}

async function fetchAsJpegDataUrl(path: string, maxEdge = 1200): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    if (!c) return null;
    c.fillStyle = '#FFFAF5';
    c.fillRect(0, 0, w, h);
    c.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return null;
  }
}

function newPage(ctx: PdfCtx) {
  ctx.doc.addPage();
  fillPage(ctx.doc);
  ctx.pagesWithFooter.push(true);
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

function sectionTitle(ctx: PdfCtx, title: string) {
  ensure(ctx, 14);
  ctx.doc.setFillColor(...ctx.accent);
  ctx.doc.rect(MARGIN, ctx.y, 22, 1.5, 'F');
  ctx.y += 6.5;
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(11);
  ctx.doc.setTextColor(...INK);
  ctx.doc.text(title.toUpperCase(), MARGIN, ctx.y);
  ctx.y += 7;
}

function addParagraphs(ctx: PdfCtx, items: string[]) {
  for (const item of items) {
    const lines = wrap(ctx.doc, item, CONTENT_W);
    ensure(ctx, lines.length * LINE_H + 4);
    writeLines(ctx, lines);
    ctx.y += 3.5;
  }
}

function addBullets(ctx: PdfCtx, items: string[]) {
  for (const item of items) {
    const lines = wrap(ctx.doc, item, CONTENT_W - 8);
    ensure(ctx, lines.length * LINE_H + 3);
    ctx.doc.setFillColor(...ctx.accent);
    ctx.doc.circle(MARGIN + 1.8, ctx.y - 1, 1.5, 'F');
    writeLines(ctx, lines, { x: MARGIN + 7 });
    ctx.y += 2.5;
  }
}

function addBannerImage(ctx: PdfCtx, jpeg: string | null, caption: string) {
  if (!jpeg) return;
  const h = 42;
  ensure(ctx, h + 8);
  try {
    ctx.doc.addImage(jpeg, 'JPEG', MARGIN, ctx.y, CONTENT_W, h);
  } catch {
    /* ignore */
  }
  ctx.doc.setFillColor(...ctx.accent);
  ctx.doc.rect(MARGIN, ctx.y + h - 8, Math.min(58, CONTENT_W), 8, 'F');
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(7);
  ctx.doc.setTextColor(255, 255, 255);
  ctx.doc.text(caption.toUpperCase().slice(0, 28), MARGIN + 2.5, ctx.y + h - 2.8);
  ctx.y += h + 6;
}

/** Donut mix → JPEG data URL */
function renderDonutJpeg(slices: Slice[]): string {
  const size = 520;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#FFFAF5';
  c.fillRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const rOut = 200;
  const rIn = 108;
  let angle = -Math.PI / 2;
  const total = Math.max(1, slices.reduce((s, x) => s + x.percent, 0));
  for (const slice of slices) {
    const sweep = (slice.percent / total) * Math.PI * 2;
    if (sweep <= 0) continue;
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
  c.arc(cx, cy, rIn, 0, Math.PI * 2);
  c.fill();
  return canvas.toDataURL('image/jpeg', 0.9);
}

/** Radar mix → JPEG */
function renderRadarJpeg(slices: Slice[]): string {
  const size = 520;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#FFFAF5';
  c.fillRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const rMax = 180;
  const order: DiscLetter[] = ['D', 'E', 'A', 'M'];
  const byLetter = Object.fromEntries(slices.map((s) => [s.letter, s])) as Record<DiscLetter, Slice>;

  // Grille
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

  // Axes + labels
  c.font = '700 22px Inter, system-ui, sans-serif';
  c.fillStyle = '#1D1D1F';
  for (let i = 0; i < 4; i++) {
    const L = order[i]!;
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 4;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(a) * rMax, cy + Math.sin(a) * rMax);
    c.strokeStyle = 'rgba(29,29,31,0.15)';
    c.lineWidth = 2;
    c.stroke();
    const lx = cx + Math.cos(a) * (rMax + 28);
    const ly = cy + Math.sin(a) * (rMax + 28);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = DISC_LETTER_COLOR[L];
    c.fillText(L, lx, ly);
  }

  // Forme
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
  c.fillStyle = primary ? `${primary.color}55` : 'rgba(196,93,62,0.3)';
  c.fill();
  c.strokeStyle = primary?.color ?? '#C45D3E';
  c.lineWidth = 4;
  c.stroke();

  return canvas.toDataURL('image/jpeg', 0.9);
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

  const [
    logoJpeg,
    heroJpeg,
    howJpeg,
    forcesJpeg,
    stressJpeg,
    parlerJpeg,
    developJpeg,
  ] = await Promise.all([
    fetchAsJpegDataUrl('/logo.png', 400),
    card ? fetchAsJpegDataUrl(card.image, 1000) : Promise.resolve(null),
    fetchAsJpegDataUrl(QUIZ_SECTION_IMAGES.how.src, 900),
    fetchAsJpegDataUrl(QUIZ_SECTION_IMAGES.forces.src, 900),
    fetchAsJpegDataUrl(QUIZ_SECTION_IMAGES.stress.src, 900),
    fetchAsJpegDataUrl(QUIZ_SECTION_IMAGES.parler.src, 900),
    fetchAsJpegDataUrl(QUIZ_SECTION_IMAGES.develop.src, 900),
  ]);

  const donutJpeg = renderDonutJpeg(slices);
  const radarJpeg = renderRadarJpeg(slices);

  const labels =
    locale === 'es'
      ? {
          coverKicker: 'EVALUACIÓN FITMANGAS',
          coverTitle: 'Tu perfil de disciplina',
          mix: 'Tu mix',
          wheel: 'Parte de cada color',
          radar: 'Forma de tu mix',
          portrait: 'Quién eres aquí',
          how: 'Cómo funcionas',
          strengths: 'Tus fuerzas',
          limits: 'Tus límites',
          stress: 'Bajo estrés',
          fears: 'Tus miedos útiles',
          needs: 'Lo que necesitas para sostenerte',
          talk: 'Cómo hablarte',
          notalk: 'Lo que no hay que decirte',
          develop: 'Ejes de desarrollo',
          bridge: 'Y ahora',
          secondary: '2.ª color',
          note: 'Cuatro perfiles FitMangas (D · E · A · M). No es un test oficial Everything DiSC®.',
          cta: 'Probar el marco 7 días → fitmangas.com',
        }
      : {
          coverKicker: 'ÉVALUATION FITMANGAS',
          coverTitle: 'Ton profil de discipline',
          mix: 'Ton mix',
          wheel: 'Part de chaque couleur',
          radar: 'Forme de ton mix',
          portrait: 'Qui tu es ici',
          how: 'Comment tu fonctionnes',
          strengths: 'Tes forces',
          limits: 'Tes limites',
          stress: 'Sous stress',
          fears: 'Tes peurs utiles',
          needs: 'Ce dont tu as besoin pour tenir',
          talk: 'Comment te parler',
          notalk: 'Ce qu’il ne faut pas te dire',
          develop: 'Axes de développement',
          bridge: 'Et maintenant',
          secondary: '2e couleur',
          note: 'Quatre profils FitMangas (D · E · A · M). Pas un test officiel Everything DiSC®.',
          cta: 'Tester le cadre 7 jours → fitmangas.com',
        };

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  fillPage(doc);

  const ctx: PdfCtx = {
    doc,
    y: TOP,
    pagesWithFooter: [false],
    accent,
    locale,
  };

  // ——— COVER dense ———
  if (logoJpeg) {
    try {
      doc.addImage(logoJpeg, 'JPEG', MARGIN, 12, 14, 14);
    } catch {
      /* ignore */
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TERRACOTTA);
  doc.text('FitMangas', logoJpeg ? MARGIN + 17 : MARGIN, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(labels.coverKicker, MARGIN, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text(labels.coverTitle, MARGIN, 42);

  // Hero photo + profil card côte à côte
  const heroH = 78;
  if (heroJpeg) {
    try {
      doc.addImage(heroJpeg, 'JPEG', MARGIN, 48, 72, heroH);
    } catch {
      /* ignore */
    }
  }
  const cardX = heroJpeg ? MARGIN + 76 : MARGIN;
  const cardW = heroJpeg ? CONTENT_W - 76 : CONTENT_W;
  doc.setFillColor(...accent);
  doc.roundedRect(cardX, 48, cardW, heroH, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${colorLabel} · ${letter}`, cardX + 8, 64);
  doc.setFontSize(18);
  const nameLines = wrap(doc, styleName, cardW - 16);
  let ny = 78;
  for (const line of nameLines.slice(0, 2)) {
    doc.text(line, cardX + 8, ny);
    ny += 8;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(`${primaryPct} %`, cardX + 8, 112);

  ctx.y = 48 + heroH + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  for (const line of wrap(doc, result.tagline[locale], CONTENT_W)) {
    doc.text(line, MARGIN, ctx.y);
    ctx.y += 5;
  }
  if (secondary && secondaryLetter) {
    ctx.y += 2;
    doc.setFontSize(9);
    doc.text(
      `${labels.secondary} : ${DISC_LETTER_LABEL[locale][secondaryLetter].short} (${secondaryLetter}) — ${secondaryName} · ${secondaryPct} %`,
      MARGIN,
      ctx.y,
    );
    ctx.y += 6;
  }
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(labels.note, MARGIN, ctx.y);
  ctx.y += 8;

  // ——— MIX + graphiques (même page si place) ———
  sectionTitle(ctx, labels.mix);
  ensure(ctx, 78);
  const chartSize = 72;
  try {
    doc.addImage(donutJpeg, 'JPEG', MARGIN, ctx.y, chartSize, chartSize);
    doc.addImage(radarJpeg, 'JPEG', MARGIN + chartSize + 8, ctx.y, chartSize, chartSize);
  } catch {
    /* ignore */
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...TERRACOTTA);
  doc.text(labels.wheel.toUpperCase(), MARGIN, ctx.y + chartSize + 5);
  doc.text(labels.radar.toUpperCase(), MARGIN + chartSize + 8, ctx.y + chartSize + 5);
  ctx.y += chartSize + 10;

  // Barres
  for (const slice of slices) {
    ensure(ctx, 11);
    const c = hexToRgb(slice.color);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`${slice.label} (${slice.letter})`, MARGIN, ctx.y);
    doc.text(`${slice.percent} %`, PAGE_W - MARGIN, ctx.y, { align: 'right' });
    ctx.y += 3.5;
    doc.setFillColor(...LINE);
    doc.rect(MARGIN, ctx.y, CONTENT_W, 4.5, 'F');
    const barW = slice.percent <= 0 ? 0 : Math.max(3, (CONTENT_W * slice.percent) / 100);
    if (barW > 0) {
      doc.setFillColor(...c);
      doc.rect(MARGIN, ctx.y, barW, 4.5, 'F');
    } else {
      doc.setFillColor(...c);
      doc.circle(MARGIN + 2.2, ctx.y + 2.2, 2, 'F');
    }
    ctx.y += 9;
  }

  // ——— Contenu fluide (pas de page vide) ———
  sectionTitle(ctx, labels.portrait);
  addParagraphs(ctx, report.portrait[locale]);

  sectionTitle(ctx, labels.how);
  addBannerImage(ctx, howJpeg, labels.how);
  addBullets(ctx, report.howYouWork[locale]);

  sectionTitle(ctx, labels.strengths);
  addBannerImage(ctx, forcesJpeg, labels.strengths);
  addParagraphs(ctx, report.strengths[locale]);
  sectionTitle(ctx, labels.limits);
  addBullets(ctx, report.limits[locale]);

  sectionTitle(ctx, labels.stress);
  addBannerImage(ctx, stressJpeg, labels.stress);
  addParagraphs(ctx, report.underStress[locale]);
  sectionTitle(ctx, labels.fears);
  addBullets(ctx, report.fears[locale]);

  sectionTitle(ctx, labels.needs);
  addParagraphs(ctx, report.needs[locale]);

  sectionTitle(ctx, labels.talk);
  addBannerImage(ctx, parlerJpeg, labels.talk);
  addBullets(ctx, report.howToTalk[locale]);
  sectionTitle(ctx, labels.notalk);
  addParagraphs(ctx, report.howNotToTalk[locale]);

  sectionTitle(ctx, labels.develop);
  addBannerImage(ctx, developJpeg, labels.develop);
  addParagraphs(ctx, report.develop[locale]);

  sectionTitle(ctx, labels.bridge);
  addParagraphs(ctx, [result.bridge[locale]]);
  ensure(ctx, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TERRACOTTA);
  doc.text(labels.cta, MARGIN, ctx.y);

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (ctx.pagesWithFooter[i - 1] !== false || i > 1) {
      drawFooter(doc, i, total, locale);
    }
  }
  // Cover aussi un footer léger
  doc.setPage(1);
  drawFooter(doc, 1, total, locale);

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
