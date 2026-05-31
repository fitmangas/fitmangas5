/** Badges santé client (liste admin + agrégats KPI). */
export type MemberHealthBadge = 'new' | 'watch' | 'green' | 'orange' | 'red';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Profil récent, sans activité prolongée : voir règles produit (7 / 14 jours).
 */
export function computeMemberHealth(args: {
  lastActivityTs: number;
  accountCreatedTs: number;
  now: number;
}): MemberHealthBadge {
  const { lastActivityTs, accountCreatedTs, now } = args;
  const ageMs = now - accountCreatedTs;
  const last = lastActivityTs > 0 ? lastActivityTs : 0;

  if (ageMs < 7 * DAY_MS) return 'new';

  if (!last) {
    if (ageMs < 14 * DAY_MS) return 'watch';
    return 'red';
  }

  const fourteenDaysAgo = now - 14 * DAY_MS;
  const fourDaysAgo = now - 4 * DAY_MS;

  if (ageMs < 14 * DAY_MS) {
    if (last < fourteenDaysAgo) return 'orange';
    if (last < fourDaysAgo) return 'orange';
    return 'green';
  }

  if (last < fourteenDaysAgo) return 'red';
  if (last < fourDaysAgo) return 'orange';
  return 'green';
}
