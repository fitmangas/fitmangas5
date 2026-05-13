import type { BlogLang, LocalizedArticleFields } from '@/types/blog';

type Row = {
  title_fr: string;
  title_es: string | null;
  description_fr: string | null;
  description_es: string | null;
  content_fr: string;
  content_es: string | null;
  meta_description_fr: string | null;
  meta_description_es: string | null;
  slug_fr: string;
  slug_es: string | null;
};

export function pickLocalizedArticle(row: Row, lang: BlogLang): LocalizedArticleFields {
  if (lang === 'es') {
    const translatedContent = row.content_es?.trim();
    return {
      title: row.title_es?.trim() || row.title_fr,
      description: row.description_es ?? row.description_fr,
      content: translatedContent || row.content_fr,
      metaDescription: row.meta_description_es ?? row.meta_description_fr,
      slug: row.slug_es?.trim() || row.slug_fr,
      isContentFallback: !translatedContent,
    };
  }
  return {
    title: row.title_fr,
    description: row.description_fr,
    content: row.content_fr,
    metaDescription: row.meta_description_fr,
    slug: row.slug_fr,
    isContentFallback: false,
  };
}
