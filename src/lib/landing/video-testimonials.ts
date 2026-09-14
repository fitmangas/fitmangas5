import type { Language } from '@/types';

export type VideoTestimonial = {
  id: string;
  name: string;
  flag: '🇫🇷' | '🇪🇸';
  countryCode: 'FR' | 'ES';
  professionFr: string;
  professionEs: string;
  videoSrc: string;
  posterSrc: string;
  /** Courte accroche SEO (pas une fausse citation inventée). */
  seoBlurbFr: string;
  seoBlurbEs: string;
};

/**
 * Elena en tête (mise en avant FR), Maria en fin (mise en avant ES).
 * Teresa est au milieu volontairement : audio fragile → jamais dans les 3 cartes
 * visibles au chargement (voisins circulaires d’Elena / Maria).
 * Maria / Teresa = seuls drapeaux ES.
 */
export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    id: 'elena',
    name: 'Elena',
    flag: '🇫🇷',
    countryCode: 'FR',
    professionFr: 'Gérante de restaurant',
    professionEs: 'Gerente de restaurante',
    videoSrc: '/testimonials/elena.mp4',
    posterSrc: '/testimonials/elena.jpg',
    seoBlurbFr:
      'Elena, gérante de restaurant, raconte pourquoi elle a choisi FitMangas pour ne plus s’entraîner seule et rester régulière malgré un emploi du temps chargé.',
    seoBlurbEs:
      'Elena, gerente de restaurante, cuenta por qué eligió FitMangas para no entrenar sola y mantener la constancia con un horario exigente.',
  },
  {
    id: 'sandrine',
    name: 'Sandrine',
    flag: '🇫🇷',
    countryCode: 'FR',
    professionFr: 'Marchand de biens',
    professionEs: 'Negociadora inmobiliaria',
    videoSrc: '/testimonials/sandrine.mp4',
    posterSrc: '/testimonials/sandrine.jpg',
    seoBlurbFr:
      'Sandrine, marchande de biens, témoigne de son expérience des cours de Pilates & Barre FitMangas en visio — le rendez-vous fixe et la correction en direct.',
    seoBlurbEs:
      'Sandrine, negociadora inmobiliaria, comparte su experiencia con las clases de Pilates y Barre FitMangas online: cita fija y corrección en directo.',
  },
  {
    id: 'alicia',
    name: 'Alicia',
    flag: '🇫🇷',
    countryCode: 'FR',
    professionFr: 'Avocate',
    professionEs: 'Abogada',
    videoSrc: '/testimonials/alicia.mp4',
    posterSrc: '/testimonials/alicia.jpg',
    seoBlurbFr:
      'Alicia, avocate, explique ce que lui apportent les séances Pilates FitMangas en visio dans un quotidien professionnel intense.',
    seoBlurbEs:
      'Alicia, abogada, explica qué le aportan las sesiones de Pilates FitMangas online en un día a día profesional intenso.',
  },
  {
    id: 'olivia',
    name: 'Olivia',
    flag: '🇫🇷',
    countryCode: 'FR',
    professionFr: 'Orthophoniste',
    professionEs: 'Logopeda',
    videoSrc: '/testimonials/olivia.mp4',
    posterSrc: '/testimonials/olivia.jpg',
    seoBlurbFr:
      'Olivia, orthophoniste, décrit son ressenti après les cours de Pilates & Barre FitMangas — régularité, présence et correction.',
    seoBlurbEs:
      'Olivia, logopeda, describe su experiencia con las clases de Pilates y Barre FitMangas: constancia, presencia y corrección.',
  },
  {
    id: 'teresa',
    name: 'Teresa',
    flag: '🇪🇸',
    countryCode: 'ES',
    professionFr: 'Assistante administrative',
    professionEs: 'Asistente administrativa',
    videoSrc: '/testimonials/teresa.mp4',
    posterSrc: '/testimonials/teresa.jpg',
    seoBlurbFr:
      'Teresa, assistante administrative, parle de son expérience FitMangas et de l’importance de se sentir vue pendant le cours.',
    seoBlurbEs:
      'Teresa, asistente administrativa, habla de su experiencia FitMangas y de la importancia de sentirse vista durante la clase.',
  },
  {
    id: 'jose-luis',
    name: 'José Luis',
    flag: '🇫🇷',
    countryCode: 'FR',
    professionFr: 'Consultant hôtelier',
    professionEs: 'Consultor hotelero',
    videoSrc: '/testimonials/jose-luis.mp4',
    posterSrc: '/testimonials/jose-luis.jpg',
    seoBlurbFr:
      'José Luis, consultant hôtelier, témoigne en vidéo de son parcours avec FitMangas et de l’accompagnement en direct.',
    seoBlurbEs:
      'José Luis, consultor hotelero, comparte en vídeo su experiencia con FitMangas y el acompañamiento en directo.',
  },
  {
    id: 'karla',
    name: 'Karla',
    flag: '🇫🇷',
    countryCode: 'FR',
    professionFr: 'Business Developer',
    professionEs: 'Business Developer',
    videoSrc: '/testimonials/karla.mp4',
    posterSrc: '/testimonials/karla.jpg',
    seoBlurbFr:
      'Karla, business developer, partage en vidéo pourquoi elle recommande les cours Pilates FitMangas en visio.',
    seoBlurbEs:
      'Karla, business developer, comparte en vídeo por qué recomienda las clases de Pilates FitMangas online.',
  },
  {
    id: 'maria',
    name: 'Maria',
    flag: '🇪🇸',
    countryCode: 'ES',
    professionFr: 'Marketing du sport',
    professionEs: 'Marketing deportivo',
    videoSrc: '/testimonials/maria.mp4',
    posterSrc: '/testimonials/maria.jpg',
    seoBlurbFr:
      'Maria, professionnelle du marketing du sport, partage son ressenti sur les cours collectifs en visio avec Alejandra et la communauté FitMangas.',
    seoBlurbEs:
      'Maria, profesional de marketing deportivo, comparte su experiencia en las clases grupales online con Alejandra y la comunidad FitMangas.',
  },
];

export function featuredTestimonialIndex(lang: Language): number {
  const id = lang === 'ES' ? 'maria' : 'elena';
  const index = VIDEO_TESTIMONIALS.findIndex((item) => item.id === id);
  return index >= 0 ? index : 0;
}
