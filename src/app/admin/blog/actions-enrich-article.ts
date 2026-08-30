'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { enrichArticleBodyHtml } from '@/lib/blog/enrich-article';
import {
  deleteSpanishTranslationRow,
  withSpanishInvalidationIfContentFrChanged,
} from '@/lib/blog/translate-article-es';
import { createAdminClient } from '@/lib/supabase/admin';

export type EnrichArticleActionResult =
  | {
      ok: true;
      articleId: string;
      contentHtml: string;
      wordsBefore: number;
      wordsAfter: number;
      rewriteRatio: number;
      provider: string;
      model: string;
    }
  | {
      ok: false;
      articleId?: string;
      error: string;
      reason?: string;
      rewriteRatio?: number;
      wordsBefore?: number;
      wordsAfter?: number;
    };

/**
 * MàJ unitaire : enrichit le corps FR, garde titre/slug/CTA, invalide ES, touche updated_at.
 */
export async function enrichPublishedArticleAction(articleId: string): Promise<EnrichArticleActionResult> {
  await requireAdmin();
  const id = articleId.trim();
  if (!id) return { ok: false, error: 'articleId manquant.' };

  const admin = createAdminClient();
  const { data: article, error } = await admin
    .from('blog_articles')
    .select('id, title_fr, description_fr, content_fr, meta_description_fr, seo_keywords, slug_fr, status')
    .eq('id', id)
    .maybeSingle();

  if (error || !article) {
    return { ok: false, articleId: id, error: error?.message ?? 'Article introuvable.' };
  }

  const enrich = await enrichArticleBodyHtml({
    title: article.title_fr,
    contentHtml: article.content_fr ?? '',
    description: article.description_fr,
  });

  if (!enrich.ok) {
    return {
      ok: false,
      articleId: id,
      error: enrich.detail,
      reason: enrich.reason,
      rewriteRatio: enrich.rewriteRatio,
      wordsBefore: enrich.wordsBefore,
      wordsAfter: enrich.wordsAfter,
    };
  }

  const previous = {
    title_fr: article.title_fr,
    description_fr: article.description_fr,
    content_fr: article.content_fr,
    meta_description_fr: article.meta_description_fr,
    seo_keywords: article.seo_keywords,
  };

  const payload = withSpanishInvalidationIfContentFrChanged({
    previous,
    payload: {
      content_fr: enrich.contentHtml,
      updated_at: new Date().toISOString(),
    },
  });

  const invalidatedEs = payload.title_es === null && payload.content_es === null;

  const { error: updateErr } = await admin.from('blog_articles').update(payload).eq('id', id);
  if (updateErr) {
    return { ok: false, articleId: id, error: updateErr.message };
  }

  if (invalidatedEs) {
    await deleteSpanishTranslationRow(admin, id);
  }

  revalidatePath('/blog');
  revalidatePath(`/blog/${article.slug_fr}`);
  revalidatePath('/admin/blog');
  revalidatePath('/admin/blog/refresh');
  revalidatePath(`/admin/blog/articles/${id}/edit`);
  revalidatePath('/admin/marketing');
  revalidatePath('/admin/croissance');

  return {
    ok: true,
    articleId: id,
    contentHtml: enrich.contentHtml,
    wordsBefore: enrich.wordsBefore,
    wordsAfter: enrich.wordsAfter,
    rewriteRatio: enrich.rewriteRatio,
    provider: enrich.provider,
    model: enrich.model,
  };
}

/**
 * Lot de MàJ (défaut 3, max 5). Traite séquentiellement ; s’arrête après N tentatives.
 * Ne lance JAMAIS les 25 d’un coup.
 */
export async function enrichPublishedArticlesBatchAction(params: {
  articleIds: string[];
  limit?: number;
}): Promise<{
  ok: true;
  results: EnrichArticleActionResult[];
  processed: number;
}> {
  await requireAdmin();
  const limit = Math.min(5, Math.max(1, params.limit ?? 3));
  const ids = [...new Set(params.articleIds.map((id) => id.trim()).filter(Boolean))].slice(0, limit);
  const results: EnrichArticleActionResult[] = [];

  for (const id of ids) {
    // Séquentiel : un article à la fois, vérifiable.
    // eslint-disable-next-line no-await-in-loop
    results.push(await enrichPublishedArticleAction(id));
  }

  return { ok: true, results, processed: results.length };
}
