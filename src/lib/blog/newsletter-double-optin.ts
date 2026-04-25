import { randomBytes } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

const TOKEN_TTL_HOURS = 48;

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

async function sendEmailViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false as const, reason: 'missing_provider' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    return { sent: false as const, reason: `provider_${res.status}` };
  }
  return { sent: true as const, reason: 'provider_sent' };
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

export async function sendNewsletterConfirmationEmail(email: string, token: string): Promise<{ sent: boolean; confirmUrl: string }> {
  const confirmUrl = `${appUrl()}/api/client/newsletter/confirm?token=${encodeURIComponent(token)}`;
  const result = await sendEmailViaResend(
    email,
    'Confirme ton inscription newsletter FitMangas',
    `<p>Confirme ton inscription en cliquant ici :</p><p><a href="${confirmUrl}">${confirmUrl}</a></p>`,
  );
  if (!result.sent) {
    console.info('[newsletter confirm] mode sans provider, lien:', confirmUrl);
  }
  return { sent: result.sent, confirmUrl };
}

export async function sendPublicationNewsletter(params: { articleId: string; title: string; slugFr: string }) {
  const admin = createAdminClient();
  const articleUrl = `${appUrl()}/blog/${params.slugFr}`;
  const { data: subscribers } = await admin
    .from('newsletter_subscriptions')
    .select('email')
    .eq('confirmed', true)
    .eq('unsubscribed', false);

  const list = (subscribers ?? []).map((s) => s.email).filter(Boolean);
  let sent = 0;
  for (const email of list) {
    const result = await sendEmailViaResend(
      email,
      `Nouveau sur le blog : ${params.title}`,
      `<p>Un nouvel article vient d'être publié :</p><p><strong>${params.title}</strong></p><p><a href="${articleUrl}">Lire l'article</a></p>`,
    );
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
