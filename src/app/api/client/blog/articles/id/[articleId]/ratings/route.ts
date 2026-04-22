import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** Agrégats + commentaires publics (service role — pas d’email exposé). */
export async function GET(_request: Request, context: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await context.params;

  try {
    const admin = createAdminClient();

    const { data: article } = await admin
      .from('blog_articles')
      .select('id, status, average_rating, rating_count')
      .eq('id', articleId)
      .maybeSingle();

    if (!article || article.status !== 'published') {
      return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
    }

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (let star = 1; star <= 5; star++) {
      const { count } = await admin
        .from('blog_article_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleId)
        .eq('rating', star);
      distribution[star] = count ?? 0;
    }

    const { data: ratings } = await admin
      .from('blog_article_ratings')
      .select('rating, comment, rated_at')
      .eq('article_id', articleId)
      .order('rated_at', { ascending: false })
      .limit(50);

    const comments = (ratings ?? [])
      .filter((r) => r.comment && r.comment.trim().length > 0)
      .map((r) => ({
        rating: r.rating,
        comment: r.comment,
        rated_at: r.rated_at,
      }));

    return NextResponse.json({
      average_rating: article.average_rating,
      rating_count: article.rating_count,
      distribution,
      comments,
    });
  } catch (e) {
    console.error('[blog ratings]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
