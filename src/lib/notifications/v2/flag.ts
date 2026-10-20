/** Lot 2 — notifications v2. Off tant que NEXT_PUBLIC_FEATURE_NOTIF_V2 ≠ 1. */

export function isNotifV2Enabled(env?: Record<string, string | undefined>): boolean {
  // Accès littéral à process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2 : seul ce format est remplacé dans le code
  // envoyé au navigateur. Avec un accès indirect (env.X), le navigateur lisait toujours
  // « off » alors que le serveur lisait « on » → erreurs d’hydratation et menus incohérents.
  const raw = env ? env.NEXT_PUBLIC_FEATURE_NOTIF_V2 : process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2;
  const v = (raw ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}
