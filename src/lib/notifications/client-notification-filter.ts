/**
 * Kinds destinés uniquement à l’admin (ne doivent jamais apparaître dans /compte).
 * - support_ticket : ancien kind des alertes « Nouveau ticket support »
 * - admin_support_ticket : kind actuel
 */
export const ADMIN_ONLY_NOTIFICATION_KINDS = ['support_ticket', 'admin_support_ticket'] as const;

export type AdminOnlyNotificationKind = (typeof ADMIN_ONLY_NOTIFICATION_KINDS)[number];

export function isAdminOnlyNotificationKind(kind: string | null | undefined): boolean {
  const value = (kind ?? '').trim();
  if (!value) return false;
  if ((ADMIN_ONLY_NOTIFICATION_KINDS as readonly string[]).includes(value)) return true;
  return value.startsWith('admin_');
}

export function isClientVisibleNotificationKind(kind: string | null | undefined): boolean {
  return !isAdminOnlyNotificationKind(kind);
}

/** Filtre PostgREST : .not('kind', 'in', clientHiddenNotificationKindsFilter()) */
export function clientHiddenNotificationKindsFilter(): string {
  return `(${ADMIN_ONLY_NOTIFICATION_KINDS.join(',')})`;
}
