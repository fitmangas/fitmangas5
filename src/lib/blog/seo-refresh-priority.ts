import {
  BLOG_SHORT_WORDS_THRESHOLD,
  BLOG_TARGET_WORDS_MIN,
  countBodyWords,
  getBodyWordLengthZone,
  type BodyWordLengthZone,
} from '@/lib/blog/blog-content-guards';

export type GscPageMetric = {
  page: string;
  clicks: number;
  impressions: number;
};

export type BlogRefreshPriorityItem = {
  id: string;
  title_fr: string;
  slug_fr: string;
  published_at: string | null;
  updated_at: string | null;
  wordCount: number;
  lengthZone: BodyWordLengthZone;
  gscImpressions: number;
  gscClicks: number;
  gscCtr: number | null;
  /** Score plus haut = plus urgent. */
  priorityScore: number;
  reasons: string[];
};

function matchBlogSlug(pageUrl: string, slug: string): boolean {
  const needle = `/blog/${slug}`.toLowerCase();
  try {
    const path = new URL(pageUrl).pathname.replace(/\/$/, '').toLowerCase();
    return path === needle || path.endsWith(needle);
  } catch {
    return pageUrl.toLowerCase().includes(needle);
  }
}

/**
 * Classe les articles publiés du plus urgent au moins urgent pour MàJ progressive.
 * Priorité : trop courts (<800) puis impressions GSC élevées / CTR bas.
 */
export function buildBlogRefreshPriorityList(params: {
  articles: Array<{
    id: string;
    title_fr: string;
    slug_fr: string;
    content_fr: string | null;
    published_at: string | null;
    updated_at: string | null;
  }>;
  topPages?: GscPageMetric[];
}): BlogRefreshPriorityItem[] {
  const topPages = params.topPages ?? [];

  const items = params.articles.map((article) => {
    const wordCount = countBodyWords(article.content_fr ?? '');
    const lengthZone = getBodyWordLengthZone(wordCount);
    const gscRows = topPages.filter((row) => matchBlogSlug(row.page, article.slug_fr));
    const gscImpressions = gscRows.reduce((sum, row) => sum + row.impressions, 0);
    const gscClicks = gscRows.reduce((sum, row) => sum + row.clicks, 0);
    const gscCtr = gscImpressions > 0 ? gscClicks / gscImpressions : null;

    const reasons: string[] = [];
    let priorityScore = 0;

    if (wordCount < BLOG_SHORT_WORDS_THRESHOLD) {
      priorityScore += 1000 + (BLOG_SHORT_WORDS_THRESHOLD - wordCount);
      reasons.push(`Trop court (${wordCount} mots)`);
    } else if (wordCount < BLOG_TARGET_WORDS_MIN) {
      priorityScore += 400 + (BLOG_TARGET_WORDS_MIN - wordCount) / 2;
      reasons.push(`Sous zone idéale (${wordCount} mots)`);
    } else {
      reasons.push(`${wordCount} mots (longueur OK)`);
    }

    if (gscImpressions >= 50 && (gscCtr == null || gscCtr < 0.02)) {
      priorityScore += 500 + Math.min(gscImpressions, 2000) / 10;
      reasons.push(
        `GSC : ${gscImpressions} impr. / ${gscClicks} clics${gscCtr != null ? ` (CTR ${(gscCtr * 100).toFixed(1)}%)` : ''} — quick win titre/intro`,
      );
    } else if (gscImpressions > 0) {
      priorityScore += Math.min(gscImpressions, 200) / 20;
      reasons.push(`GSC : ${gscImpressions} impr. / ${gscClicks} clics`);
    } else {
      reasons.push('Pas d’impressions GSC dans le top pages (ou GSC indisponible)');
    }

    return {
      id: article.id,
      title_fr: article.title_fr,
      slug_fr: article.slug_fr,
      published_at: article.published_at,
      updated_at: article.updated_at,
      wordCount,
      lengthZone,
      gscImpressions,
      gscClicks,
      gscCtr,
      priorityScore,
      reasons,
    };
  });

  return items.sort((a, b) => b.priorityScore - a.priorityScore || a.wordCount - b.wordCount);
}
