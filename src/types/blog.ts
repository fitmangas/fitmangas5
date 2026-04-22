export type BlogLang = 'fr' | 'en' | 'es';

export type BlogArticleStatus = 'draft' | 'validated' | 'published' | 'archived';

export type LocalizedArticleFields = {
  title: string;
  description: string | null;
  content: string;
  metaDescription: string | null;
  slug: string;
};
