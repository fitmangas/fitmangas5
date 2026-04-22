import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(_request: Request, context: { params: Promise<{ articleId: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { articleId } = await context.params;

  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('blog_heatmap_data')
      .select('section_bucket, scroll_hits, average_time_spent_seconds, updated_at')
      .eq('article_id', articleId)
      .order('section_bucket', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ buckets: data ?? [] });
  } catch (e) {
    console.error('[heatmap]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
