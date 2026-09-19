import { VIDEO_TESTIMONIALS } from '@/lib/landing/video-testimonials';

/** Photos coach — usage limité (identité), jamais 100 % du carrousel. */
export const QUIZ_COACH_IMAGES = [
  '/library/portraits/portrait-01-4x5.webp',
  '/library/coaching-visio/coaching-visio-01-4x5.webp',
  '/library/pilates-mat/pilates-mat-08-4x5.webp',
] as const;

/** Posters témoignages clients — pour s’identifier. */
export const QUIZ_TESTIMONIALS = VIDEO_TESTIMONIALS.filter((t) =>
  ['elena', 'sandrine', 'alicia', 'olivia', 'maria', 'karla'].includes(t.id),
);

/** Marquee hub : majorité clientes + quelques photos coach. */
export const QUIZ_PROOF_MIX = [
  ...QUIZ_TESTIMONIALS.map((t) => ({ kind: 'client' as const, src: t.posterSrc, name: t.name, videoSrc: t.videoSrc })),
  { kind: 'coach' as const, src: QUIZ_COACH_IMAGES[0], name: 'Alejandra', videoSrc: null },
  { kind: 'coach' as const, src: QUIZ_COACH_IMAGES[1], name: 'Alejandra', videoSrc: null },
];

/** Une cliente par quiz (identification), pas 4 portraits coach. */
export const QUIZ_CARD_BY_SLUG: Record<
  string,
  { poster: string; video: string; name: string; professionFr: string; professionEs: string }
> = {
  'profil-discipline': {
    poster: '/testimonials/elena.jpg',
    video: '/testimonials/elena.mp4',
    name: 'Elena',
    professionFr: 'Gérante de restaurant',
    professionEs: 'Gerente de restaurante',
  },
  'energie-journee': {
    poster: '/testimonials/sandrine.jpg',
    video: '/testimonials/sandrine.mp4',
    name: 'Sandrine',
    professionFr: 'Marchand de biens',
    professionEs: 'Negociadora inmobiliaria',
  },
  'seule-face-au-tapis': {
    poster: '/testimonials/alicia.jpg',
    video: '/testimonials/alicia.mp4',
    name: 'Alicia',
    professionFr: 'Avocate',
    professionEs: 'Abogada',
  },
  'carte-stress': {
    poster: '/testimonials/olivia.jpg',
    video: '/testimonials/olivia.mp4',
    name: 'Olivia',
    professionFr: 'Orthophoniste',
    professionEs: 'Logopeda',
  },
  'je-rate-puis': {
    poster: '/testimonials/maria.jpg',
    video: '/testimonials/maria.mp4',
    name: 'Maria',
    professionFr: 'Marketing du sport',
    professionEs: 'Marketing del deporte',
  },
};

/** @deprecated alias — préférer QUIZ_CARD_BY_SLUG / QUIZ_PROOF_MIX */
export const QUIZ_PROOF_IMAGES = QUIZ_TESTIMONIALS.map((t) => t.posterSrc);

export const QUIZ_HERO_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(QUIZ_CARD_BY_SLUG).map(([slug, v]) => [slug, v.poster]),
);
