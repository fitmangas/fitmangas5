/**
 * Génère 3 PDF visuels = print headless de la page rapport web (full).
 * Usage : NEXT_PUBLIC_UX_CAPTURE=1 npx tsx scripts/generate-self-test-report-pdfs.ts
 * (démarre un serveur Next temporaire si besoin)
 */
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { assembleAttachmentReport } from '../src/lib/self-knowledge/assemble-report';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, '_captures', 'tests-ux');
const PORT = 3099;
const BASE = `http://127.0.0.1:${PORT}`;

async function waitForServer(url: string, ms = 120_000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`Serveur non prêt : ${url}`);
}

async function startServer(): Promise<ChildProcess> {
  const child = spawn(
    'npx',
    ['next', 'dev', '-p', String(PORT), '-H', '127.0.0.1'],
    {
      cwd: root,
      env: {
        ...process.env,
        NEXT_PUBLIC_UX_CAPTURE: '1',
        NEXT_DIST_DIR: '.next-pdf-gen',
        PORT: String(PORT),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  child.stdout?.on('data', () => {});
  child.stderr?.on('data', () => {});
  await waitForServer(`${BASE}/quiz/ux-capture?slug=attachement&full=1`);
  return child;
}

async function printReport(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>,
  urlPath: string,
  filename: string
) {
  await page.goto(`${BASE}${urlPath}`, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.waitForSelector('[data-testid="self-test-report"][data-show-full="true"]', {
    timeout: 30_000,
  });
  // Laisse radar / polices peindre
  await page.waitForTimeout(600);

  const dest = path.join(OUT, filename);
  fs.mkdirSync(OUT, { recursive: true });
  await page.pdf({
    path: dest,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '14mm', left: '12mm', right: '12mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width:100%;font-size:8px;color:#958780;text-align:center;padding:0 12mm;">
        FitMangas · fitmangas.com · connaissance de soi
      </div>`,
  });
  const size = fs.statSync(dest).size;
  console.log(`OK ${dest} (${size} bytes)`);
  return size;
}

async function main() {
  // Garde-fou banque
  const aAtt = assembleAttachmentReport({ anxiety: 5.1, avoidance: 2.4 }, 'fr');
  if (!aAtt.sections?.forces?.length) {
    throw new Error('BUG: rapport attachement sans forces');
  }

  let child: ChildProcess | null = null;
  const browser = await chromium.launch({ headless: true });
  try {
    child = await startServer();
    const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });

    await printReport(
      page,
      '/quiz/ux-capture?slug=big-five&format=ipip-50&full=1',
      'rapport-ipip50.pdf'
    );
    await printReport(
      page,
      '/quiz/ux-capture?slug=big-five&format=ipip-120&full=1',
      'rapport-ipip120.pdf'
    );
    await printReport(
      page,
      '/quiz/ux-capture?slug=attachement&full=1',
      'rapport-attachement.pdf'
    );
  } finally {
    await browser.close();
    if (child?.pid) {
      try {
        process.kill(child.pid, 'SIGTERM');
      } catch {
        /* ignore */
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
