import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(_request: Request, context: { params: Promise<{ articleId: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { articleId } = await context.params;

  try {
    const admin = createAdminClient();

    const { data: article, error } = await admin
      .from('blog_articles')
      .select(
        'id, title_fr, slug_fr, status, view_count, share_count, average_rating, rating_count, average_scroll_percentage, average_time_spent_seconds, published_at',
      )
      .eq('id', articleId)
      .maybeSingle();

    if (error || !article) {
      return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
    }

    const { count: sessions } = await admin
      .from('blog_scroll_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', articleId);

    const { data: sources } = await admin
      .from('blog_scroll_tracking')
      .select('traffic_source')
      .eq('article_id', articleId);

    const sourceMap: Record<string, number> = {};
    for (const s of sources ?? []) {
      const k = s.traffic_source ?? 'direct';
      sourceMap[k] = (sourceMap[k] ?? 0) + 1;
    }

    const { data: devices } = await admin
      .from('blog_scroll_tracking')
      .select('device_type')
      .eq('article_id', articleId);

    const deviceMap: Record<string, number> = {};
    for (const d of devices ?? []) {
      const k = d.device_type ?? 'unknown';
      deviceMap[k] = (deviceMap[k] ?? 0) + 1;
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

    const { data: comments } = await admin
      .from('blog_article_ratings')
      .select('rating, comment, rated_at')
      .eq('article_id', articleId)
      .not('comment', 'is', null)
      .order('rated_at', { ascending: false })
      .limit(40);

    return NextResponse.json({
      article,
      sessions: sessions ?? 0,
      trafficSources: sourceMap,
      devices: deviceMap,
      ratingDistribution: distribution,
      comments: comments ?? [],
    });
  } catch (e) {
    console.error('[article stats]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
