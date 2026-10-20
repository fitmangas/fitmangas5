/** Lot 6 — accès unique. Off tant que ACCESS_V2 ≠ 1. Bloqué tant que les écarts du comparatif ne sont pas corrigés. */

export function isAccessV2Enabled(env: Record<string, string | undefined> = process.env): boolean {
  const v = (env.ACCESS_V2 ?? env.NEXT_PUBLIC_ACCESS_V2 ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}
