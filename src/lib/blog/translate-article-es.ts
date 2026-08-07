/**
 * Traduction ES fidèle d’un article blog à partir du FR validé.
 * Pas une re-génération éditoriale : même structure, même sens, CTA en espagnol.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  ensureValidatedBlogCtaEs,
  sanitizeBlogContentHtml,
  stripHtmlToText,
} from '@/lib/blog/blog-content-guards';
import { enforceBlogSeoMeta, enforceBlogSeoTitle } from '@/lib/blog/blog-seo-limits';
import { slugifyBlog } from '@/lib/blog/slugify';
import { translateText } from '@/lib/blog/translate';
import {
  clearEsSyncHash,
  computeFrenchSourceHash,
  hasCompleteSpanishTranslation,
  withEsSyncHash,
} from '@/lib/blog/translation-status';

function cleanTranslatedTitle(raw: string): string {
  return enforceBlogSeoTitle(
    stripHtmlToText(raw)
      .replace(/^["'«»]+|["'«»]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

export type SpanishTranslationFields = {
  title_es: string | null;
  description_es: string | null;
  content_es: string | null;
  meta_description_es: string | null;
  slug_es: string | null;
};

/** Champs à nullifier quand le texte FR change (trad ES périmée). */
export function spanishInvalidationPayload(): SpanishTranslationFields & {
  updated_at?: string;
  seo_keywords?: string | null;
} {
  return {
    title_es: null,
    description_es: null,
    content_es: null,
    meta_description_es: null,
    slug_es: null,
  };
}

const FR_TEXT_FIELDS = ['content_fr', 'title_fr', 'description_fr', 'meta_description_fr'] as const;

function frFieldChanged(
  field: (typeof FR_TEXT_FIELDS)[number],
  payload: Record<string, unknown>,
  previous: Record<string, string | null | undefined>,
  nextOverride?: unknown,
): boolean {
  if (!(field in payload) && nextOverride === undefined) return false;
  const next =
    typeof nextOverride === 'string'
      ? nextOverride
      : typeof payload[field] === 'string'
        ? (payload[field] as string)
        : null;
  if (next === null) return false;
  const prev = (previous[field] ?? '').trim();
  return next.trim() !== prev;
}

/**
 * Si titre / chapo / corps / meta FR change, invalide la trad ES
 * (badge « ES manquante » jusqu’à re-traduction).
 */
export function withSpanishInvalidationIfContentFrChanged(params: {
  nextContentFr?: unknown;
  previousContentFr?: string | null;
  /** Ancien article (pour title/description/meta). */
  previous?: {
    title_fr?: string | null;
    description_fr?: string | null;
    content_fr?: string | null;
    meta_description_fr?: string | null;
    seo_keywords?: string | null;
  };
  payload: Record<string, unknown>;
}): Record<string, unknown> {
  const prev = {
    title_fr: params.previous?.title_fr,
    description_fr: params.previous?.description_fr,
    content_fr: params.previousContentFr ?? params.previous?.content_fr,
    meta_description_fr: params.previous?.meta_description_fr,
  };

  const changed =
    frFieldChanged('content_fr', params.payload, prev, params.nextContentFr) ||
    frFieldChanged('title_fr', params.payload, prev) ||
    frFieldChanged('description_fr', params.payload, prev) ||
    frFieldChanged('meta_description_fr', params.payload, prev);

  if (!changed) return params.payload;

  return {
    ...params.payload,
    ...spanishInvalidationPayload(),
    seo_keywords: clearEsSyncHash(
      typeof params.payload.seo_keywords === 'string'
        ? params.payload.seo_keywords
        : params.previous?.seo_keywords,
    ),
  };
}

async function chunkTranslateHtml(html: string): Promise<string | null> {
  const blocks = html.split(/\n\n+/);
  const parts: string[] = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const translated = await translateText(trimmed, 'es');
    if (!translated) return null;
    parts.push(translated);
    await new Promise((r) => setTimeout(r, 150));
  }
  return parts.join('\n\n');
}

export type TranslateArticleEsResult =
  | {
      ok: true;
      title_es: string;
      description_es: string | null;
      meta_description_es: string | null;
      content_es: string;
      slug_es: string;
    }
  | { ok: false; error: string };

/**
 * Traduit titre / chapo / meta / corps FR → ES (fidèle), CTA ES forcé, seuils SEO.
 */
