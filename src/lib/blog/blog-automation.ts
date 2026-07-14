import type { SupabaseClient } from '@supabase/supabase-js';

import {
  PREMIUM_BLOG_AI_ORDER,
  tryGenerateFrenchArticle,
} from '@/lib/blog/blog-content-generator';
import { looksLikeFallbackTemplate } from '@/lib/blog/blog-content-guards';
import { collectUsedPhotoIdsFromUrls, fetchUnsplashImage } from '@/lib/blog/blog-image-fetcher';
import {
  isGenericPilatesTitle,
  tryGenerateBlogTitlesFromContentDetailed,
  type TitleGenerationFailureReason,
} from '@/lib/blog/blog-title-generator';
import { BLOG_AI_PROVIDER_ORDER } from '@/lib/blog/ai-providers';
import {
  extractTopicIdsFromRows,
  formatSeoKeywordsWithTopic,
} from '@/lib/blog/editorial-topic-key';
import { loadStaticTopicPool, pickNextEditorialTopic } from '@/lib/blog/editorial-topics';
import { GeminiRateLimiter } from '@/lib/blog/gemini-rate-limit';
import { formatMonthYear } from '@/lib/blog/month';
import { slugifyBlog } from '@/lib/blog/slugify';

/** Titres réécrits par jour (hors génération d’article hebdomadaire). */
export const MAX_TITLE_REWRITES_PER_RUN = 4;

/** Nouveaux brouillons créés par exécution hebdomadaire. */
export const MAX_ARTICLES_PER_WEEKLY_RUN = 1;

type ArticleTitleRow = {
  id: string;
  title_fr: string;
  title_es: string | null;
  content_fr: string | null;
  content_es: string | null;
  description_fr: string | null;
  description_es: string | null;
  slug_fr: string;
  status: string;
  blog_categories: { slug: string } | { slug: string }[] | null;
};

export type TitleRewriteSkipDetail = {
  slug_fr: string;
  status: string;
  reason: string;
};

export type TitleRewriteResult = {
  processed: number;
  updated: number;
  skipped: number;
  errors: string[];
  /** Articles publiés encore au titre générique après cette exécution. */
  pending_published: number;
  /** Détail des articles non mis à jour (titre conservé). */
  skip_details: TitleRewriteSkipDetail[];
  ai_failures: number;
  quota_exhausted: boolean;
};

export type ArticleGenerationResult = {
  created: number;
  articleIds: string[];
  errors: string[];
};

function categorySlugFromRow(row: ArticleTitleRow): string {
  const cat = row.blog_categories;
  if (Array.isArray(cat)) return cat[0]?.slug ?? 'technique';
  return cat?.slug ?? 'technique';
}

function needsTitleRewrite(row: ArticleTitleRow): boolean {
  if (!row.title_fr?.trim()) return true;
  if (isGenericPilatesTitle(row.title_fr)) return true;
  if (!row.title_es?.trim() || isGenericPilatesTitle(row.title_es)) return true;
  return false;
}

/** Publiés en premier, puis validés, puis brouillons. */
function titlePriority(row: ArticleTitleRow): number {
  if (row.status === 'published') return 0;
  if (row.status === 'validated') return 1;
  return 2;
}

function failureLabel(reason: TitleGenerationFailureReason): string {
  switch (reason) {
    case 'quota_exhausted':
      return 'quota IA épuisé — titre conservé';
    case 'no_api_key':
      return 'clé IA absente — titre conservé';
    case 'invalid_response':
      return 'réponse IA invalide — titre conservé';
    case 'generation_failed':
      return 'cascade IA en échec — titre conservé';
    default:
      return 'erreur fournisseur IA — titre conservé';
  }
}

async function loadEditorialContext(admin: SupabaseClient) {
  const { data, error } = await admin.from('blog_articles').select('seo_keywords, description_fr');
  if (error) throw new Error(error.message);

  const usedTopicIds = extractTopicIdsFromRows(data ?? []);
  const usedBriefs: string[] = [];
  const pool = loadStaticTopicPool();
  const poolById = new Map(pool.map((topic) => [topic.id, topic.briefFr]));

  for (const row of data ?? []) {
    const desc = row.description_fr?.trim();
    if (desc) usedBriefs.push(desc);
    const topicId = /(?:^|,\s*)topic:([^,\s]+)/i.exec(row.seo_keywords ?? '')?.[1];
    if (topicId && poolById.has(topicId)) {
      usedBriefs.push(poolById.get(topicId)!);
    }
  }

  return { usedTopicIds, usedBriefs };
}

