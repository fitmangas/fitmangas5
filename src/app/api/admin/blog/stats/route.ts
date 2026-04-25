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

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data: trackingRows } = await admin
      .from('blog_scroll_tracking')
      .select('tracked_at,traffic_source,scroll_percentage_max,time_spent_seconds')
      .gte('tracked_at', since.toISOString());

    const byDay: Record<string, number> = {};
    const sourceMap: Record<string, number> = {};
    let bounceCount = 0;
    let totalSessions = 0;
    for (const row of trackingRows ?? []) {
      totalSessions += 1;
      const day = new Date(row.tracked_at).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
      const source = row.traffic_source?.trim() || 'direct';
      sourceMap[source] = (sourceMap[source] ?? 0) + 1;
      const isBounce = (row.scroll_percentage_max ?? 0) < 25 && (row.time_spent_seconds ?? 0) < 20;
      if (isBounce) bounceCount += 1;
    }

    return NextResponse.json({
      totals: {
        publishedArticles: publishedCount ?? 0,
        totalViews,
        averageRating: avgRating,
        averageScrollPercentage: avgEngagementPct,
        newsletterSubscribers: newsletterCount ?? 0,
        bounceRate: totalSessions > 0 ? Math.round((bounceCount / totalSessions) * 100) : 0,
      },
      trending: trending ?? [],
      timeline30d: Object.entries(byDay)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, sessions]) => ({ day, sessions })),
      trafficSources: sourceMap,
    });
  } catch (e) {
    console.error('[admin blog stats]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
