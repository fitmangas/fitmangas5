/**
 * Enveloppe HTML commune pour tous les e-mails Resend (desktop + mobile).
 * URLs absolues pour les assets (clients mail).
 * Lot 2b : gabarit v2 (SPEC §3.9) si NEXT_PUBLIC_FEATURE_NOTIF_V2.
 */

import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';

export type EmailLocale = 'fr' | 'es';

export function getEmailPublicBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(/\/$/, '');
}

export type WrapResendEmailOptions = {
  /** Fragment HTML du corps (titres, paragraphes, CTA déjà formatés côté template). */
  innerHtml: string;
  locale: EmailLocale;
  /** Si false, n’affiche pas le lien « préférences » dans le pied (événements critiques). */
  showPreferencesLink?: boolean;
  /** Lien de désinscription (ex. newsletter) — optionnel. */
  unsubscribeUrl?: string | null;
  heroUrl?: string | null;
  kicker?: string | null;
  headline?: string | null;
  preheader?: string | null;
};

function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Applique header (dégradé terracotta, logo, photo), zone corps et footer légal.
 */
export function wrapResendEmail(options: WrapResendEmailOptions): string {
  if (isNotifV2Enabled()) return wrapResendEmailV2(options);
  const base = getEmailPublicBaseUrl();
  const logoUrl = `${base}/logo.png`;
  const photoUrl = `${base}/alejandra.png`;
  const siteUrl = base;
  const instagramUrl = 'https://www.instagram.com/fit.mangas/';
  const prefsUrl = `${base}/compte/profil#notifications`;

  const showPrefs = options.showPreferencesLink !== false;
  const prefsLabel =
    options.locale === 'es' ? 'Gestionar mis preferencias' : 'Gérer mes préférences de notification';
  const unsubBlock =
    options.unsubscribeUrl && options.unsubscribeUrl.length > 0
      ? `<p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#6B6560;">
          <a href="${escapeAttr(options.unsubscribeUrl)}" style="color:#C45D3E;text-decoration:underline;">${
            options.locale === 'es' ? 'Darse de baja' : 'Se désinscrire'
          }</a>
        </p>`
      : '';

  const prefsBlock = showPrefs
    ? `<p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#6B6560;">
        <a href="${escapeAttr(prefsUrl)}" style="color:#C45D3E;text-decoration:underline;">${escapeAttr(prefsLabel)}</a>
      </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="${options.locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>FitMangas</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .email-outer-padding { padding: 16px 8px !important; }
      .email-body-padding { padding: 24px 18px !important; }
    }
    a.email-cta-link:hover { background-color: #A84B30 !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#EDE8E2;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#EDE8E2;">
    <tr>
      <td align="center" class="email-outer-padding" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(45,45,45,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg, #C45D3E 0%, #E8967A 100%);background-color:#C45D3E;padding:24px 20px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;max-width:560px;">
                <tr>
                  <td align="center" valign="middle" style="padding:0 12px;">
                    <img src="${escapeAttr(logoUrl)}" alt="FitMangas" width="56" height="56" style="display:block;border:0;outline:none;text-decoration:none;" />
                  </td>
                  <td align="center" valign="middle" style="padding:0 12px;">
                    <!-- Portrait 1837×2454 : ratio conservé, pas d’object-fit ni overflow (clients mail) -->
                    <img src="${escapeAttr(photoUrl)}" alt="Alejandra" width="72" height="96" style="display:block;border:0;border-radius:10px;outline:none;text-decoration:none;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-body-padding" style="padding:32px 28px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:#2D2D2D;">
              ${options.innerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 32px;background-color:#F5F0EB;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;line-height:1.55;color:#5C5652;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="${escapeAttr(logoUrl)}" alt="" width="36" height="auto" style="display:inline-block;vertical-align:middle;margin-right:10px;max-width:36px;border:0;" />
                    <span style="vertical-align:middle;font-weight:600;color:#2D2D2D;">FitMangas</span>
                    <span style="vertical-align:middle;color:#8A827A;"> — Pilates &amp; Barre en visio</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:14px;">
                    <a href="${escapeAttr(instagramUrl)}" style="color:#C45D3E;text-decoration:underline;">Instagram @fit.mangas</a>
                    <span style="color:#B5ADA5;"> &nbsp;|&nbsp; </span>
                    <a href="${escapeAttr(siteUrl)}" style="color:#C45D3E;text-decoration:underline;">${options.locale === 'es' ? 'Sitio web' : 'Site web'}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;font-size:11px;line-height:1.5;color:#8A827A;">
                    Mangas Alejandra EI — 17 Passage Leroy, 44300 Nantes
                  </td>
                </tr>
                <tr>
                  <td>
                    ${prefsBlock}
                    ${unsubBlock}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Gabarit v2 : fond sable, carte 28px, Playfair italique, bouton Outlook, pas de SVG ni de <link>. */
export function wrapResendEmailV2(options: WrapResendEmailOptions): string {
  const base = getEmailPublicBaseUrl();
  const logoUrl = `${base}/email/logo.png`;
  const hero = options.heroUrl ?? null;
  const prefsUrl = `${base}/compte/preferences`;
  const instagramUrl = 'https://www.instagram.com/fit.mangas/';
  const brand =
    options.locale === 'es' ? 'FitMangas · Pilates & Barre en visio · fitmangas.com' : 'FitMangas · Pilates & Barre en visio · fitmangas.com';
  const prefsLabel = options.locale === 'es' ? 'Gestionar mis notificaciones' : 'Gérer mes notifications';
  const showPrefs = options.showPreferencesLink !== false;
  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(options.preheader)}</div>`
    : '';
  const kicker = options.kicker
    ? `<div style="font-size:11px;font-weight:700;letter-spacing:2.6px;text-transform:uppercase;color:#C45D3E;">${escapeHtml(options.kicker)}</div>`
    : '';
  const headline = options.headline
    ? `<h1 style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:600;font-size:34px;line-height:40px;letter-spacing:-0.5px;color:#2D2D2D;">${escapeHtml(options.headline)}</h1>`
    : '';
  const heroBlock = hero
    ? `<tr><td><img src="${escapeAttr(hero)}" alt="" width="600" style="display:block;border-radius:28px 28px 0 0;width:100%;height:270px;border:0;"></td></tr>`
    : '';
  const prefs = showPrefs
    ? `<a href="${escapeAttr(prefsUrl)}" style="color:#8B8178;text-decoration:underline;">${escapeHtml(prefsLabel)}</a> · `
    : '';
  const unsub = options.unsubscribeUrl
    ? `<div style="margin-top:8px;"><a href="${escapeAttr(options.unsubscribeUrl)}" style="color:#8B8178;text-decoration:underline;">${options.locale === 'es' ? 'Darse de baja' : 'Se désinscrire'}</a></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="${options.locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>FitMangas</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0EB;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F0EB" style="background:#F5F0EB;">
  <tr><td align="center" style="padding:32px 16px 40px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
      <tr><td align="center" style="padding:0 0 22px;">
        <img src="${escapeAttr(logoUrl)}" width="46" height="46" alt="FitMangas" style="display:block;width:46px;height:46px;border:0;">
        <div style="margin-top:8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#8B8178;">FITMANGAS</div>
      </td></tr>
      <tr><td bgcolor="#FFFFFF" style="background:#FFFFFF;border:1px solid #EFE6DC;border-radius:28px;overflow:hidden;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${heroBlock}
          <tr><td style="padding:34px 44px 8px;font-family:Helvetica,Arial,sans-serif;">
            ${kicker}${headline}
          </td></tr>
          <tr><td style="padding:14px 44px 36px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:26px;color:#4A443F;">
            ${options.innerHtml}
            <p style="margin:26px 0 0;font-size:15px;color:#4A443F;">${options.locale === 'es' ? 'Un abrazo,' : 'À bientôt,'}<br><span style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#2D2D2D;">Alejandra</span></p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:26px 24px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:19px;color:#8B8178;">
        ${prefs}<a href="${escapeAttr(instagramUrl)}" style="color:#8B8178;text-decoration:underline;">Instagram @fit.mangas</a>
        <div style="margin-top:10px;color:#A39A92;">${escapeHtml(brand)}</div>
        ${unsub}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function outlookButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr><td align="center" bgcolor="#C45D3E" style="border-radius:999px;background:#C45D3E;">
    <a href="${escapeAttr(href)}" style="display:inline-block;padding:16px 34px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
  </td></tr>
</table>`;
}
