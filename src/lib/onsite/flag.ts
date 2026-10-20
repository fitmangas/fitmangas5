/** Présentiel masqué tant que ONSITE_ENABLED ≠ 1. Rien n’est supprimé. */

export function isOnsiteEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const v = (env.ONSITE_ENABLED ?? env.NEXT_PUBLIC_ONSITE_ENABLED ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}
