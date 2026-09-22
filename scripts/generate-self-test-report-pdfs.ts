/**
 * Génère 3 PDF via le même pipeline que le bouton client (print-report + Chromium).
 * Usage : serveur Next déjà up avec NEXT_PUBLIC_UX_CAPTURE optionnel
 *   BASE_URL=http://127.0.0.1:3000 npx tsx scripts/generate-self-test-report-pdfs.ts
 * Ou démarre un serveur temporaire.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assembleAttachmentReport } from '../src/lib/self-knowledge/assemble-report';
import { renderUrlToPdf } from '../src/lib/self-knowledge/render-report-pdf';
import { IPIP120_FACET_IDS } from '../src/lib/self-knowledge/ipip120';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, '_captures', 'tests-ux');
const PORT = Number(process.env.PDF_GEN_PORT ?? 3099);
const BASE = process.env.BASE_URL?.replace(/\/$/, '') ?? `http://127.0.0.1:${PORT}`;

function scores50() {
  return { E: 28, A: 34, C: 44, ES: 18, O: 36 };
}
function scores120() {
  const base = scores50() as Record<string, number>;
  for (const id of IPIP120_FACET_IDS) {
    const n = Number(id.slice(1));
    base[id] = 8 + ((n * 2) % 10);
  }
  return base;
}
function scoresAttach() {
  return { anxiety: 5.1, avoidance: 2.4 };
}

async function waitForServer(url: string, ms = 120_000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404 || res.status === 200) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`Serveur non prêt : ${url}`);
}

async function startServer(): Promise<ChildProcess | null> {
  if (process.env.BASE_URL) return null;
  const child = spawn('npx', ['next', 'dev', '-p', String(PORT), '-H', '127.0.0.1'], {
    cwd: root,
    env: { ...process.env, NEXT_DIST_DIR: '.next-pdf-gen', PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForServer(`${BASE}/quiz/print-report?slug=attachement&scores=${encodeURIComponent(JSON.stringify(scoresAttach()))}`);
  return child;
}

async function writePdf(filename: string, qs: Record<string, string>) {
  const params = new URLSearchParams(qs);
  const url = `${BASE}/quiz/print-report?${params.toString()}`;
  const buf = await renderUrlToPdf({
    url,
    waitForSelector: '[data-testid="self-test-report"][data-show-full="true"]',
    footerText: `${qs.format ?? qs.slug} · fitmangas.com`,
  });
  fs.mkdirSync(OUT, { recursive: true });
  const dest = path.join(OUT, filename);
  fs.writeFileSync(dest, buf);
  console.log(`OK ${dest} (${buf.length} bytes)`);
  return buf.length;
}

async function main() {
  const aAtt = assembleAttachmentReport(scoresAttach(), 'fr');
  if (!aAtt.sections?.forces?.length) throw new Error('BUG: forces attachement vides');

  let child: ChildProcess | null = null;
  try {
    child = await startServer();
    await writePdf('rapport-ipip50.pdf', {
      slug: 'big-five',
      format: 'ipip-50',
      locale: 'fr',
      scores: JSON.stringify(scores50()),
    });
    await writePdf('rapport-ipip120.pdf', {
      slug: 'big-five',
      format: 'ipip-120',
      locale: 'fr',
      scores: JSON.stringify(scores120()),
    });
    await writePdf('rapport-attachement.pdf', {
      slug: 'attachement',
      locale: 'fr',
      scores: JSON.stringify(scoresAttach()),
    });
  } finally {
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
