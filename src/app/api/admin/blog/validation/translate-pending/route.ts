import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import {
  persistSpanishTranslation,
  translateArticleBodyToSpanish,
} from '@/lib/blog/translate-article-es';
import { hasCompleteSpanishTranslation } from '@/lib/blog/translation-status';
import { createAdminClient } from '@/lib/supabase/admin';

/** Plusieurs articles × chunks Gemini. */
export const maxDuration = 300;

/**
 * Traduit en ES tous les articles pending d’un mois de validation encore incomplets.
 * Body JSON optionnel : { monthYear?: "2026-09", limit?: number }
 */
export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      monthYear?: string;
      limit?: number;
    };
    const limit = Math.max(1, Math.min(20, Number(body.limit ?? 12) || 12));
    const admin = createAdminClient();

    let validationsQuery = admin
      .from('admin_article_validations')
      .select('article_id, month_year')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (body.monthYear?.trim()) {
      validationsQuery = validationsQuery.eq('month_year', body.monthYear.trim());
    }

    const { data: validations, error: vErr } = await validationsQuery.limit(80);
    if (vErr) {
      return NextResponse.json({ error: vErr.message }, { status: 400 });
    }

    const articleIds = [...new Set((validations ?? []).map((v) => String(v.article_id)))];
    if (!articleIds.length) {
      return NextResponse.json({ ok: true, translated: 0, failed: 0, skipped: 0, message: 'Aucun pending.' });
    }

    const { data: articles, error: aErr } = await admin
      .from('blog_articles')
      .select(
        'id,title_fr,description_fr,meta_description_fr,content_fr,title_es,description_es,meta_description_es,content_es,seo_keywords',
      )
      .in('id', articleIds);

    if (aErr) {
      return NextResponse.json({ error: aErr.message }, { status: 400 });
    }

    const targets = (articles ?? [])
      .filter(
        (a) =>
          !hasCompleteSpanishTranslation({
            title_es: a.title_es,
            content_es: a.content_es,
            description_es: a.description_es,
            meta_description_es: a.meta_description_es,
            title_fr: a.title_fr,
            description_fr: a.description_fr,
            content_fr: a.content_fr,
            meta_description_fr: a.meta_description_fr,
            seo_keywords: a.seo_keywords,
          }),
      )
      .slice(0, limit);

    let translated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const article of targets) {
      const translation = await translateArticleBodyToSpanish({
        title_fr: article.title_fr,
        description_fr: article.description_fr,
        meta_description_fr: article.meta_description_fr,
        content_fr: article.content_fr,
      });
      if (!translation.ok) {
        failed += 1;
        errors.push(`${article.title_fr?.slice(0, 40)}… : ${translation.error}`);
        continue;
      }
      const persisted = await persistSpanishTranslation(admin, article.id, translation, {
        title_fr: article.title_fr,
        description_fr: article.description_fr,
        content_fr: article.content_fr,
        meta_description_fr: article.meta_description_fr,
        seo_keywords: article.seo_keywords,
      });
      if (!persisted.ok) {
        failed += 1;
        errors.push(`${article.title_fr?.slice(0, 40)}… : ${persisted.error}`);
        continue;
      }
      translated += 1;
    }

    return NextResponse.json({
      ok: failed === 0,
      translated,
      failed,
      targeted: targets.length,
      errors: errors.slice(0, 8),
      message:
        translated > 0
          ? `${translated} article(s) traduits en ES.${failed ? ` ${failed} échec(s).` : ''} Relance le bouton s’il en reste.`
          : failed
            ? `Aucun traduit — ${failed} échec(s).`
            : 'Tous les pending ciblés ont déjà une ES complète.',
    });
  } catch (e) {
    console.error('[translate-pending]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
