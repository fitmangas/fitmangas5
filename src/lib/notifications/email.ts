import { Resend } from 'resend';

import { formatEmailFirstName } from '@/lib/email/format-first-name';
import { wrapResendEmail } from '@/lib/email/base-template';

import { createAdminClient } from '@/lib/supabase/admin';
import { getEmailTemplate, renderTemplate } from './templates';

export type SendDispatcherEmailArgs = {
  toProfileId: string;
  event_type: string;
  payload: Record<string, unknown>;
  locale: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendDispatcherEmail(args: SendDispatcherEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    console.warn('[notifications] RESEND_API_KEY ou NEWSLETTER_FROM_EMAIL manquant — email ignoré.');
    return;
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, preferred_locale, first_name')
    .eq('id', args.toProfileId)
    .maybeSingle();
  if (error) throw error;
  if (!profile?.id) {
    console.warn('[notifications] Profil introuvable — email ignoré.');
    return;
  }

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(args.toProfileId);
  if (userError) throw userError;
  const to = userData.user?.email?.trim();
  if (!to) {
    console.warn('[notifications] Email utilisateur introuvable — email ignoré.');
    return;
  }

  const locale = profile.preferred_locale === 'es' ? 'es' : 'fr';
  const metaFirstName =
    userData.user?.user_metadata && typeof userData.user.user_metadata === 'object'
      ? (userData.user.user_metadata as { first_name?: unknown }).first_name
      : undefined;
  const firstName = formatEmailFirstName(profile.first_name) || formatEmailFirstName(String(metaFirstName ?? ''));
  const payload = { ...args.payload, firstName };
  const template = getEmailTemplate(args.event_type);
  const rendered = template ? renderTemplate(template, locale, payload) : null;
  const title = rendered?.subject ?? String(args.payload.title ?? 'FitMangas');
  const body = args.payload.body != null ? String(args.payload.body) : '';
  const innerHtml =
    rendered?.html ??
    `
    <h1 style="margin:0 0 20px;font-size:22px;line-height:1.25;font-weight:700;color:#C45D3E;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(title)}</h1>
    ${body ? `<p style="margin:0 0 14px;color:#2D2D2D;">${escapeHtml(body)}</p>` : ''}
    <p style="margin:16px 0 0;font-size:12px;color:#6B6560;">FitMangas · ${escapeHtml(args.locale)} · ${escapeHtml(args.event_type)}</p>
  `;
  const showPreferences = !template?.critical;
  const html = wrapResendEmail({
    innerHtml,
    locale,
    showPreferencesLink: showPreferences,
  });

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: title,
    html,
  });
}
