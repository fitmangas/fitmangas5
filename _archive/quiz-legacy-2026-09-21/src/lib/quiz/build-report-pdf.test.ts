import { describe, expect, it } from 'vitest';

/** Même logique que build-report-pdf.parseFocusY — testée ici sans charger jsPDF/DOM. */
function parseFocusY(objectPosition?: string): number {
  if (!objectPosition) return 0.2;
  const parts = objectPosition.trim().split(/\s+/);
  const yPart = parts[1] ?? parts[0] ?? '20%';
  const n = parseFloat(yPart);
  if (Number.isNaN(n)) return 0.2;
  return Math.min(1, Math.max(0, n / 100));
}

function computeCropRect(
  srcW: number,
  srcH: number,
  aspect: number,
  focusY: number,
): { sx: number; sy: number; sw: number; sh: number } {
  const srcAspect = srcW / srcH;
  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;
  if (srcAspect > aspect) {
    sw = Math.round(srcH * aspect);
    sx = Math.round((srcW - sw) / 2);
  } else {
    sh = Math.round(srcW / aspect);
    const maxSy = srcH - sh;
    sy = Math.round(maxSy * focusY);
    sy = Math.min(maxSy, Math.max(0, sy));
  }
  return { sx, sy, sw, sh };
}

function fitBox(aspect: number, maxW: number, maxH: number): { w: number; h: number } {
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  return { w, h };
}

describe('PDF image crop / fit (anti-déformation)', () => {
  it('parseFocusY lit object-position web', () => {
    expect(parseFocusY('50% 18%')).toBeCloseTo(0.18, 5);
    expect(parseFocusY('50% 12%')).toBeCloseTo(0.12, 5);
    expect(parseFocusY(undefined)).toBe(0.2);
  });

  it('portrait 4:5 depuis source carrée → crop vertical, ratio exact', () => {
    const r = computeCropRect(1000, 1000, 4 / 5, 0.2);
    expect(r.sw / r.sh).toBeCloseTo(4 / 5, 5);
  });

  it('bannière large depuis 4:5 → crop vertical (source plus étroite), ratio exact', () => {
    const r = computeCropRect(800, 1000, 2.55, 0.18);
    expect(r.sw / r.sh).toBeCloseTo(2.55, 2);
    expect(r.sw).toBe(800);
    expect(r.sh).toBeLessThan(1000);
  });

  it('bannière depuis source déjà large → crop horizontal', () => {
    const r = computeCropRect(2400, 800, 2.55, 0.2);
    expect(r.sw / r.sh).toBeCloseTo(2.55, 2);
    expect(r.sh).toBe(800);
    expect(r.sw).toBeLessThan(2400);
  });

  it('placeImage ne dépasse jamais la boîte et garde le ratio', () => {
    const { w, h } = fitBox(4 / 5, 68, 100);
    expect(w / h).toBeCloseTo(4 / 5, 5);
    expect(w).toBeLessThanOrEqual(68.01);
  });

  it('bannière 178×40 mm : fit conserve ratio 2.55', () => {
    const { w, h } = fitBox(2.55, 178, 40);
    expect(w / h).toBeCloseTo(2.55, 5);
    expect(h).toBeLessThanOrEqual(40.01);
  });

  it('hero 4:5 : largeur 68 → hauteur 85', () => {
    const { w, h } = fitBox(4 / 5, 68, 90);
    expect(w).toBeCloseTo(68, 1);
    expect(h).toBeCloseTo(85, 1);
  });
});
