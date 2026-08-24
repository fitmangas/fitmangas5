/** Bande crème / beige en haut d’une image IA (espace négatif) à recadrer. */
export function isCreamRgb(r: number, g: number, b: number): boolean {
  return r >= 210 && g >= 195 && b >= 175 && r - b < 80 && Math.abs(r - g) < 35;
}

/**
 * Nombre de rangées crème en haut à retirer.
 * Ignore un bruit < 8 % ; ne coupe jamais plus de `maxFraction` de la hauteur.
 */
export function creamTopCropRows(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  channels: number,
  maxFraction = 0.42,
): number {
  if (width < 8 || height < 8 || channels < 3) return 0;
  const rowThreshold = 0.86;
  let top = 0;
  for (let y = 0; y < height; y += 1) {
    let cream = 0;
    const rowStart = y * width * channels;
    for (let x = 0; x < width; x += 1) {
      const i = rowStart + x * channels;
      if (isCreamRgb(data[i]!, data[i + 1]!, data[i + 2]!)) cream += 1;
    }
    if (cream / width >= rowThreshold) top = y + 1;
    else break;
  }
  if (top < height * 0.08) return 0;
  return Math.min(top, Math.floor(height * maxFraction));
}
