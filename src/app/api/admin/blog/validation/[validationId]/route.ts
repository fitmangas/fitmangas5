import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: Request, context: { params: Promise<{ validationId: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { validationId } = await context.params;

  let body: { action?: string; notes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const action = body.action === 'approve' || body.action === 'reject' ? body.action : null;
  if (!action) {
    return NextResponse.json({ error: 'action doit être approve ou reject.' }, { status: 400 });
  }

  const notes =
    typeof body.notes === 'string' && body.notes.trim().length > 0 ? body.notes.trim().slice(0, 4000) : null;

  try {
    const admin = createAdminClient();

    const { data: row, error: fetchErr } = await admin
      .from('admin_article_validations')
      .select('id, article_id, coach_id')
      .eq('id', validationId)
      .maybeSingle();

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Validation introuvable.' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      await admin
        .from('admin_article_validations')
        .update({
          status: 'validated',
          validated_at: now,
          notes,
        })
        .eq('id', validationId);

      await admin
        .from('blog_articles')
        .update({
          status: 'validated',
          ...(notes !== null ? { coach_notes: notes } : {}),
          updated_at: now,
        })
        .eq('id', row.article_id);
    } else {
      await admin
        .from('admin_article_validations')
        .update({
          status: 'rejected',
          validated_at: now,
          notes,
        })
        .eq('id', validationId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[validation patch]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
