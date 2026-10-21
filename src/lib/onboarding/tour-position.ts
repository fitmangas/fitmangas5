/** Placement de la bulle du tuto autour de l'élément mis en lumière (calcul pur, testable). */

export type Box = { top: number; left: number; width: number; height: number };

export type CardPlacement = {
  top: number;
  left: number;
  width: number;
  /** below / above : sous ou au-dessus de la cible ; inside : cible plus haute que l'écran ; sheet : téléphone. */
  anchored: 'below' | 'above' | 'inside' | 'sheet';
};

export const TOUR_MOBILE_BREAKPOINT = 640;

export function placeTourCard(
  target: Box | null,
  viewport: { width: number; height: number },
  card: { width: number; height: number },
  gap = 14,
  margin = 16,
): CardPlacement {
  const vw = viewport.width;
  const vh = viewport.height;

  if (vw < TOUR_MOBILE_BREAKPOINT) {
    // Téléphone : bulle en bas d'écran ; en haut si la cible occupe le bas.
    const width = vw - 24;
    const bottomTop = Math.max(12, vh - card.height - 12);
    if (target && target.top + target.height > bottomTop && target.top > card.height + 24) {
      return { top: 12, left: 12, width, anchored: 'sheet' };
    }
    return { top: bottomTop, left: 12, width, anchored: 'sheet' };
  }

  const width = Math.min(card.width, vw - margin * 2);
  if (!target) {
    return { top: Math.max(margin, (vh - card.height) / 2), left: (vw - width) / 2, width, anchored: 'inside' };
  }
  const left = Math.min(Math.max(target.left, margin), vw - width - margin);
  const below = target.top + target.height + gap;
  if (below + card.height <= vh - margin) return { top: below, left, width, anchored: 'below' };
  const above = target.top - gap - card.height;
  if (above >= margin) return { top: above, left, width, anchored: 'above' };
  // Cible plus haute que la partie visible (ex. le planning) : bulle posée en bas de l'écran, sur la cible.
  return {
    top: Math.max(margin, vh - card.height - margin * 1.5),
    left: Math.min(Math.max(target.left + 24, margin), vw - width - margin),
    width,
    anchored: 'inside',
  };
}
