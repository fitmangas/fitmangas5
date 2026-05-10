import { renderEmailLayout, text } from './types';

export const subject_fr = 'Vos notifications — {date}';
export const subject_es = 'Sus notificaciones — {date}';

function items(data: Record<string, string | number | boolean | null | undefined>) {
  return text(data, 'items', '• FitMangas');
}

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: `Vos notifications — ${text(data, 'date')}`,
    body: ['Voici votre récapitulatif FitMangas :', items(data)],
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: `Sus notificaciones — ${text(data, 'date')}`,
    body: ['Aquí está tu resumen FitMangas:', items(data)],
  });
}
