/**
 * Seed complet blog: contenu IA + images Unsplash + validations mensuelles.
 *
 * Les variables sont lues depuis `.env.local` à la racine (voir `scripts/load-env-local.ts`).
 *
 * Usage:
 * - npm run seed:blog:complete
 * - npm run seed:blog:complete -- --limit=5
 */

import './load-env-local';

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

import { fetchUnsplashImage } from '../src/lib/blog/blog-image-fetcher';
import { generateFrenchArticle } from '../src/lib/blog/blog-content-generator';
import { slugifyBlog } from '../src/lib/blog/slugify';

type ParsedArticle = {
  index: number;
  title: string;
  date: Date;
  categorySlug: string;
  description: string;
};

function parseArgLimit(): number | null {
  const arg = process.argv.find((a) => a.startsWith('--limit='));
  if (!arg) return null;
  const n = Number(arg.slice('--limit='.length));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function parsePlanningFile(raw: string): ParsedArticle[] {
  const chunks = raw.split(/^##\s+/m).filter(Boolean);
  const out: ParsedArticle[] = [];

  for (const chunk of chunks) {
    const idx = Number(/^(\d+)/.exec(chunk)?.[1] ?? '0');
    const title = /^Titre:\s*(.+)$/im.exec(chunk)?.[1]?.trim() ?? '';
    const dateStr = /^Date:\s*(\d{4}-\d{2}-\d{2})$/im.exec(chunk)?.[1]?.trim() ?? '';
    const categoryRaw = /^Catégorie:\s*(.+)$/im.exec(chunk)?.[1]?.trim().toLowerCase() ?? 'technique';
    const description = /^Description:\s*(.+)$/im.exec(chunk)?.[1]?.trim() ?? '';

    if (!title || !dateStr) continue;
    const date = new Date(`${dateStr}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) continue;

    out.push({
      index: idx > 0 ? idx : out.length + 1,
      title,
      date,
      categorySlug: categoryRaw.replace(/\s+/g, '-'),
      description,
    });
  }
  return out;
}

function fallbackCategoryForIndex(index: number): string {
  return ['technique', 'respiration', 'posture', 'renforcement', 'bien-etre', 'nutrition'][index % 6] ?? 'technique';
}

function fillTo104(seed: ParsedArticle[]): ParsedArticle[] {
  const out = [...seed];
  const base = new Date();
  while (out.length < 104) {
    const i = out.length + 1;
    const d = new Date(base);
    d.setDate(d.getDate() + i * 3);
    out.push({
      index: i,
      title: `Article pilates ${i} — mouvement & souffle`,
      date: d,
      categorySlug: fallbackCategoryForIndex(i),
      description: `Conseils pilates pratiques pour l’article ${i}.`,
    });
  }
  return out.slice(0, 104);
}

function monthYearFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function looksLikeFallbackContent(contentHtml: string, description: string): boolean {
  const markers = [
    'Pourquoi ce sujet change ta pratique',
    "3 actions simples à appliquer cette semaine",
    'mini-story réaliste',
    'Un guide concret pour progresser en pilates autour de',
  ];
  return markers.some((m) => contentHtml.includes(m) || description.includes(m));
}

async function ensureCategoryId(
  admin: ReturnType<typeof createClient>,
  slug: string,
  cache: Map<string, string>,
): Promise<string | null> {
  const normalized = slug.replace(/[^a-z0-9-]/g, '') || 'general';
  const cached = cache.get(normalized);
  if (cached) return cached;

  const { data: existing } = await admin.from('blog_categories').select('id').eq('slug', normalized).maybeSingle();
  if (existing?.id) {
    cache.set(normalized, existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await admin
    .from('blog_categories')
    .insert({
      slug: normalized,
      label_fr: normalized,
      label_en: normalized,
      label_es: normalized,
      sort_order: 99,
    })
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('[ensureCategoryId]', normalized, error.message);
    return null;
  }
  if (!inserted?.id) return null;
  cache.set(normalized, inserted.id);
  return inserted.id;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.');
    process.exit(1);
  }

  const limit = parseArgLimit();
  const refreshExisting = hasFlag('--refresh-existing');
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
  }
  parsed = fillTo104(parsed);
  if (limit != null) parsed = parsed.slice(0, limit);

  console.log(`Seed complet: ${parsed.length} article(s) à traiter.`);
  if (refreshExisting) {
    console.log('Mode refresh activé: les articles déjà présents peuvent être enrichis (Gemini/Unsplash).');
  }
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
    console.warn('Aucune clé Gemini détectée -> génération fallback locale utilisée.');
  } else if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY absent -> pas de repli OpenAI si Gemini échoue (fallback local).');
  }
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    console.warn('UNSPLASH_ACCESS_KEY absent -> images non assignées.');
  }

  const { data: categories } = await admin.from('blog_categories').select('id, slug');
  const categoryCache = new Map<string, string>((categories ?? []).map((c) => [c.slug, c.id]));

  const seededArticles: Array<{ articleId: string; date: Date; index: number; title: string; reused: boolean }> = [];
  let refreshedCount = 0;
  let skippedExistingCount = 0;

  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    const slugBase = slugifyBlog(p.title);
    const slugFr = `${slugBase}-${String(p.index).padStart(3, '0')}`;

    const { data: existingBySlug, error: existingError } = await admin
      .from('blog_articles')
      .select('id, content_fr, description_fr, featured_image_url')
      .eq('slug_fr', slugFr)
      .maybeSingle();
    if (existingError) {
      console.error(`Check slug article ${p.index} échoué:`, existingError.message);
      continue;
    }

    if (existingBySlug?.id && !refreshExisting) {
      seededArticles.push({
        articleId: existingBySlug.id,
        date: p.date,
        index: p.index,
        title: p.title,
        reused: true,
      });
      skippedExistingCount += 1;
      console.log(`↪️ ${p.index}/${parsed.length} ${p.title} (déjà présent, slug ${slugFr})`);
      continue;
    }

    const categoryId = await ensureCategoryId(admin, p.categorySlug, categoryCache);
    if (!categoryId) {
      console.error(`Article ${p.index}: catégorie invalide (${p.categorySlug})`);
      continue;
    }

    const generated = await generateFrenchArticle({
      title: p.title,
      category: p.categorySlug,
      publishDateIso: p.date.toISOString(),
    });

    const img = await fetchUnsplashImage({
      title: p.title,
      categorySlug: p.categorySlug,
    });

    if (existingBySlug?.id) {
      const shouldRefreshText = looksLikeFallbackContent(
        existingBySlug.content_fr ?? '',
        existingBySlug.description_fr ?? '',
      );
      const shouldRefreshImage = !existingBySlug.featured_image_url && Boolean(img.imageUrl);
      if (!shouldRefreshText && !shouldRefreshImage) {
        seededArticles.push({
          articleId: existingBySlug.id,
          date: p.date,
          index: p.index,
          title: p.title,
          reused: true,
        });
        skippedExistingCount += 1;
        console.log(`↪️ ${p.index}/${parsed.length} ${p.title} (déjà présent, inchangé)`);
        continue;
      }

      const updatePayload: {
        description_fr?: string;
        content_fr?: string;
        seo_keywords?: string;
        meta_description_fr?: string;
        featured_image_url?: string | null;
      } = {};
      if (shouldRefreshText) {
        updatePayload.description_fr = generated.description || p.description || `Article pilates: ${p.title}`;
        updatePayload.content_fr = generated.contentHtml;
        updatePayload.seo_keywords = generated.seoKeywords;
        updatePayload.meta_description_fr = generated.metaDescription.slice(0, 320);
      }
      if (shouldRefreshImage) {
        updatePayload.featured_image_url = img.imageUrl;
      }

      const { error: updateError } = await admin.from('blog_articles').update(updatePayload).eq('id', existingBySlug.id);
      if (updateError) {
        console.error(`Update article ${p.index} échoué:`, updateError.message);
        continue;
      }

      seededArticles.push({
        articleId: existingBySlug.id,
        date: p.date,
        index: p.index,
        title: p.title,
        reused: true,
      });
      refreshedCount += 1;
      console.log(`🔄 ${p.index}/${parsed.length} ${p.title} (article existant enrichi)`);
      continue;
    }

    const { data: inserted, error } = await admin
      .from('blog_articles')
      .insert({
        coach_id: coach.id,
        title_fr: p.title,
        slug_fr: slugFr,
        description_fr: generated.description || p.description || `Article pilates: ${p.title}`,
        content_fr: generated.contentHtml,
        category_id: categoryId,
        featured_image_url: img.imageUrl,
        scheduled_publication_at: p.date.toISOString(),
        status: 'draft',
        seo_keywords: generated.seoKeywords,
        meta_description_fr: generated.metaDescription.slice(0, 320),
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.error(`Insert article ${p.index} échoué:`, error.message);
      continue;
    }

    if (inserted?.id) {
      seededArticles.push({
        articleId: inserted.id,
        date: p.date,
        index: p.index,
        title: p.title,
        reused: false,
      });
      const src = img.imageUrl ? 'IA+Unsplash' : 'IA';
      console.log(`✅ ${p.index}/${parsed.length} ${p.title} (${src})`);
    }
  }

  for (const seeded of seededArticles) {
    const monthYear = monthYearFromDate(seeded.date);
    const { error } = await admin.from('admin_article_validations').upsert(
      {
        article_id: seeded.articleId,
        coach_id: coach.id,
        month_year: monthYear,
        status: 'pending',
      },
      { onConflict: 'article_id,month_year' },
    );
    if (error) {
      console.error(`[validation] ${seeded.articleId}`, error.message);
    }
  }

  const insertedCount = seededArticles.filter((a) => !a.reused).length;
  const reusedCount = seededArticles.filter((a) => a.reused).length;
  console.log(
    `\n🎉 Seed complet terminé: ${insertedCount} article(s) inséré(s), ${reusedCount} déjà présent(s), ${refreshedCount} enrichi(s), ${skippedExistingCount} ignoré(s).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
