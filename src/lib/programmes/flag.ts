/** Lot 3 — programmes guidés. Off tant que NEXT_PUBLIC_FEATURE_PROGRAMMES ≠ 1. */

export function isProgrammesEnabled(env?: Record<string, string | undefined>): boolean {
  // Accès littéral à process.env.NEXT_PUBLIC_FEATURE_PROGRAMMES : seul ce format est remplacé dans le code
  // envoyé au navigateur. Avec un accès indirect (env.X), le navigateur lisait toujours
  // « off » alors que le serveur lisait « on » → erreurs d’hydratation et menus incohérents.
  const raw = env ? env.NEXT_PUBLIC_FEATURE_PROGRAMMES : process.env.NEXT_PUBLIC_FEATURE_PROGRAMMES;
  const v = (raw ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}
