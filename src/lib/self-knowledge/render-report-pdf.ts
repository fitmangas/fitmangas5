/**
 * Rendu PDF d’une URL (print headless) — même pipeline client + captures.
 * Local / CI : Playwright chromium.
 * Vercel : @sparticuz/chromium + puppeteer-core.
 */
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export type RenderPdfOptions = {
  url: string;
  waitForSelector?: string;
  footerText?: string;
};

const PDF_OPTS = {
  format: 'A4' as const,
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
};

function isServerless() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

async function renderWithPlaywright(opts: RenderPdfOptions): Promise<Buffer> {
  const { chromium: pw } = await import('playwright');
  const browser = await pw.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 1600 } });
    await page.emulateMedia({ media: 'print' });
    await page.goto(opts.url, { waitUntil: 'networkidle', timeout: 90_000 });
    if (opts.waitForSelector) {
      await page.waitForSelector(opts.waitForSelector, { timeout: 30_000 });
    }
    await page.waitForTimeout(500);
    const footer = opts.footerText ?? 'FitMangas · fitmangas.com · connaissance de soi';
    const pdf = await page.pdf({
      ...PDF_OPTS,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="width:100%;font-size:8px;color:#958780;text-align:center;padding-bottom:6mm;">${footer}</div>`,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function renderWithSparticuz(opts: RenderPdfOptions): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1100, height: 1600, deviceScaleFactor: 1 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.emulateMediaType('print');
    await page.goto(opts.url, { waitUntil: 'networkidle0', timeout: 90_000 });
    if (opts.waitForSelector) {
      await page.waitForSelector(opts.waitForSelector, { timeout: 30_000 });
    }
    await new Promise((r) => setTimeout(r, 500));
    const footer = opts.footerText ?? 'FitMangas · fitmangas.com · connaissance de soi';
    const pdf = await page.pdf({
      ...PDF_OPTS,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="width:100%;font-size:8px;color:#958780;text-align:center;padding-bottom:6mm;">${footer}</div>`,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function renderUrlToPdf(opts: RenderPdfOptions): Promise<Buffer> {
  if (isServerless()) return renderWithSparticuz(opts);
  return renderWithPlaywright(opts);
}

/** Origine absolue pour naviguer Chromium vers la page print. */
export function pdfAppOrigin(req?: Request): string {
  if (req) {
    const proto = req.headers.get('x-forwarded-proto') ?? 'http';
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    if (host) return `${proto}://${host}`;
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://127.0.0.1:3000'
  );
}
