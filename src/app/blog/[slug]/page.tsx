import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogArticleShell } from '@/components/Blog/BlogArticleShell';
import {
  fetchAnyArticleBySlugParam,
  fetchAnyArticleBySlugParamAdmin,
  fetchPublishedArticleBySlugParam,
} from '@/lib/blog/fetch-article';
import { getClientLang } from '@/lib/compte/i18n';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BlogLang } from '@/types/blog';

type SearchParams = Promise<{ lang?: string; preview?: string }>;
export const dynamic = 'force-dynamic';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(/\/$/, '');

export type RelatedBlogArticle = {
  id: string;
  title_fr: string;
  title_es: string | null;
  slug_fr: string;
  slug_es: string | null;
  description_fr: string | null;
  description_es: string | null;
  blog_categories?: { slug: string; label_fr: string; label_es: string | null } | null;
};

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const previewDraft = process.env.NODE_ENV !== 'production' && sp.preview === 'draft';
  const article = previewDraft ? await fetchAnyArticleBySlugParamAdmin(slug) : await fetchPublishedArticleBySlugParam(slug);
  if (!article) return { title: 'Article' };
  const lang = (sp.lang === 'es' ? 'es' : 'fr') as BlogLang;
  const title =
    lang === 'es' ? article.title_es ?? article.title_fr : article.title_fr;
  const description =
    lang === 'es'
      ? article.meta_description_es ?? article.description_es ?? article.description_fr ?? undefined
      : article.meta_description_fr ?? article.description_fr ?? undefined;
  const image = article.featured_image_url || '/og-default.jpg';
  const canonical = `${APP_URL}/blog/${article.slug_fr}`;
  const keywords =
    typeof article.seo_keywords === 'string'
      ? article.seo_keywords
          .split(',')
          .map((item: string) => item.trim())
          .filter((item: string) => item && !item.startsWith('topic:'))
          .slice(0, 8)
      : undefined;
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function BlogArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const previewDraft = process.env.NODE_ENV !== 'production' && sp.preview === 'draft';
  const queryLang = sp.lang === 'es' ? sp.lang : null;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let article = previewDraft ? await fetchAnyArticleBySlugParamAdmin(slug) : await fetchPublishedArticleBySlugParam(slug);
  if (!article && !previewDraft && user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role === 'admin') {
      article = await fetchAnyArticleBySlugParam(slug);
    }
  }
  if (!article) notFound();
  const relatedArticles = await fetchRelatedArticles(article);

  let defaultLang: BlogLang = queryLang ?? 'fr';
  if (!queryLang && user) {
    const clientLang = await getClientLang(supabase, user.id);
    defaultLang = clientLang === 'es' ? 'es' : 'fr';
  } else if (queryLang) {
    defaultLang = queryLang;
  }

  return (
    <>
      <BlogArticleJsonLd article={article} />
      <BlogArticleShell
        article={article as never}
        defaultLang={defaultLang}
        isLoggedIn={!!user}
        relatedArticles={relatedArticles}
      />
    </>
  );
}

async function fetchRelatedArticles(article: unknown): Promise<RelatedBlogArticle[]> {
  const row = article as {
    id?: string;
    category_id?: string | null;
    published_at?: string | null;
  };
  if (!row.id || !row.category_id) return [];

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from('blog_articles')
    .select('id,title_fr,title_es,slug_fr,slug_es,description_fr,description_es,blog_categories(slug,label_fr,label_es)')
    .eq('status', 'published')
    .eq('category_id', row.category_id)
    .neq('id', row.id)
    .not('published_at', 'is', null)
    .lte('published_at', nowIso)
    .order('published_at', { ascending: false })
    .limit(3);

  return ((data ?? []) as unknown as Array<RelatedBlogArticle & { blog_categories?: RelatedBlogArticle['blog_categories'] | RelatedBlogArticle['blog_categories'][] }>).map((item) => ({
    ...item,
    blog_categories: Array.isArray(item.blog_categories) ? item.blog_categories[0] : item.blog_categories,
  }));
}

function BlogArticleJsonLd({ article }: { article: unknown }) {
  const row = article as {
    title_fr?: string | null;
    description_fr?: string | null;
    meta_description_fr?: string | null;
    slug_fr?: string | null;
    featured_image_url?: string | null;
    published_at?: string | null;
    updated_at?: string | null;
    blog_categories?: { label_fr?: string | null } | { label_fr?: string | null }[] | null;
  };
  const slug = row.slug_fr?.trim();
  if (!slug) return null;
  const url = `${APP_URL}/blog/${slug}`;
  const category = Array.isArray(row.blog_categories) ? row.blog_categories[0] : row.blog_categories;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: row.title_fr,
        description: row.meta_description_fr ?? row.description_fr,
        image: row.featured_image_url ? [row.featured_image_url] : [`${APP_URL}/og-default.jpg`],
        datePublished: row.published_at,
        dateModified: row.updated_at ?? row.published_at,
        mainEntityOfPage: url,
        url,
        author: {
          '@type': 'Person',
          name: 'Alejandra — FitMangas',
        },
        publisher: {
          '@type': 'Organization',
          name: 'FitMangas',
          logo: {
            '@type': 'ImageObject',
            url: `${APP_URL}/logo.png`,
          },
        },
        articleSection: category?.label_fr ?? 'Pilates',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: APP_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${APP_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: row.title_fr, item: url },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
