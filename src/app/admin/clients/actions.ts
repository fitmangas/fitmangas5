'use server';

import { revalidatePath } from 'next/cache';

import { sendPasswordResetEmail } from '@/lib/auth/password-reset';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export type ClientAdminActionResult = { ok: true } | { ok: false; message: string };

/** Envoie à la cliente l'e-mail « choisis ton nouveau mot de passe » (même e-mail que « mot de passe oublié »). */
export async function sendPasswordResetLinkAction(profileId: string): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(profileId);
    const email = data?.user?.email?.trim();
    if (error || !email) return { ok: false, message: 'Aucun e-mail de connexion pour ce compte.' };
    const result = await sendPasswordResetEmail({ email });
    if (!result.sent) return { ok: false, message: `E-mail non envoyé (${result.reason}).` };
    return { ok: true, message: `Lien envoyé à ${email}. Il est valable une heure.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erreur serveur.' };
  }
}

export async function archiveClientAction(profileId: string): Promise<ClientAdminActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin.from('profiles').update({ archived: true, updated_at: new Date().toISOString() }).eq('id', profileId);
    if (error) return { ok: false, message: error.message };
    revalidatePath('/admin');
    revalidatePath('/admin/clients');
    revalidatePath(`/admin/clients/${profileId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erreur serveur.' };
  }
}

export async function unarchiveClientAction(profileId: string): Promise<ClientAdminActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin.from('profiles').update({ archived: false, updated_at: new Date().toISOString() }).eq('id', profileId);
    if (error) return { ok: false, message: error.message };
    revalidatePath('/admin');
    revalidatePath('/admin/clients');
    revalidatePath(`/admin/clients/${profileId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erreur serveur.' };
  }
}

export async function deleteClientAction(profileId: string): Promise<ClientAdminActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error: authError } = await admin.auth.admin.deleteUser(profileId);
    if (authError) return { ok: false, message: authError.message };
    revalidatePath('/admin');
    revalidatePath('/admin/clients');
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erreur serveur.' };
  }
}
