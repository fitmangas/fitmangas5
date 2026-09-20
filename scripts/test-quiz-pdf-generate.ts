/**
 * 3 tests navigateur : crop + placement d’images PDF sans déformation.
 * Usage: npx tsx scripts/test-quiz-pdf-generate.ts
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'tmp/quiz-pdf-tests');

async function main() {
  mkdirSync(OUT, { recursive: true });

  const { chromium } = await import('playwright');
  const publicDir = join(process.cwd(), 'public');
  const server = createServer((req, res) => {
    const url = (req.url ?? '/').split('?')[0]!;
    const filePath = join(publicDir, decodeURIComponent(url));
    if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
      res.writeHead(404);
      res.end('missing');
      return;
    }
    const buf = readFileSync(filePath);
    const ext = filePath.split('.').pop();
    const type =
      ext === 'png'
        ? 'image/png'
        : ext === 'webp'
          ? 'image/webp'
          : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
    res.end(buf);
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('bad listen');
  const base = `http://127.0.0.1:${addr.port}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('about:blank');
  await page.addScriptTag({
    url: 'https://cdn.jsdelivr.net/npm/jspdf@3.0.1/dist/jspdf.umd.min.js',
  });

  const cases = [
    { name: 'hero-4x5', path: '/library/coaching-visio/coaching-visio-03-4x5.webp', aspect: 0.8, focusY: 0.15, maxW: 68, maxH: 85, fullWidth: false },
    { name: 'banner-how', path: '/library/pilates-mat/pilates-mat-08-4x5.webp', aspect: 2.55, focusY: 0.28, maxW: 178, maxH: 80, fullWidth: true },
    { name: 'banner-forces', path: '/library/portraits/portrait-01-4x5.webp', aspect: 2.55, focusY: 0.12, maxW: 178, maxH: 80, fullWidth: true },
    { name: 'banner-stress', path: '/library/renfo-core/renfo-core-07-4x5.webp', aspect: 2.55, focusY: 0.18, maxW: 178, maxH: 80, fullWidth: true },
    { name: 'logo', path: '/logo.png', aspect: 1, focusY: 0.5, maxW: 14, maxH: 14, fullWidth: false },
  ];

  const results: { name: string; ok: boolean; cropAspect: number; placeAspect: number; bytes: number; note: string }[] = [];

  for (const c of cases) {
    const data = await page.evaluate(
      async ({ baseUrl, path, aspect, focusY, maxW, maxH, fullWidth }) => {
        // @ts-expect-error jspdf umd
        const { jsPDF } = window.jspdf;
        const res = await fetch(baseUrl + path);
        if (!res.ok) throw new Error('fetch ' + path);
        const blob = await res.blob();
        const bmp = await createImageBitmap(blob);
        const srcAspect = bmp.width / bmp.height;
        let sx = 0;
        let sy = 0;
        let sw = bmp.width;
        let sh = bmp.height;
        if (srcAspect > aspect) {
          sw = Math.round(bmp.height * aspect);
          sx = Math.round((bmp.width - sw) / 2);
        } else {
          sh = Math.round(bmp.width / aspect);
          const maxSy = bmp.height - sh;
          sy = Math.min(maxSy, Math.max(0, Math.round(maxSy * focusY)));
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(sw));
        canvas.height = Math.max(1, Math.round(sh));
        const ctx2 = canvas.getContext('2d');
        if (!ctx2) throw new Error('no ctx');
        ctx2.drawImage(bmp, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        bmp.close();
        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        const cropAspect = canvas.width / canvas.height;

        let w: number;
        let h: number;
        if (fullWidth) {
          w = maxW;
          h = w / cropAspect;
        } else {
          w = maxW;
          h = w / cropAspect;
          if (h > maxH) {
            h = maxH;
            w = h * cropAspect;
          }
        }

        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        doc.setFillColor(255, 250, 245);
        doc.rect(0, 0, 210, 297, 'F');
        doc.addImage(dataUrl, 'JPEG', 16, 20, w, h);
        const ab = doc.output('arraybuffer');
        return {
          cropAspect,
          placeAspect: w / h,
          w,
          h,
          bytes: Array.from(new Uint8Array(ab)),
        };
      },
      {
        baseUrl: base,
        path: c.path,
        aspect: c.aspect,
        focusY: c.focusY,
        maxW: c.maxW,
        maxH: c.maxH,
        fullWidth: c.fullWidth,
      },
    );

    const buf = Buffer.from(data.bytes);
    writeFileSync(join(OUT, `${c.name}.pdf`), buf);
    const cropOk = Math.abs(data.cropAspect - c.aspect) < 0.03;
    const placeOk = Math.abs(data.placeAspect - c.aspect) < 0.03;
    const ok = cropOk && placeOk;
    const note = ok
      ? `crop=${data.cropAspect.toFixed(3)} place=${data.placeAspect.toFixed(3)} ${data.w.toFixed(1)}×${data.h.toFixed(1)}mm`
      : `FAIL crop=${data.cropAspect} want=${c.aspect} place=${data.placeAspect}`;
    results.push({ name: c.name, ok, cropAspect: data.cropAspect, placeAspect: data.placeAspect, bytes: buf.length, note });
    console.log(`${ok ? 'OK' : 'FAIL'} ${c.name}: ${note}`);
  }

  writeFileSync(join(OUT, 'summary.json'), JSON.stringify(results, null, 2));
  await browser.close();
  server.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} OK → ${OUT}`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
