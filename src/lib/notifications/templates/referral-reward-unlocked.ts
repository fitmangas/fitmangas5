import { formatEmailFirstName } from '@/lib/email/format-first-name';

import { renderEmailLayout, text } from './types';

export const subject_fr = 'Félicitations ! Ton abonnement est offert 🎉';
export const subject_es = '¡Enhorabuena! Tu suscripción es gratis 🎉';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  const base = text(data, 'appUrl', 'https://fitmangas.com').replace(/\/$/, '');
  const name = formatEmailFirstName(text(data, 'firstName', '')) || 'toi';
  return renderEmailLayout({
    locale: 'fr',
    title: 'Ton mois offert est activé',
    body: [
      `Bravo ${name} !`,
      'Tes 5 filleules sont actives : ton prochain mois d’abonnement Visio est gratuit (remise 100 % appliquée sur Stripe).',
      'Continue à partager ton code parrainage pour faire grandir la communauté FitMangas.',
    ],
    ctaLabel: 'Voir mon espace',
    ctaUrl: `${base}/compte/parrainage`,
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  const base = text(data, 'appUrl', 'https://fitmangas.com').replace(/\/$/, '');
  const name = formatEmailFirstName(text(data, 'firstName', '')) || 'amiga';
  return renderEmailLayout({
    locale: 'es',
    title: 'Tu mes gratis está activado',
    body: [
      `¡Enhorabuena ${name}!`,
      'Tus 5 ahijadas están activas: tu próximo mes de suscripción Visio es gratis (descuento del 100 % aplicado en Stripe).',
      'Sigue compartiendo tu código de apadrinamiento para hacer crecer la comunidad FitMangas.',
    ],
    ctaLabel: 'Ver mi espacio',
    ctaUrl: `${base}/compte/parrainage`,
  });
}
