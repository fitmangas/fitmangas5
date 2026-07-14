'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { dispatch } from '@/lib/notifications/dispatcher';
import { createAdminClient } from '@/lib/supabase/admin';

export async function resolveSupportTicketAction(ticketId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: ticket, error: ticketError } = await admin
    .from('support_tickets')
    .select('id, user_id, status')
    .eq('id', ticketId)
    .maybeSingle();
  if (ticketError) throw new Error(ticketError.message);
  if (!ticket?.id || ticket.status !== 'open') {
    revalidatePath('/admin/inbox');
    return;
  }

  const { error } = await admin
    .from('support_tickets')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('status', 'open');
  if (error) throw new Error(error.message);

  try {
    await dispatch(admin, {
      event_type: 'account.support_ticket_resolved',
      user_id: ticket.user_id,
      payload: {
        kind: 'support_ticket_resolved',
        title: 'Ton message a été traité ✓',
        body: 'Ta demande a été résolue par l’équipe FitMangas. Merci de nous avoir signalé ça, ça nous aide à améliorer la plateforme.',
      },
      channel_hints: ['in_app'],
      idempotency_key: `account.support_ticket_resolved:${ticket.id}`,
    });
  } catch (notifyError) {
    console.error('[inbox] notify client ticket resolved', notifyError);
  }

  revalidatePath('/admin/inbox');
  revalidatePath('/compte/notifications');
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
