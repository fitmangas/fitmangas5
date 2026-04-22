import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { pickLocalizedArticle } from '@/lib/blog/localize';
import { NewsletterCta } from '@/components/Blog/NewsletterCta';
import type { BlogLang } from '@/types/blog';

const PAGE = 12;

type Search = { q?: string; category?: string; page?: string; lang?: string };

export default async function BlogListPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1') || 1);
  const q = (sp.q ?? '').replace(/[%_]/g, '').slice(0, 80);
  const categorySlug = (sp.category ?? '').trim();
  const lang = (sp.lang === 'en' || sp.lang === 'es' ? sp.lang : 'fr') as BlogLang;

  const supabase = await createClient();

  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: cat } = await supabase.from('blog_categories').select('id').eq('slug', categorySlug).maybeSingle();
    categoryId = cat?.id ?? null;
  }

  let listQuery = supabase
    .from('blog_articles')
    .select(
      `
      id,
      title_fr, title_en, title_es,
      description_fr, description_en, description_es,
      slug_fr, slug_en, slug_es,
      featured_image_url,
      published_at,
      average_rating,
      rating_count,
      view_count,
      blog_categories ( slug, label_fr, label_en, label_es )
    `,
      { count: 'exact' },
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (categoryId) listQuery = listQuery.eq('category_id', categoryId);

  if (q) {
    const pattern = `%${q}%`;
    listQuery = listQuery.or(`title_fr.ilike.${pattern},title_en.ilike.${pattern},title_es.ilike.${pattern}`);
  }

  const from = (page - 1) * PAGE;
  const { data: articles, count } = await listQuery.range(from, from + PAGE - 1);

  const { data: cats } = await supabase.from('blog_categories').select('*').order('sort_order');

  const total = count ?? 0;
  const hero = articles?.[0];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Blog</p>
          <h1 className="hero-signature-title mt-2 text-4xl text-luxury-ink">Blog Pilates</h1>
          <p className="mt-3 max-w-xl text-sm text-luxury-muted">
            Articles, conseils et inspiration — barre & pilates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['fr', 'en', 'es'] as const).map((code) => (
            <Link
              key={code}
              href={`/blog?lang=${code}${categorySlug ? `&category=${categorySlug}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                lang === code ? 'bg-luxury-ink text-white' : 'bg-white/50 text-luxury-muted hover:bg-white/80'
              }`}
            >
              {code === 'fr' ? 'FR' : code === 'en' ? 'EN' : 'ES'}
            </Link>
          ))}
        </div>
      </header>

      <form className="mt-8 flex flex-col gap-4 md:flex-row md:items-center" action="/blog" method="get">
        <input type="hidden" name="lang" value={lang} />
        {categorySlug ? <input type="hidden" name="category" value={categorySlug} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher…"
          className="min-w-0 flex-1 rounded-full border border-white/50 bg-white/60 px-5 py-3 text-sm backdrop-blur-md outline-none ring-orange-400/25 focus:ring-2"
        />
        <button type="submit" className="btn-luxury-primary shrink-0 px-8 py-3 text-[11px] tracking-[0.14em]">
          Rechercher
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip href={`/blog?lang=${lang}`} active={!categorySlug} lang={lang} q={q}>
          Toutes
        </FilterChip>
        {(cats ?? []).map((c) => (
          <FilterChip key={c.id} href={`/blog?category=${c.slug}&lang=${lang}`} active={categorySlug === c.slug} lang={lang} q={q}>
            {lang === 'en' ? c.label_en ?? c.label_fr : lang === 'es' ? c.label_es ?? c.label_fr : c.label_fr}
          </FilterChip>
        ))}
      </div>

      {page === 1 && hero ? <HeroArticle article={asListArticle(hero)} lang={lang} /> : null}

      <section className="mt-14">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Tous les articles</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(articles ?? []).slice(page === 1 && hero ? 1 : 0).map((a) => (
            <ArticleCard key={a.id} article={asListArticle(a) as BlogCardArticle & { id: string }} lang={lang} />
          ))}
        </div>
      </section>

      {total > PAGE ? (
        <nav className="mt-12 flex justify-center gap-4 text-sm text-luxury-muted">
          {page > 1 ? (
            <Link href={`/blog?page=${page - 1}&lang=${lang}${categorySlug ? `&category=${categorySlug}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>
              ← Précédent
            </Link>
          ) : null}
          {from + PAGE < total ? (
            <Link href={`/blog?page=${page + 1}&lang=${lang}${categorySlug ? `&category=${categorySlug}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>
              Suivant →
            </Link>
          ) : null}
        </nav>
      ) : null}

      <div className="mt-16">
        <NewsletterCta />
      </div>
    </main>
  );
}

function FilterChip({
  href,
  active,
  children,
  lang,
  q,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  lang: BlogLang;
  q: string;
}) {
  const qs = q ? `${href.includes('?') ? '&' : '?'}q=${encodeURIComponent(q)}` : '';
  const langQs = href.includes('lang=') ? '' : `${href.includes('?') ? '&' : '?'}lang=${lang}`;
  return (
    <Link
      href={`${href}${qs}${href.includes('lang=') ? '' : langQs}`}
      className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition ${
        active ? 'border-orange-400 bg-orange-50 text-orange-900' : 'border-white/40 bg-white/35 text-luxury-muted hover:bg-white/55'
      }`}
    >
      {children}
    </Link>
  );
}

type BlogCardArticle = Parameters<typeof pickLocalizedArticle>[0] & {
  featured_image_url: string | null;
  average_rating: number | null;
  rating_count: number | null;
  view_count: number | null;
};

function asListArticle(a: unknown): BlogCardArticle {
  return a as BlogCardArticle;
}

function HeroArticle({ article, lang }: { article: BlogCardArticle; lang: BlogLang }) {
  const loc = pickLocalizedArticle(article, lang);
  const href =
    lang === 'en'
      ? `/blog/${article.slug_en ?? article.slug_fr}`
      : lang === 'es'
        ? `/blog/${article.slug_es ?? article.slug_fr}`
        : `/blog/${article.slug_fr}`;
  return (
    <article className="glass-card mt-12 grid gap-8 overflow-hidden rounded-[2rem] p-6 lg:grid-cols-2 lg:p-10">
      <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-white/35 bg-white/25">
        {article.featured_image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={article.featured_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-[220px] items-center justify-center text-luxury-soft">Fit Mangas</div>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-600">À la une</p>
        <h2 className="hero-signature-title mt-3 text-3xl">{loc.title}</h2>
        <p className="mt-4 line-clamp-4 text-sm text-luxury-muted">{loc.description ?? ''}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-luxury-muted">
          {article.average_rating != null ? (
            <span>
              ⭐ {Number(article.average_rating).toFixed(1)} ({article.rating_count ?? 0})
            </span>
          ) : null}
          <span>👁 {article.view_count ?? 0}</span>
        </div>
        <Link href={href} className="btn-luxury-primary mt-8 inline-flex w-fit items-center px-8 py-3 text-[11px] tracking-[0.14em]">
          Lire l’article
        </Link>
      </div>
    </article>
  );
}

function ArticleCard({
  article,
  lang,
}: {
  article: BlogCardArticle & {
    id: string;
    blog_categories?: { label_fr: string; label_en: string | null; label_es: string | null } | null;
  };
  lang: BlogLang;
}) {
  const loc = pickLocalizedArticle(article, lang);
  const href =
    lang === 'en'
      ? `/blog/${article.slug_en ?? article.slug_fr}`
      : lang === 'es'
        ? `/blog/${article.slug_es ?? article.slug_fr}`
        : `/blog/${article.slug_fr}`;
  const cat =
    article.blog_categories &&
    (lang === 'en'
      ? article.blog_categories.label_en ?? article.blog_categories.label_fr
      : lang === 'es'
        ? article.blog_categories.label_es ?? article.blog_categories.label_fr
        : article.blog_categories.label_fr);

  return (
    <Link href={href} className="glass-card group flex flex-col overflow-hidden rounded-2xl border border-white/35 transition hover:border-orange-200/80">
      <div className="relative aspect-[16/10] overflow-hidden bg-white/30">
        {article.featured_image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={article.featured_image_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{cat}</span>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-luxury-ink">{loc.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-luxury-muted">{loc.description ?? ''}</p>
        <div className="mt-4 flex gap-4 text-[11px] text-luxury-muted">
          {article.average_rating != null ? <span>⭐ {Number(article.average_rating).toFixed(1)}</span> : null}
          <span>👁 {article.view_count ?? 0}</span>
        </div>
      </div>
    </Link>
  );
}
