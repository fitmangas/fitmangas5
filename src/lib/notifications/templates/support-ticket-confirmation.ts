import { formatEmailFirstName } from '@/lib/email/format-first-name';

import { renderEmailLayout, text } from './types';

export const subject_fr = 'Votre message a bien été reçu';
export const subject_es = 'Hemos recibido tu mensaje';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  const name = formatEmailFirstName(text(data, 'firstName', '')) || 'toi';
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [
      `Bonjour ${name},`,
      'Nous avons bien reçu votre message et reviendrons vers vous rapidement.',
      'Merci de votre confiance — l’équipe FitMangas.',
    ],
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  const name = formatEmailFirstName(text(data, 'firstName', '')) || 'amiga';
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [
      `Hola ${name},`,
      'Hemos recibido tu mensaje y te responderemos pronto.',
      'Gracias por tu confianza — el equipo FitMangas.',
    ],
  });
}
