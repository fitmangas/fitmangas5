import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { formatMonthYear, parseMonthYearParam } from '@/lib/blog/month';
import { hasCompleteTranslations } from '@/lib/blog/translation-status';
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

export async function PATCH(request: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  let body: { action?: string; validationIds?: string[]; notes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const action = body.action === 'approve' || body.action === 'reject' ? body.action : null;
  const validationIds = Array.isArray(body.validationIds) ? body.validationIds.filter(Boolean) : [];
  const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim().slice(0, 4000) : null;

  if (!action || validationIds.length === 0) {
    return NextResponse.json({ error: 'action et validationIds sont requis.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: rows, error } = await admin
    .from('admin_article_validations')
    .select('id,article_id')
    .in('id', validationIds);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (rows ?? []).map((r) => r.id);
  const articleIds = (rows ?? []).map((r) => r.article_id);
  if (ids.length === 0) return NextResponse.json({ ok: true, updated: 0 });

  const nextStatus = action === 'approve' ? 'validated' : 'rejected';
  await admin
    .from('admin_article_validations')
    .update({ status: nextStatus, validated_at: now, ...(notes ? { notes } : {}) })
    .in('id', ids);

  if (action === 'approve') {
    if (process.env.BLOG_REQUIRE_TRANSLATIONS !== 'false') {
      const { data: articles } = await admin
        .from('blog_articles')
        .select('id,title_en,title_es,content_en,content_es')
        .in('id', articleIds);
      const missing = (articles ?? []).filter(
        (a) =>
          !hasCompleteTranslations({
            title_en: a.title_en,
            title_es: a.title_es,
            content_en: a.content_en,
            content_es: a.content_es,
          }),
      );
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `${missing.length} article(s) ont des traductions EN/ES incomplètes.` },
          { status: 400 },
        );
      }
    }

    await admin
      .from('blog_articles')
      .update({ status: 'validated', updated_at: now, ...(notes ? { coach_notes: notes } : {}) })
      .in('id', articleIds);
  }

  return NextResponse.json({ ok: true, updated: ids.length });
}
