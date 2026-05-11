import { renderEmailLayout, text } from './types';

export const subject_fr = 'Rappel : votre cours visio demain';
export const subject_es = 'Recordatorio: tu clase online mañana';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [`${text(data, 'courseTitle', 'Votre cours')} est prévu demain à ${text(data, 'courseTime', 'l’heure prévue')}.`],
    ctaLabel: 'Rejoindre le cours',
    ctaUrl: text(data, 'joinUrl', text(data, 'appUrl', 'https://fitmangas.com') + '/compte/planning'),
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [`${text(data, 'courseTitle', 'Tu clase')} está prevista mañana a las ${text(data, 'courseTime', 'hora prevista')}.`],
    ctaLabel: 'Entrar a la clase',
    ctaUrl: text(data, 'joinUrl', text(data, 'appUrl', 'https://fitmangas.com') + '/compte/planning'),
  });
}
