import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import {
  deleteSpanishTranslationRow,
  withSpanishInvalidationIfContentFrChanged,
} from '@/lib/blog/translate-article-es';
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
const SLUG_FIELDS = ['slug_fr', 'slug_en', 'slug_es'] as const;

function normalizedSlug(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

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

  let payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (PATCHABLE.has(key)) payload[key] = value;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Aucun champ reconnu.' }, { status: 400 });
  }

  payload.updated_at = new Date().toISOString();

  try {
    const admin = createAdminClient();
    const { data: current, error: readError } = await admin
      .from('blog_articles')
      .select(
        'status, slug_fr, slug_en, slug_es, content_fr, title_fr, description_fr, meta_description_fr, seo_keywords',
      )
      .eq('id', articleId)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 400 });
    }
    if (!current) {
      return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
    }

    if (current.status === 'published') {
      for (const field of SLUG_FIELDS) {
        if (!(field in payload)) continue;
        const incoming = normalizedSlug(payload[field]);
        const existing = normalizedSlug(current[field as keyof typeof current] as string);
        if (incoming !== existing) {
          return NextResponse.json(
            {
              error:
                'Slug verrouillé : cet article est déjà publié. Modifier son slug casserait son URL Google. Modifie le titre ou la meta description, pas le slug.',
            },
            { status: 400 },
          );
        }
        delete payload[field];
      }
    }

    payload = withSpanishInvalidationIfContentFrChanged({
      previousContentFr: current.content_fr,
      previous: {
        title_fr: current.title_fr,
        description_fr: current.description_fr,
        content_fr: current.content_fr,
        meta_description_fr: current.meta_description_fr,
        seo_keywords: current.seo_keywords,
      },
      payload,
    });
    const invalidatedEs = payload.title_es === null && payload.content_es === null;

    const { error } = await admin.from('blog_articles').update(payload).eq('id', articleId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (invalidatedEs) {
      await deleteSpanishTranslationRow(admin, articleId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[admin patch article]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
