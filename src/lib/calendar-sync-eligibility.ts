import type { SupabaseClient } from '@supabase/supabase-js';

import { hasMemberCourseAccessByUserId } from '@/lib/access-control';

/** Désactive la synchro en base (le token peut rester pour une réactivation future). */
export async function disableCalendarSyncFlag(admin: SupabaseClient, userId: string) {
  await admin.from('profiles').update({ calendar_sync_enabled: false }).eq('id', userId);
}

export type CalendarSyncGateResult =
  | { ok: true }
  | { ok: false; reason: 'auth_missing' | 'auth_banned' | 'no_access' };

/**
 * Flux mobile + toggle synchro : même critère d’accès membre que les cours
 * (`current_customer_tier` / admin), plus compte Auth non banni.
 */
export async function gateCalendarSyncForUser(
  admin: SupabaseClient,
  userId: string,
): Promise<CalendarSyncGateResult> {
  const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId);
  if (authError || !authData?.user) {
    await disableCalendarSyncFlag(admin, userId);
    return { ok: false, reason: 'auth_missing' };
  }

  const bannedUntil = authData.user.banned_until;
  if (bannedUntil != null && String(bannedUntil).trim() !== '') {
    const until = new Date(bannedUntil);
    if (!Number.isNaN(until.getTime()) && until > new Date()) {
      await disableCalendarSyncFlag(admin, userId);
      return { ok: false, reason: 'auth_banned' };
    }
  }

  let hasAccess = false;
  try {
    hasAccess = await hasMemberCourseAccessByUserId(userId);
  } catch (e) {
    console.error('[calendar-sync-eligibility] member access', e);
    hasAccess = false;
  }

  if (!hasAccess) {
    await disableCalendarSyncFlag(admin, userId);
    return { ok: false, reason: 'no_access' };
  }

  return { ok: true };
}
