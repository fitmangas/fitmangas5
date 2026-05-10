import { renderEmailLayout } from './types';

export const subject_fr = 'Vous nous manquez !';
export const subject_es = '¡Te extrañamos!';

export function html_fr() {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: ['Reprenez votre routine Pilates à votre rythme. Votre espace FitMangas vous attend.'],
  });
}

export function html_es() {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: ['Retoma tu rutina Pilates a tu ritmo. Tu espacio FitMangas te espera.'],
  });
}
