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
}) {
  const escapedBody = params.body
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 14px;color:#2D2D2D;">${escapeHtml(line)}</p>`)
    .join('');
  const cta =
    params.ctaLabel && params.ctaUrl
      ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto 0;">
          <tr>
            <td align="center" style="border-radius:8px;background-color:#C45D3E;">
              <a class="email-cta-link" href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;padding:14px 32px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;background-color:#C45D3E;">${escapeHtml(
                params.ctaLabel,
              )}</a>
            </td>
          </tr>
        </table>`
      : '';
  return `
    <h1 style="margin:0 0 20px;font-size:22px;line-height:1.25;font-weight:700;color:#C45D3E;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(params.title)}</h1>
    ${escapedBody}
    ${cta}
    <p style="margin:28px 0 0;font-size:15px;color:#2D2D2D;">Alejandra — FitMangas</p>
  `;
}
