import { renderEmailLayout, text } from './types';

export const subject_fr = 'Ton cours visio commence dans 1 heure ! 🧘‍♀️';
export const subject_es = '¡Tu clase online empieza en 1 hora! 🧘‍♀️';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [
      `${text(data, 'courseTitle', 'Ton cours')} commence dans 1 heure, à ${text(data, 'courseTime', 'l’heure prévue')}.`,
      'Prépare ton tapis, une serviette et une bouteille d’eau.',
      'Tu pourras rejoindre la visio quelques minutes avant le début.',
    ],
    ctaLabel: 'Rejoindre le cours',
    ctaUrl: text(data, 'joinUrl', text(data, 'appUrl', 'https://fitmangas.com') + '/compte/planning'),
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [
      `${text(data, 'courseTitle', 'Tu clase')} empieza en 1 hora, a las ${text(data, 'courseTime', 'hora prevista')}.`,
      'Prepara tu esterilla, una toalla y una botella de agua.',
      'Podrás entrar a la videollamada unos minutos antes del inicio.',
    ],
    ctaLabel: 'Entrar a la clase',
    ctaUrl: text(data, 'joinUrl', text(data, 'appUrl', 'https://fitmangas.com') + '/compte/planning'),
  });
}
