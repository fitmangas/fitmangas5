import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogArticleShell } from '@/components/Blog/BlogArticleShell';
import { fetchPublishedArticleBySlugParam } from '@/lib/blog/fetch-article';
import type { BlogLang } from '@/types/blog';

type SearchParams = Promise<{ lang?: string }>;

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await fetchPublishedArticleBySlugParam(slug);
  if (!article) return { title: 'Article' };
  const sp = await props.searchParams;
  const lang = (sp.lang === 'en' || sp.lang === 'es' ? sp.lang : 'fr') as BlogLang;
  const title =
    lang === 'en'
      ? article.title_en ?? article.title_fr
      : lang === 'es'
        ? article.title_es ?? article.title_fr
        : article.title_fr;
  return {
    title: `${title} — Blog`,
    description:
      lang === 'en'
        ? article.meta_description_en ?? article.description_en ?? article.description_fr
        : lang === 'es'
          ? article.meta_description_es ?? article.description_es ?? article.description_fr
          : article.meta_description_fr ?? article.description_fr ?? undefined,
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
  const article = await fetchPublishedArticleBySlugParam(slug);
  if (!article) notFound();

  const sp = await searchParams;
  const queryLang = sp.lang === 'en' || sp.lang === 'es' ? sp.lang : null;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let defaultLang: BlogLang = queryLang ?? 'fr';
  if (!queryLang && user) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('preferred_blog_language')
      .eq('id', user.id)
      .maybeSingle();
    if (prof?.preferred_blog_language === 'en' || prof?.preferred_blog_language === 'es') {
      defaultLang = prof.preferred_blog_language;
    }
  } else if (queryLang) {
    defaultLang = queryLang;
  }

  return (
    <BlogArticleShell
      article={article as never}
      defaultLang={defaultLang}
      isLoggedIn={!!user}
    />
  );
}
