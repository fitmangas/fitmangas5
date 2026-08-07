import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

/** Capture desktop paysage — dashboard ENTIER (jamais mobile / crop 4:5). */
export const CAROUSEL_CTA_DASHBOARD_SRC = '/espace cliente dashboard.jpg';

const EXPORT_W = 1080;
const EXPORT_H = 1350;

function resolvePublicFile(publicPath: string): string {
  const rel = publicPath.replace(/^\//, '');
  return path.join(process.cwd(), 'public', rel);
}

/**
 * Compose la slide CTA carousel 4:5 :
 * fond sombre + carte flottante + dashboard ENTIER en contain (jamais cover/zoom).
 */
export async function composeCarouselCtaSlideBuffer(opts?: {
  overlayText?: string;
}): Promise<Buffer> {
  const srcAbs = resolvePublicFile(CAROUSEL_CTA_DASHBOARD_SRC);
  if (!fs.existsSync(srcAbs)) {
    throw new Error(`Asset CTA introuvable : ${CAROUSEL_CTA_DASHBOARD_SRC}`);
  }

  const overlay =
    (opts?.overlayText || 'ESSAI 7 JOURS — ON T’ATTEND EN VISIO').trim().toLocaleUpperCase('fr-FR') ||
    'ESSAI 7 JOURS — ON T’ATTEND EN VISIO';

  // Fond gris/cream sombre
  const bg = await sharp({
    create: {
      width: EXPORT_W,
      height: EXPORT_H,
      channels: 3,
      background: { r: 42, g: 36, b: 32 },
    },
  })
    .png()
    .toBuffer();

  // Zone carte (marges ~7–8 %, ne touche pas les bords)
  const marginX = Math.round(EXPORT_W * 0.08);
  const marginTop = Math.round(EXPORT_H * 0.11);
  const marginBottom = Math.round(EXPORT_H * 0.28);
  const cardW = EXPORT_W - marginX * 2;
  const cardH = EXPORT_H - marginTop - marginBottom;
  const radius = 28;

  // Dashboard ENTIER dans la carte (contain)
  const dashPad = 28;
  const innerW = cardW - dashPad * 2;
  const innerH = cardH - dashPad * 2;
  const dashboardFit = await sharp(srcAbs)
    .resize(innerW, innerH, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();
  const dashMeta = await sharp(dashboardFit).metadata();
  const dashW = dashMeta.width || innerW;
  const dashH = dashMeta.height || innerH;

  // Carte cream + ombre légère (SVG)
  const cardSvg = Buffer.from(`
    <svg width="${EXPORT_W}" height="${EXPORT_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity="0.45"/>
        </filter>
      </defs>
      <rect x="${marginX}" y="${marginTop}" width="${cardW}" height="${cardH}" rx="${radius}" ry="${radius}"
        fill="#FFFAF5" filter="url(#shadow)"/>
    </svg>
  `);

  const dashLeft = marginX + Math.round((cardW - dashW) / 2);
  const dashTop = marginTop + Math.round((cardH - dashH) / 2);

  // Pill fitmangas.com
  const pillLabel = 'fitmangas.com';
  const pillW = 220;
  const pillH = 44;
  const pillX = Math.round((EXPORT_W - pillW) / 2);
  const pillY = EXPORT_H - 118;
  const textY = EXPORT_H - 175;

  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Wrap overlay roughly
  const words = overlay.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (test.length > 28) {
      if (line) lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  const textLines = lines.slice(0, 3);
  const textSvg = textLines
    .map(
      (l, i) =>
        `<text x="${EXPORT_W / 2}" y="${textY - (textLines.length - 1 - i) * 42}" text-anchor="middle" font-family="Georgia, serif" font-size="36" font-weight="600" fill="#FFFAF5">${escapeXml(l)}</text>`,
    )
    .join('\n');

  const uiSvg = Buffer.from(`
    <svg width="${EXPORT_W}" height="${EXPORT_H}" xmlns="http://www.w3.org/2000/svg">
      ${textSvg}
      <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="22" ry="22" fill="#C45D3E"/>
      <text x="${EXPORT_W / 2}" y="${pillY + 29}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="#FFFAF5">${pillLabel}</text>
    </svg>
  `);

  // Logo optionnel
  const logoAbs = resolvePublicFile('/logo.png');
  const composites: sharp.OverlayOptions[] = [
    { input: cardSvg, top: 0, left: 0 },
    { input: dashboardFit, top: dashTop, left: dashLeft },
    { input: uiSvg, top: 0, left: 0 },
  ];

  if (fs.existsSync(logoAbs)) {
    const logo = await sharp(logoAbs)
      .resize(Math.round(EXPORT_W * 0.12), Math.round(EXPORT_H * 0.08), { fit: 'inside' })
      .png()
      .toBuffer();
    const logoMeta = await sharp(logo).metadata();
    composites.push({
      input: logo,
      top: Math.round(EXPORT_H * 0.035),
      left: Math.round(EXPORT_W * 0.04),
    });
    void logoMeta;
  }

  return sharp(bg)
    .composite(composites)
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}
