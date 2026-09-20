import { jsPDF } from 'jspdf';

import { DISC_LETTER_COLOR, DISC_LETTER_LABEL, type DiscLetter } from '@/lib/quiz/disc-palette';
import type { QuizDefinition, QuizLocale, QuizResult, QuizScore } from '@/lib/quiz/types';

const CREAM: [number, number, number] = [255, 250, 245];
const INK: [number, number, number] = [29, 29, 31];
const MUTED: [number, number, number] = [90, 85, 80];
const LINE: [number, number, number] = [220, 210, 200];
const TERRACOTTA: [number, number, number] = [196, 93, 62];

const MARGIN = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TOP = 26;
const BOTTOM = PAGE_H - 24;
const LINE_H = 5.4;

type BuildPdfArgs = {
  quiz: QuizDefinition;
  result: QuizResult;
  score: QuizScore;
  locale: QuizLocale;
  logoDataUrl: string | null;
};

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
  doc.setLineWidth(0.35);
  doc.line(MARGIN, PAGE_H - 16, PAGE_W - MARGIN, PAGE_H - 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const left = locale === 'es' ? 'FitMangas · Perfil de disciplina' : 'FitMangas · Profil de discipline';
  doc.text(left, MARGIN, PAGE_H - 9);
  doc.text(`${page} / ${total}`, PAGE_W - MARGIN, PAGE_H - 9, { align: 'right' });
}

function wrap(doc: jsPDF, text: string, maxW: number): string[] {
  return doc.splitTextToSize(text, maxW) as string[];
}

