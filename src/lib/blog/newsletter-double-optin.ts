import { randomBytes } from 'node:crypto';
import { wrapResendEmail } from '@/lib/email/base-template';
import { createAdminClient } from '@/lib/supabase/admin';

const TOKEN_TTL_HOURS = 48;

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

async function sendEmailViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false as const, reason: 'missing_provider' };

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (res.ok) {
      return { sent: true as const, reason: 'provider_sent' };
    }
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 300 * attempt));
      continue;
    }
    return { sent: false as const, reason: `provider_${res.status}` };
  }
  return { sent: false as const, reason: 'provider_unknown' };
}

export async function createNewsletterConfirmationToken(subscriptionId: string): Promise<string> {
  const admin = createAdminClient();
  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();
  await admin.from('newsletter_confirmation_tokens').insert({
    subscription_id: subscriptionId,
    token,
    expires_at: expiresAt,
  });
  return token;
}

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

export async function sendNewsletterConfirmationEmail(email: string, token: string): Promise<{ sent: boolean; confirmUrl: string }> {
  const confirmUrl = `${appUrl()}/api/client/newsletter/confirm?token=${encodeURIComponent(token)}`;
  const innerHtml = `<p style="margin:0 0 14px;color:#2D2D2D;">Confirme ton inscription en cliquant sur le bouton ci-dessous.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto 0;">
        <tr>
          <td align="center" style="border-radius:8px;background-color:#C45D3E;">
            <a href="${escapeHref(confirmUrl)}" class="email-cta-link" style="display:inline-block;padding:14px 32px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;background-color:#C45D3E;">Confirmer mon inscription</a>
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0;font-size:12px;color:#6B6560;word-break:break-all;">${escapeHtml(confirmUrl)}</p>`;
  const html = wrapResendEmail({
    innerHtml,
    locale: 'fr',
    showPreferencesLink: false,
  });
  const result = await sendEmailViaResend(email, 'Confirme ton inscription newsletter FitMangas', html);
  if (!result.sent) {
    console.info('[newsletter confirm] mode sans provider, lien:', confirmUrl);
  }
  return { sent: result.sent, confirmUrl };
}

export async function sendPublicationNewsletter(params: { articleId: string; title: string; slugFr: string; excludeUserIds?: string[] }) {
  const admin = createAdminClient();
  const articleUrl = `${appUrl()}/blog/${params.slugFr}`;
  const excludedEmails = new Set<string>();
  for (const userId of params.excludeUserIds ?? []) {
    const { data } = await admin.auth.admin.getUserById(userId);
    const email = data.user?.email?.trim().toLowerCase();
    if (email) excludedEmails.add(email);
  }
  const { data: subscribers } = await admin
    .from('newsletter_subscriptions')
    .select('email')
    .eq('confirmed', true)
    .eq('unsubscribed', false);

  const list = (subscribers ?? [])
    .map((s) => s.email)
    .filter(Boolean)
    .filter((email) => !excludedEmails.has(String(email).trim().toLowerCase()));
  const articleUrlEsc = escapeHref(articleUrl);
  const titleEsc = escapeHtml(params.title);
  let sent = 0;
  for (const email of list) {
    const inner = `<p style="margin:0 0 14px;color:#2D2D2D;">Un nouvel article vient d'être publié :</p><p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#C45D3E;">${titleEsc}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
        <tr>
          <td align="center" style="border-radius:8px;background-color:#C45D3E;">
            <a href="${articleUrlEsc}" class="email-cta-link" style="display:inline-block;padding:14px 32px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;background-color:#C45D3E;">Lire l'article</a>
          </td>
        </tr>
      </table>`;
    const html = wrapResendEmail({ innerHtml: inner, locale: 'fr', showPreferencesLink: true });
    const result = await sendEmailViaResend(email, `Nouveau sur le blog : ${params.title}`, html);
    if (result.sent) sent += 1;
  }

  await admin.from('blog_publication_events').upsert(
    {
      article_id: params.articleId,
      published_at: new Date().toISOString(),
      newsletter_targeted: list.length,
      newsletter_sent: sent,
      newsletter_provider: process.env.RESEND_API_KEY ? 'resend' : 'none',
    },
    { onConflict: 'article_id' },
  );

  return { targeted: list.length, sent };
}
