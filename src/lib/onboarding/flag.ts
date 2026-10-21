/** « Premiers pas » (tuto guidé, liste de démarrage, aide par page). Éteint tant que PREMIERS_PAS_ENABLED ≠ 1 : rien ne change. */
export function isPremiersPasEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const v = (env.PREMIERS_PAS_ENABLED ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}