async function loadLogoAsDataUrl(): Promise<string | null> {
  try {
    const res = await fetch('/logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function newPage(ctx: PdfCtx, withFooter = true) {
  ctx.doc.addPage();
  fillPage(ctx.doc);
  ctx.pagesWithFooter.push(withFooter);
  ctx.y = TOP;
}

/** Garantit l’espace ; avance sur une nouvelle page si besoin. Met à jour ctx.y. */
function ensure(ctx: PdfCtx, needed: number) {
  if (ctx.y + needed > BOTTOM) {
    newPage(ctx, true);
  }
}

function writeLines(
  ctx: PdfCtx,
  lines: string[],
  opts: { x?: number; size?: number; color?: [number, number, number]; bold?: boolean; lineH?: number },
) {
  const x = opts.x ?? MARGIN;
  const size = opts.size ?? 10;
  const color = opts.color ?? MUTED;
  const lineH = opts.lineH ?? LINE_H;
  ctx.doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
  ctx.doc.setFontSize(size);
  ctx.doc.setTextColor(...color);
  for (const line of lines) {
    ensure(ctx, lineH + 1);
    ctx.doc.text(line, x, ctx.y);
    ctx.y += lineH;
  }
}

function sectionTitle(ctx: PdfCtx, title: string) {
  ensure(ctx, 18);
  ctx.doc.setFillColor(...ctx.accent);
  ctx.doc.rect(MARGIN, ctx.y, 26, 1.8, 'F');
  ctx.y += 8;
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(12);
  ctx.doc.setTextColor(...INK);
  ctx.doc.text(title.toUpperCase(), MARGIN, ctx.y);
  ctx.y += 10;
}

function addParagraphs(ctx: PdfCtx, items: string[]) {
  for (const item of items) {
    const lines = wrap(ctx.doc, item, CONTENT_W);
    ensure(ctx, lines.length * LINE_H + 8);
    writeLines(ctx, lines, { size: 10, color: MUTED });
    ctx.y += 5;
  }
}

function addBullets(ctx: PdfCtx, items: string[]) {
  for (const item of items) {
    const lines = wrap(ctx.doc, item, CONTENT_W - 10);
    const blockH = lines.length * LINE_H + 4;
    ensure(ctx, blockH + 2);
    const bulletY = ctx.y - 1.2;
    ctx.doc.setFillColor(...ctx.accent);
    ctx.doc.circle(MARGIN + 2.2, bulletY, 1.8, 'F');
    writeLines(ctx, lines, { x: MARGIN + 9, size: 10, color: MUTED });
    ctx.y += 4;
  }
}

function startSection(ctx: PdfCtx, title: string) {
  newPage(ctx, true);
  sectionTitle(ctx, title);
}

export async function buildDisciplineReportPdf(args: Omit<BuildPdfArgs, 'logoDataUrl'>): Promise<Blob> {
  const logoDataUrl = await loadLogoAsDataUrl();
  return buildDisciplineReportPdfWithLogo({ ...args, logoDataUrl });
}

function buildDisciplineReportPdfWithLogo({
  quiz,
  result,
  score,
  locale,
  logoDataUrl,
}: BuildPdfArgs): Blob {
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

  const labels =
    locale === 'es'
      ? {
          coverKicker: 'EVALUACIÓN FITMANGAS',
          coverTitle: 'Tu perfil de disciplina',
          mix: 'Tu mix',
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

  // ——— Cover ———
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', MARGIN, 20, 16, 16);
    } catch {
      /* ignore */
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TERRACOTTA);
  doc.text('FitMangas', logoDataUrl ? MARGIN + 20 : MARGIN, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(labels.coverKicker, MARGIN, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...INK);
  const titleLines = wrap(doc, labels.coverTitle, CONTENT_W);
  let ty = 66;
  for (const line of titleLines) {
    doc.text(line, MARGIN, ty);
    ty += 10;
  }

  doc.setFillColor(...accent);
  doc.roundedRect(MARGIN, 88, CONTENT_W, 48, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${colorLabel} · ${letter}`, MARGIN + 10, 104);
  doc.setFontSize(20);
  doc.text(styleName, MARGIN + 10, 118);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(`${primaryPct} %`, MARGIN + 10, 130);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  let tagY = 152;
  for (const line of wrap(doc, result.tagline[locale], CONTENT_W)) {
    doc.text(line, MARGIN, tagY);
    tagY += 6;
  }

  if (secondary && secondaryLetter) {
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(
      `${labels.secondary} : ${DISC_LETTER_LABEL[locale][secondaryLetter].short} (${secondaryLetter}) — ${secondaryName} · ${secondaryPct} %`,
      MARGIN,
      tagY + 8,
    );
  }

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(labels.note, MARGIN, PAGE_H - 28);
  doc.text(
    new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    MARGIN,
    PAGE_H - 20,
  );

  // ——— Mix ———
  startSection(ctx, labels.mix);
  for (const row of score.ranked) {
    const profile = quiz.results.find((r) => r.id === row.id);
    if (!profile?.letter) continue;
    const L = profile.letter as DiscLetter;
    const c = hexToRgb(DISC_LETTER_COLOR[L]);
    const name = profile.styleName?.[locale] ?? profile.title[locale];
    ensure(ctx, 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(`${DISC_LETTER_LABEL[locale][L].short} (${L}) — ${name}`, MARGIN, ctx.y);
    doc.text(`${row.percent} %`, PAGE_W - MARGIN, ctx.y, { align: 'right' });
    ctx.y += 5;
    // Piste
    doc.setFillColor(...LINE);
    doc.rect(MARGIN, ctx.y, CONTENT_W, 5, 'F');
    // Remplissage (min 3 mm si > 0 pour rester visible)
    const barW = row.percent <= 0 ? 0 : Math.max(3, (CONTENT_W * row.percent) / 100);
    if (barW > 0) {
      doc.setFillColor(...c);
      doc.rect(MARGIN, ctx.y, barW, 5, 'F');
    } else {
      // Point visible à 0 %
      doc.setFillColor(...c);
      doc.circle(MARGIN + 2.5, ctx.y + 2.5, 2.2, 'F');
    }
    ctx.y += 12;
  }

  startSection(ctx, labels.portrait);
  addParagraphs(ctx, report.portrait[locale]);

  startSection(ctx, labels.how);
  addBullets(ctx, report.howYouWork[locale]);

  startSection(ctx, labels.strengths);
  addParagraphs(ctx, report.strengths[locale]);
  ctx.y += 4;
  sectionTitle(ctx, labels.limits);
  addBullets(ctx, report.limits[locale]);

  startSection(ctx, labels.stress);
  addParagraphs(ctx, report.underStress[locale]);
  ctx.y += 4;
  sectionTitle(ctx, labels.fears);
  addBullets(ctx, report.fears[locale]);

  startSection(ctx, labels.needs);
  addParagraphs(ctx, report.needs[locale]);

  startSection(ctx, labels.talk);
  addBullets(ctx, report.howToTalk[locale]);
  ctx.y += 4;
  sectionTitle(ctx, labels.notalk);
  addParagraphs(ctx, report.howNotToTalk[locale]);

  startSection(ctx, labels.develop);
  addParagraphs(ctx, report.develop[locale]);

  startSection(ctx, labels.bridge);
  addParagraphs(ctx, [result.bridge[locale]]);
  ctx.y += 8;
  ensure(ctx, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TERRACOTTA);
  doc.text(labels.cta, MARGIN, ctx.y);

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (ctx.pagesWithFooter[i - 1]) {
      drawFooter(doc, i, total, locale);
    }
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
