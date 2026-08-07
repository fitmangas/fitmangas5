import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import {
  persistSpanishTranslation,
  translateArticleBodyToSpanish,
} from '@/lib/blog/translate-article-es';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(_request: Request, context: { params: Promise<{ articleId: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { articleId } = await context.params;

  try {
    const admin = createAdminClient();

    const { data: article, error } = await admin
      .from('blog_articles')
      .select('id,title_fr,description_fr,meta_description_fr,content_fr,seo_keywords')
      .eq('id', articleId)
      .maybeSingle();

    if (error || !article) {
      return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
    }

    const translation = await translateArticleBodyToSpanish({
      title_fr: article.title_fr,
      description_fr: article.description_fr,
      meta_description_fr: article.meta_description_fr,
      content_fr: article.content_fr,
    });

    if (!translation.ok) {
      return NextResponse.json(
        { error: translation.error || 'Traduction impossible. Vérifie GEMINI_API_KEY ou réessaie.' },
        { status: 503 },
      );
    }

    const persisted = await persistSpanishTranslation(admin, articleId, translation, {
      title_fr: article.title_fr,
      description_fr: article.description_fr,
      content_fr: article.content_fr,
      meta_description_fr: article.meta_description_fr,
      seo_keywords: article.seo_keywords,
    });
    if (!persisted.ok) {
      return NextResponse.json({ error: persisted.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[translate]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
