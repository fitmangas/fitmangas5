/**
 * Seed 104 articles + validations mensuelles (8 / mois).
 * Les variables sont lues depuis `.env.local` à la racine (voir `scripts/load-env-local.ts`).
 *
 * Usage : npm run seed:blog
 * Prérequis : .env.local avec SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL
 */

import './load-env-local';

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

import { slugifyBlog } from '../src/lib/blog/slugify';

function monthYearFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

type ParsedArticle = {
  title: string;
  date: Date;
  categorySlug: string;
  description: string;
  content: string;
};

function parsePlanningFile(raw: string): ParsedArticle[] {
  const chunks = raw.split(/^##\s+/m).filter(Boolean);
  const out: ParsedArticle[] = [];

  for (const chunk of chunks) {
    const titre = /^Titre:\s*(.+)$/im.exec(chunk)?.[1]?.trim();
    const dateStr = /^Date:\s*(\d{4}-\d{2}-\d{2})$/im.exec(chunk)?.[1]?.trim();
    const cat = /^Catégorie:\s*(.+)$/im.exec(chunk)?.[1]?.trim().toLowerCase() ?? 'technique';
    const desc = /^Description:\s*(.+)$/im.exec(chunk)?.[1]?.trim() ?? '';
    const contMatch = chunk.split(/^Contenu:\s*/im)[1];
    const content = contMatch?.trim() ?? '';

    if (!titre || !dateStr) continue;

    const date = new Date(`${dateStr}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) continue;

    out.push({
      title: titre,
      date,
      categorySlug: cat.replace(/\s+/g, '-'),
      description: desc || `Article pilates — ${titre}`,
      content: content || `Contenu à enrichir pour : ${titre}`,
    });
  }

  return out;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.');
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: coach } = await admin.from('profiles').select('id').eq('role', 'admin').limit(1).maybeSingle();
  if (!coach?.id) {
    console.error('Aucun profil admin trouvé.');
    process.exit(1);
  }

  const planningPath = resolve(process.cwd(), 'data/PLANNING_EDITORIAL_104_ARTICLES.md');
  let parsed: ParsedArticle[] = [];
  if (existsSync(planningPath)) {
    parsed = parsePlanningFile(readFileSync(planningPath, 'utf8'));
    console.log(`Parsé ${parsed.length} article(s) depuis planning.`);
  }

  const baseDate = new Date();
  while (parsed.length < 104) {
    const i = parsed.length + 1;
    const d = addMonths(baseDate, Math.floor((i - 1) / 8));
    parsed.push({
      title: `Article pilates ${i} — mouvement & souffle`,
      date: d,
      categorySlug: ['technique', 'respiration', 'posture', 'renforcement', 'bien-etre', 'nutrition'][i % 6],
      description: `Description courte pour l’article ${i}.`,
      content: `Paragraphe intro article ${i}.\n\nParagraphe développement : respiration, alignement, régularité.`,
    });
  }

  parsed = parsed.slice(0, 104);

  const { data: categories } = await admin.from('blog_categories').select('id, slug');
  const catMap = new Map((categories ?? []).map((c) => [c.slug, c.id]));

  const articleIds: string[] = [];

  for (let idx = 0; idx < parsed.length; idx++) {
    const p = parsed[idx];
    let catId: string | null = catMap.get(p.categorySlug) ?? null;
    if (!catId) {
      const slug = p.categorySlug.replace(/[^a-z0-9-]/g, '') || 'general';
      const { data: existing } = await admin.from('blog_categories').select('id').eq('slug', slug).maybeSingle();
      if (existing?.id) {
        catId = existing.id;
        catMap.set(p.categorySlug, catId);
      } else {
        const ins = await admin
          .from('blog_categories')
          .insert({
            slug,
            label_fr: p.categorySlug,
            label_en: p.categorySlug,
            label_es: p.categorySlug,
            sort_order: 99,
          })
          .select('id')
          .maybeSingle();
        if (ins.data?.id) {
          catId = ins.data.id;
          catMap.set(p.categorySlug, catId);
        }
      }
    }

    const slug_fr = `${slugifyBlog(p.title)}-${idx + 1}`;
    const insert = await admin
      .from('blog_articles')
      .insert({
        coach_id: coach.id,
        title_fr: p.title,
        slug_fr,
        description_fr: p.description,
        content_fr: p.content,
        category_id: catId,
        scheduled_publication_at: p.date.toISOString(),
        status: 'draft',
        meta_description_fr: p.description.slice(0, 320),
      })
      .select('id')
      .maybeSingle();

    if (insert.error) {
      console.error('Insert article', idx + 1, insert.error.message);
      continue;
    }
    if (insert.data?.id) articleIds.push(insert.data.id);
  }

  console.log(`Inséré ${articleIds.length} articles.`);

  const batchMonth = (index: number) => monthYearFromDate(addMonths(new Date(), Math.floor(index / 8)));

  for (let i = 0; i < articleIds.length; i++) {
    const articleId = articleIds[i];
    const my = batchMonth(i);
    await admin.from('admin_article_validations').upsert(
      {
        article_id: articleId,
        coach_id: coach.id,
        month_year: my,
        status: 'pending',
      },
      { onConflict: 'article_id,month_year' },
    );
  }

  console.log('Validations mensuelles créées / mises à jour (8 articles par mois glissant).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
