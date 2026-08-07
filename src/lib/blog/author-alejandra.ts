/**
 * Credentials auteur Alejandra — visibles UI + schema.org Person (core update 2026).
 * Faits réels uniquement ; rien d’inventé.
 */

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(/\/$/, '');
const INSTAGRAM_URL =
  process.env.NEXT_PUBLIC_LANDING_INSTAGRAM_URL?.trim() || 'https://www.instagram.com/fit.mangas/';

export const BLOG_AUTHOR_ALEJANDRA = {
  name: 'Alejandra Mangas',
  givenName: 'Alejandra',
  familyName: 'Mangas',
  jobTitle: 'Coach Pilates & Barre, FitMangas',
  roleShortFr: 'Coach Pilates & Barre, FitMangas',
  roleShortEs: 'Coach de Pilates & Barre, FitMangas',
  url: APP_URL,
  sameAs: [INSTAGRAM_URL].filter(Boolean),
  image: `${APP_URL}/alejandra.jpg`,
  /** Bio UI — 2–3 phrases sobres, faits stables FitMangas. */
  bioFr:
    'Alejandra Mangas est coach Pilates & Barre chez FitMangas. Elle accompagne les femmes en visio (et en présentiel à Nantes) avec une méthode claire, accessible et sans promesse miracle — progressive, régulière, ancrée dans le corps réel.',
  bioEs:
    'Alejandra Mangas es coach de Pilates & Barre en FitMangas. Acompaña a mujeres en visio (y en presencial en Nantes) con un método claro, accesible y sin promesas milagro — progresivo, constante y anclado en el cuerpo real.',
} as const;

/** Bloc Person pour JSON-LD Article / BlogPosting. */
export function alejandraPersonJsonLd() {
  return {
    '@type': 'Person' as const,
    name: BLOG_AUTHOR_ALEJANDRA.name,
    givenName: BLOG_AUTHOR_ALEJANDRA.givenName,
    familyName: BLOG_AUTHOR_ALEJANDRA.familyName,
    jobTitle: BLOG_AUTHOR_ALEJANDRA.jobTitle,
    url: BLOG_AUTHOR_ALEJANDRA.url,
    image: BLOG_AUTHOR_ALEJANDRA.image,
    sameAs: [...BLOG_AUTHOR_ALEJANDRA.sameAs],
    worksFor: {
      '@type': 'Organization' as const,
      name: 'FitMangas',
      url: APP_URL,
    },
  };
}
