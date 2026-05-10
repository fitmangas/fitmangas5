import { renderEmailLayout } from './types';

export const subject_fr = 'Paiement reçu — merci';
export const subject_es = 'Pago recibido — gracias';

export function html_fr() {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: ['Votre renouvellement FitMangas est confirmé. Merci pour votre confiance.'],
  });
}

export function html_es() {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: ['Tu renovación FitMangas está confirmada. Gracias por tu confianza.'],
  });
}
