/**
 * Invitations self-test (RGPD) — lien partage ou email unique, jamais de follow-up auto à l'invitée.
 */
import { randomBytes } from 'node:crypto';

import { createAdminClient } from '@/lib/supabase/admin';

export type InviteChannel = 'share_link' | 'email';

export type SelfTestInviteRow = {
  id: string;
  inviter_result_id: string | null;
  inviter_email: string;
  inviter_first_name: string | null;
  invitee_email: string | null;
  share_token: string;
  channel: InviteChannel;
  email_sent_at: string | null;
  email_sent_count: number;
  consent_logged_at: string;
  created_at: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function newShareToken(): string {
  return randomBytes(16).toString('hex');
}

export function buildShareUrl(token: string, locale: 'fr' | 'es' = 'fr'): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(
    /\/$/,
    '',
  );
  const path = locale === 'es' ? '/es/quiz' : '/quiz';
  return `${base}${path}?ref=${encodeURIComponent(token)}`;
}

/** Journalise le consentement d’invitation (timestamp figé à la création). */
export async function logConsent(inviteId: string): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from('self_test_invites')
    .update({ consent_logged_at: now })
    .eq('id', inviteId);
  if (error) {
    console.error('[self-test-invite] logConsent', error);
  }
}

export type CreateShareInviteInput = {
  inviterEmail: string;
  inviterFirstName?: string | null;
  inviterResultId?: string | null;
};

export async function createShareInvite(
  input: CreateShareInviteInput,
): Promise<{ ok: true; invite: SelfTestInviteRow } | { ok: false; error: string; status: number }> {
  const inviterEmail = normalizeEmail(input.inviterEmail);
  if (!inviterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviterEmail)) {
    return { ok: false, error: 'Email invitante invalide.', status: 400 };
  }

  const admin = createAdminClient();
  const token = newShareToken();
  const { data, error } = await admin
    .from('self_test_invites')
    .insert({
      inviter_email: inviterEmail,
      inviter_first_name: input.inviterFirstName?.trim() || null,
      inviter_result_id: input.inviterResultId ?? null,
      invitee_email: null,
      share_token: token,
      channel: 'share_link',
      email_sent_count: 0,
    })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    console.error('[self-test-invite] createShareInvite', error);
    return { ok: false, error: error?.message ?? 'Création invitation impossible.', status: 500 };
  }

  return { ok: true, invite: data as SelfTestInviteRow };
}

export type CreateEmailInviteInput = {
  inviterEmail: string;
  inviterFirstName?: string | null;
  inviterResultId?: string | null;
  inviteeEmail: string;
};

/**
 * Crée une invitation email. Refuse si un envoi a déjà eu lieu pour ce couple
 * (unique partial index + garde applicative).
 */
export async function createEmailInvite(
  input: CreateEmailInviteInput,
): Promise<
  | { ok: true; invite: SelfTestInviteRow; alreadySent: false }
  | { ok: false; error: string; status: number; alreadySent?: boolean }
> {
  const inviterEmail = normalizeEmail(input.inviterEmail);
  const inviteeEmail = normalizeEmail(input.inviteeEmail);

  if (!inviterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviterEmail)) {
    return { ok: false, error: 'Email invitante invalide.', status: 400 };
  }
  if (!inviteeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteeEmail)) {
    return { ok: false, error: 'Email invitée invalide.', status: 400 };
  }
  if (inviterEmail === inviteeEmail) {
    return { ok: false, error: 'Tu ne peux pas t’inviter toi-même.', status: 400 };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('self_test_invites')
    .select('*')
    .eq('channel', 'email')
    .ilike('inviter_email', inviterEmail)
    .ilike('invitee_email', inviteeEmail)
    .maybeSingle();

  if (existing) {
    const row = existing as SelfTestInviteRow;
    if (row.email_sent_count > 0 || row.email_sent_at) {
      return {
        ok: false,
        error: 'Une invitation a déjà été envoyée à cette adresse.',
        status: 409,
        alreadySent: true,
      };
    }
    return { ok: true, invite: row, alreadySent: false };
  }

  const token = newShareToken();
  const { data, error } = await admin
    .from('self_test_invites')
    .insert({
      inviter_email: inviterEmail,
      inviter_first_name: input.inviterFirstName?.trim() || null,
      inviter_result_id: input.inviterResultId ?? null,
      invitee_email: inviteeEmail,
      share_token: token,
      channel: 'email',
      email_sent_count: 0,
    })
    .select('*')
    .maybeSingle();

  if (error) {
    // Race sur l’index unique → traiter comme déjà existant
    if (error.code === '23505') {
      return {
        ok: false,
        error: 'Une invitation a déjà été envoyée à cette adresse.',
        status: 409,
        alreadySent: true,
      };
    }
    console.error('[self-test-invite] createEmailInvite', error);
    return { ok: false, error: error.message, status: 500 };
  }

  if (!data) {
    return { ok: false, error: 'Création invitation impossible.', status: 500 };
  }

  return { ok: true, invite: data as SelfTestInviteRow, alreadySent: false };
}

/** Marque l’email invite comme envoyé (une seule fois). */
export async function markEmailInviteSent(
  inviteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: row } = await admin
    .from('self_test_invites')
    .select('email_sent_count, email_sent_at')
    .eq('id', inviteId)
    .maybeSingle();

  if (!row) return { ok: false, error: 'Invitation introuvable.' };
  if (Number(row.email_sent_count ?? 0) > 0 || row.email_sent_at) {
    return { ok: false, error: 'Déjà envoyée.' };
  }

  const { error } = await admin
    .from('self_test_invites')
    .update({
      email_sent_at: now,
      email_sent_count: 1,
    })
    .eq('id', inviteId)
    .eq('email_sent_count', 0);

  if (error) {
    console.error('[self-test-invite] markEmailInviteSent', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function getInviteByToken(token: string): Promise<SelfTestInviteRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('self_test_invites')
    .select('*')
    .eq('share_token', token)
    .maybeSingle();
  if (error) {
    console.error('[self-test-invite] getInviteByToken', error);
    return null;
  }
  return (data as SelfTestInviteRow) ?? null;
}

export async function listInvitesForInviter(inviterEmail: string): Promise<SelfTestInviteRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('self_test_invites')
    .select('*')
    .ilike('inviter_email', normalizeEmail(inviterEmail))
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[self-test-invite] listInvitesForInviter', error);
    return [];
  }
  return (data ?? []) as SelfTestInviteRow[];
}
