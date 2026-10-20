/**
 * Pages guides du blog par thème (SPEC §12.6, lot 7, derrière CROISSANCE_V2) :
 * la page guide liste les articles du thème, chaque article du thème renvoie vers son guide.
 * Aucun article n'est déplacé, fusionné ni renommé : le rattachement se fait sur le titre.
 */

export type BlogGuideId = 'respiration' | 'seances-courtes' | 'progresser';

export type BlogGuide = {
  id: BlogGuideId;
  title: { fr: string; es: string };
  intro: { fr: string; es: string };
  /** Testé sur le titre sans accents, en minuscules (FR et ES). */
  match: RegExp;
};

export const BLOG_GUIDES: BlogGuide[] = [
  {
    id: 'respiration',
    title: { fr: 'Respiration', es: 'Respiración' },
    intro: {
      fr: 'La respiration est la base du Pilates : elle accompagne chaque mouvement et aide à gainer. Retrouve ici tous les articles sur le sujet.',
      es: 'La respiración es la base del Pilates: acompaña cada movimiento y ayuda a activar el centro. Aquí encontrarás todos los artículos sobre el tema.',
    },
    match: /respir/,
  },
  {
    id: 'seances-courtes',
    title: { fr: 'Séances courtes', es: 'Sesiones cortas' },
    intro: {
      fr: 'Pas beaucoup de temps ? Retrouve ici les articles sur les séances courtes, à caser dans une journée chargée.',
      es: '¿Poco tiempo? Aquí encontrarás los artículos sobre sesiones cortas, para encajar en un día ocupado.',
    },
    match: /\b(courtes?|rapides?|cortas?|rapidas?|express)\b|\b(5|10|15|20)\s?min/,
  },
  {
    id: 'progresser',
    title: { fr: 'Progresser', es: 'Progresar' },
    intro: {
      fr: 'Passer un cap, savoir où tu en es, choisir la suite : les articles pour progresser à ton rythme.',
      es: 'Dar un paso más, saber en qué punto estás, elegir lo siguiente: los artículos para progresar a tu ritmo.',
    },
    match: /progres|niveau|nivel|avancer|avanzar/,
  },
];

export function normalizeForGuide(text: string | null | undefined): string {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function getBlogGuide(id: string): BlogGuide | null {
  return BLOG_GUIDES.find((g) => g.id === id) ?? null;
}

/** Premier guide dont le thème correspond au titre (FR ou ES) de l'article. */
export function guideForArticle(titles: { title_fr?: string | null; title_es?: string | null }): BlogGuide | null {
  const text = `${normalizeForGuide(titles.title_fr)} ${normalizeForGuide(titles.title_es)}`;
  return BLOG_GUIDES.find((g) => g.match.test(text)) ?? null;
}
