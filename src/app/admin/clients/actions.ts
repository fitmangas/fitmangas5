'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export type ClientAdminActionResult = { ok: true } | { ok: false; message: string };

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
