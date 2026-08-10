/**
 * Score SEO article admin — longueur alignée sur la cible 1200–1800 mots.
 * Un article « trop court » (< 800) ne peut jamais scorer 100 %.
 */

import {
  BLOG_SHORT_WORDS_THRESHOLD,
  BLOG_TARGET_WORDS_MAX,
  BLOG_TARGET_WORDS_MIN,
  countBodyWords,
  getBodyWordLengthZone,
  type BodyWordLengthZone,
} from '@/lib/blog/blog-content-guards';

export type SeoCheckStatus = 'pass' | 'partial' | 'fail';

export type ArticleSeoCheck = {
  label: string;
  status: SeoCheckStatus;
  /** Compat UI / AI : true seulement si pass (partial ≠ ok). */
  ok: boolean;
};

export type ArticleSeoScoreInput = {
  title_fr?: string | null;
  description_fr?: string | null;
  meta_description_fr?: string | null;
  slug_fr?: string | null;
  content_fr?: string | null;
  featured_image_url?: string | null;
};

export type ArticleSeoScoreResult = {
  title: string;
  score: number;
  checks: ArticleSeoCheck[];
  wordCount: number;
  lengthZone: BodyWordLengthZone;
  lengthOkIdeal: boolean;
};

function lengthCheckLabel(zone: BodyWordLengthZone, wordCount: number): string {
  if (zone === 'too_short') return `Trop court (${wordCount} mots)`;
  if (zone === 'below_ideal') return `Sous idéal (${wordCount} mots)`;
  if (zone === 'ideal') return `Zone idéale (${wordCount} mots)`;
  return `Long (${wordCount} mots)`;
}

function lengthCheckStatus(zone: BodyWordLengthZone): SeoCheckStatus {
  // Idéal (ou long dense) = OK ; 800–1199 = partiel (empêche 100 %) ; < 800 = échec.
  if (zone === 'ideal' || zone === 'long') return 'pass';
  if (zone === 'below_ideal') return 'partial';
  return 'fail';
}

function checkPoints(status: SeoCheckStatus): number {
  if (status === 'pass') return 1;
  if (status === 'partial') return 0.5;
  return 0;
}

export function seoCheckIcon(status: SeoCheckStatus): string {
  if (status === 'pass') return '✅';
  if (status === 'partial') return '⚠️';
  return '❌';
}

/** Calcule le score SEO d’un article (titre, meta, image, longueur, slug). */
export function scoreArticleSeoFields(article: ArticleSeoScoreInput): ArticleSeoScoreResult {
  const title = article.title_fr ?? '';
  const description = article.meta_description_fr || article.description_fr || '';
  const slug = article.slug_fr ?? '';
  const wordCount = countBodyWords(article.content_fr ?? '');
  const lengthZone = getBodyWordLengthZone(wordCount);
  const lengthStatus = lengthCheckStatus(lengthZone);

  const rawChecks: Array<{ label: string; status: SeoCheckStatus }> = [
    { label: 'Titre < 60', status: title.length > 0 && title.length < 60 ? 'pass' : 'fail' },
    {
      label: 'Description < 160',
      status: description.length > 0 && description.length < 160 ? 'pass' : 'fail',
    },
    { label: 'Image', status: article.featured_image_url ? 'pass' : 'fail' },
    { label: lengthCheckLabel(lengthZone, wordCount), status: lengthStatus },
    {
      label: 'Slug propre',
      status: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? 'pass' : 'fail',
    },
  ];

  const checks: ArticleSeoCheck[] = rawChecks.map((check) => ({
    ...check,
    ok: check.status === 'pass',
  }));

  const points = checks.reduce((sum, check) => sum + checkPoints(check.status), 0);
  const score = checks.length > 0 ? Math.round((points / checks.length) * 100) : 0;

  return {
    title,
    score,
    checks,
    wordCount,
    lengthZone,
    lengthOkIdeal: lengthZone === 'ideal',
  };
}

/** Garde-fous documentés (utiles aux tests / docs). */
export const ARTICLE_SEO_LENGTH_RULES = {
  tooShortBelow: BLOG_SHORT_WORDS_THRESHOLD,
  idealMin: BLOG_TARGET_WORDS_MIN,
  idealMax: BLOG_TARGET_WORDS_MAX,
} as const;
