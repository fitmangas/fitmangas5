import { Resend } from 'resend';

import { wrapResendEmail } from '@/lib/email/base-template';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Alerte ops — escalade inbox Acquisition vers Alejandra (pas un email cliente). */
export async function sendAcquisitionEscalationEmail(params: {
  conversationId: string;
  channel: string;
  handle: string | null;
  preview: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  return sendAcquisitionOpsEmail({
    subjectPrefix: 'Escalade DM',
    title: 'Escalade inbox Acquisition',
    intro: 'Un fil a besoin d’une réponse humaine.',
    conversationId: params.conversationId,
    channel: params.channel,
    handle: params.handle,
    preview: params.preview,
    extraLines: [],
  });
}

/** Alerte ops — intention de réservation (Nantes / créneaux). */
export async function sendAcquisitionBookingEmail(params: {
  conversationId: string;
  channel: string;
  handle: string | null;
  courseType: string;
  preview: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const courseLabel =
    params.courseType === 'nantes_presentiel' ? 'Présentiel Nantes' : 'Visio collectif (créneaux)';
  return sendAcquisitionOpsEmail({
    subjectPrefix: 'Booking intent',
    title: 'Nouvelle demande de cours',
    intro: 'Une lead a demandé des créneaux — réponds vite pour convertir.',
    conversationId: params.conversationId,
    channel: params.channel,
    handle: params.handle,
    preview: params.preview,
    extraLines: [`<li><strong>Type</strong> : ${escapeHtml(courseLabel)}</li>`],
  });
}

async function sendAcquisitionOpsEmail(params: {
  subjectPrefix: string;
  title: string;
  intro: string;
  conversationId: string;
  channel: string;
  handle: string | null;
  preview: string | null;
  extraLines: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  const to =
    process.env.ACQUISITION_ESCALATION_EMAIL?.trim() ||
    process.env.ADMIN_ALERT_EMAIL?.trim() ||
    'alejandra@fitmangas.com';

  if (!apiKey || !from) {
    return { ok: false, error: 'RESEND_API_KEY ou NEWSLETTER_FROM_EMAIL manquant.' };
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://fitmangas.com').replace(/\/$/, '');
  const inboxUrl = `${base}/admin/croissance?tab=conversations&conversation=${encodeURIComponent(params.conversationId)}`;
  const who = params.handle || 'Contact';
  const preview = (params.preview || '—').slice(0, 280);

  const innerHtml = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#C45D3E;font-family:system-ui,sans-serif;">${escapeHtml(params.title)}</h1>
    <p style="margin:0 0 12px;color:#2D2D2D;">${escapeHtml(params.intro)}</p>
    <ul style="margin:0 0 16px;padding-left:18px;color:#2D2D2D;">
      <li><strong>Contact</strong> : ${escapeHtml(who)}</li>
      <li><strong>Canal</strong> : ${escapeHtml(params.channel)}</li>
      ${params.extraLines.join('\n')}
      <li><strong>Aperçu</strong> : ${escapeHtml(preview)}</li>
    </ul>
    <p style="margin:0;">
      <a href="${escapeHtml(inboxUrl)}" style="display:inline-block;padding:12px 20px;background:#C45D3E;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;">
        Ouvrir le fil
      </a>
    </p>
  `;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `[FitMangas] ${params.subjectPrefix} — ${who} (${params.channel})`,
      html: wrapResendEmail({ innerHtml, locale: 'fr', showPreferencesLink: false }),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Envoi Resend échoué' };
  }
}
