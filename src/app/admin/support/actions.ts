'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function resolveSupportTicketAction(ticketId: string): Promise<{ ok: boolean; message?: string }> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('support_tickets')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('status', 'open');

  if (error) {
    console.error('[admin/support] resolve', error);
    return { ok: false, message: error.message };
  }

  void user;
  revalidatePath('/admin/inbox');
  return { ok: true };
}
