import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { formatMonthYear, parseMonthYearParam } from '@/lib/blog/month';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const monthParam = parseMonthYearParam(url.searchParams.get('month'));
  const month_year = monthParam ?? formatMonthYear(new Date());

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_article_validations')
      .select(
        `
        id,
        status,
        month_year,
        notes,
        validated_at,
        article:blog_articles (
          id,
          title_fr,
          description_fr,
          slug_fr,
          status,
          scheduled_publication_at,
          coach_notes,
          featured_image_url,
          category_id,
          blog_categories ( slug, label_fr )
        )
      `,
      )
      .eq('month_year', month_year)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[admin blog validation]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const pending = (data ?? []).filter((row) => row.status === 'pending');

    return NextResponse.json({
      month_year,
      validations: data ?? [],
      pendingCount: pending.length,
    });
  } catch (e) {
    console.error('[admin blog validation]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
