import { renderEmailLayout, text } from './types';

export const subject_fr = 'Vos ressources membres';
export const subject_es = 'Tus recursos de miembro';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: ['Le blog, les replays et la communauté WhatsApp sont là pour vous accompagner entre deux séances.'],
    ctaLabel: 'Découvrir mes ressources',
    ctaUrl: text(data, 'resourcesUrl', text(data, 'appUrl', 'https://fitmangas5.vercel.app') + '/compte/blog'),
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: ['El blog, las repeticiones y la comunidad WhatsApp te acompañan entre sesiones.'],
    ctaLabel: 'Descubrir mis recursos',
    ctaUrl: text(data, 'resourcesUrl', text(data, 'appUrl', 'https://fitmangas5.vercel.app') + '/compte/blog'),
  });
}
