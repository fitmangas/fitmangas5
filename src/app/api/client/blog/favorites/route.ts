import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const { data, error } = await supabase
    .from('blog_article_favorites')
    .select('article_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorites: (data ?? []).map((r) => r.article_id) });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { articleId?: string; favorite?: boolean } | null;
  const articleId = body?.articleId?.trim();
  const favorite = body?.favorite === true;
  if (!articleId) return NextResponse.json({ error: 'articleId manquant.' }, { status: 400 });

  if (favorite) {
    const { error } = await supabase.from('blog_article_favorites').insert({ article_id: articleId, user_id: user.id });
    if (error && !error.message.includes('duplicate key')) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, favorite: true });
  }

  const { error } = await supabase.from('blog_article_favorites').delete().eq('article_id', articleId).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, favorite: false });
}
