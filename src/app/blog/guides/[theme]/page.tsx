import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BlogConversionCta } from '@/components/Blog/BlogConversionCta';
import { isCroissanceV2Enabled } from '@/lib/acquisition/croissance-v2-flag';
import { BLOG_GUIDES, getBlogGuide, guideForArticle } from '@/lib/blog/guides';
import { uniqueBlogImageUrl } from '@/lib/blog/images';
import { pickLocalizedArticle } from '@/lib/blog/localize';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BlogLang } from '@/types/blog';

/**
 * Page guide d'un thème du blog (SPEC §12.6, lot 7) : liste les articles publiés du thème.
 * Derrière CROISSANCE_V2 (drapeau éteint : la page n'existe pas, comme avant le lot).
 */

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ theme: string }>; searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const { theme } = await params;
  const { lang: rawLang } = await searchParams;
  const guide = getBlogGuide(theme);
  if (!guide || !isCroissanceV2Enabled()) return { title: 'Guide' };
  const lang: BlogLang = rawLang === 'es' ? 'es' : 'fr';
  return {
    title: lang === 'es' ? `Guía ${guide.title.es} — Pilates` : `Guide ${guide.title.fr} — Pilates`,
    description: guide.intro[lang],
    alternates: { canonical: `/blog/guides/${guide.id}` },
  };
}

type Row = {
  id: string;
  title_fr: string;
  title_es: string | null;
  description_fr: string | null;
  description_es: string | null;
  slug_fr: string;
  slug_es: string | null;
  featured_image_url: string | null;
  content_es: string | null;
  blog_categories: { slug: string; label_fr: string; label_es: string | null } | { slug: string; label_fr: string; label_es: string | null }[] | null;
};

export default async function BlogGuidePage({ params, searchParams }: Params) {
  if (!isCroissanceV2Enabled()) notFound();
  const { theme } = await params;
  const { lang: rawLang } = await searchParams;
  const guide = getBlogGuide(theme);
  if (!guide) notFound();
  const lang: BlogLang = rawLang === 'es' ? 'es' : 'fr';

  let rows: Row[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('blog_articles')
      .select('id, title_fr, title_es, description_fr, description_es, slug_fr, slug_es, featured_image_url, content_es, blog_categories ( slug, label_fr, label_es )')
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(300);
    rows = ((data ?? []) as unknown as Row[]).filter((row) => guideForArticle(row)?.id === guide.id);
  } catch {
    rows = [];
  }
  if (lang === 'es') rows = rows.filter((r) => r.content_es);

  const used = new Set<string>();
  const others = BLOG_GUIDES.filter((g) => g.id !== guide.id);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-[12px] text-luxury-muted" aria-label={lang === 'es' ? 'Ruta' : 'Fil d’Ariane'}>
        <Link href={`/blog${lang === 'es' ? '?lang=es' : ''}`} className="hover:text-luxury-ink">
          Blog
        </Link>{' '}
        / <span className="text-luxury-ink">{lang === 'es' ? 'Guías' : 'Guides'}</span>
      </nav>
      <header className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C45D3E]">{lang === 'es' ? 'Guía Pilates' : 'Guide Pilates'}</p>
          <h1 className="hero-signature-title mt-2 text-4xl text-luxury-ink md:text-5xl">{guide.title[lang]}</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-luxury-muted">{guide.intro[lang]}</p>
        </div>
        <div className="flex gap-2">
          {(['fr', 'es'] as const).map((code) => (
            <Link
              key={code}
              href={`/blog/guides/${guide.id}${code === 'es' ? '?lang=es' : ''}`}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                lang === code ? 'bg-luxury-ink text-white' : 'bg-white/50 text-luxury-muted hover:bg-white/80'
              }`}
            >
              {code.toUpperCase()}
            </Link>
          ))}
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">
          {lang === 'es' ? `${rows.length} artículo${rows.length > 1 ? 's' : ''}` : `${rows.length} article${rows.length > 1 ? 's' : ''}`}
        </h2>
        {rows.length ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row, index) => {
              const loc = pickLocalizedArticle(row as never, lang);
              const category = Array.isArray(row.blog_categories) ? row.blog_categories[0] : row.blog_categories;
              const image = uniqueBlogImageUrl({ coverImageUrl: row.featured_image_url, categoryLabel: category?.label_fr ?? null, index, used });
              const href = lang === 'es' ? `/blog/${row.slug_es ?? row.slug_fr}?lang=es` : `/blog/${row.slug_fr}`;
              return (
                <Link
                  key={row.id}
                  href={href}
                  className="glass-card group flex flex-col overflow-hidden border border-white/35 transition-all duration-200 hover:scale-[1.02] hover:border-orange-200/80"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-white/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-semibold leading-snug text-luxury-ink">{loc.title}</h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-luxury-muted">{loc.description ?? ''}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 rounded-[1.5rem] bg-white/60 px-5 py-4 text-sm text-luxury-muted">
            {lang === 'es' ? 'Pronto habrá artículos en esta guía.' : 'Les premiers articles de ce guide arrivent bientôt.'}
          </p>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">{lang === 'es' ? 'Otras guías' : 'Autres guides'}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {others.map((g) => (
            <Link
              key={g.id}
              href={`/blog/guides/${g.id}${lang === 'es' ? '?lang=es' : ''}`}
              className="rounded-full border border-[#C45D3E]/25 bg-white/70 px-5 py-2.5 text-[13px] font-semibold text-luxury-ink hover:border-[#C45D3E]/50"
            >
              {g.title[lang]} →
            </Link>
          ))}
        </div>
      </section>

      <BlogConversionCta className="mt-16" />
    </main>
  );
}
