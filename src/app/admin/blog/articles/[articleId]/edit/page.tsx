import { notFound } from 'next/navigation';

import { ArticleEditWithSeoAssistant } from '@/components/Admin/blog/ArticleEditWithSeoAssistant';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminArticleEditPage({ params }: { params: Promise<{ articleId: string }> }) {
  await requireAdmin();
  const { articleId } = await params;
  const admin = createAdminClient();
  const { data: article } = await admin
    .from('blog_articles')
    .select('id, title_fr, description_fr, content_fr, meta_description_fr, seo_keywords, slug_fr')
    .eq('id', articleId)
    .maybeSingle();

  if (!article) notFound();

  return (
    <main className="min-h-screen">
      <ArticleEditWithSeoAssistant article={article} />
    </main>
  );
}
