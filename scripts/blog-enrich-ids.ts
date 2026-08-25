/**
 * Enrichit des articles publiés ciblés (MàJ progressive CLI).
 * Usage: npx tsx scripts/blog-enrich-ids.ts --ids=ff1aff03,2b613e2a,4b807e55
 */
import './load-env-local';

import { createClient } from '@supabase/supabase-js';

import { enrichArticleBodyHtml } from '../src/lib/blog/enrich-article';
import {
  deleteSpanishTranslationRow,
  withSpanishInvalidationIfContentFrChanged,
} from '../src/lib/blog/translate-article-es';

function arg(name: string): string | null {
  const raw = process.argv.find((a) => a.startsWith(`${name}=`));
  return raw ? raw.slice(name.length + 1) : null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env manquantes.');

  const prefixes = (arg('--ids') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!prefixes.length) throw new Error('Passe --ids=uuid1,uuid2…');

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: rows, error } = await admin
    .from('blog_articles')
    .select('id,title_fr,description_fr,content_fr,meta_description_fr,seo_keywords,slug_fr,status');

  if (error) throw new Error(error.message);
  const articles = (rows ?? []).filter(
    (row) =>
      (row.status === 'published' || row.status === 'validated') &&
      prefixes.some((p) => row.id === p || row.id.startsWith(p)),
  );
  console.log(`Articles trouvés: ${articles.length}`);

  for (const article of articles) {
    console.log(`→ ${article.title_fr}`);
    const enrich = await enrichArticleBodyHtml({
      title: article.title_fr,
      contentHtml: article.content_fr ?? '',
      description: article.description_fr,
    });
    if (!enrich.ok) {
      console.warn(`  ✗ ${enrich.detail}`);
      continue;
    }

    const payload = withSpanishInvalidationIfContentFrChanged({
      previous: {
        title_fr: article.title_fr,
        description_fr: article.description_fr,
        content_fr: article.content_fr,
        meta_description_fr: article.meta_description_fr,
        seo_keywords: article.seo_keywords,
      },
      payload: {
        content_fr: enrich.contentHtml,
        updated_at: new Date().toISOString(),
      },
    });

    const { error: updateErr } = await admin.from('blog_articles').update(payload).eq('id', article.id);
    if (updateErr) {
      console.warn(`  ✗ persist: ${updateErr.message}`);
      continue;
    }
    if (payload.title_es === null) await deleteSpanishTranslationRow(admin, article.id);
    console.log(
      `  ✓ ${enrich.wordsBefore} → ${enrich.wordsAfter} mots (${enrich.provider}/${enrich.model}, rewrite ${(enrich.rewriteRatio * 100).toFixed(0)}%)`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
