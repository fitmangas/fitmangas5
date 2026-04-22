import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(_request: Request, context: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await context.params;
  if (!articleId) {
    return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from('blog_articles')
      .select('id, status, view_count')
      .eq('id', articleId)
      .maybeSingle();

    if (!row || row.status !== 'published') {
      return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
    }

    await admin
      .from('blog_articles')
      .update({ view_count: (row.view_count ?? 0) + 1 })
      .eq('id', articleId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[blog view]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
