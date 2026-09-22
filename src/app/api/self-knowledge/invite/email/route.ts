import { NextResponse } from 'next/server';
import { z } from 'zod';

import { wrapResendEmail, getEmailPublicBaseUrl } from '@/lib/email/base-template';
import {
  buildShareUrl,
  createEmailInvite,
  markEmailInviteSent,
} from '@/lib/self-knowledge/invites';

const bodySchema = z.object({
  inviterEmail: z.string().trim().email().max(120),
  inviterFirstName: z.string().trim().max(60).optional().nullable(),
  inviterResultId: z.string().uuid().optional().nullable(),
  inviteeEmail: z.string().trim().email().max(120),
  locale: z.enum(['fr', 'es']).optional().default('fr'),
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeHref(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

async function sendInviteEmail(params: {
  to: string;
  inviterFirstName: string;
  shareUrl: string;
  locale: 'fr' | 'es';
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return { sent: false, reason: 'missing_provider' };
  }

  const first = params.inviterFirstName.trim() || (params.locale === 'es' ? 'Una amiga' : 'Une amie');
  const subject =
    params.locale === 'es'
      ? `${first} te invita a descubrir tu perfil FitMangas`
      : `${first} t’invite à découvrir ton profil FitMangas`;

  const unsubUrl = `${getEmailPublicBaseUrl()}/quiz`;
  const innerHtml =
    params.locale === 'es'
      ? `<p style="margin:0 0 14px;color:#2D2D2D;"><strong>${escapeHtml(first)}</strong> te invita a hacer el test de conocimiento de sí de FitMangas.</p>
         <p style="margin:0 0 14px;color:#2D2D2D;">Es un envío único: no recibirás más emails de esta invitación.</p>
         <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto 0;">
           <tr><td align="center" style="border-radius:8px;background-color:#C45D3E;">
             <a href="${escapeHref(params.shareUrl)}" style="display:inline-block;padding:14px 32px;font-family:system-ui,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;background-color:#C45D3E;">Descubrir mi perfil</a>
           </td></tr>
         </table>`
      : `<p style="margin:0 0 14px;color:#2D2D2D;"><strong>${escapeHtml(first)}</strong> t’invite à faire le test de connaissance de soi FitMangas.</p>
         <p style="margin:0 0 14px;color:#2D2D2D;">Envoi unique : tu ne recevras pas d’autres emails liés à cette invitation.</p>
         <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto 0;">
           <tr><td align="center" style="border-radius:8px;background-color:#C45D3E;">
             <a href="${escapeHref(params.shareUrl)}" style="display:inline-block;padding:14px 32px;font-family:system-ui,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;background-color:#C45D3E;">Découvrir mon profil</a>
           </td></tr>
         </table>`;

  const html = wrapResendEmail({
    innerHtml,
    locale: params.locale,
    showPreferencesLink: false,
    unsubscribeUrl: unsubUrl,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: params.to, subject, html }),
  });

  if (!res.ok) {
    return { sent: false, reason: `provider_${res.status}` };
  }
  return { sent: true };
}

/**
 * Envoie UN seul email à l’invitée. Jamais de follow-up auto.
 * Refuse si déjà envoyé pour ce couple (inviter, invitee).
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const created = await createEmailInvite({
    inviterEmail: parsed.data.inviterEmail,
    inviterFirstName: parsed.data.inviterFirstName,
    inviterResultId: parsed.data.inviterResultId,
    inviteeEmail: parsed.data.inviteeEmail,
  });

  if (!created.ok) {
    return NextResponse.json(
      { error: created.error, alreadySent: created.alreadySent ?? false },
      { status: created.status },
    );
  }

  if (created.invite.email_sent_count > 0 || created.invite.email_sent_at) {
    return NextResponse.json(
      { error: 'Une invitation a déjà été envoyée à cette adresse.', alreadySent: true },
      { status: 409 },
    );
  }

  const shareUrl = buildShareUrl(created.invite.share_token, parsed.data.locale);
  const firstName = parsed.data.inviterFirstName?.trim() || created.invite.inviter_first_name || '';

  const emailResult = await sendInviteEmail({
    to: parsed.data.inviteeEmail.trim().toLowerCase(),
    inviterFirstName: firstName,
    shareUrl,
    locale: parsed.data.locale,
  });

  if (!emailResult.sent && emailResult.reason === 'missing_provider') {
    // Mode local / sans Resend : on marque quand même pour respecter « un seul envoi »
    // et on renvoie le lien pour debug — pas de fallback silencieux.
    await markEmailInviteSent(created.invite.id);
    return NextResponse.json({
      ok: true,
      inviteId: created.invite.id,
      emailSent: false,
      shareUrl,
      detail: 'Resend absent — invitation enregistrée, lien fourni.',
    });
  }

  if (!emailResult.sent) {
    return NextResponse.json(
      { error: `Envoi email impossible (${emailResult.reason ?? 'unknown'}).`, shareUrl },
      { status: 502 },
    );
  }

  const marked = await markEmailInviteSent(created.invite.id);
  if (!marked.ok) {
    // Email parti mais compteur non mis à jour — signaler clairement
    console.error('[invite/email] mark failed after send', marked.error);
  }

  return NextResponse.json({
    ok: true,
    inviteId: created.invite.id,
    emailSent: true,
    shareUrl,
  });
}
