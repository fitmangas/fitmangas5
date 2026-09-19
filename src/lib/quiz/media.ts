import { VIDEO_TESTIMONIALS } from '@/lib/landing/video-testimonials';

/** Photos biblio nettes (4:5) — jamais un freeze-frame vidéo flou. */
export const QUIZ_COACH_IMAGES = [
  '/library/portraits/portrait-01-4x5.webp',
  '/library/coaching-visio/coaching-visio-01-4x5.webp',
  '/library/pilates-mat/pilates-mat-08-4x5.webp',
] as const;

/** Témoignages vidéo clients — carousel 3D uniquement (lecture réelle). */
export const QUIZ_TESTIMONIALS = VIDEO_TESTIMONIALS.filter((t) =>
  ['elena', 'sandrine', 'alicia', 'olivia', 'karla', 'maria', 'teresa'].includes(t.id),
);

/** @deprecated */
export const QUIZ_PROOF_MIX = QUIZ_TESTIMONIALS.map((t) => ({
  kind: 'client' as const,
  src: t.posterSrc,
  name: t.name,
  videoSrc: t.videoSrc,
}));

/**
 * Visuel des 5 cartes hub / intro : photos library nettes (pas poster MP4).
 * Variété thèmes pour coller au quiz.
 */
export const QUIZ_CARD_BY_SLUG: Record<
  string,
  { image: string; name: string; captionFr: string; captionEs: string }
> = {
  'profil-discipline': {
    image: '/library/coaching-visio/coaching-visio-03-4x5.webp',
    name: 'FitMangas',
    captionFr: 'Cours en visio',
    captionEs: 'Clase en visio',
  },
  'energie-journee': {
    image: '/library/lifestyle-coulisses/lifestyle-04-4x5.webp',
    name: 'FitMangas',
    captionFr: 'Énergie du jour',
    captionEs: 'Energía del día',
  },
  'seule-face-au-tapis': {
    image: '/library/pilates-mat/pilates-mat-05-4x5.webp',
    name: 'FitMangas',
    captionFr: 'Seul·e sur le tapis',
    captionEs: 'Sola en el tapete',
  },
  'carte-stress': {
    image: '/library/renfo-core/renfo-core-04-4x5.webp',
    name: 'FitMangas',
    captionFr: 'Corps & stress',
    captionEs: 'Cuerpo y estrés',
  },
  'je-rate-puis': {
    image: '/library/portraits/portrait-08-4x5.webp',
    name: 'FitMangas',
    captionFr: 'Après un raté',
    captionEs: 'Después de fallar',
  },
};

/** Petites images d’ambiance par section du rapport (biblio + Unsplash). */
export const QUIZ_SECTION_IMAGES = {
  stress: {
    src: 'https://images.unsplash.com/photo-1541199249251-f712dc791be0?auto=format&fit=crop&w=400&q=80',
    altFr: 'Moment de tension',
    altEs: 'Momento de tensión',
  },
  forces: {
    src: '/library/portraits/portrait-03-4x5.webp',
    altFr: 'Force et présence',
    altEs: 'Fuerza y presencia',
  },
  parler: {
    src: '/library/coaching-visio/coaching-visio-02-4x5.webp',
    altFr: 'Échange en cours',
    altEs: 'Intercambio en clase',
  },
  develop: {
    src: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=400&q=80',
    altFr: 'Progression',
    altEs: 'Progreso',
  },
} as const;

/** @deprecated alias */
export const QUIZ_PROOF_IMAGES = QUIZ_TESTIMONIALS.map((t) => t.posterSrc);

export const QUIZ_HERO_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(QUIZ_CARD_BY_SLUG).map(([slug, v]) => [slug, v.image]),
);
