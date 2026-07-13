/**
 * Réécrit les titres génériques "Article pilates N — mouvement & souffle"
 * à partir du contenu réel de chaque article PUBLIÉ (FR + ES).
 *
 * Ne modifie QUE title_fr et title_es. Les slugs/URLs restent inchangés.
 *
 * Usage:
 * - npm run blog:rewrite:titles              (simulation, défaut)
 * - npm run blog:rewrite:titles -- --apply    (écriture en base)
 * - npm run blog:rewrite:titles -- --limit=5 (test partiel)
 */

import './load-env-local';

import { createClient } from '@supabase/supabase-js';

import { isGenericPilatesTitle, tryGenerateBlogTitlesFromContent } from '../src/lib/blog/blog-title-generator';

const APPLY = process.argv.includes('--apply');
const DELAY_MS = 13_000;

function parseLimit(): number | null {
  const arg = process.argv.find((a) => a.startsWith('--limit='));
  if (!arg) return null;
  const n = Number(arg.slice('--limit='.length));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ArticleRow = {
  id: string;
  title_fr: string;
  title_es: string | null;
  content_fr: string | null;
  content_es: string | null;
  description_fr: string | null;
  description_es: string | null;
  slug_fr: string;
  status: string;
  blog_categories: { slug: string } | { slug: string }[] | null;
};

type Proposal = {
  id: string;
  slug_fr: string;
  status: string;
  old_fr: string;
  old_es: string | null;
  new_fr: string;
  new_es: string;
  changed: boolean;
  skipReason: string | null;
};

function categorySlugFromRow(row: ArticleRow): string {
  const cat = row.blog_categories;
  if (Array.isArray(cat)) return cat[0]?.slug ?? 'technique';
  return cat?.slug ?? 'technique';
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.');
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    console.warn('Aucune clé IA détectée — aucun titre ne pourra être généré (anciens titres conservés).');
  }

  const limit = parseLimit();
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: rows, error } = await admin
    .from('blog_articles')
    .select(
      'id,title_fr,title_es,content_fr,content_es,description_fr,description_es,slug_fr,status,blog_categories(slug)',
    )
    .eq('status', 'published')
    .order('published_at', { ascending: true });

  if (error) {
    console.error('Lecture des articles échouée:', error.message);
    process.exit(1);
  }

  const publishedGeneric = (rows ?? []).filter((row) => isGenericPilatesTitle(row.title_fr));
  let targets = publishedGeneric;
  if (limit != null) targets = targets.slice(0, limit);

  console.log(`Mode: ${APPLY ? 'APPLICATION EN BASE' : 'SIMULATION (dry-run)'}`);
  console.log(`Articles publiés total: ${rows?.length ?? 0}`);
  console.log(`Articles publiés avec titre générique: ${publishedGeneric.length}`);
  console.log(`Articles à traiter dans cette exécution: ${targets.length}\n`);

  if (targets.length === 0) {
    console.log('Aucun article publié avec titre générique à traiter.');
    return;
  }

  const proposals: Proposal[] = [];
  const untreated: Array<{ slug_fr: string; reason: string }> = [];

  for (let i = 0; i < targets.length; i += 1) {
    const row = targets[i] as ArticleRow;
    const contentFr = row.content_fr?.trim() ?? '';

    if (contentFr.length < 80) {
      const reason = 'contenu FR trop court';
      untreated.push({ slug_fr: row.slug_fr, reason });
      proposals.push({
        id: row.id,
        slug_fr: row.slug_fr,
        status: row.status,
        old_fr: row.title_fr,
        old_es: row.title_es,
        new_fr: row.title_fr,
        new_es: row.title_es ?? row.title_fr,
        changed: false,
        skipReason: reason,
      });
      continue;
    }

    const categorySlug = categorySlugFromRow(row);
    const titles = await tryGenerateBlogTitlesFromContent({
      contentHtmlFr: contentFr,
      descriptionFr: row.description_fr ?? undefined,
      categorySlug,
      contentHtmlEs: row.content_es,
      descriptionEs: row.description_es ?? undefined,
    });

    if (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
      await sleep(DELAY_MS);
    }

    if (!titles) {
      const reason = 'IA indisponible ou réponse invalide — ancien titre conservé';
      untreated.push({ slug_fr: row.slug_fr, reason });
      proposals.push({
        id: row.id,
        slug_fr: row.slug_fr,
        status: row.status,
        old_fr: row.title_fr,
        old_es: row.title_es,
        new_fr: row.title_fr,
        new_es: row.title_es ?? row.title_fr,
        changed: false,
        skipReason: reason,
      });
      continue;
    }

    proposals.push({
      id: row.id,
      slug_fr: row.slug_fr,
      status: row.status,
      old_fr: row.title_fr,
      old_es: row.title_es,
      new_fr: titles.title_fr,
      new_es: titles.title_es,
      changed: true,
      skipReason: null,
    });
  }

  const changedCount = proposals.filter((p) => p.changed).length;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('PROPOSITIONS DE TITRES — ARTICLES PUBLIÉS UNIQUEMENT');
  console.log('(aucune écriture tant que --apply absent)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const [index, p] of proposals.entries()) {
    const tag = p.changed ? 'NOUVEAU' : 'INCHANGÉ';
    console.log(`[${index + 1}/${proposals.length}] ${tag} — slug: ${p.slug_fr}`);
    console.log(`  FR ancien : ${p.old_fr}`);
    console.log(`  FR nouveau: ${p.new_fr}`);
    console.log(`  ES ancien : ${p.old_es ?? '(vide)'}`);
    console.log(`  ES nouveau: ${p.new_es}`);
    if (p.skipReason) console.log(`  ⚠️  ${p.skipReason}`);
    console.log('');
  }

  if (untreated.length > 0) {
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`ARTICLES NON TRAITÉS (${untreated.length}) — titres conservés tels quels:`);
    for (const item of untreated) {
      console.log(`  • ${item.slug_fr} — ${item.reason}`);
    }
    console.log('');
  }

  if (!APPLY) {
    console.log(
      `\n🧪 Simulation terminée: ${changedCount} titre(s) proposé(s), ${untreated.length} inchangé(s), 0 écriture en base.`,
    );
    console.log('Pour appliquer après validation: npm run blog:rewrite:titles -- --apply');
    return;
  }

  let updated = 0;
  for (const p of proposals) {
    if (!p.changed) continue;

    const { error: updateError } = await admin
      .from('blog_articles')
      .update({ title_fr: p.new_fr, title_es: p.new_es })
      .eq('id', p.id);

    if (updateError) {
      console.error(`❌ ${p.slug_fr}: ${updateError.message}`);
      continue;
    }
    updated += 1;
    console.log(`✅ ${p.slug_fr} — titres mis à jour`);
  }

  console.log(`\n🎉 ${updated} article(s) publié(s) mis à jour (titres FR + ES uniquement).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
