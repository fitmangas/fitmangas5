import { renderEmailLayout, text } from './types';

export const subject_fr = 'Votre commande est expédiée';
export const subject_es = 'Tu pedido ha sido enviado';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [`Suivi : ${text(data, 'trackingUrl', 'lien à venir')}`],
    ctaLabel: 'Suivre ma commande',
    ctaUrl: text(data, 'trackingUrl', text(data, 'appUrl', 'https://fitmangas.com') + '/compte/boutique/commandes'),
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [`Seguimiento: ${text(data, 'trackingUrl', 'enlace pendiente')}`],
    ctaLabel: 'Seguir mi pedido',
    ctaUrl: text(data, 'trackingUrl', text(data, 'appUrl', 'https://fitmangas.com') + '/compte/boutique/commandes'),
  });
}
