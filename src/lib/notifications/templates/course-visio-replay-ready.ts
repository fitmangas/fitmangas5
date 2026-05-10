import { renderEmailLayout, text } from './types';

export const subject_fr = 'Replay disponible';
export const subject_es = 'Repetición disponible';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [`Le replay de ${text(data, 'courseTitle', 'votre cours')} est disponible dans votre espace.`],
    ctaLabel: 'Voir le replay',
    ctaUrl: text(data, 'replayUrl', text(data, 'appUrl', 'https://fitmangas5.vercel.app') + '/compte/replays'),
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [`La repetición de ${text(data, 'courseTitle', 'tu clase')} está disponible en tu espacio.`],
    ctaLabel: 'Ver repetición',
    ctaUrl: text(data, 'replayUrl', text(data, 'appUrl', 'https://fitmangas5.vercel.app') + '/compte/replays'),
  });
}
