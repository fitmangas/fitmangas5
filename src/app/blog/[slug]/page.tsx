import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { BlogArticleShell } from '@/components/Blog/BlogArticleShell';
import {
  fetchAnyArticleBySlugParam,
  fetchAnyArticleBySlugParamAdmin,
  fetchPublishedArticleBySlugParam,
} from '@/lib/blog/fetch-article';
import { hasVisioClientAccess } from '@/lib/access-control';
import { getClientLang } from '@/lib/compte/i18n';
import type { BlogLang } from '@/types/blog';

type SearchParams = Promise<{ lang?: string; preview?: string }>;
export const dynamic = 'force-dynamic';

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
  return {
    title: `${title} — Blog`,
    description:
      lang === 'es'
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
  const sp = await searchParams;
  const previewDraft = process.env.NODE_ENV !== 'production' && sp.preview === 'draft';
  const queryLang = sp.lang === 'es' ? sp.lang : null;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');

  if (!(await hasVisioClientAccess(user.id))) redirect('/compte/blog');

  let article = previewDraft ? await fetchAnyArticleBySlugParamAdmin(slug) : await fetchPublishedArticleBySlugParam(slug);
  if (!article && !previewDraft && user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role === 'admin') {
      article = await fetchAnyArticleBySlugParam(slug);
    }
  }
  if (!article) notFound();

  let defaultLang: BlogLang = queryLang ?? 'fr';
  if (!queryLang && user) {
    const clientLang = await getClientLang(supabase, user.id);
    defaultLang = clientLang === 'es' ? 'es' : 'fr';
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
