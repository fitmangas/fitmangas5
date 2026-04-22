import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PAGE_SIZE = 12;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const categorySlug = url.searchParams.get('category')?.trim() ?? '';

  try {
    const supabase = await createClient();

    let categoryId: string | null = null;
    if (categorySlug) {
      const { data: cat } = await supabase.from('blog_categories').select('id').eq('slug', categorySlug).maybeSingle();
      categoryId = cat?.id ?? null;
      if (!categoryId) {
        return NextResponse.json({ articles: [], total: 0, page, pageSize: PAGE_SIZE });
      }
    }

    let query = supabase
      .from('blog_articles')
      .select(
        `
        id,
        title_fr,
        title_en,
        title_es,
        description_fr,
        description_en,
        description_es,
        slug_fr,
        slug_en,
        slug_es,
        featured_image_url,
        published_at,
        average_rating,
        rating_count,
        view_count,
        blog_categories ( slug, label_fr, label_en, label_es )
      `,
        { count: 'exact' },
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (q) {
      const safe = q.replace(/[%_]/g, '').slice(0, 80);
      if (safe.length > 0) {
        const pattern = `%${safe}%`;
        query = query.or(
          `title_fr.ilike.${pattern},title_en.ilike.${pattern},title_es.ilike.${pattern},description_fr.ilike.${pattern}`,
        );
      }
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('[blog articles]', error);
      return NextResponse.json({ error: 'Impossible de charger les articles.' }, { status: 500 });
    }

    return NextResponse.json({
      articles: data ?? [],
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (e) {
    console.error('[blog articles]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
