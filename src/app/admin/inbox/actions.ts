'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function resolveSupportTicketAction(ticketId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('support_tickets')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('status', 'open');
  if (error) throw new Error(error.message);
  revalidatePath('/admin/inbox');
}

export async function markAdminNotificationReadAction(notificationId: string) {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/inbox');
}

export async function markAllAdminNotificationsReadAction() {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);
  revalidatePath('/admin/inbox');
}