async function ensureCategoryId(
  admin: SupabaseClient,
  slug: string,
  cache: Map<string, string>,
): Promise<string | null> {
  const normalized = slug.replace(/[^a-z0-9-]/g, '') || 'general';
  const cached = cache.get(normalized);
  if (cached) return cached;

  const { data: existing } = await admin.from('blog_categories').select('id').eq('slug', normalized).maybeSingle();
  if (existing?.id) {
    cache.set(normalized, existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await admin
    .from('blog_categories')
    .insert({
      slug: normalized,
      label_fr: normalized,
      label_en: normalized,
      label_es: normalized,
      sort_order: 99,
    })
    .select('id')
    .maybeSingle();

  if (error || !inserted?.id) return null;
  cache.set(normalized, inserted.id);
  return inserted.id;
}

async function ensureUniqueSlug(admin: SupabaseClient, baseTitle: string, suffix: string): Promise<string> {
  const base = slugifyBlog(baseTitle);
  let slug = `${base}-${suffix}`;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data: exists } = await admin.from('blog_articles').select('id').eq('slug_fr', slug).maybeSingle();
    if (!exists) return slug;
    slug = `${base}-${suffix}-${attempt + 2}`;
  }
  return `${base}-${Date.now()}`;
}

function schedulePublicationDate(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 21);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

export async function rewriteBlogTitlesBatch(
  admin: SupabaseClient,
  limit = MAX_TITLE_REWRITES_PER_RUN,
): Promise<TitleRewriteResult> {
  const limiter = new GeminiRateLimiter();
  const result: TitleRewriteResult = {
    processed: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    pending_published: 0,
    skip_details: [],
    ai_failures: 0,
    quota_exhausted: false,
  };

  const { data: rows, error } = await admin
    .from('blog_articles')
    .select(
      'id,title_fr,title_es,content_fr,content_es,description_fr,description_es,slug_fr,status,blog_categories(slug)',
    )
    .in('status', ['draft', 'validated', 'published'])
    .order('created_at', { ascending: true });

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const candidates = (rows ?? []).filter((row) => needsTitleRewrite(row as ArticleTitleRow));
  const publishedPending = candidates.filter((row) => (row as ArticleTitleRow).status === 'published');

  // Tant qu'il reste des publiés au titre générique, on ne touche pas aux brouillons.
  const pool = publishedPending.length > 0 ? publishedPending : candidates;

  const targets = pool
    .sort((a, b) => titlePriority(a as ArticleTitleRow) - titlePriority(b as ArticleTitleRow))
    .slice(0, limit);

  result.pending_published = publishedPending.length;

  let updatedPublished = 0;

  for (const row of targets) {
    const article = row as ArticleTitleRow;
    result.processed += 1;
    const contentFr = article.content_fr?.trim() ?? '';

    if (contentFr.length < 80) {
      result.skipped += 1;
      result.skip_details.push({
        slug_fr: article.slug_fr,
        status: article.status,
        reason: 'contenu FR trop court — titre conservé',
      });
      continue;
    }

    await limiter.waitTurn();
    const generation = await tryGenerateBlogTitlesFromContentDetailed({
      contentHtmlFr: contentFr,
      descriptionFr: article.description_fr ?? undefined,
      categorySlug: categorySlugFromRow(article),
      contentHtmlEs: article.content_es,
      descriptionEs: article.description_es ?? undefined,
    });

    if (!generation.ok) {
      result.skipped += 1;
      result.ai_failures += 1;
      if (generation.reason === 'quota_exhausted') {
        result.quota_exhausted = true;
      }
      result.skip_details.push({
        slug_fr: article.slug_fr,
        status: article.status,
        reason: failureLabel(generation.reason),
      });
      continue;
    }

    const generated = generation.titles;
    const sameFr = generated.title_fr.trim() === article.title_fr.trim();
    const sameEs = (article.title_es?.trim() ?? '') === generated.title_es.trim();
    if (sameFr && sameEs) {
      result.skipped += 1;
      result.skip_details.push({
        slug_fr: article.slug_fr,
        status: article.status,
        reason: 'titres IA identiques à l’existant — aucune mise à jour',
      });
      continue;
    }

    const { error: updateError } = await admin
      .from('blog_articles')
      .update({
        title_fr: generated.title_fr,
        title_es: generated.title_es,
        updated_at: new Date().toISOString(),
      })
      .eq('id', article.id);

    if (updateError) {
      result.errors.push(`${article.slug_fr}: ${updateError.message}`);
      continue;
    }

    result.updated += 1;
    if (article.status === 'published') {
      updatedPublished += 1;
    }
  }

  result.pending_published = Math.max(0, publishedPending.length - updatedPublished);

  return result;
}

