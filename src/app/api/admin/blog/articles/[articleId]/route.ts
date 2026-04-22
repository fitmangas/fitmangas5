import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { createAdminClient } from '@/lib/supabase/admin';

const PATCHABLE = new Set([
  'title_fr',
  'title_en',
  'title_es',
  'slug_fr',
  'slug_en',
  'slug_es',
  'description_fr',
  'description_en',
  'description_es',
  'content_fr',
  'content_en',
  'content_es',
  'featured_image_url',
  'category_id',
  'scheduled_publication_at',
  'coach_notes',
  'seo_keywords',
  'meta_description_fr',
  'meta_description_en',
  'meta_description_es',
]);

export async function PATCH(request: Request, context: { params: Promise<{ articleId: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { articleId } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  for (const key of PATCHABLE) {
    if (key in body) payload[key] = body[key];
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Aucun champ reconnu.' }, { status: 400 });
  }

  payload.updated_at = new Date().toISOString();

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('blog_articles').update(payload).eq('id', articleId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[admin patch article]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
