import { renderEmailLayout, text } from './types';

export const subject_fr = 'Nouvel article : {title}';
export const subject_es = 'Nuevo artículo: {title}';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  const title = text(data, 'title', 'Nouvel article');
  return renderEmailLayout({
    locale: 'fr',
    title: `Nouvel article : ${title}`,
    body: [text(data, 'excerpt', 'Un nouvel article FitMangas vient de paraître.')],
    ctaLabel: "Lire l'article",
    ctaUrl: text(data, 'articleUrl', text(data, 'appUrl', 'https://fitmangas5.vercel.app') + `/blog/${text(data, 'slug')}`),
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  const title = text(data, 'title', 'Nuevo artículo');
  return renderEmailLayout({
    locale: 'es',
    title: `Nuevo artículo: ${title}`,
    body: [text(data, 'excerpt', 'Un nuevo artículo FitMangas acaba de publicarse.')],
    ctaLabel: 'Leer el artículo',
    ctaUrl: text(data, 'articleUrl', text(data, 'appUrl', 'https://fitmangas5.vercel.app') + `/blog/${text(data, 'slug')}`),
  });
}
