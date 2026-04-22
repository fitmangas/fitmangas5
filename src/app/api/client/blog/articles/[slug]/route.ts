import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const decoded = decodeURIComponent(slug).trim();
  if (!decoded) {
    return NextResponse.json({ error: 'Slug manquant.' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    const select = `
      *,
      blog_categories ( id, slug, label_fr, label_en, label_es )
    `;

    for (const col of ['slug_fr', 'slug_en', 'slug_es'] as const) {
      const { data, error } = await supabase
        .from('blog_articles')
        .select(select)
        .eq('status', 'published')
        .eq(col, decoded)
        .maybeSingle();

      if (error) {
        console.error('[blog article slug]', error);
        return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
      }
      if (data) {
        return NextResponse.json({ article: data });
      }
    }

    return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
  } catch (e) {
    console.error('[blog article slug]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
