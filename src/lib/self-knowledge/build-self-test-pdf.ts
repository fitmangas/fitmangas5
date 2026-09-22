/**
 * PDF = capture visuelle de la page rapport (DOM → canvas → PDF),
 * pas une reconstruction texte. Logo, radar, couleurs, typo = ceux du web.
 */
import { jsPDF } from 'jspdf';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const A4_W_MM = 210;
const A4_H_MM = 297;
const MARGIN_MM = 10;

/**
 * Imprime l’élément rapport (version complète affichée) en PDF multipages.
 * Utilise html2canvas pour coller au rendu CSS (cream / terracotta / radar).
 */
export async function buildSelfTestReportPdfFromElement(
  element: HTMLElement,
  opts?: { footer?: string }
): Promise<Blob> {
  const html2canvas = (await import('html2canvas')).default;

  // Masque temporairement les blocs non imprimables dans l’élément
  const hide = element.querySelectorAll('.self-test-no-print, .quiz-no-print');
  const prev: Array<{ el: HTMLElement; display: string }> = [];
  hide.forEach((node) => {
    const el = node as HTMLElement;
    prev.push({ el, display: el.style.display });
    el.style.display = 'none';
  });

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFAF5',
      logging: false,
      windowWidth: Math.max(element.scrollWidth, 800),
    });
  } finally {
    prev.forEach(({ el, display }) => {
      el.style.display = display;
    });
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const usableW = A4_W_MM - MARGIN_MM * 2;
  const usableH = A4_H_MM - MARGIN_MM * 2 - 6; // réserve pied de page
  const imgW = usableW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const pageCanvasH = (usableH / imgH) * canvas.height;

  let yPx = 0;
  let page = 0;
  while (yPx < canvas.height) {
    if (page > 0) doc.addPage();
    const sliceH = Math.min(pageCanvasH, canvas.height - yPx);
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = Math.max(1, Math.ceil(sliceH));
    const ctx = slice.getContext('2d')!;
    ctx.fillStyle = '#FFFAF5';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, yPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

    const sliceHmm = (slice.height * imgW) / canvas.width;
    doc.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN_MM, MARGIN_MM, imgW, sliceHmm);

    const footer = opts?.footer ?? 'FitMangas · fitmangas.com · connaissance de soi';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 140, 130);
    doc.text(footer, A4_W_MM / 2, A4_H_MM - 6, { align: 'center' });

    yPx += sliceH;
    page += 1;
    if (page > 40) break; // garde-fou
  }

  return doc.output('blob');
}

/** @deprecated Conservé pour imports anciens — préfère buildSelfTestReportPdfFromElement */
export async function buildSelfTestReportPdf(): Promise<Blob> {
  throw new Error(
    'buildSelfTestReportPdf texte est retiré. Utilise buildSelfTestReportPdfFromElement (DOM) ou le script Playwright print-to-PDF.'
  );
}
