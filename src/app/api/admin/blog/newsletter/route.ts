import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const format = url.searchParams.get('format');
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
  const pageSize = 50;
  const from = (page - 1) * pageSize;

  try {
    const admin = createAdminClient();

    const { data, error, count } = await admin
      .from('newsletter_subscriptions')
      .select('id, email, subscribed_at, confirmed, unsubscribed, subscribed_from_article_id', {
        count: 'exact',
      })
      .eq('unsubscribed', false)
      .order('subscribed_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (format === 'csv') {
      const lines = ['email,subscribed_at,article_id'];
      for (const row of data ?? []) {
        lines.push(`${row.email},${row.subscribed_at},${row.subscribed_from_article_id ?? ''}`);
      }
      return new Response(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="newsletter-subscribers.csv"',
        },
      });
    }

    return NextResponse.json({
      subscribers: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (e) {
    console.error('[newsletter admin]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
