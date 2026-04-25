export type TranslationReadyInput = {
  title_en: string | null;
  title_es: string | null;
  content_en: string | null;
  content_es: string | null;
};

function hasText(value: string | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function hasCompleteTranslations(article: TranslationReadyInput): boolean {
  return hasText(article.title_en) && hasText(article.title_es) && hasText(article.content_en) && hasText(article.content_es);
}
