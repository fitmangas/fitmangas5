import './load-env-local';

import { createClient } from '@supabase/supabase-js';
import { slugifyBlog } from '../src/lib/blog/slugify';
import { translateText } from '../src/lib/blog/translate';

function arg(name: string): string | null {
  const raw = process.argv.find((a) => a.startsWith(`${name}=`));
  return raw ? raw.slice(name.length + 1) : null;
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

async function chunkTranslate(text: string, target: 'en' | 'es'): Promise<string | null> {
  const blocks = text.split(/\n\n+/);
  const parts: string[] = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const translated = await translateText(trimmed, target);
    if (!translated) return null;
    parts.push(translated);
    await new Promise((r) => setTimeout(r, 120));
  }
  return parts.join('\n\n');
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.');

  const limit = Math.max(1, Number(arg('--limit') ?? '20') || 20);
  const dryRun = hasFlag('--dry-run');
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: rows } = await admin
    .from('blog_articles')
    .select('id,title_fr,description_fr,content_fr,title_en,title_es,content_en,content_es')
    .order('scheduled_publication_at', { ascending: true })
    .limit(limit * 4);

  const targets = (rows ?? [])
    .filter((a) => !a.title_en || !a.title_es || !a.content_en || !a.content_es)
    .slice(0, limit);

  console.log(`Articles à traduire: ${targets.length} (dryRun=${dryRun}).`);

  for (const article of targets) {
    const titleEn = article.title_en ?? (await translateText(article.title_fr, 'en'));
    const titleEs = article.title_es ?? (await translateText(article.title_fr, 'es'));
    const descEn = article.description_fr ? await translateText(article.description_fr, 'en') : null;
    const descEs = article.description_fr ? await translateText(article.description_fr, 'es') : null;
    const contentEn = article.content_en ?? (await chunkTranslate(article.content_fr, 'en'));
    const contentEs = article.content_es ?? (await chunkTranslate(article.content_fr, 'es'));

    if (!titleEn || !titleEs || !contentEn || !contentEs) {
      console.warn(`⏭️  Traduction incomplète pour ${article.id}, article ignoré.`);
      continue;
    }

    if (dryRun) {
      console.log(`🧪 ${article.id} prêt (pas écrit en base).`);
      continue;
    }

    await admin
      .from('blog_articles')
      .update({
        title_en: titleEn,
        title_es: titleEs,
        description_en: descEn,
        description_es: descEs,
        content_en: contentEn,
        content_es: contentEs,
        slug_en: slugifyBlog(titleEn),
        slug_es: slugifyBlog(titleEs),
        meta_description_en: descEn?.slice(0, 320) ?? null,
        meta_description_es: descEs?.slice(0, 320) ?? null,
      })
      .eq('id', article.id);

    await admin.from('blog_article_translations').upsert(
      [
        {
          article_id: article.id,
          language: 'en',
          title: titleEn,
          description: descEn,
          content: contentEn,
          meta_description: descEn?.slice(0, 320) ?? null,
          slug: slugifyBlog(titleEn),
          auto_translated: true,
        },
        {
          article_id: article.id,
          language: 'es',
          title: titleEs,
          description: descEs,
          content: contentEs,
          meta_description: descEs?.slice(0, 320) ?? null,
          slug: slugifyBlog(titleEs),
          auto_translated: true,
        },
      ],
      { onConflict: 'article_id,language' },
    );

    console.log(`✅ ${article.id} traduit.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
