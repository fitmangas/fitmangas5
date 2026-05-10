import { Resend } from 'resend';

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
    .select('id, preferred_locale')
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
  const template = getEmailTemplate(args.event_type);
  const rendered = template ? renderTemplate(template, locale, args.payload) : null;
  const title = rendered?.subject ?? String(args.payload.title ?? 'FitMangas');
  const body = args.payload.body != null ? String(args.payload.body) : '';
  const html = rendered?.html ?? `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1d1d1f">
      <h1>${escapeHtml(title)}</h1>
      ${body ? `<p>${escapeHtml(body)}</p>` : ''}
      <p style="font-size:12px;color:#777">FitMangas · ${escapeHtml(args.locale)} · ${escapeHtml(args.event_type)}</p>
    </div>
  `;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: title,
    html,
  });
}
