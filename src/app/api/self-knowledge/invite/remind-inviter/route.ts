import { NextResponse } from 'next/server';
import { z } from 'zod';

import { wrapResendEmail, getEmailPublicBaseUrl } from '@/lib/email/base-template';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildShareUrl } from '@/lib/self-knowledge/invites';

const bodySchema = z.object({
  inviterEmail: z.string().trim().email().max(120),
  locale: z.enum(['fr', 'es']).optional().default('fr'),
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeHref(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Rappel UNIQUEMENT à l’invitante (jamais à l’invitée).
 * Pas de nurture / follow-up vers l’invitee.
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

  const inviterEmail = parsed.data.inviterEmail.trim().toLowerCase();
  const admin = createAdminClient();

  const { data: invites, error } = await admin
    .from('self_test_invites')
    .select('*')
    .ilike('inviter_email', inviterEmail)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('[invite/remind-inviter]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!invites?.length) {
    return NextResponse.json({ error: 'Aucune invitation trouvée pour cet email.' }, { status: 404 });
  }

  const latest = invites[0]!;
  const shareUrl = buildShareUrl(String(latest.share_token), parsed.data.locale);
  const firstName = (latest.inviter_first_name as string | null)?.trim() || '';

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return NextResponse.json({
      ok: true,
      emailSent: false,
      to: inviterEmail,
      shareUrl,
      detail: 'Resend absent — rappel non envoyé, lien fourni.',
    });
  }

  const locale = parsed.data.locale;
  const subject =
    locale === 'es'
      ? 'Tu enlace para invitar a una amiga — FitMangas'
      : 'Ton lien pour inviter une amie — FitMangas';

  const greeting = firstName
    ? locale === 'es'
      ? `Hola ${escapeHtml(firstName)},`
      : `Salut ${escapeHtml(firstName)},`
    : locale === 'es'
      ? 'Hola,'
      : 'Salut,';

  const innerHtml =
    locale === 'es'
      ? `<p style="margin:0 0 14px;color:#2D2D2D;">${greeting}</p>
         <p style="margin:0 0 14px;color:#2D2D2D;">Aquí tienes de nuevo tu enlace para invitar a una amiga al test FitMangas. Este recordatorio es solo para ti.</p>
         <p style="margin:0 0 14px;word-break:break-all;"><a href="${escapeHref(shareUrl)}" style="color:#C45D3E;">${escapeHtml(shareUrl)}</a></p>`
      : `<p style="margin:0 0 14px;color:#2D2D2D;">${greeting}</p>
         <p style="margin:0 0 14px;color:#2D2D2D;">Voici à nouveau ton lien pour inviter une amie au test FitMangas. Ce rappel est uniquement pour toi.</p>
         <p style="margin:0 0 14px;word-break:break-all;"><a href="${escapeHref(shareUrl)}" style="color:#C45D3E;">${escapeHtml(shareUrl)}</a></p>`;

  const html = wrapResendEmail({
    innerHtml,
    locale,
    showPreferencesLink: true,
    unsubscribeUrl: `${getEmailPublicBaseUrl()}/compte/profil#notifications`,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: inviterEmail, subject, html }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Envoi rappel impossible (provider_${res.status}).` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    emailSent: true,
    to: inviterEmail,
    shareUrl,
  });
}
