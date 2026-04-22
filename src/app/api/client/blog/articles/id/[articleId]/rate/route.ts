import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/api-auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, context: { params: Promise<{ articleId: string }> }) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const { articleId } = await context.params;
  let body: { rating?: number; comment?: string };
  try {
    body = (await request.json()) as { rating?: number; comment?: string };
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const rating = typeof body.rating === 'number' ? Math.round(body.rating) : NaN;
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Note entre 1 et 5 requise.' }, { status: 400 });
  }

  const comment =
    typeof body.comment === 'string' && body.comment.trim().length > 0 ? body.comment.trim().slice(0, 2000) : null;

  try {
    const supabase = await createClient();

    const { data: article } = await supabase
      .from('blog_articles')
      .select('id, status')
      .eq('id', articleId)
      .maybeSingle();

    if (!article || article.status !== 'published') {
      return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
    }

    const { error } = await supabase.from('blog_article_ratings').upsert(
      {
        article_id: articleId,
        user_id: auth.user.id,
        rating,
        comment,
        rated_at: new Date().toISOString(),
      },
      { onConflict: 'article_id,user_id' },
    );

    if (error) {
      console.error('[blog rate]', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: stats } = await supabase
      .from('blog_articles')
      .select('average_rating, rating_count')
      .eq('id', articleId)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      average_rating: stats?.average_rating ?? null,
      rating_count: stats?.rating_count ?? 0,
    });
  } catch (e) {
    console.error('[blog rate]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
