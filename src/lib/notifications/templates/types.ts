export type TemplateLocale = 'fr' | 'es';

export type TemplateData = Record<string, string | number | boolean | null | undefined>;

export type NotificationEmailTemplate = {
  subject_fr: string;
  subject_es: string;
  html_fr: (data: TemplateData) => string;
  html_es: (data: TemplateData) => string;
  critical?: boolean;
};

export function text(data: TemplateData, key: string, fallback = ''): string {
  const value = data[key];
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderEmailLayout(params: {
  title: string;
  body: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  locale: TemplateLocale;
  critical?: boolean;
}) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas5.vercel.app').replace(/\/$/, '');
  const preferences =
    params.locale === 'es'
      ? `Gestionar mis preferencias: ${appUrl}/compte/preferences`
      : `Gérer mes préférences : ${appUrl}/compte/preferences`;
  const escapedBody = params.body
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
  const cta =
    params.ctaLabel && params.ctaUrl
      ? `<p><a href="${escapeHtml(params.ctaUrl)}">${escapeHtml(params.ctaLabel)}</a></p>`
      : '';
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1d1d1f;max-width:640px;margin:0 auto">
      <p style="font-size:18px;font-weight:700;letter-spacing:.08em">FitMangas</p>
      <h1>${escapeHtml(params.title)}</h1>
      ${escapedBody}
      ${cta}
      <p>Alejandra — FitMangas</p>
      ${params.critical ? '' : `<p style="font-size:12px;color:#777">${escapeHtml(preferences)}</p>`}
    </div>
  `;
}
