/** Lot 4 — cartes cadeaux. Off tant que NEXT_PUBLIC_FEATURE_GIFTS ≠ 1. */

export function isGiftsEnabled(env?: Record<string, string | undefined>): boolean {
  // Accès littéral à process.env.NEXT_PUBLIC_FEATURE_GIFTS : seul ce format est remplacé dans le code
  // envoyé au navigateur. Avec un accès indirect (env.X), le navigateur lisait toujours
  // « off » alors que le serveur lisait « on » → erreurs d’hydratation et menus incohérents.
  const raw = env ? env.NEXT_PUBLIC_FEATURE_GIFTS : process.env.NEXT_PUBLIC_FEATURE_GIFTS;
  const v = (raw ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}

export function stripeGiftWritesAllowed(env: Record<string, string | undefined> = process.env): boolean {
  const key = env.STRIPE_SECRET_KEY?.trim() ?? '';
  if (key.startsWith('sk_test_')) return true;
  if (key.startsWith('sk_live_') && env.VERCEL_ENV === 'production' && isGiftsEnabled(env)) return true;
  return false;
}
