import { formatEmailFirstName } from '@/lib/email/format-first-name';
import { wrapResendEmail } from '@/lib/email/base-template';
import { v2TemplateForEvent, type V2EmailVars } from '@/lib/email/v2-templates';
import { sendEmail } from '@/lib/email/send';
import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { unsubscribeUrlForUser } from '@/lib/notifications/v2/unsubscribe';

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
    .select('id, preferred_locale, first_name, display_timezone')
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
  const payload: Record<string, unknown> = { ...args.payload, firstName };
  const template = getEmailTemplate(args.event_type);
  const timeZone =
    (profile as { display_timezone?: string | null }).display_timezone?.trim() ||
    (locale === 'es' ? 'America/Mexico_City' : 'Europe/Paris');
  const pick = <T,>(key: string): T | undefined => (payload[key] != null ? (payload[key] as T) : undefined);
  let unsubCandidate: string | null = null;
  try {
    unsubCandidate = unsubscribeUrlForUser(args.toProfileId, process.env, locale === 'es' ? 'es' : 'fr');
  } catch (e) {
    console.error('[notifications] lien de désinscription impossible (secret manquant)', e);
  }
  const v2 = isNotifV2Enabled()
    ? v2TemplateForEvent(args.event_type, {
        locale,
        timeZone,
        firstName,
        courseTitle: String(payload.courseTitle ?? payload.title ?? ''),
        courseTime: String(payload.courseTime ?? ''),
        joinUrl: payload.joinUrl ? String(payload.joinUrl) : undefined,
        programUrl: payload.programUrl ? String(payload.programUrl) : undefined,
        live: pick<V2EmailVars['live']>('live'),
        nextLive: pick<V2EmailVars['nextLive']>('nextLive'),
        changed: args.event_type === 'course.visio.schedule_changed',
        previousStartsAt: payload.previousStartsAt ? String(payload.previousStartsAt) : null,
        items: pick<V2EmailVars['items']>('items'),
        weekStart: payload.weekStart ? String(payload.weekStart) : null,
        weekLives: pick<V2EmailVars['weekLives']>('weekLives'),
        programme: pick<V2EmailVars['programme']>('programme'),
        session: pick<V2EmailVars['session']>('session'),
        unsubscribeUrl: unsubCandidate,
        omitProgramme: !isProgrammesEnabled(),
      })
    : null;
  const rendered = template ? renderTemplate(template, locale, payload) : null;
  const title = v2?.subject ?? rendered?.subject ?? String(args.payload.title ?? 'FitMangas');
  const body = args.payload.body != null ? String(args.payload.body) : '';
  const innerHtml =
    rendered?.html ??
    `
    <h1 style="margin:0 0 20px;font-size:22px;line-height:1.25;font-weight:700;color:#C45D3E;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(title)}</h1>
    ${body ? `<p style="margin:0 0 14px;color:#2D2D2D;">${escapeHtml(body)}</p>` : ''}
    <p style="margin:16px 0 0;font-size:12px;color:#6B6560;">FitMangas · ${escapeHtml(args.locale)} · ${escapeHtml(args.event_type)}</p>
  `;
  const showPreferences = !template?.critical;
  const unsub = v2 && !v2.transactional ? unsubCandidate : null;
  const html =
    v2?.html ??
    wrapResendEmail({
      innerHtml,
      locale,
      showPreferencesLink: showPreferences,
      unsubscribeUrl: unsub,
    });

  const headers =
    unsub
      ? {
          'List-Unsubscribe': `<${unsub}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
      : undefined;
  const result = await sendEmail({ from, to, subject: title, html, headers });
  if (!result.ok) throw new Error(`Envoi email échoué : ${result.error}`);
}
