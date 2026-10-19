'use server';

import { revalidatePath } from 'next/cache';

import { AVATAR_MAX_BYTES, validateAvatarBytes } from '@/lib/compte/avatar-validation';
import { createClient } from '@/lib/supabase/server';
import { clientHiddenNotificationKindsFilter } from '@/lib/notifications/client-notification-filter';

export type CompteActionResult = { ok: true } | { ok: false; message: string };

export async function toggleReplayFavoriteAction(recordingId: string): Promise<CompteActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Connexion requise.' };

  const { error } = await supabase.rpc('toggle_replay_favorite', { p_recording_id: recordingId });
  if (error) return { ok: false, message: error.message };

  revalidatePath('/compte');
  revalidatePath('/compte/replays');
  return { ok: true };
}

export async function markNotificationReadAction(notificationId: string): Promise<CompteActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Connexion requise.' };

  const { error } = await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath('/compte');
  revalidatePath('/compte/notifications');
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<CompteActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Connexion requise.' };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('user_notifications')
    .update({ read_at: now })
    .eq('user_id', user.id)
    .is('read_at', null)
    .not('kind', 'in', clientHiddenNotificationKindsFilter());

  if (error) return { ok: false, message: error.message };

  revalidatePath('/compte');
  revalidatePath('/compte/notifications');
  return { ok: true };
}

/** Formulaire « photo » : types Next attendent une action sans valeur de retour exploitable côté client. */
export async function updateAvatarAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const file = formData.get('avatar');
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > AVATAR_MAX_BYTES) return;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateAvatarBytes(bytes, file.type || null);
  if (!check.ok) {
    console.warn('[avatar] fichier refusé', check.reason);
    return;
  }
  const path = `${user.id}/avatar.${check.ext}`;

  const { error: upErr } = await supabase.storage.from('avatars').upload(path, bytes, {
    upsert: true,
    contentType: check.mime,
  });
  if (upErr) return;

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path);

  const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', user.id);

  if (dbErr) return;

  revalidatePath('/compte');
  revalidatePath('/compte/profil');
}

export async function updateBirthDateAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const raw = formData.get('birth_date');
  const str = typeof raw === 'string' ? raw.trim() : '';
  const birthDate = str === '' ? null : str;

  await supabase
    .from('profiles')
    .update({ birth_date: birthDate, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  revalidatePath('/compte/profil');
  revalidatePath('/compte');
}
