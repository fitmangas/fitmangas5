import { renderEmailLayout, text } from './types';

export const subject_fr = 'Échec de paiement — action requise';
export const subject_es = 'Pago fallido — acción necesaria';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    critical: true,
    title: subject_fr,
    body: ['Votre paiement n’a pas pu être validé. Mettez à jour votre moyen de paiement pour conserver votre accès.'],
    ctaLabel: 'Mettre à jour le paiement',
    ctaUrl: text(data, 'billingPortalUrl', text(data, 'appUrl', 'https://fitmangas5.vercel.app') + '/compte/profil'),
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    critical: true,
    title: subject_es,
    body: ['No se pudo validar tu pago. Actualiza tu método de pago para conservar el acceso.'],
    ctaLabel: 'Actualizar pago',
    ctaUrl: text(data, 'billingPortalUrl', text(data, 'appUrl', 'https://fitmangas5.vercel.app') + '/compte/profil'),
  });
}
