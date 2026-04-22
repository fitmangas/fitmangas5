import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, context: { params: Promise<{ articleId: string }> }) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const { articleId } = await context.params;

  let body: {
    scrollPercentage?: number;
    timeSpentSeconds?: number;
    deviceType?: string;
    trafficSource?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const scrollPct =
    typeof body.scrollPercentage === 'number'
      ? Math.min(100, Math.max(0, Math.round(body.scrollPercentage)))
      : null;
  const timeSpent =
    typeof body.timeSpentSeconds === 'number' ? Math.max(0, Math.round(body.timeSpentSeconds)) : 0;
  const deviceType =
    typeof body.deviceType === 'string' ? body.deviceType.slice(0, 32) : null;
  const trafficSource =
    typeof body.trafficSource === 'string' ? body.trafficSource.slice(0, 32) : null;

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

    const { error: insErr } = await supabase.from('blog_scroll_tracking').insert({
      article_id: articleId,
      user_id: auth.user.id,
      scroll_percentage_max: scrollPct,
      time_spent_seconds: timeSpent,
      device_type: deviceType,
      traffic_source: trafficSource,
    });

    if (insErr) {
      console.error('[blog scroll]', insErr);
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    }

    if (scrollPct != null) {
      const bucket = Math.min(19, Math.floor(scrollPct / 5));
      const admin = createAdminClient();
      const { data: hm } = await admin
        .from('blog_heatmap_data')
        .select('id, scroll_hits, average_time_spent_seconds')
        .eq('article_id', articleId)
        .eq('section_bucket', bucket)
        .maybeSingle();

      const hits = (hm?.scroll_hits ?? 0) + 1;
      const prevAvg = hm?.average_time_spent_seconds ?? 0;
      const newAvg = Math.round(prevAvg + (timeSpent - prevAvg) / hits);

      await admin.from('blog_heatmap_data').upsert(
        {
          article_id: articleId,
          section_bucket: bucket,
          scroll_hits: hits,
          average_time_spent_seconds: newAvg,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'article_id,section_bucket' },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[blog scroll]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
