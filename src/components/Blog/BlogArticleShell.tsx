'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArticleProse } from '@/components/Blog/ArticleProse';
import { BlogLanguageBar, useBlogLanguagePref } from '@/components/Blog/BlogLanguageBar';
import { BlogRatingBlock } from '@/components/Blog/BlogRatingBlock';
import { BlogScrollTracker } from '@/components/Blog/BlogScrollTracker';
import { BlogViewBeacon } from '@/components/Blog/BlogViewBeacon';
import { BlogConversionCta } from '@/components/Blog/BlogConversionCta';
import { NewsletterCta } from '@/components/Blog/NewsletterCta';
import { uniqueBlogImageUrl } from '@/lib/blog/images';
import { pickLocalizedArticle } from '@/lib/blog/localize';
import { SEO_PILLAR_PAGES } from '@/lib/seo-pillar-pages';
import type { BlogLang } from '@/types/blog';

type ArticleRow = Parameters<typeof pickLocalizedArticle>[0];
type RelatedBlogArticle = {
  id: string;
  title_fr: string;
  title_es: string | null;
  slug_fr: string;
  slug_es: string | null;
  description_fr: string | null;
  description_es: string | null;
  blog_categories?: { slug: string; label_fr: string; label_es: string | null } | null;
};

type Props = {
  article: ArticleRow & {
    id: string;
    featured_image_url: string | null;
    published_at: string | null;
    average_rating: number | null;
    rating_count: number | null;
    view_count: number | null;
    blog_categories?: { slug: string; label_fr: string; label_es: string | null } | null;
  };
  defaultLang: BlogLang;
  isLoggedIn: boolean;
  relatedArticles?: RelatedBlogArticle[];
};

function readingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function BlogArticleShell({ article, defaultLang, isLoggedIn, relatedArticles = [] }: Props) {
  const [lang, setLang] = useBlogLanguagePref(defaultLang, isLoggedIn);

  const loc = useMemo(() => pickLocalizedArticle(article, lang), [article, lang]);

  const catLabel =
    article.blog_categories &&
    (lang === 'es' ? article.blog_categories.label_es ?? article.blog_categories.label_fr : article.blog_categories.label_fr);

  const imageUrl = useMemo(
    () =>
      uniqueBlogImageUrl({
        coverImageUrl: article.featured_image_url,
        categoryLabel: catLabel,
        index: 0,
        used: new Set<string>(),
      }),
    [article.featured_image_url, catLabel],
  );

  const date =
    article.published_at != null
      ? new Date(article.published_at).toLocaleDateString(
          lang === 'es' ? 'es-ES' : 'fr-FR',
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
      {isLoggedIn ? <BlogScrollTracker articleId={article.id} /> : null}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <BlogLanguageBar value={lang} onChange={setLang} />
        <Link
          href="/blog"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted hover:text-luxury-ink"
        >
          ← Blog
        </Link>
      </div>

      <div className="mb-8 overflow-hidden rounded-[1.75rem] border border-white/40 shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-auto w-full object-cover" />
      </div>

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
        {loc.isContentFallback ? (
          <p className="mb-6 inline-flex rounded-full border border-amber-200 bg-amber-50/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800">
            {lang === 'es' ? 'Traducción no disponible' : 'Traduction non disponible'}
          </p>
        ) : null}
        <ArticleProse text={loc.content} />
      </div>

      <section className="mb-10 rounded-[1.75rem] border border-[#C45D3E]/20 bg-[#fffaf5]/90 p-5 shadow-[0_14px_36px_rgba(120,80,20,0.07)] backdrop-blur-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">
          {lang === 'es' ? 'Guías esenciales' : 'Guides essentiels'}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-luxury-ink">
          {lang === 'es' ? 'Profundizar tu práctica de Pilates' : 'Approfondir ta pratique du Pilates'}
        </h2>
        <div className="mt-4 grid gap-3">
          {SEO_PILLAR_PAGES.map((pillar) => (
            <Link
              key={pillar.slug}
              href={`/${pillar.slug}`}
              className="rounded-2xl border border-white/70 bg-white/65 p-4 transition hover:border-orange-200 hover:bg-white"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                {lang === 'es' ? 'Guía Pilates' : 'Guide Pilates'}
              </span>
              <h3 className="mt-1 text-base font-semibold leading-snug text-luxury-ink">{pillar.shortTitle}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-luxury-muted">{pillar.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {relatedArticles.length > 0 ? (
        <section className="mb-10 rounded-[1.75rem] border border-white/45 bg-white/45 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">
            {lang === 'es' ? 'Para seguir leyendo' : 'À lire ensuite'}
          </p>
          <div className="mt-4 grid gap-3">
            {relatedArticles.map((related) => {
              const relatedLoc = pickLocalizedArticle(
                {
                  title_fr: related.title_fr,
                  title_es: related.title_es,
                  description_fr: related.description_fr,
                  description_es: related.description_es,
                  content_fr: '',
                  content_es: null,
                  meta_description_fr: null,
                  meta_description_es: null,
                  slug_fr: related.slug_fr,
                  slug_es: related.slug_es,
                },
                lang,
              );
              const href = lang === 'es' ? `/blog/${related.slug_es ?? related.slug_fr}` : `/blog/${related.slug_fr}`;
              return (
                <Link key={related.id} href={href} className="rounded-2xl border border-white/50 bg-white/55 p-4 transition hover:border-orange-200 hover:bg-white/80">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                    {lang === 'es'
                      ? related.blog_categories?.label_es ?? related.blog_categories?.label_fr ?? 'Pilates'
                      : related.blog_categories?.label_fr ?? 'Pilates'}
                  </span>
                  <h2 className="mt-1 text-base font-semibold leading-snug text-luxury-ink">{relatedLoc.title}</h2>
                  {relatedLoc.description ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-luxury-muted">{relatedLoc.description}</p> : null}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <BlogRatingBlock
        articleId={article.id}
        initialAverage={article.average_rating}
        initialCount={article.rating_count ?? 0}
        isLoggedIn={isLoggedIn}
      />

      <BlogConversionCta className="mt-10" />

      <div className="mt-10">
        <NewsletterCta articleId={article.id} />
      </div>
    </article>
  );
}
