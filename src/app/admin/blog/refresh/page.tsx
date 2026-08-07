import Link from 'next/link';

import { BlogRefreshPriorityClient } from '@/components/Admin/blog/BlogRefreshPriorityClient';
import { requireAdmin } from '@/lib/auth/require-admin';
import { buildBlogRefreshPriorityList } from '@/lib/blog/seo-refresh-priority';
import { getSearchTopPages } from '@/lib/google/search-console';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminBlogRefreshPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: articles } = await admin
    .from('blog_articles')
    .select('id, title_fr, slug_fr, content_fr, published_at, updated_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  let topPages: Array<{ page: string; clicks: number; impressions: number }> = [];
  let gscAvailable = false;
  try {
    topPages = await getSearchTopPages(28, 100);
    gscAvailable = true;
  } catch (e) {
    console.warn('[admin/blog/refresh] Search Console topPages', e);
  }

  const items = buildBlogRefreshPriorityList({
    articles: articles ?? [],
    topPages,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/admin/blog" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted hover:text-luxury-ink">
        ← Blog
      </Link>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">SEO qualité 2026</p>
      <h1 className="hero-signature-title mt-2 text-3xl text-luxury-ink">Mise à jour progressive</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-luxury-muted">
        Liste priorisée des {items.length} articles publiés — du plus urgent au moins urgent. Aucune réécriture automatique
        au chargement : tu lances les lots toi-même (3–5 max).
      </p>

      <div className="mt-8">
        <BlogRefreshPriorityClient items={items} gscAvailable={gscAvailable} />
      </div>
    </main>
  );
}
