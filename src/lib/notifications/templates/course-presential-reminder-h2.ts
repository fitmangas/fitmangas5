import { renderEmailLayout, text } from './types';

export const subject_fr = 'Ton cours à Nantes est dans 2 heures !';
export const subject_es = '¡Tu clase en Nantes es en 2 horas!';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [
      `${text(data, 'courseTitle', 'Ta séance')} à Nantes commence dans 2 heures, à ${text(data, 'courseTime', 'l’heure prévue')}.`,
      'Adresse : 17 Passage Leroy, 44300 Nantes.',
      'Pense à arriver quelques minutes en avance, avec ton tapis, une serviette et une bouteille d’eau.',
    ],
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [
      `${text(data, 'courseTitle', 'Tu sesión')} en Nantes empieza en 2 horas, a las ${text(data, 'courseTime', 'hora prevista')}.`,
      'Dirección: 17 Passage Leroy, 44300 Nantes.',
      'Llega unos minutos antes, con esterilla, toalla y botella de agua.',
    ],
  });
}
