import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function fetchPublishedArticleBySlugParam(slug: string) {
  const supabase = await createClient();
  const decoded = decodeURIComponent(slug).trim();
  if (!decoded) return null;

  const select = `
      *,
      blog_categories ( id, slug, label_fr, label_en, label_es )
    `;

  for (const col of ['slug_fr', 'slug_en', 'slug_es'] as const) {
    const { data } = await supabase
      .from('blog_articles')
      .select(select)
      .eq('status', 'published')
      .eq(col, decoded)
      .maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function fetchAnyArticleBySlugParam(slug: string) {
  const supabase = await createClient();
  const decoded = decodeURIComponent(slug).trim();
  if (!decoded) return null;

  const select = `
      *,
      blog_categories ( id, slug, label_fr, label_en, label_es )
    `;

  for (const col of ['slug_fr', 'slug_en', 'slug_es'] as const) {
    const { data } = await supabase.from('blog_articles').select(select).eq(col, decoded).maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function fetchAnyArticleBySlugParamAdmin(slug: string) {
  const supabase = createAdminClient();
  const decoded = decodeURIComponent(slug).trim();
  if (!decoded) return null;

  const select = `
      *,
      blog_categories ( id, slug, label_fr, label_en, label_es )
    `;

  for (const col of ['slug_fr', 'slug_en', 'slug_es'] as const) {
    const { data } = await supabase.from('blog_articles').select(select).eq(col, decoded).maybeSingle();
    if (data) return data;
  }
  return null;
}
