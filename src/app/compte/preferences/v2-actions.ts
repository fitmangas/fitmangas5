'use server';

import { revalidatePath } from 'next/cache';

import { isPrefKey, PREF_KEYS, resolvePrefColumn, type PrefKeyDef } from '@/lib/notifications/v2/preference-keys';
import { createClient } from '@/lib/supabase/server';

export type SavePrefResult = { ok: true } | { ok: false; error: 'unauthorized' | 'unknown_key' | 'column_missing' | 'save_failed' };

/** Enregistre une case de l'écran Préférences v2 (A09) : une seule colonne, liste blanche, propriétaire seulement. */
export async function savePreferenceToggleV2(key: string, value: boolean): Promise<SavePrefResult> {
  if (!isPrefKey(key) || typeof value !== 'boolean') return { ok: false, error: 'unknown_key' };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const def: PrefKeyDef = PREF_KEYS[key];

  if (def.table === 'profiles') {
    const { data: profile, error: readError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (readError) {
      console.error('[preferences v2] lecture profil', readError.message);
      return { ok: false, error: 'save_failed' };
    }
    const column = resolvePrefColumn(key, profile as Record<string, unknown> | null);
    if (!column) return { ok: false, error: 'column_missing' };
    const payload: Record<string, unknown> = { [column]: value };
    if (column === 'marketing_email_opt_in' && value && !(profile as { marketing_email_opt_in?: boolean } | null)?.marketing_email_opt_in) {
      payload.marketing_email_opt_in_at = new Date().toISOString();
    }
    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
    if (error) {
      console.error('[preferences v2] profil', column, error.message);
      return { ok: false, error: 'save_failed' };
    }
  } else {
    const { error: rpcError } = await supabase.rpc('ensure_notification_prefs_row', { p_user_id: user.id });
    if (rpcError) {
      console.error('[preferences v2] ensure row', rpcError.message);
      return { ok: false, error: 'save_failed' };
    }
    const { data: prefs, error: readError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (readError) {
      console.error('[preferences v2] lecture', readError.message);
      return { ok: false, error: 'save_failed' };
    }
    const column = resolvePrefColumn(key, prefs as Record<string, unknown> | null);
    if (!column) return { ok: false, error: 'column_missing' };
    const { error } = await supabase
      .from('notification_preferences')
      .update({ [column]: value, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) {
      console.error('[preferences v2]', column, error.message);
      return { ok: false, error: 'save_failed' };
    }
  }

  revalidatePath('/compte/preferences');
  revalidatePath('/compte/notifications');
  return { ok: true };
}