export async function generateDraftArticlesBatch(
  admin: SupabaseClient,
  count = MAX_ARTICLES_PER_WEEKLY_RUN,
): Promise<ArticleGenerationResult> {
  const limiter = new GeminiRateLimiter();
  const result: ArticleGenerationResult = { created: 0, articleIds: [], errors: [] };

  const { data: coach, error: coachError } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();
  if (coachError || !coach?.id) {
    result.errors.push(coachError?.message ?? 'Coach admin introuvable.');
    return result;
  }

  const { usedTopicIds, usedBriefs } = await loadEditorialContext(admin);
  const { data: categories } = await admin.from('blog_categories').select('id, slug');
  const categoryCache = new Map<string, string>((categories ?? []).map((c) => [c.slug, c.id]));

  const { data: existingImageRows } = await admin.from('blog_articles').select('featured_image_url');
  const usedPhotoIds = collectUsedPhotoIdsFromUrls(
    (existingImageRows ?? []).map((row) => row.featured_image_url),
  );

  for (let i = 0; i < count; i += 1) {
    await limiter.waitTurn();
    const topic = await pickNextEditorialTopic({
      usedTopicIds,
      usedBriefs,
      seed: Date.now() + i,
    });

    if (!topic) {
      result.errors.push('Aucun sujet éditorial disponible (réserve épuisée et génération IA vide).');
      break;
    }

    const scheduledAt = schedulePublicationDate();
    await limiter.waitTurn();
    // Qualité d’abord (Gemini→Mistral), puis cascade complète si besoin (Groq/OpenAI).
    let contentResult = await tryGenerateFrenchArticle({
      topicBrief: topic.briefFr,
      category: topic.categorySlug,
      publishDateIso: scheduledAt.toISOString(),
      providerOrder: PREMIUM_BLOG_AI_ORDER,
    });
    if (!contentResult.ok) {
      contentResult = await tryGenerateFrenchArticle({
        topicBrief: topic.briefFr,
        category: topic.categorySlug,
        publishDateIso: scheduledAt.toISOString(),
        providerOrder: BLOG_AI_PROVIDER_ORDER,
      });
    }

    if (!contentResult.ok) {
      result.errors.push(
        `generation_failed topic=${topic.id}: ${contentResult.detail ?? 'cascade IA vide'}`,
      );
      continue;
    }

    const generated = contentResult.article;
    if (looksLikeFallbackTemplate(generated.contentHtml, generated.description)) {
      result.errors.push(`generation_failed topic=${topic.id}: template de secours refusé.`);
      continue;
    }

    await limiter.waitTurn();
    let titleResult = await tryGenerateBlogTitlesFromContentDetailed({
      contentHtmlFr: generated.contentHtml,
      descriptionFr: generated.description,
      categorySlug: topic.categorySlug,
      providerOrder: PREMIUM_BLOG_AI_ORDER,
    });
    if (!titleResult.ok) {
      titleResult = await tryGenerateBlogTitlesFromContentDetailed({
        contentHtmlFr: generated.contentHtml,
        descriptionFr: generated.description,
        categorySlug: topic.categorySlug,
        providerOrder: BLOG_AI_PROVIDER_ORDER,
      });
    }

    if (!titleResult.ok) {
      result.errors.push(
        `generation_failed titles topic=${topic.id}: ${titleResult.detail ?? titleResult.reason}`,
      );
      continue;
    }

    const titles = titleResult.titles;
    // Brief réservé uniquement après succès contenu + titres
    usedTopicIds.add(topic.id);
    usedBriefs.push(topic.briefFr);

    console.info(
      `[generateDraftArticlesBatch] article via contenu=${generated.provider}/${generated.model} titres=${titles.provider ?? '?'}/${titles.model ?? '?'}`,
    );

    const categoryId = await ensureCategoryId(admin, topic.categorySlug, categoryCache);
    if (!categoryId) {
      result.errors.push(`Catégorie invalide: ${topic.categorySlug}`);
      continue;
    }

    const img = await fetchUnsplashImage({
      title: titles.title_fr,
      categorySlug: topic.categorySlug,
      excludedPhotoIds: usedPhotoIds,
      variant: usedTopicIds.size,
    });
    if (img.photoId) usedPhotoIds.add(img.photoId);

    const slugSuffix = topic.id.slice(-8);
    const { data: inserted, error: insertError } = await admin
      .from('blog_articles')
      .insert({
        coach_id: coach.id,
        title_fr: titles.title_fr,
        title_es: titles.title_es,
        slug_fr: await ensureUniqueSlug(admin, titles.title_fr, slugSuffix),
        slug_es: slugifyBlog(titles.title_es),
        description_fr: generated.description || topic.briefFr,
        content_fr: generated.contentHtml,
        category_id: categoryId,
        featured_image_url: img.imageUrl,
        scheduled_publication_at: scheduledAt.toISOString(),
        status: 'draft',
        seo_keywords: formatSeoKeywordsWithTopic(topic.id, generated.seoKeywords),
        meta_description_fr: generated.metaDescription.slice(0, 320),
      })
      .select('id')
      .maybeSingle();

    if (insertError || !inserted?.id) {
      result.errors.push(insertError?.message ?? 'Insertion article échouée.');
      continue;
    }

    const monthYear = formatMonthYear(scheduledAt);
    await admin.from('admin_article_validations').upsert(
      {
        article_id: inserted.id,
        coach_id: coach.id,
        month_year: monthYear,
        status: 'pending',
      },
      { onConflict: 'article_id,month_year' },
    );

    result.created += 1;
    result.articleIds.push(inserted.id);
  }

  return result;
}
