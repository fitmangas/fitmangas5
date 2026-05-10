import { renderEmailLayout, text } from './types';

export const subject_fr = 'Cours annulé';
export const subject_es = 'Clase cancelada';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    critical: true,
    title: subject_fr,
    body: [`${text(data, 'courseTitle', 'Le cours')} du ${text(data, 'courseDate', 'jour prévu')} est annulé.`],
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    critical: true,
    title: subject_es,
    body: [`${text(data, 'courseTitle', 'La clase')} del ${text(data, 'courseDate', 'día previsto')} está cancelada.`],
  });
}
