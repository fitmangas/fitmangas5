import { renderEmailLayout, text } from './types';

export const subject_fr = 'Ton récap FitMangas — {date}';
export const subject_es = 'Tu resumen FitMangas — {date}';

function lines(data: Record<string, string | number | boolean | null | undefined>) {
  return text(data, 'summaryLines', '');
}

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  const body = lines(data)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return renderEmailLayout({
    locale: 'fr',
    title: `Ton récap — ${text(data, 'date')}`,
    body: body.length ? body : ['Voici ton récapitulatif FitMangas.'],
    ctaLabel: 'Ouvrir mon espace',
    ctaUrl: text(data, 'appUrl', 'https://fitmangas.com/compte'),
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  const body = lines(data)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return renderEmailLayout({
    locale: 'es',
    title: `Tu resumen — ${text(data, 'date')}`,
    body: body.length ? body : ['Aquí está tu resumen FitMangas.'],
    ctaLabel: 'Abrir mi espacio',
    ctaUrl: text(data, 'appUrl', 'https://fitmangas.com/compte'),
  });
}
