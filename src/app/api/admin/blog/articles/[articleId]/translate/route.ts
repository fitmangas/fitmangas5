import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { slugifyBlog } from '@/lib/blog/slugify';
import { translateText } from '@/lib/blog/translate';
import { createAdminClient } from '@/lib/supabase/admin';

async function chunkTranslate(text: string, target: 'en' | 'es'): Promise<string | null> {
  const blocks = text.split(/\n\n+/);
  const parts: string[] = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const t = await translateText(trimmed, target);
    if (!t) return null;
    parts.push(t);
    await new Promise((r) => setTimeout(r, 120));
  }
  return parts.join('\n\n');
}

export async function POST(_request: Request, context: { params: Promise<{ articleId: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { articleId } = await context.params;

  try {
    const admin = createAdminClient();

    const { data: article, error } = await admin.from('blog_articles').select('*').eq('id', articleId).maybeSingle();

    if (error || !article) {
      return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
    }

    const titleEn = await translateText(article.title_fr, 'en');
    const titleEs = await translateText(article.title_fr, 'es');
    const descFr = article.description_fr?.trim() ?? '';
    const descEn = descFr ? await translateText(descFr, 'en') : null;
    const descEs = descFr ? await translateText(descFr, 'es') : null;
    const contentEn = await chunkTranslate(article.content_fr, 'en');
    const contentEs = await chunkTranslate(article.content_fr, 'es');

    if (!titleEn || !titleEs || !contentEn || !contentEs) {
      return NextResponse.json(
        { error: 'Traduction impossible. Vérifie GOOGLE_TRANSLATE_API_KEY ou réessaie.' },
        { status: 503 },
      );
    }

    const slug_en = slugifyBlog(titleEn);
    const slug_es = slugifyBlog(titleEs);

    await admin
      .from('blog_articles')
      .update({
        title_en: titleEn,
        title_es: titleEs,
        description_en: descEn,
        description_es: descEs,
        content_en: contentEn,
        content_es: contentEs,
        slug_en,
        slug_es,
        meta_description_en: descEn?.slice(0, 320) ?? null,
        meta_description_es: descEs?.slice(0, 320) ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId);

    await admin.from('blog_article_translations').upsert(
      [
        {
          article_id: articleId,
          language: 'en',
          title: titleEn,
          description: descEn,
          content: contentEn,
          meta_description: descEn?.slice(0, 320) ?? null,
          slug: slug_en,
          auto_translated: true,
          updated_at: new Date().toISOString(),
        },
        {
          article_id: articleId,
          language: 'es',
          title: titleEs,
          description: descEs,
          content: contentEs,
          meta_description: descEs?.slice(0, 320) ?? null,
          slug: slug_es,
          auto_translated: true,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'article_id,language' },
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[translate]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
