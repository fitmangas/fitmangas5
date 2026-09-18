import { VIDEO_TESTIMONIALS } from '@/lib/landing/video-testimonials';

/** Visuels biblio pour preuve / hero quiz (pas d’IA). */
export const QUIZ_PROOF_IMAGES = [
  '/library/portraits/portrait-01-4x5.webp',
  '/library/coaching-visio/coaching-visio-01-4x5.webp',
  '/library/pilates-mat/pilates-mat-08-4x5.webp',
  '/library/barre/barre-01-4x5.webp',
  '/library/renfo-core/renfo-core-02-4x5.webp',
  '/library/lifestyle-coulisses/lifestyle-03-4x5.webp',
  '/library/coaching-visio/coaching-visio-04-4x5.webp',
  '/library/portraits/portrait-05-4x5.webp',
  '/library/produit-captures/produit-dashboard-02.webp',
  '/library/ambiance-studio/ambiance-studio-01-4x5.webp',
] as const;

export const QUIZ_HERO_BY_SLUG: Record<string, string> = {
  'profil-discipline': '/library/portraits/portrait-01-4x5.webp',
  'energie-journee': '/library/renfo-core/renfo-core-02-4x5.webp',
  'seule-face-au-tapis': '/library/lifestyle-coulisses/lifestyle-03-4x5.webp',
  'carte-stress': '/library/pilates-mat/pilates-mat-08-4x5.webp',
  'je-rate-puis': '/library/coaching-visio/coaching-visio-01-4x5.webp',
};

export const QUIZ_TESTIMONIALS = VIDEO_TESTIMONIALS.filter((t) =>
  ['elena', 'sandrine', 'alicia', 'olivia', 'maria', 'karla'].includes(t.id),
);
