import type { BlogLang, LocalizedArticleFields } from '@/types/blog';

type Row = {
  title_fr: string;
  title_en: string | null;
  title_es: string | null;
  description_fr: string | null;
  description_en: string | null;
  description_es: string | null;
  content_fr: string;
  content_en: string | null;
  content_es: string | null;
  meta_description_fr: string | null;
  meta_description_en: string | null;
  meta_description_es: string | null;
  slug_fr: string;
  slug_en: string | null;
  slug_es: string | null;
};

export function pickLocalizedArticle(row: Row, lang: BlogLang): LocalizedArticleFields {
  if (lang === 'en') {
    return {
      title: row.title_en?.trim() || row.title_fr,
      description: row.description_en ?? row.description_fr,
      content: row.content_en?.trim() || row.content_fr,
      metaDescription: row.meta_description_en ?? row.meta_description_fr,
      slug: row.slug_en?.trim() || row.slug_fr,
    };
  }
  if (lang === 'es') {
    return {
      title: row.title_es?.trim() || row.title_fr,
      description: row.description_es ?? row.description_fr,
      content: row.content_es?.trim() || row.content_fr,
      metaDescription: row.meta_description_es ?? row.meta_description_fr,
      slug: row.slug_es?.trim() || row.slug_fr,
    };
  }
  return {
    title: row.title_fr,
    description: row.description_fr,
    content: row.content_fr,
    metaDescription: row.meta_description_fr,
    slug: row.slug_fr,
  };
}
