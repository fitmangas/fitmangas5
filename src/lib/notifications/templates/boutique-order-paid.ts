import { renderEmailLayout, text } from './types';

export const subject_fr = 'Commande confirmée — {order_ref}';
export const subject_es = 'Pedido confirmado — {order_ref}';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: `Commande confirmée — ${text(data, 'orderRef', 'FitMangas')}`,
    body: ['Votre commande boutique est confirmée. Vous recevrez les informations de suivi dès expédition.'],
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: `Pedido confirmado — ${text(data, 'orderRef', 'FitMangas')}`,
    body: ['Tu pedido de boutique está confirmado. Recibirás el seguimiento cuando sea enviado.'],
  });
}
