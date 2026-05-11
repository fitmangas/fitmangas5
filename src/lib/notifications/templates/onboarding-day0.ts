import { renderEmailLayout, text } from './types';

export const subject_fr = 'Bienvenue chez FitMangas';
export const subject_es = 'Bienvenida a FitMangas';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [
      `Bonjour ${text(data, 'firstName', 'à vous')}, votre abonnement est actif.`,
      'Votre espace membre est prêt : planning, replays et ressources vous attendent.',
    ],
    ctaLabel: 'Accéder à mon espace',
    ctaUrl: text(data, 'appUrl', 'https://fitmangas.com') + '/compte',
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [
      `Hola ${text(data, 'firstName', 'a ti')}, tu suscripción está activa.`,
      'Tu espacio miembro está listo: calendario, repeticiones y recursos te esperan.',
    ],
    ctaLabel: 'Entrar a mi espacio',
    ctaUrl: text(data, 'appUrl', 'https://fitmangas.com') + '/compte',
  });
}
