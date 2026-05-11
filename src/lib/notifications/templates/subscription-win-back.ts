import { renderEmailLayout, text } from './types';

export const subject_fr = 'Vous nous manquez';
export const subject_es = 'Te extrañamos';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: ['Revenez quand vous voulez : votre abonnement collectif visio est disponible à 39€/mois.'],
    ctaLabel: 'Revenir chez FitMangas',
    ctaUrl: text(data, 'appUrl', 'https://fitmangas.com'),
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: ['Vuelve cuando quieras: la suscripción colectiva online está disponible por 39€/mes.'],
    ctaLabel: 'Volver a FitMangas',
    ctaUrl: text(data, 'appUrl', 'https://fitmangas.com'),
  });
}
