import { renderEmailLayout, text } from './types';

export const subject_fr = 'Vous avez manqué le cours';
export const subject_es = 'Te perdiste la clase';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [`Vous avez manqué ${text(data, 'courseTitle', 'le cours')}. Le replay sera disponible dans votre espace.`],
    ctaLabel: 'Voir les replays',
    ctaUrl: text(data, 'replayUrl', text(data, 'appUrl', 'https://fitmangas5.vercel.app') + '/compte/replays'),
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [`Te perdiste ${text(data, 'courseTitle', 'la clase')}. La repetición estará disponible en tu espacio.`],
    ctaLabel: 'Ver repeticiones',
    ctaUrl: text(data, 'replayUrl', text(data, 'appUrl', 'https://fitmangas5.vercel.app') + '/compte/replays'),
  });
}
