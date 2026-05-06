'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import type { NotificationPreferencesRow } from '@/lib/notifications/types';

function compactNullable<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export type ProfilePreferencesUpdate = {
  preferred_locale?: 'fr' | 'es';
  display_timezone?: string;
  marketing_email_opt_in?: boolean;
};

export type UpdateNotificationPayload = Partial<Omit<NotificationPreferencesRow, 'user_id'>>;

export async function updateNotificationPreferences(partial: UpdateNotificationPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const update = compactNullable(partial as Record<string, unknown>) as UpdateNotificationPayload;
  if (Object.keys(update).length === 0) {
    return;
  }

  const { error: rpcError } = await supabase.rpc('ensure_notification_prefs_row', {
    p_user_id: user.id,
  });
  if (rpcError) {
    throw new Error(rpcError.message);
  }

  const { error } = await supabase
    .from('notification_preferences')
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath('/compte/preferences');
}

export async function updateProfilePreferences(partial: ProfilePreferencesUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const base = compactNullable(partial as Record<string, unknown>) as ProfilePreferencesUpdate;
  if (Object.keys(base).length === 0) {
    return;
  }

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('marketing_email_opt_in, display_timezone')
    .eq('id', user.id)
    .single();

  if (readError) {
    throw new Error(readError.message);
  }

  const payload: Record<string, unknown> = { ...base };

  if (
    base.display_timezone !== undefined &&
    base.display_timezone !== (existing?.display_timezone ?? null)
  ) {
    payload.display_timezone_manual_locked = true;
  }

  if (base.marketing_email_opt_in === true && !existing?.marketing_email_opt_in) {
    payload.marketing_email_opt_in_at = new Date().toISOString();
  }

  const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath('/compte/preferences');
}
