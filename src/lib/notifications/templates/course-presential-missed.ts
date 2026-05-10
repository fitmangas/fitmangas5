import { renderEmailLayout, text } from './types';

export const subject_fr = 'Vous avez manqué votre séance';
export const subject_es = 'Te perdiste tu sesión';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [`Vous avez manqué ${text(data, 'courseTitle', 'votre séance')}. Nous espérons vous revoir très vite.`],
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [`Te perdiste ${text(data, 'courseTitle', 'tu sesión')}. Esperamos verte muy pronto.`],
  });
}
