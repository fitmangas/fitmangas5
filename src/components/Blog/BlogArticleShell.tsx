'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArticleProse } from '@/components/Blog/ArticleProse';
import { BlogLanguageBar, useBlogLanguagePref } from '@/components/Blog/BlogLanguageBar';
import { BlogRatingBlock } from '@/components/Blog/BlogRatingBlock';
import { BlogScrollTracker } from '@/components/Blog/BlogScrollTracker';
import { BlogViewBeacon } from '@/components/Blog/BlogViewBeacon';
import { NewsletterCta } from '@/components/Blog/NewsletterCta';
import { pickLocalizedArticle } from '@/lib/blog/localize';
import type { BlogLang } from '@/types/blog';

type ArticleRow = Parameters<typeof pickLocalizedArticle>[0];

type Props = {
  article: ArticleRow & {
    id: string;
    featured_image_url: string | null;
    published_at: string | null;
    average_rating: number | null;
    rating_count: number | null;
    view_count: number | null;
    blog_categories?: { slug: string; label_fr: string; label_en: string | null; label_es: string | null } | null;
  };
  defaultLang: BlogLang;
  isLoggedIn: boolean;
};

function readingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function BlogArticleShell({ article, defaultLang, isLoggedIn }: Props) {
  const [lang, setLang] = useBlogLanguagePref(defaultLang, isLoggedIn);

  const loc = useMemo(() => pickLocalizedArticle(article, lang), [article, lang]);

  const catLabel =
    article.blog_categories &&
    (lang === 'en'
      ? article.blog_categories.label_en ?? article.blog_categories.label_fr
      : lang === 'es'
        ? article.blog_categories.label_es ?? article.blog_categories.label_fr
        : article.blog_categories.label_fr);

  const date =
    article.published_at != null
      ? new Date(article.published_at).toLocaleDateString(
          lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          },
        )
      : '';

  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
      <BlogViewBeacon articleId={article.id} />
      <BlogScrollTracker articleId={article.id} />

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <BlogLanguageBar value={lang} onChange={setLang} />
        <Link
          href="/blog"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted hover:text-luxury-ink"
        >
          ← Blog
        </Link>
      </div>

      {article.featured_image_url ? (
        <div className="mb-8 overflow-hidden rounded-[1.75rem] border border-white/40 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.featured_image_url} alt="" className="h-auto w-full object-cover" />
        </div>
      ) : null}

      <header className="border-b border-white/40 pb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">{catLabel ?? 'Blog'}</p>
        <h1 className="hero-signature-title mt-4 text-3xl sm:text-4xl">{loc.title}</h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-luxury-muted">
          <span>{date}</span>
          <span>·</span>
          <span>⏱ ~{readingMinutes(loc.content)} min</span>
          <span>·</span>
          <span>👁 {article.view_count ?? 0} vues</span>
        </div>
      </header>

      <div className="py-10">
        <ArticleProse text={loc.content} />
      </div>

      <BlogRatingBlock
        articleId={article.id}
        initialAverage={article.average_rating}
        initialCount={article.rating_count ?? 0}
        isLoggedIn={isLoggedIn}
      />

      <div className="mt-10">
        <NewsletterCta articleId={article.id} />
      </div>
    </article>
  );
}
