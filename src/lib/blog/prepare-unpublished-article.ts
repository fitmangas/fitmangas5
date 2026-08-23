/**
 * Prépare un article NON PUBLIÉ au format SEO 2026 (1200–1800, anti-template).
 * Ne jamais appeler sur status=published.
 */

import {
  assertContentSafeToPublish,
  containsArticlePilatesPlaceholder,
  countBodyWords,
  idealZoneOutOfRangeDetail,
  isIdealBodyWordCount,
  looksLikeFallbackTemplate,
  substantialRewriteRatio,
} from '@/lib/blog/blog-content-guards';
import { PREMIUM_BLOG_AI_ORDER, tryGenerateFrenchArticle } from '@/lib/blog/blog-content-generator';
import { enrichArticleBodyHtml } from '@/lib/blog/enrich-article';

export type PrepareUnpublishedResult =
  | {
      ok: true;
      contentHtml: string;
      description?: string | null;
      metaDescription?: string | null;
      seoKeywords?: string | null;
      wordsBefore: number;
      wordsAfter: number;
      rewriteRatio: number;
      mode: 'generate' | 'enrich';
      provider: string;
      model: string;
    }
  | { ok: false; detail: string; wordsBefore: number };

export async function prepareUnpublishedArticleBody(params: {
  title: string;
  contentHtml: string;
  description?: string | null;
  categoryLabel?: string | null;
  scheduledIso?: string | null;
  siblingContents?: Array<{ id: string; contentHtml: string }>;
  excludeArticleId?: string;
}): Promise<PrepareUnpublishedResult> {
  const wordsBefore = countBodyWords(params.contentHtml);
  const needsFullGenerate =
    wordsBefore < 400 ||
    looksLikeFallbackTemplate(params.contentHtml, params.description) ||
    containsArticlePilatesPlaceholder(params.contentHtml) ||
    containsArticlePilatesPlaceholder(params.title);

  let contentHtml = '';
  let description: string | null | undefined = params.description;
  let metaDescription: string | null | undefined = undefined;
  let seoKeywords: string | null | undefined = undefined;
  let wordsAfter = 0;
  let rewriteRatio = 0;
  let mode: 'generate' | 'enrich' = 'enrich';
  let provider = '';
  let model = '';

  if (needsFullGenerate) {
    const generated = await tryGenerateFrenchArticle({
      topicBrief: `${params.title}\n\n${params.description?.trim() || ''}`.trim(),
      category: params.categoryLabel?.trim() || 'Pilates',
      publishDateIso: params.scheduledIso || new Date().toISOString().slice(0, 10),
      title: params.title,
      providerOrder: PREMIUM_BLOG_AI_ORDER,
    });
    if (!generated.ok) {
      return { ok: false, detail: generated.detail, wordsBefore };
    }
    contentHtml = generated.article.contentHtml;
    description = generated.article.description;
    metaDescription = generated.article.metaDescription;
    seoKeywords = generated.article.seoKeywords;
    wordsAfter = countBodyWords(contentHtml);
    rewriteRatio = substantialRewriteRatio(params.contentHtml, contentHtml);
    mode = 'generate';
    provider = generated.article.provider;
    model = generated.article.model;
  } else {
    const enriched = await enrichArticleBodyHtml({
      title: params.title,
      contentHtml: params.contentHtml,
      description: params.description,
      requireSubstantialRewrite: true,
    });
    if (!enriched.ok) {
      const generated = await tryGenerateFrenchArticle({
        topicBrief: `${params.title}\n\n${params.description?.trim() || ''}`.trim(),
        category: params.categoryLabel?.trim() || 'Pilates',
        publishDateIso: params.scheduledIso || new Date().toISOString().slice(0, 10),
        title: params.title,
        providerOrder: PREMIUM_BLOG_AI_ORDER,
      });
      if (!generated.ok) {
        return { ok: false, detail: `${enriched.detail} | retry: ${generated.detail}`, wordsBefore };
      }
      contentHtml = generated.article.contentHtml;
      description = generated.article.description;
      metaDescription = generated.article.metaDescription;
      seoKeywords = generated.article.seoKeywords;
      wordsAfter = countBodyWords(contentHtml);
      rewriteRatio = substantialRewriteRatio(params.contentHtml, contentHtml);
      mode = 'generate';
      provider = generated.article.provider;
      model = generated.article.model;
    } else {
      contentHtml = enriched.contentHtml;
      wordsAfter = enriched.wordsAfter;
      rewriteRatio = enriched.rewriteRatio;
      mode = 'enrich';
      provider = enriched.provider;
      model = enriched.model;
    }
  }

  const guard = assertContentSafeToPublish({
    contentHtml,
    description: description ?? null,
    existingContents: params.siblingContents,
    excludeArticleId: params.excludeArticleId,
  });
  if (!guard.allowed) {
    return { ok: false, detail: guard.reason, wordsBefore };
  }

  if (!isIdealBodyWordCount(wordsAfter)) {
    return {
      ok: false,
      detail: idealZoneOutOfRangeDetail(wordsAfter),
      wordsBefore,
    };
  }

  return {
    ok: true,
    contentHtml,
    description,
    metaDescription,
    seoKeywords,
    wordsBefore,
    wordsAfter,
    rewriteRatio,
    mode,
    provider,
    model,
  };
}
