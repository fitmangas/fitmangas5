/** Lot 4 — cartes cadeaux. Off tant que NEXT_PUBLIC_FEATURE_GIFTS ≠ 1. */

export function isGiftsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const v = (env.NEXT_PUBLIC_FEATURE_GIFTS ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}

export function stripeGiftWritesAllowed(env: Record<string, string | undefined> = process.env): boolean {
  const key = env.STRIPE_SECRET_KEY?.trim() ?? '';
  if (key.startsWith('sk_test_')) return true;
  if (key.startsWith('sk_live_') && env.VERCEL_ENV === 'production' && isGiftsEnabled(env)) return true;
  return false;
}
