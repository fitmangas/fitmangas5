import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { formatMonthYear } from '@/lib/blog/month';
import { createAdminClient } from '@/lib/supabase/admin';

function nextMonthYear(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return formatMonthYear(d);
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  const admin = createAdminClient();
  const monthYear = nextMonthYear();

  const { data: coach } = await admin.from('profiles').select('id').eq('role', 'admin').limit(1).maybeSingle();
  if (!coach?.id) return NextResponse.json({ error: 'Coach admin introuvable.' }, { status: 500 });

  const { data: drafts } = await admin
    .from('blog_articles')
    .select('id')
    .in('status', ['draft', 'validated'])
    .gte('scheduled_publication_at', new Date().toISOString())
    .order('scheduled_publication_at', { ascending: true })
    .limit(8);

  const rows = (drafts ?? []).map((d) => ({
    article_id: d.id,
    coach_id: coach.id,
    month_year: monthYear,
    status: 'pending' as const,
  }));

  if (rows.length > 0) {
    await admin.from('admin_article_validations').upsert(rows, { onConflict: 'article_id,month_year' });
  }

  await admin.from('blog_cron_logs').insert({
    cron_name: 'blog_prepare_monthly_validation',
    status: 'ok',
    message: `month=${monthYear}`,
    meta: { inserted: rows.length },
  });

  return NextResponse.json({ ok: true, monthYear, prepared: rows.length });
}