export async function translateArticleBodyToSpanish(params: {
  title_fr: string;
  description_fr?: string | null;
  meta_description_fr?: string | null;
  content_fr: string;
}): Promise<TranslateArticleEsResult> {
  const titleFr = params.title_fr?.trim() ?? '';
  const contentFr = params.content_fr?.trim() ?? '';
  if (!titleFr || !contentFr) {
    return { ok: false, error: 'Titre ou corps FR manquant.' };
  }

  const titleEsRaw = await translateText(titleFr, 'es');
  if (!titleEsRaw) return { ok: false, error: 'Échec traduction titre ES.' };
  let title_es = cleanTranslatedTitle(titleEsRaw);
  // Si le modèle a renvoyé du FR / du HTML parasite, re-tente une fois
  if (!title_es || /respiration|élément fondamental|méthode pilates/i.test(title_es) || /<[^>]+>/.test(titleEsRaw)) {
    const retry = await translateText(
      `Traduis UNIQUEMENT ce titre (une ligne, sans HTML, sans guillemets):\n${titleFr}`,
      'es',
    );
    if (retry) title_es = cleanTranslatedTitle(retry);
  }
  if (!title_es || title_es.length < 20) {
    return { ok: false, error: 'Titre ES invalide après nettoyage.' };
  }

  const descFr = params.description_fr?.trim() ?? '';
  const metaFr = params.meta_description_fr?.trim() || descFr;
  const description_es = descFr
    ? enforceBlogSeoMeta((await translateText(descFr, 'es')) ?? '')
    : null;
  if (descFr && !description_es) {
    return { ok: false, error: 'Échec traduction description ES.' };
  }

  let meta_description_es: string | null = null;
  if (metaFr) {
    // Évite un 2e appel si meta = description
    if (metaFr === descFr && description_es) {
      meta_description_es = description_es;
    } else {
      const metaRaw = await translateText(metaFr, 'es');
      if (!metaRaw) return { ok: false, error: 'Échec traduction meta ES.' };
      meta_description_es = enforceBlogSeoMeta(metaRaw);
    }
  }

  const contentRaw = await chunkTranslateHtml(contentFr);
  if (!contentRaw) return { ok: false, error: 'Échec traduction corps ES.' };

  let content_es = ensureValidatedBlogCtaEs(sanitizeBlogContentHtml(contentRaw));
  // Sécurité : aucun CTA FR résiduel
  if (/Si cet article t['’]aide/i.test(content_es)) {
    content_es = ensureValidatedBlogCtaEs(content_es.replace(/<p>\s*Si cet article t['’]aide[\s\S]*?<\/p>/gi, ''));
  }

  if (!hasCompleteSpanishTranslation({ title_es, content_es })) {
    return { ok: false, error: 'Traduction ES incomplète après parse.' };
  }

  return {
    ok: true,
    title_es,
    description_es: description_es || null,
    meta_description_es: meta_description_es || null,
    content_es,
    slug_es: slugifyBlog(title_es),
  };
}

export async function persistSpanishTranslation(
  admin: SupabaseClient,
  articleId: string,
  translation: Extract<TranslateArticleEsResult, { ok: true }>,
  frSource?: {
    title_fr?: string | null;
    description_fr?: string | null;
    content_fr?: string | null;
    meta_description_fr?: string | null;
    seo_keywords?: string | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const hash = frSource
    ? computeFrenchSourceHash(frSource)
    : computeFrenchSourceHash({
        title_fr: translation.title_es,
        description_fr: translation.description_es,
        content_fr: translation.content_es,
        meta_description_fr: translation.meta_description_es,
      });
  const seo_keywords = withEsSyncHash(frSource?.seo_keywords, hash);

  const { error } = await admin
    .from('blog_articles')
    .update({
      title_es: translation.title_es,
      description_es: translation.description_es,
      content_es: translation.content_es,
      meta_description_es: translation.meta_description_es,
      slug_es: translation.slug_es,
      seo_keywords,
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId);

  if (error) return { ok: false, error: error.message };

  await admin.from('blog_article_translations').upsert(
    {
      article_id: articleId,
      language: 'es',
      title: translation.title_es,
      description: translation.description_es,
      content: translation.content_es,
      meta_description: translation.meta_description_es,
      slug: translation.slug_es,
      auto_translated: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'article_id,language' },
  );

  return { ok: true };
}

/** Supprime la ligne satellite ES (après invalidation des colonnes *_es). */
export async function deleteSpanishTranslationRow(
  admin: SupabaseClient,
  articleId: string,
): Promise<void> {
  const { error } = await admin
    .from('blog_article_translations')
    .delete()
    .eq('article_id', articleId)
    .eq('language', 'es');
  if (error) {
    console.error('[translate-article-es] delete ES translation row', error.message);
  }
}
