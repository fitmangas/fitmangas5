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
    <h1 style="margin:0 0 16px;font-size:22px;color:#C45D3E;font-family:system-ui,sans-serif;">Escalade inbox Acquisition</h1>
    <p style="margin:0 0 12px;color:#2D2D2D;">Un fil a besoin d’une réponse humaine.</p>
    <ul style="margin:0 0 16px;padding-left:18px;color:#2D2D2D;">
      <li><strong>Contact</strong> : ${escapeHtml(who)}</li>
      <li><strong>Canal</strong> : ${escapeHtml(params.channel)}</li>
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
      subject: `[FitMangas] Escalade DM — ${who} (${params.channel})`,
      html: wrapResendEmail({ innerHtml, locale: 'fr', showPreferencesLink: false }),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Envoi Resend échoué' };
  }
}
