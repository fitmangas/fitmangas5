'use server';

import { revalidatePath } from 'next/cache';

import { dispatch } from '@/lib/notifications/dispatcher';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type SupportTicketType = 'bug' | 'question' | 'suggestion' | 'other';

export type SubmitSupportTicketResult = { ok: true } | { ok: false; message: string };

const TYPE_LABELS: Record<SupportTicketType, string> = {
  bug: 'Bug technique',
  question: 'Question',
  suggestion: 'Suggestion',
  other: 'Autre',
};

export async function submitSupportTicketAction(
  type: SupportTicketType,
  message: string,
): Promise<SubmitSupportTicketResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Connexion requise.' };

  const trimmed = message.trim();
  if (trimmed.length < 10) {
    return { ok: false, message: 'Décris ton problème en au moins 10 caractères.' };
  }
  if (trimmed.length > 4000) {
    return { ok: false, message: 'Message trop long (4000 caractères max).' };
  }

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      type,
      message: trimmed,
      status: 'open',
    })
    .select('id')
    .single();

  if (error || !ticket?.id) {
    console.error('[support] insert ticket', error);
    return { ok: false, message: 'Envoi impossible pour le moment. Réessaie plus tard.' };
  }

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin.from('profiles').select('first_name').eq('id', user.id).maybeSingle();
    const firstName = profile?.first_name?.trim() || null;

    await dispatch(admin, {
      event_type: 'account.support_ticket_received',
      user_id: user.id,
      payload: {
        title: 'Votre message a bien été reçu',
        body: 'Nous avons bien reçu votre message et reviendrons vers vous rapidement.',
        firstName,
      },
      channel_hints: ['in_app', 'email'],
      idempotency_key: `account.support_ticket_received:${ticket.id}`,
    });
    const adminFirstName = profile?.first_name?.trim() || 'Cliente';
    const typeLabel = TYPE_LABELS[type];

    const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin');
    const rows = (admins ?? []).map((a) => ({
      user_id: a.id,
      kind: 'support_ticket',
      title: 'Nouveau ticket support',
      body: `${adminFirstName} — ${typeLabel} : ${trimmed.slice(0, 200)}${trimmed.length > 200 ? '…' : ''}`,
    }));
    if (rows.length) {
      const { error: notifError } = await admin.from('user_notifications').insert(rows);
      if (notifError) console.error('[support] admin notification', notifError);
    }
  } catch (err) {
    console.error('[support] notify admins', err);
  }

  revalidatePath('/admin/inbox');
  return { ok: true };
}
