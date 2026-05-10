import { renderEmailLayout, text } from './types';

export const subject_fr = 'Votre premier pas FitMangas';
export const subject_es = 'Tu primer paso FitMangas';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [
      'Pour commencer en douceur, choisissez votre prochain cours visio et découvrez les premiers articles du blog.',
      'Vous pouvez aussi activer les notifications push depuis vos préférences.',
    ],
    ctaLabel: 'Voir les prochains cours',
    ctaUrl: text(data, 'courseUrl', text(data, 'appUrl', 'https://fitmangas5.vercel.app') + '/compte/planning'),
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [
      'Para empezar con calma, elige tu próxima clase online y descubre los primeros artículos del blog.',
      'También puedes activar las notificaciones push desde tus preferencias.',
    ],
    ctaLabel: 'Ver próximas clases',
    ctaUrl: text(data, 'courseUrl', text(data, 'appUrl', 'https://fitmangas5.vercel.app') + '/compte/planning'),
  });
}
