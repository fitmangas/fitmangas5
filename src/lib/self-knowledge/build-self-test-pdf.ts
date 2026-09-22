import { jsPDF } from 'jspdf';

import type { SelfTestLang, SelfTestSections } from './types';

const CREAM: [number, number, number] = [255, 250, 245];
const INK: [number, number, number] = [29, 29, 31];
const MUTED: [number, number, number] = [90, 85, 80];
const LINE: [number, number, number] = [220, 210, 200];
const TERRACOTTA: [number, number, number] = [196, 93, 62];

const MARGIN = 16;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 16;
const LINE_H = 5.2;

export type SelfTestPdfInput = {
  locale: SelfTestLang;
  testTitle: string;
  portraitName: string;
  tagline: string;
  disclaimer: string;
  sections: SelfTestSections;
  instrumentVersion: string;
};

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function wrap(doc: jsPDF, text: string, maxW: number): string[] {
  return doc.splitTextToSize(text, maxW) as string[];
}

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  if (y + need <= BOTTOM) return y;
  doc.addPage();
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  return 18;
}

function heading(doc: jsPDF, y: number, title: string): number {
  y = ensureSpace(doc, y, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TERRACOTTA);
  doc.text(title.toUpperCase(), MARGIN, y);
  return y + 7;
}

function body(doc: jsPDF, y: number, text: string): number {
  const lines = wrap(doc, text, CONTENT_W);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  for (const line of lines) {
    y = ensureSpace(doc, y, LINE_H);
    doc.text(line, MARGIN, y);
    y += LINE_H;
  }
  return y + 3;
}

function bullets(doc: jsPDF, y: number, items: string[]): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  for (const item of items) {
    const lines = wrap(doc, `• ${item}`, CONTENT_W);
    for (const line of lines) {
      y = ensureSpace(doc, y, LINE_H);
      doc.text(line, MARGIN, y);
      y += LINE_H;
    }
    y += 1.5;
  }
  return y + 2;
}

/** PDF client-side — DA cream / terracotta FitMangas. */
export async function buildSelfTestReportPdf(input: SelfTestPdfInput): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const fr = input.locale === 'fr';
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  let y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TERRACOTTA);
  doc.text('FitMangas', MARGIN, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(input.testTitle, MARGIN, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  const nameLines = wrap(doc, input.portraitName, CONTENT_W);
  for (const line of nameLines) {
    doc.text(line, MARGIN, y);
    y += 8;
  }
  y = body(doc, y + 2, input.tagline);

  if (input.sections.scorePhrases?.length) {
    y = heading(doc, y + 2, fr ? 'Profil' : 'Perfil');
    for (const sp of input.sections.scorePhrases) {
      y = body(doc, y, `${sp.label} ${sp.percent}% — ${sp.phrase}`);
    }
  }

  y = heading(doc, y + 2, fr ? 'Qui tu es' : 'Quién eres');
  y = body(doc, y, input.sections.whoYouAre);

  y = heading(doc, y + 2, fr ? 'Comment tu fonctionnes' : 'Cómo funcionas');
  y = body(doc, y, input.sections.howYouWork);

  if (input.sections.forces.length) {
    y = heading(doc, y + 2, fr ? 'Forces' : 'Fortalezas');
    y = bullets(doc, y, input.sections.forces);
  }
  if (input.sections.limits.length) {
    y = heading(doc, y + 2, fr ? 'Limites' : 'Límites');
    y = bullets(doc, y, input.sections.limits);
  }
  if (input.sections.practiceImpact?.length) {
    y = heading(doc, y + 2, fr ? 'Ce que ça change pour ta pratique' : 'Qué cambia para tu práctica');
    y = bullets(doc, y, input.sections.practiceImpact);
  }
  if (input.sections.microRecommendation) {
    y = body(doc, y + 2, input.sections.microRecommendation);
  }
  if (input.sections.facets?.length) {
    y = heading(doc, y + 2, fr ? 'Facettes' : 'Facetas');
    for (const facet of input.sections.facets) {
      y = body(doc, y, `${facet.label} — ${facet.bandLabel}`);
      y = body(doc, y, facet.narrative);
    }
  }

  y = ensureSpace(doc, y + 4, 20);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;
  if (input.disclaimer) y = body(doc, y, input.disclaimer);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  y = ensureSpace(doc, y + 2, 8);
  doc.text(
    fr
      ? `Instrument : ${input.instrumentVersion} · fitmangas.com`
      : `Instrumento : ${input.instrumentVersion} · fitmangas.com`,
    MARGIN,
    y,
  );

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      fr ? 'FitMangas · Connaissance de soi' : 'FitMangas · Conocimiento de una misma',
      MARGIN,
      PAGE_H - 6,
    );
    doc.text(`${i} / ${total}`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
  }

  return doc.output('blob');
}
