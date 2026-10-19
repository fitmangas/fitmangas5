/** Lot 3 — programmes guidés. Off tant que NEXT_PUBLIC_FEATURE_PROGRAMMES ≠ 1. */

export function isProgrammesEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const v = (env.NEXT_PUBLIC_FEATURE_PROGRAMMES ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}
