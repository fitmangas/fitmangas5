import type { SupabaseClient } from '@supabase/supabase-js';

/** Désactive la synchro en base (le token peut rester pour une réactivation future). */
export async function disableCalendarSyncFlag(admin: SupabaseClient, userId: string) {
  await admin.from('profiles').update({ calendar_sync_enabled: false }).eq('id', userId);
}

export type CalendarSyncGateResult =
  | { ok: true }
  | { ok: false; reason: 'auth_missing' | 'auth_banned' | 'no_access' };

/**
 * Flux mobile + toggle synchro : autorisé seulement si le compte Auth existe,
 * n'est pas banni, et la cliente a encore un accès métier
 * (tier effectif, abonnement past_due dans la période, ou cours réservé actif — pas un simple statut canceled).
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
  if (bannedUntil != null && bannedUntil.trim() !== '') {
    const until = new Date(bannedUntil);
    if (!Number.isNaN(until.getTime()) && until > new Date()) {
      await disableCalendarSyncFlag(admin, userId);
      return { ok: false, reason: 'auth_banned' };
    }
  }

  const { data: eligible, error: rpcError } = await admin.rpc('customer_calendar_feed_eligible', {
    target_user_id: userId,
  });

  if (rpcError) {
    console.error('[calendar-sync-eligibility]', rpcError);
    await disableCalendarSyncFlag(admin, userId);
    return { ok: false, reason: 'no_access' };
  }

  if (eligible !== true) {
    await disableCalendarSyncFlag(admin, userId);
    return { ok: false, reason: 'no_access' };
  }

  return { ok: true };
}
