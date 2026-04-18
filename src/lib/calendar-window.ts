/**
 * Fenêtre calendrier : 14 jours glissants à partir du jour courant (minuit UTC).
 * Même logique côté API et côté client pour éviter les décalages de mois vides.
 */

export const FORTNIGHT_DAYS = 14;

export type FortnightWindow = {
  start: Date;
  endExclusive: Date;
};

/** Début du jour UTC + durée exacte de 14×24h (fin exclusive). */
export function getUtcFortnightWindow(reference = new Date()): FortnightWindow {
  const t = Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate(), 0, 0, 0, 0);
  const start = new Date(t);
  const endExclusive = new Date(t + FORTNIGHT_DAYS * 24 * 60 * 60 * 1000);
  return { start, endExclusive };
}

export function isWithinFortnight(startsAtIso: string, window: FortnightWindow): boolean {
  const t = new Date(startsAtIso).getTime();
  return t >= window.start.getTime() && t < window.endExclusive.getTime();
}

/** Cours terminé : plus de réservation / live. */
export function isCoursePast(endsAtIso: string, reference = new Date()): boolean {
  return new Date(endsAtIso).getTime() < reference.getTime();
}
