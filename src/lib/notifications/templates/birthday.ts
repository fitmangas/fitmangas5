import { renderEmailLayout, text } from './types';

export const subject_fr = 'Joyeux anniversaire {firstName} ! 🎂';
export const subject_es = '¡Feliz cumpleaños {firstName}! 🎂';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: `Joyeux anniversaire ${text(data, 'firstName')} ! 🎂`,
    body: ['Toute l’équipe FitMangas vous souhaite une journée lumineuse et pleine d’énergie.'],
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: `¡Feliz cumpleaños ${text(data, 'firstName')}! 🎂`,
    body: ['Todo el equipo FitMangas te desea un día luminoso y lleno de energía.'],
  });
}
