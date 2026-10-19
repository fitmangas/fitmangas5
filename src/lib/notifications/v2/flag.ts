/** Lot 2 — notifications v2. Off tant que NEXT_PUBLIC_FEATURE_NOTIF_V2 ≠ 1. */

export function isNotifV2Enabled(env: Record<string, string | undefined> = process.env): boolean {
  const v = (env.NEXT_PUBLIC_FEATURE_NOTIF_V2 ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}
