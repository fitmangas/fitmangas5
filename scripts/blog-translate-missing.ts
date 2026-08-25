/**
 * Traduit en ES tous les articles published/validated incomplets
 * (title/content/description/meta), via translateArticleBodyToSpanish.
 *
 * Usage:
 *   npm run blog:translate:missing
 *   npm run blog:translate:missing -- --limit=5
 *   npm run blog:translate:missing -- --dry-run
 */
import './load-env-local';

import { createClient } from '@supabase/supabase-js';

import {
  persistSpanishTranslation,
  translateArticleBodyToSpanish,
} from '../src/lib/blog/translate-article-es';
import { hasCompleteSpanishTranslation } from '../src/lib/blog/translation-status';

function arg(name: string): string | null {
  const raw = process.argv.find((a) => a.startsWith(`${name}=`));
  return raw ? raw.slice(name.length + 1) : null;
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.');
  if (!process.env.GEMINI_API_KEY?.trim()) throw new Error('GEMINI_API_KEY manquante.');

  const limit = Math.max(1, Number(arg('--limit') ?? '100') || 100);
  const dryRun = hasFlag('--dry-run');
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: rows, error } = await admin
    .from('blog_articles')
    .select(
      'id,status,title_fr,description_fr,meta_description_fr,content_fr,title_es,description_es,meta_description_es,content_es,seo_keywords,published_at,scheduled_publication_at',
    )
    .in('status', ['published', 'validated'])
    .order('published_at', { ascending: false });

  if (error) throw new Error(error.message);

  const targets = (rows ?? [])
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

  console.log(`Articles ES incomplets: ${targets.length} (dryRun=${dryRun}, limit=${limit}).`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const article = targets[i]!;
    const label = `[${i + 1}/${targets.length}] ${article.status} · ${article.title_fr?.slice(0, 60)}`;
    console.log(`→ ${label}`);

    if (dryRun) {
      console.log('  (dry-run) skip');
      continue;
    }

    const translation = await translateArticleBodyToSpanish({
      title_fr: article.title_fr,
      description_fr: article.description_fr,
      meta_description_fr: article.meta_description_fr,
      content_fr: article.content_fr,
    });

    if (!translation.ok) {
      fail += 1;
      console.warn(`  ✗ ${translation.error}`);
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
      fail += 1;
      console.warn(`  ✗ persist: ${persisted.error}`);
      continue;
    }

    ok += 1;
    console.log(`  ✓ ES OK (${translation.title_es.slice(0, 50)}…)`);
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`Terminé: ${ok} OK, ${fail} échecs, ${targets.length} ciblés.`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
