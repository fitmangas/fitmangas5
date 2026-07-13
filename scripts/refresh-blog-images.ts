/**
 * Réattribue des images de couverture uniques aux articles de blog en doublon.
 * Ne modifie que `featured_image_url` — statut, contenu et validations inchangés.
 *
 * Usage:
 * - npm run blog:refresh:images
 * - npm run blog:refresh:images -- --dry-run
 */

import './load-env-local';

import { createClient } from '@supabase/supabase-js';

import {
  collectUsedPhotoIdsFromUrls,
  extractUnsplashPhotoId,
  fetchUnsplashImage,
  normalizeStoredImageUrl,
} from '../src/lib/blog/blog-image-fetcher';

type ArticleRow = {
  id: string;
  title_fr: string;
  slug_fr: string;
  featured_image_url: string | null;
  status: string;
  category_slug: string;
};

const DRY_RUN = process.argv.includes('--dry-run');
const UNSPLASH_DELAY_MS = 350;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pilatesArticleNumber(title: string): number | null {
  const match = /Article pilates (\d+)/i.exec(title);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

/** Plus la valeur est haute, plus l'article garde son image actuelle dans un groupe de doublons. */
function keepPriority(article: ArticleRow): number {
  const n = pilatesArticleNumber(article.title_fr);
  const pilatesBonus = n != null && n >= 10 && n <= 17 ? 800 : 0;
  const statusBonus = article.status === 'published' ? 300 : article.status === 'validated' ? 200 : 100;
  const lowNumberBonus = n != null ? Math.max(0, 50 - n) : 0;
  return pilatesBonus + statusBonus + lowNumberBonus;
}

/** Plus la valeur est haute, plus l'article est traité tôt pour une nouvelle image. */
function refreshPriority(article: ArticleRow): number {
  const n = pilatesArticleNumber(article.title_fr);
  if (n != null && n >= 10 && n <= 17) return 2000 - n;
  return 100;
}

function groupArticlesByPhotoId(articles: ArticleRow[]): Map<string, ArticleRow[]> {
  const groups = new Map<string, ArticleRow[]>();
  for (const article of articles) {
    const photoId = extractUnsplashPhotoId(article.featured_image_url);
    if (!photoId) continue;
    const list = groups.get(photoId) ?? [];
    list.push(article);
    groups.set(photoId, list);
  }
  return groups;
}

function pickArticlesToRefresh(articles: ArticleRow[]): ArticleRow[] {
  const toRefresh = new Set<string>();
  const groups = groupArticlesByPhotoId(articles);

  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => keepPriority(b) - keepPriority(a));
    for (const article of sorted.slice(1)) {
      toRefresh.add(article.id);
    }
  }

  return articles
    .filter((a) => toRefresh.has(a.id))
    .sort((a, b) => refreshPriority(b) - refreshPriority(a));
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.');
    process.exit(1);
  }

  if (!process.env.UNSPLASH_ACCESS_KEY) {
    console.warn('UNSPLASH_ACCESS_KEY absent — seuls les fallbacks locaux seront utilisés.');
  }

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: rows, error } = await admin
    .from('blog_articles')
    .select('id, title_fr, slug_fr, featured_image_url, status, blog_categories(slug)')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Lecture des articles échouée:', error.message);
    process.exit(1);
  }

  const articles: ArticleRow[] = (rows ?? []).map((row) => {
    const category = row.blog_categories as { slug?: string } | { slug?: string }[] | null;
    const categorySlug = Array.isArray(category) ? category[0]?.slug : category?.slug;
    return {
      id: row.id,
      title_fr: row.title_fr,
      slug_fr: row.slug_fr,
      featured_image_url: row.featured_image_url,
      status: row.status,
      category_slug: categorySlug ?? 'technique',
    };
  });

  const toRefresh = pickArticlesToRefresh(articles);
  const usedPhotoIds = collectUsedPhotoIdsFromUrls(articles.map((a) => a.featured_image_url));

  const duplicateGroups = [...groupArticlesByPhotoId(articles).entries()].filter(([, g]) => g.length > 1);
  console.log(`Articles total: ${articles.length}`);
  console.log(`Groupes d'images en doublon: ${duplicateGroups.length}`);
  for (const [photoId, group] of duplicateGroups) {
    console.log(`  • photo ${photoId} → ${group.length} article(s): ${group.map((a) => a.title_fr).join(' | ')}`);
  }
  console.log(`Articles à réattribuer: ${toRefresh.length}${DRY_RUN ? ' (dry-run)' : ''}`);

  if (toRefresh.length === 0) {
    console.log('Aucun doublon à corriger.');
    return;
  }

  let updatedCount = 0;
  const updatedArticles: Array<{ title: string; photoId: string | null }> = [];

  for (const article of toRefresh) {
    const currentPhotoId = extractUnsplashPhotoId(article.featured_image_url);
    if (currentPhotoId) usedPhotoIds.delete(currentPhotoId);

    const variant = pilatesArticleNumber(article.title_fr) ?? article.slug_fr.length;
    const img = await fetchUnsplashImage({
      title: article.title_fr,
      categorySlug: article.category_slug,
      excludedPhotoIds: usedPhotoIds,
      variant,
    });

    if (process.env.UNSPLASH_ACCESS_KEY) {
      await sleep(UNSPLASH_DELAY_MS);
    }

    if (!img.imageUrl || !img.photoId) {
      console.error(`❌ ${article.title_fr}: aucune image unique trouvée`);
      if (currentPhotoId) usedPhotoIds.add(currentPhotoId);
      continue;
    }

    const normalizedUrl = normalizeStoredImageUrl(img.imageUrl);
    usedPhotoIds.add(img.photoId);

    if (DRY_RUN) {
      console.log(`[dry-run] ${article.title_fr} → photo ${img.photoId}`);
      updatedCount += 1;
      updatedArticles.push({ title: article.title_fr, photoId: img.photoId });
      continue;
    }

    const { error: updateError } = await admin
      .from('blog_articles')
      .update({ featured_image_url: normalizedUrl })
      .eq('id', article.id);

    if (updateError) {
      console.error(`❌ ${article.title_fr}: mise à jour échouée — ${updateError.message}`);
      usedPhotoIds.delete(img.photoId);
      if (currentPhotoId) usedPhotoIds.add(currentPhotoId);
      continue;
    }

    updatedCount += 1;
    updatedArticles.push({ title: article.title_fr, photoId: img.photoId });
    console.log(`✅ ${article.title_fr} → photo ${img.photoId}`);
  }

  const pilates10to17 = articles.filter((a) => {
    const n = pilatesArticleNumber(a.title_fr);
    return n != null && n >= 10 && n <= 17;
  });

  if (!DRY_RUN && pilates10to17.length > 0) {
    const { data: refreshed } = await admin
      .from('blog_articles')
      .select('title_fr, featured_image_url')
      .in(
        'id',
        pilates10to17.map((a) => a.id),
      );

    const photoIds = (refreshed ?? []).map((a) => extractUnsplashPhotoId(a.featured_image_url)).filter(Boolean);
    const uniqueCount = new Set(photoIds).size;
    console.log(`\nArticles pilates 10–17: ${pilates10to17.length} trouvé(s), ${uniqueCount} image(s) distincte(s).`);
    for (const row of refreshed ?? []) {
      console.log(`  • ${row.title_fr} → ${extractUnsplashPhotoId(row.featured_image_url) ?? '(aucune)'}`);
    }
  }

  console.log(`\n🎉 Terminé: ${updatedCount} article(s) ${DRY_RUN ? 'simulé(s)' : 'mis à jour'}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
