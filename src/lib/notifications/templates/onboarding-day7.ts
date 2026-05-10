import { renderEmailLayout } from './types';

export const subject_fr = 'Petit check-in FitMangas';
export const subject_es = 'Pequeño check-in FitMangas';

export function html_fr() {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: ['Comment se passe votre première semaine ? Répondez simplement à cet email si vous avez besoin d’aide.'],
  });
}

export function html_es() {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: ['¿Cómo va tu primera semana? Responde a este email si necesitas ayuda.'],
  });
}
