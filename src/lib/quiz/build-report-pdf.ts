import { jsPDF } from 'jspdf';

import { DISC_LETTER_COLOR, DISC_LETTER_LABEL, type DiscLetter } from '@/lib/quiz/disc-palette';
import type { QuizDefinition, QuizLocale, QuizResult, QuizScore } from '@/lib/quiz/types';

const CREAM = [255, 250, 245] as const;
const INK = [29, 29, 31] as const;
const MUTED = [90, 85, 80] as const;
const LINE = [220, 210, 200] as const;
const TERRACOTTA = [196, 93, 62] as const;

const MARGIN = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

type BuildPdfArgs = {
  quiz: QuizDefinition;
  result: QuizResult;
  score: QuizScore;
  locale: QuizLocale;
  logoDataUrl: string | null;
};

function rgb(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function fillPage(doc: jsPDF) {
  doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
}

function drawFooter(doc: jsPDF, page: number, total: number, locale: QuizLocale) {
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rgb(doc, MUTED);
  const left = locale === 'es' ? 'FitMangas · Perfil de disciplina' : 'FitMangas · Profil de discipline';
  doc.text(left, MARGIN, PAGE_H - 8);
  doc.text(`${page} / ${total}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
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

function drawAccentBar(doc: jsPDF, y: number, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(MARGIN, y, 28, 1.6, 'F');
}

function sectionTitle(doc: jsPDF, title: string, y: number, accent: readonly [number, number, number]): number {
  drawAccentBar(doc, y, accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  rgb(doc, INK);
  doc.text(title.toUpperCase(), MARGIN, y + 8);
  return y + 16;
}

function addParagraphs(
  doc: jsPDF,
  items: string[],
  startY: number,
  accent: readonly [number, number, number],
  locale: QuizLocale,
  ensureSpace: (needed: number) => number,
): number {
  let y = startY;
  for (const item of items) {
    const lines = wrap(doc, item, CONTENT_W);
    const blockH = lines.length * 5.2 + 6;
    y = ensureSpace(blockH + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    rgb(doc, MUTED);
    doc.text(lines, MARGIN, y);
    y += blockH;
  }
  void accent;
  void locale;
  return y;
}

function addBullets(
  doc: jsPDF,
  items: string[],
  startY: number,
  accentHex: string,
  ensureSpace: (needed: number) => number,
): number {
  const accent = hexToRgb(accentHex);
  let y = startY;
  for (const item of items) {
    const lines = wrap(doc, item, CONTENT_W - 8);
    const blockH = lines.length * 5 + 5;
    y = ensureSpace(blockH + 2);
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.circle(MARGIN + 2, y - 1.2, 1.4, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    rgb(doc, MUTED);
    doc.text(lines, MARGIN + 8, y);
    y += blockH;
  }
  return y;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
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
  const pagesMeta: { drawFooter: boolean }[] = [];

  const newPage = () => {
    if (pagesMeta.length > 0) doc.addPage();
    fillPage(doc);
    pagesMeta.push({ drawFooter: true });
  };

  // ——— Cover ———
  fillPage(doc);
  pagesMeta.push({ drawFooter: false });

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', MARGIN, 22, 18, 18);
    } catch {
      /* ignore */
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  rgb(doc, TERRACOTTA);
  doc.text('FitMangas', logoDataUrl ? MARGIN + 22 : MARGIN, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  rgb(doc, MUTED);
  doc.text(labels.coverKicker, MARGIN, 55);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  rgb(doc, INK);
  const titleLines = wrap(doc, labels.coverTitle, CONTENT_W);
  doc.text(titleLines, MARGIN, 68);

  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(MARGIN, 88, CONTENT_W, 52, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`${colorLabel} · ${letter}`, MARGIN + 8, 102);

  doc.setFontSize(22);
  doc.text(styleName, MARGIN + 8, 116);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`${primaryPct} %`, MARGIN + 8, 130);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  rgb(doc, MUTED);
  const tagLines = wrap(doc, result.tagline[locale], CONTENT_W);
  doc.text(tagLines, MARGIN, 156);

  if (secondary && secondaryLetter) {
    doc.setFontSize(10);
    rgb(doc, MUTED);
    doc.text(
      `${labels.secondary} : ${DISC_LETTER_LABEL[locale][secondaryLetter].short} (${secondaryLetter}) — ${secondaryName} · ${secondaryPct} %`,
      MARGIN,
      172,
    );
  }

  doc.setFontSize(8);
  rgb(doc, MUTED);
  doc.text(labels.note, MARGIN, PAGE_H - 28);
  const dateStr = new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(dateStr, MARGIN, PAGE_H - 20);

  // ——— Content pages ———
  let y = 0;
  const TOP = 24;
  const BOTTOM = PAGE_H - 22;

  const ensureSpace = (needed: number): number => {
    if (y + needed > BOTTOM) {
      newPage();
      y = TOP;
    }
    return y;
  };

  const startSection = (title: string) => {
    newPage();
    y = TOP;
    y = sectionTitle(doc, title, y, accent);
  };

  // Mix bars
  startSection(labels.mix);
  for (const row of score.ranked) {
    const profile = quiz.results.find((r) => r.id === row.id);
    if (!profile?.letter) continue;
    const L = profile.letter as DiscLetter;
    const c = hexToRgb(DISC_LETTER_COLOR[L]);
    const name = profile.styleName?.[locale] ?? profile.title[locale];
    y = ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    rgb(doc, INK);
    doc.text(`${DISC_LETTER_LABEL[locale][L].short} (${L}) — ${name}`, MARGIN, y);
    doc.text(`${row.percent} %`, PAGE_W - MARGIN, y, { align: 'right' });
    y += 4;
    doc.setFillColor(LINE[0], LINE[1], LINE[2]);
    doc.roundedRect(MARGIN, y, CONTENT_W, 4, 1, 1, 'F');
    const barW = Math.max(2, (CONTENT_W * row.percent) / 100);
    doc.setFillColor(c[0], c[1], c[2]);
    doc.roundedRect(MARGIN, y, barW, 4, 1, 1, 'F');
    y += 12;
  }

  startSection(labels.portrait);
  y = addParagraphs(doc, report.portrait[locale], y, accent, locale, ensureSpace);

  startSection(labels.how);
  y = addBullets(doc, report.howYouWork[locale], y, accentHex, ensureSpace);

  startSection(labels.strengths);
  y = addParagraphs(doc, report.strengths[locale], y, accent, locale, ensureSpace);

  y = ensureSpace(20);
  y = sectionTitle(doc, labels.limits, y, accent);
  y = addBullets(doc, report.limits[locale], y, accentHex, ensureSpace);

  startSection(labels.stress);
  y = addParagraphs(doc, report.underStress[locale], y, accent, locale, ensureSpace);

  y = ensureSpace(20);
  y = sectionTitle(doc, labels.fears, y, accent);
  y = addBullets(doc, report.fears[locale], y, accentHex, ensureSpace);

  startSection(labels.needs);
  y = addParagraphs(doc, report.needs[locale], y, accent, locale, ensureSpace);

  startSection(labels.talk);
  y = addBullets(doc, report.howToTalk[locale], y, accentHex, ensureSpace);

  y = ensureSpace(20);
  y = sectionTitle(doc, labels.notalk, y, accent);
  y = addParagraphs(doc, report.howNotToTalk[locale], y, accent, locale, ensureSpace);

  startSection(labels.develop);
  y = addParagraphs(doc, report.develop[locale], y, accent, locale, ensureSpace);

  startSection(labels.bridge);
  y = addParagraphs(doc, [result.bridge[locale]], y, accent, locale, ensureSpace);
  y = ensureSpace(16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  rgb(doc, TERRACOTTA);
  doc.text(labels.cta, MARGIN, y + 6);

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (pagesMeta[i - 1]?.drawFooter) {
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
