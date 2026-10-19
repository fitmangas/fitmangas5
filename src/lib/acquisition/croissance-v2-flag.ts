/** Lot 7 — Croissance. Off tant que CROISSANCE_V2 ≠ 1. Couper le drapeau remet l’existant. */

export function isCroissanceV2Enabled(env: Record<string, string | undefined> = process.env): boolean {
  const v = (env.CROISSANCE_V2 ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}
