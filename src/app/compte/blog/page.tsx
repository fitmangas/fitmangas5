import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BlogFavoriteToggle } from '@/components/Compte/BlogFavoriteToggle';

type SearchParams = Promise<{ q?: string; category?: string }>;

export default async function CompteBlogPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');

  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 80);
  const category = (sp.category ?? '').trim();

  const { data: cats } = await supabase.from('blog_categories').select('id,slug,label_fr').order('sort_order');
  let categoryId: string | null = null;
  if (category) {
    categoryId = cats?.find((c) => c.slug === category)?.id ?? null;
  }

  let query = supabase
    .from('blog_articles')
    .select(
      `
      id,title_fr,description_fr,slug_fr,featured_image_url,published_at,status,
      blog_categories ( label_fr, slug )
    `,
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(200);

  if (categoryId) query = query.eq('category_id', categoryId);
  if (q) query = query.ilike('title_fr', `%${q.replace(/[%_]/g, '')}%`);
  const { data: articles } = await query;

  const { data: favRows } = await supabase.from('blog_article_favorites').select('article_id').eq('user_id', user.id);
  const favoriteIds = new Set((favRows ?? []).map((r) => r.article_id));

  const list = articles ?? [];
  const hero = list[0];
  const rest = list.slice(1);
  const favorites = list.filter((a) => favoriteIds.has(a.id));

  if (!hero && rest.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-6 md:px-8">
        <h1 className="hero-signature-title text-4xl">Mon blog</h1>
        <p className="mt-4 text-sm text-luxury-muted">Aucun article publié pour le moment.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Espace client</p>
          <h1 className="hero-signature-title mt-2 text-4xl md:text-5xl">Mon blog</h1>
          <p className="mt-2 text-sm text-luxury-muted">Dernier article en vedette + historique complet.</p>
        </div>
        <Link href="/compte" className="btn-luxury-ghost px-5 py-2.5 text-[10px] tracking-[0.14em]">
          ← Retour dashboard
        </Link>
      </header>

      <form method="get" className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher un article..."
          className="min-w-0 flex-1 rounded-full border border-white/45 bg-white/55 px-5 py-3 text-sm text-luxury-ink outline-none ring-orange-400/25 focus:ring-2"
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded-full border border-white/45 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none"
        >
          <option value="">Toutes les catégories</option>
          {(cats ?? []).map((c) => (
            <option key={c.id} value={c.slug}>
              {c.label_fr}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-luxury-primary px-7 py-3 text-[11px] tracking-[0.14em]">
          Filtrer
        </button>
      </form>

      {favorites.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Dossier favoris</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {favorites.map((a) => (
              <Link
                key={a.id}
                href={`/blog/${a.slug_fr}`}
                className="rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700"
              >
                ♥ {a.title_fr}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {hero ? (
        <section className="glass-card mt-10 grid gap-6 overflow-hidden rounded-[2rem] p-6 md:grid-cols-2 md:p-8">
          <div className="overflow-hidden rounded-2xl border border-white/35 bg-white/25">
            {hero.featured_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.featured_image_url} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-600">Dernier article</p>
            <h2 className="hero-signature-title mt-3 text-3xl">{hero.title_fr}</h2>
            <p className="mt-3 text-sm text-luxury-muted">{hero.description_fr ?? ''}</p>
            <div className="mt-5 flex items-center gap-3">
              <BlogFavoriteToggle articleId={hero.id} initialFavorite={favoriteIds.has(hero.id)} />
              <Link href={`/blog/${hero.slug_fr}`} className="btn-luxury-primary px-6 py-2.5 text-[11px] tracking-[0.12em]">
                Lire l’article
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Historique des articles</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rest.map((a) => (
            <article key={a.id} className="glass-card rounded-2xl border border-white/40 p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">
                {a.blog_categories?.[0]?.label_fr ?? 'Blog'}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-luxury-ink">{a.title_fr}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-luxury-muted">{a.description_fr ?? ''}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <BlogFavoriteToggle articleId={a.id} initialFavorite={favoriteIds.has(a.id)} />
                <Link
                  href={`/blog/${a.slug_fr}`}
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-muted underline underline-offset-2"
                >
                  Ouvrir
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
