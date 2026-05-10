import { renderEmailLayout, text } from './types';

export const subject_fr = 'Séance confirmée à Nantes';
export const subject_es = 'Sesión confirmada en Nantes';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [
      `${text(data, 'courseTitle', 'Votre séance')} est confirmée pour le ${text(data, 'courseDate', 'jour prévu')}.`,
      'Adresse : 17 Passage Leroy, 44300 Nantes.',
    ],
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [
      `${text(data, 'courseTitle', 'Tu sesión')} está confirmada para el ${text(data, 'courseDate', 'día previsto')}.`,
      'Dirección: 17 Passage Leroy, 44300 Nantes.',
    ],
  });
}
