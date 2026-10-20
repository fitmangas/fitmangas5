/**
 * Mot de passe oublié — côté serveur uniquement.
 *
 * Le lien est créé par Supabase (`auth.admin.generateLink`, type `recovery`) mais envoyé par notre propre
 * e-mail (Resend, gabarit FitMangas, FR/ES) : il ne dépend pas du serveur d'e-mails de Supabase.
 * Le lien pointe vers /auth/reinitialiser, qui range le jeton dans un cookie httpOnly puis redirige vers
 * /nouveau-mot-de-passe : le jeton n'apparaît jamais dans l'adresse d'une page (statistiques) et n'est
 * consommé qu'à l'envoi du formulaire (un antivirus de messagerie qui ouvre le lien ne le grille pas).
 */
import { getEmailPublicBaseUrl, wrapResendEmail, type EmailLocale } from '@/lib/email/base-template';
import { sendEmail } from '@/lib/email/send';
import { emailButton } from '@/lib/email/v2-templates';
import { createAdminClient } from '@/lib/supabase/admin';

/** Jeton de récupération (cookie httpOnly, 1 h). */
export const RESET_TOKEN_COOKIE = 'fm_pwd_reset';
/** Récupération déjà validée dans ce navigateur : permet de corriger un mot de passe refusé (15 min). */
export const RESET_VERIFIED_COOKIE = 'fm_pwd_reset_ok';
export const RESET_TOKEN_MAX_AGE_S = 60 * 60;
export const RESET_VERIFIED_MAX_AGE_S = 15 * 60;

export const RESET_LINK_PATH = '/auth/reinitialiser';

export function isPlausibleTokenHash(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{16,200}$/.test(value);
}

export function buildRecoveryUrl(baseUrl: string, tokenHash: string, locale: EmailLocale): string {
  const url = new URL(RESET_LINK_PATH, baseUrl.replace(/\/$/, '') + '/');
  url.searchParams.set('token_hash', tokenHash);
  if (locale === 'es') url.searchParams.set('lang', 'es');
  return url.toString();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const SANS = 'Inter,Helvetica,Arial,sans-serif';
const P = `margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:26px;color:#2D2D2D;`;
const SMALL = `margin:22px 0 0;font-family:${SANS};font-size:13px;line-height:21px;color:#8B8178;`;

export function passwordResetEmailContent(params: { url: string; locale: EmailLocale; firstName?: string | null }): {
  subject: string;
  html: string;
  text: string;
} {
  const es = params.locale === 'es';
  const name = params.firstName?.trim() ? escapeHtml(params.firstName.trim()) : '';
  const t = es
    ? {
        subject: 'Elige tu nueva contraseña de FitMangas',
        kicker: 'Contraseña',
        headline: '¿Una nueva contraseña?',
        preheader: 'Elige tu nueva contraseña en un minuto.',
        hello: name ? `Hola ${name},` : 'Hola,',
        body: 'Pediste cambiar tu contraseña. Toca el botón para elegir una nueva.',
        cta: 'Elegir mi contraseña',
        note: 'El enlace funciona una sola vez y caduca en una hora. Si no pediste nada, ignora este correo: tu contraseña actual sigue siendo válida.',
        fallback: 'Si el botón no funciona, copia este enlace en tu navegador:',
      }
    : {
        subject: 'Choisis ton nouveau mot de passe FitMangas',
        kicker: 'Mot de passe',
        headline: 'Un nouveau mot de passe ?',
        preheader: 'Choisis ton nouveau mot de passe en une minute.',
        hello: name ? `Bonjour ${name},` : 'Bonjour,',
        body: 'Tu as demandé à changer ton mot de passe. Clique sur le bouton pour en choisir un nouveau.',
        cta: 'Choisir mon mot de passe',
        note: 'Le lien ne fonctionne qu’une fois et expire au bout d’une heure. Si tu n’as rien demandé, ignore cet e-mail : ton mot de passe actuel reste valable.',
        fallback: 'Si le bouton ne marche pas, copie ce lien dans ton navigateur :',
      };

  const innerHtml = [
    `<p style="${P}">${t.hello}</p>`,
    `<p style="${P}">${escapeHtml(t.body)}</p>`,
    `<div style="height:8px;line-height:8px;">&nbsp;</div>`,
    emailButton(t.cta, params.url),
    `<p style="${SMALL}">${escapeHtml(t.note)}</p>`,
    `<p style="${SMALL}">${escapeHtml(t.fallback)}<br><a href="${escapeHtml(params.url)}" style="color:#C45D3E;word-break:break-all;">${escapeHtml(params.url)}</a></p>`,
  ].join('\n');

  const html = wrapResendEmail({
    innerHtml,
    locale: params.locale,
    showPreferencesLink: false,
    kicker: t.kicker,
    headline: t.headline,
    preheader: t.preheader,
    signOff: null,
  });

  const text = [
    params.firstName?.trim() ? `${es ? 'Hola' : 'Bonjour'} ${params.firstName.trim()},` : es ? 'Hola,' : 'Bonjour,',
    '',
    t.body,
    '',
    params.url,
    '',
    t.note,
  ].join('\n');

  return { subject: t.subject, html, text };
}

export type SendPasswordResetResult = { sent: true } | { sent: false; reason: string };

/**
 * Crée le lien de récupération et l'envoie. Ne dit jamais à l'appelant public si le compte existe
 * (la page répond toujours la même chose) ; `reason` sert seulement aux journaux et à l'admin.
 */
export async function sendPasswordResetEmail(params: {
  email: string;
  locale?: EmailLocale;
}): Promise<SendPasswordResetResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email: params.email });
  const tokenHash = data?.properties?.hashed_token ?? null;
  if (error || !isPlausibleTokenHash(tokenHash)) {
    return { sent: false, reason: error?.message ? 'no_account_or_error' : 'no_token' };
  }

  let locale: EmailLocale = params.locale === 'es' ? 'es' : 'fr';
  let firstName: string | null = null;
  const userId = data?.user?.id;
  if (userId) {
    const { data: profile } = await admin
      .from('profiles')
      .select('preferred_locale, first_name')
      .eq('id', userId)
      .maybeSingle();
    if (profile?.preferred_locale === 'es' || profile?.preferred_locale === 'fr') locale = profile.preferred_locale;
    firstName = (profile?.first_name as string | null | undefined) ?? null;
  }

  const content = passwordResetEmailContent({
    url: buildRecoveryUrl(getEmailPublicBaseUrl(), tokenHash, locale),
    locale,
    firstName,
  });
  const result = await sendEmail({ to: params.email, subject: content.subject, html: content.html, text: content.text });
  return result.ok ? { sent: true } : { sent: false, reason: result.error };
}
