/**
 * Enrichit TOUS les articles non publiés (draft / validated) au format 1200–1800.
 * Refuse status=published. Usage :
 *   npx tsx scripts/enrich-unpublished-blog.ts
 *   npx tsx scripts/enrich-unpublished-blog.ts --limit=5
 *   npx tsx scripts/enrich-unpublished-blog.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'));
loadEnvFile(resolve(process.cwd(), '.env'));

function argValue(name: string): string | null {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const limit = Number(argValue('limit') || '0') || 0;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env manquant');

  const { prepareUnpublishedArticleBody } = await import('../src/lib/blog/prepare-unpublished-article');
  const { withSpanishInvalidationIfContentFrChanged, deleteSpanishTranslationRow } = await import(
    '../src/lib/blog/translate-article-es'
  );
  const { countBodyWords, looksLikeFallbackTemplate } = await import('../src/lib/blog/blog-content-guards');

  const sb = createClient(url, key);

  const { data: rows, error } = await sb
    .from('blog_articles')
    .select(
      'id, title_fr, slug_fr, status, scheduled_publication_at, content_fr, description_fr, meta_description_fr, seo_keywords, blog_categories(label_fr)',
    )
    .neq('status', 'published')
    .order('scheduled_publication_at', { ascending: true });

  if (error) throw error;

  const publishedProbe = await sb
    .from('blog_articles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  console.log(`[guard] articles published (ne pas toucher): ${publishedProbe.count ?? '?'}`);

  let list = rows ?? [];
  // Double filet
  list = list.filter((r) => r.status !== 'published');
  if (limit > 0) list = list.slice(0, limit);

  console.log(`[start] ${list.length} non-publiés à traiter (dryRun=${dryRun})`);

  const siblingContents: Array<{ id: string; contentHtml: string }> = [];
  const results: Array<Record<string, unknown>> = [];

  for (let i = 0; i < list.length; i += 1) {
    const row = list[i];
    if (row.status === 'published') {
      console.error(`[SKIP published] ${row.id}`);
      continue;
    }

    const cat = Array.isArray(row.blog_categories) ? row.blog_categories[0] : row.blog_categories;
    const titleLen = (row.title_fr ?? '').length;
    const titleNote =
      titleLen > 59 ? `titre ${titleLen} car. (>60) — conservé, à revoir manuellement` : null;

    console.log(`\n[${i + 1}/${list.length}] ${row.status} · ${row.title_fr}`);

    const currentWords = countBodyWords(row.content_fr ?? '');
    if (
      currentWords >= 1100 &&
      !looksLikeFallbackTemplate(row.content_fr ?? '', row.description_fr)
    ) {
      console.log(`  SKIP déjà enrichi (~${currentWords} mots)`);
      siblingContents.push({ id: row.id, contentHtml: row.content_fr ?? '' });
      results.push({
        id: row.id,
        title: row.title_fr,
        status: row.status,
        ok: true,
        skipped: true,
        wordsBefore: currentWords,
        wordsAfter: currentWords,
      });
      continue;
    }

    const prepared = await prepareUnpublishedArticleBody({
      title: row.title_fr,
      contentHtml: row.content_fr ?? '',
      description: row.description_fr,
      categoryLabel: cat?.label_fr ?? null,
      scheduledIso: row.scheduled_publication_at,
      siblingContents,
      excludeArticleId: row.id,
    });

    if (!prepared.ok) {
      console.error(`  FAIL: ${prepared.detail}`);
      results.push({
        id: row.id,
        title: row.title_fr,
        status: row.status,
        ok: false,
        error: prepared.detail,
        titleNote,
      });
      continue;
    }

    console.log(
      `  OK ${prepared.mode} ${prepared.wordsBefore}→${prepared.wordsAfter} mots · Δ ${(prepared.rewriteRatio * 100).toFixed(0)}% · ${prepared.provider}/${prepared.model}${titleNote ? ` · ${titleNote}` : ''}`,
    );

    if (!dryRun) {
      const previous = {
        title_fr: row.title_fr,
        description_fr: row.description_fr,
        content_fr: row.content_fr,
        meta_description_fr: row.meta_description_fr,
        seo_keywords: row.seo_keywords,
      };
      const payload = withSpanishInvalidationIfContentFrChanged({
        previous,
        payload: {
          content_fr: prepared.contentHtml,
          ...(prepared.description
            ? { description_fr: prepared.description }
            : {}),
          ...(prepared.metaDescription
            ? { meta_description_fr: prepared.metaDescription }
            : {}),
          ...(prepared.seoKeywords != null
            ? { seo_keywords: prepared.seoKeywords }
            : {}),
          updated_at: new Date().toISOString(),
        },
      });

      // Jamais changer le status ni republier
      const { error: upErr } = await sb
        .from('blog_articles')
        .update(payload)
        .eq('id', row.id)
        .neq('status', 'published');

      if (upErr) {
        console.error(`  DB FAIL: ${upErr.message}`);
        results.push({ id: row.id, title: row.title_fr, ok: false, error: upErr.message });
        continue;
      }

      if (payload.title_es === null && payload.content_es === null) {
        await deleteSpanishTranslationRow(sb, row.id);
      }
    }

    siblingContents.push({ id: row.id, contentHtml: prepared.contentHtml });
    results.push({
      id: row.id,
      title: row.title_fr,
      slug: row.slug_fr,
      status: row.status,
      scheduled: row.scheduled_publication_at,
      ok: true,
      mode: prepared.mode,
      wordsBefore: prepared.wordsBefore,
      wordsAfter: prepared.wordsAfter,
      rewriteRatio: prepared.rewriteRatio,
      titleNote,
      sample: prepared.contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220),
    });
  }

  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  console.log(`\n[done] ok=${ok} fail=${fail}`);

  // Vérif : aucun published modifié (hash count words snapshot would need before; check status still)
  const { data: stillPub } = await sb
    .from('blog_articles')
    .select('id')
    .eq('status', 'published');
  console.log(`[guard] published count after: ${stillPub?.length ?? 0}`);

  // Exemples
  const examples = results.filter((r) => r.ok).slice(0, 3);
  console.log('\n=== EXAMPLES ===');
  for (const ex of examples) {
    console.log(JSON.stringify(ex, null, 2));
  }

  // Write report
  const reportPath = resolve(process.cwd(), 'data/blog-enrich-unpublished-report.json');
  const { writeFileSync, mkdirSync } = await import('fs');
  mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });
  writeFileSync(reportPath, JSON.stringify({ at: new Date().toISOString(), dryRun, results }, null, 2));
  console.log(`Report: ${reportPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
