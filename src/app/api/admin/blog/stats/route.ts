import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  try {
    const admin = createAdminClient();

    const { count: publishedCount } = await admin
      .from('blog_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    let totalViews = 0;
    let weightedRating = 0;
    let ratingWeights = 0;
    let scrollSum = 0;
    let scrollN = 0;

    const { data: rows } = await admin.from('blog_articles').select(
      'view_count, average_rating, rating_count, average_scroll_percentage',
    );

    for (const r of rows ?? []) {
      totalViews += r.view_count ?? 0;
      if (r.average_rating != null && (r.rating_count ?? 0) > 0) {
        weightedRating += Number(r.average_rating) * (r.rating_count ?? 0);
        ratingWeights += r.rating_count ?? 0;
      }
      if ((r.average_scroll_percentage ?? 0) > 0) {
        scrollSum += r.average_scroll_percentage ?? 0;
        scrollN += 1;
      }
    }

    const avgRating = ratingWeights > 0 ? Math.round((weightedRating / ratingWeights) * 100) / 100 : null;
    const avgEngagementPct = scrollN > 0 ? Math.round(scrollSum / scrollN) : null;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: trending } = await admin
      .from('blog_articles')
      .select('id, title_fr, slug_fr, view_count, average_rating, published_at')
      .eq('status', 'published')
      .gte('published_at', weekAgo.toISOString())
      .order('view_count', { ascending: false })
      .limit(5);

    const { count: newsletterCount } = await admin
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('unsubscribed', false);

    return NextResponse.json({
      totals: {
        publishedArticles: publishedCount ?? 0,
        totalViews,
        averageRating: avgRating,
        averageScrollPercentage: avgEngagementPct,
        newsletterSubscribers: newsletterCount ?? 0,
      },
      trending: trending ?? [],
    });
  } catch (e) {
    console.error('[admin blog stats]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
