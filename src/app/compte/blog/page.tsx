import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BlogFavoriteToggle } from '@/components/Compte/BlogFavoriteToggle';
import { getClientLang } from '@/lib/compte/i18n';

type SearchParams = Promise<{ q?: string; category?: string; tab?: string; sort?: string; page?: string }>;
const PAGE_SIZE = 9;

export default async function CompteBlogPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');
  const lang = await getClientLang(supabase, user.id);
  const field = lang === 'en' ? 'en' : lang === 'es' ? 'es' : 'fr';
  const t =
    lang === 'en'
      ? {
          title: 'My blog',
          emptyFav: 'No favorite yet.',
          emptyAll: 'No published article yet.',
          area: 'Client area',
          subtitle: 'Latest featured article + full history.',
          back: 'Back dashboard',
          all: 'All articles',
          fav: 'My favorites',
          search: 'Search an article...',
          allCats: 'All categories',
          recent: 'Most recent',
          topRated: 'Top rated',
          mostViewed: 'Most viewed',
          filter: 'Filter',
          favFolder: 'Favorite folder',
          latest: 'Latest article',
          read: 'Read article',
          favHistory: 'Favorites history',
          history: 'Articles history',
          blog: 'Blog',
          open: 'Open',
          prev: 'Previous',
          next: 'Load more',
          page: 'Page',
        }
      : lang === 'es'
        ? {
            title: 'Mi blog',
            emptyFav: 'Aún no hay favoritos.',
            emptyAll: 'Aún no hay artículos publicados.',
            area: 'Área cliente',
            subtitle: 'Último artículo destacado + historial completo.',
            back: 'Volver al panel',
            all: 'Todos los artículos',
            fav: 'Mis favoritos',
            search: 'Buscar un artículo...',
            allCats: 'Todas las categorías',
            recent: 'Más recientes',
            topRated: 'Mejor valorados',
            mostViewed: 'Más vistos',
            filter: 'Filtrar',
            favFolder: 'Carpeta favoritos',
            latest: 'Último artículo',
            read: 'Leer artículo',
            favHistory: 'Historial de favoritos',
            history: 'Historial de artículos',
            blog: 'Blog',
            open: 'Abrir',
            prev: 'Anterior',
            next: 'Cargar más',
            page: 'Página',
          }
        : {
            title: 'Mon blog',
            emptyFav: 'Aucun favori pour le moment.',
            emptyAll: 'Aucun article publié pour le moment.',
            area: 'Espace client',
            subtitle: 'Dernier article en vedette + historique complet.',
            back: 'Retour dashboard',
            all: 'Tous les articles',
            fav: 'Mes favoris',
            search: 'Rechercher un article...',
            allCats: 'Toutes les catégories',
            recent: 'Plus récents',
            topRated: 'Mieux notés',
            mostViewed: 'Plus vus',
            filter: 'Filtrer',
            favFolder: 'Dossier favoris',
            latest: 'Dernier article',
            read: 'Lire l’article',
            favHistory: 'Historique des favoris',
            history: 'Historique des articles',
            blog: 'Blog',
            open: 'Ouvrir',
            prev: 'Précédent',
            next: 'Charger plus',
            page: 'Page',
          };

  await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('kind', 'blog_article')
    .is('read_at', null);

  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 80);
  const category = (sp.category ?? '').trim();
  const tab = sp.tab === 'favorites' ? 'favorites' : 'all';
  const sort = sp.sort === 'rating' || sp.sort === 'views' ? sp.sort : 'recent';
  const page = Math.max(1, Number(sp.page ?? '1') || 1);

  const { data: cats } = await supabase.from('blog_categories').select('id,slug,label_fr,label_en,label_es').order('sort_order');
  let categoryId: string | null = null;
  if (category) {
    categoryId = cats?.find((c) => c.slug === category)?.id ?? null;
  }

  let query = supabase
    .from('blog_articles')
    .select(
      `
      id,title_fr,title_en,title_es,description_fr,description_en,description_es,slug_fr,slug_en,slug_es,featured_image_url,published_at,status,average_rating,view_count,
      blog_categories ( label_fr, label_en, label_es, slug )
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
  type ArticleRow = (typeof list)[number];
  function pickLocalized(a: ArticleRow, key: 'title' | 'description' | 'slug'): string {
    const val =
      key === 'title'
        ? (a[`title_${field}` as 'title_fr'] as string | null)
        : key === 'description'
          ? (a[`description_${field}` as 'description_fr'] as string | null)
          : (a[`slug_${field}` as 'slug_fr'] as string | null);
    const fallback =
      key === 'title' ? a.title_fr : key === 'description' ? a.description_fr : a.slug_fr;
    return (val && val.trim()) || (fallback ?? '');
  }
  function pickCategoryLabel(a: ArticleRow): string {
    const c = a.blog_categories?.[0] as { label_fr?: string | null; label_en?: string | null; label_es?: string | null } | undefined;
    if (!c) return t.blog;
    if (field === 'en' && c.label_en) return c.label_en;
    if (field === 'es' && c.label_es) return c.label_es;
    return c.label_fr ?? t.blog;
  }

  const favorites = list.filter((a) => favoriteIds.has(a.id));
  const sortedBase = [...(tab === 'favorites' ? favorites : list)];
  sortedBase.sort((a, b) => {
    if (sort === 'views') return (b.view_count ?? 0) - (a.view_count ?? 0);
    if (sort === 'rating') return (b.average_rating ?? 0) - (a.average_rating ?? 0);
    return new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime();
  });
  const hero = sortedBase[0];
  const rest = sortedBase.slice(1);
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRest = rest.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!hero && rest.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-6 md:px-8">
        <h1 className="hero-signature-title text-4xl">{t.title}</h1>
        <p className="mt-4 text-sm text-luxury-muted">
          {tab === 'favorites' ? t.emptyFav : t.emptyAll}
        </p>
      </main>
    );
  }

  const makeHref = (overrides: Partial<{ q: string; category: string; tab: string; sort: string; page: string }> = {}) => {
    const params = new URLSearchParams();
    const nextQ = overrides.q ?? q;
    const nextCategory = overrides.category ?? category;
    const nextTab = overrides.tab ?? tab;
    const nextSort = overrides.sort ?? sort;
    const nextPage = overrides.page ?? String(safePage);
    if (nextQ) params.set('q', nextQ);
    if (nextCategory) params.set('category', nextCategory);
    if (nextTab !== 'all') params.set('tab', nextTab);
    if (nextSort !== 'recent') params.set('sort', nextSort);
    if (nextPage !== '1') params.set('page', nextPage);
    const qs = params.toString();
    return qs ? `/compte/blog?${qs}` : '/compte/blog';
  };

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">{t.area}</p>
          <h1 className="hero-signature-title mt-2 text-4xl md:text-5xl">{t.title}</h1>
          <p className="mt-2 text-sm text-luxury-muted">{t.subtitle}</p>
        </div>
        <Link href="/compte" className="btn-luxury-ghost px-5 py-2.5 text-[10px] tracking-[0.14em]">
          ← {t.back}
        </Link>
      </header>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href={makeHref({ tab: 'all', page: '1' })}
          className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] ${
            tab === 'all' ? 'border-orange-400 bg-orange-50 text-orange-900' : 'border-white/40 bg-white/35 text-luxury-muted'
          }`}
        >
          {t.all}
        </Link>
        <Link
          href={makeHref({ tab: 'favorites', page: '1' })}
          className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] ${
            tab === 'favorites'
              ? 'border-orange-400 bg-orange-50 text-orange-900'
              : 'border-white/40 bg-white/35 text-luxury-muted'
          }`}
        >
          {t.fav}
        </Link>
      </div>

      <form method="get" className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <input type="hidden" name="tab" value={tab} />
        <input
          name="q"
          defaultValue={q}
          placeholder={t.search}
          className="min-w-0 flex-1 rounded-full border border-white/45 bg-white/55 px-5 py-3 text-sm text-luxury-ink outline-none ring-orange-400/25 focus:ring-2"
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded-full border border-white/45 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none"
        >
          <option value="">{t.allCats}</option>
          {(cats ?? []).map((c) => (
            <option key={c.id} value={c.slug}>
              {(field === 'en' ? c.label_en : field === 'es' ? c.label_es : c.label_fr) ?? c.label_fr ?? c.slug}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className="rounded-full border border-white/45 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none">
          <option value="recent">{t.recent}</option>
          <option value="rating">{t.topRated}</option>
          <option value="views">{t.mostViewed}</option>
        </select>
        <button type="submit" className="btn-luxury-primary px-7 py-3 text-[11px] tracking-[0.14em]">
          {t.filter}
        </button>
      </form>

      {favorites.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">{t.favFolder}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {favorites.map((a) => (
              <Link
                key={a.id}
                href={`/blog/${pickLocalized(a, 'slug')}`}
                className="rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700"
              >
                ♥ {pickLocalized(a, 'title')}
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-600">{t.latest}</p>
            <h2 className="hero-signature-title mt-3 text-3xl">{pickLocalized(hero, 'title')}</h2>
            <p className="mt-3 text-sm text-luxury-muted">{pickLocalized(hero, 'description')}</p>
            <div className="mt-5 flex items-center gap-3">
              <BlogFavoriteToggle articleId={hero.id} initialFavorite={favoriteIds.has(hero.id)} />
              <Link href={`/blog/${pickLocalized(hero, 'slug')}`} className="btn-luxury-primary px-6 py-2.5 text-[11px] tracking-[0.12em]">
                {t.read}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">
          {tab === 'favorites' ? t.favHistory : t.history}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedRest.map((a) => (
            <article key={a.id} className="glass-card rounded-2xl border border-white/40 p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">
                {pickCategoryLabel(a)}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-luxury-ink">{pickLocalized(a, 'title')}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-luxury-muted">{pickLocalized(a, 'description')}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <BlogFavoriteToggle articleId={a.id} initialFavorite={favoriteIds.has(a.id)} />
                <Link
                  href={`/blog/${pickLocalized(a, 'slug')}`}
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-muted underline underline-offset-2"
                >
                  {t.open}
                </Link>
              </div>
            </article>
          ))}
        </div>
        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            {safePage > 1 ? (
              <Link href={makeHref({ page: String(safePage - 1) })} className="rounded-full border border-white/40 bg-white/50 px-4 py-2 text-luxury-muted">
                ← {t.prev}
              </Link>
            ) : null}
            <span className="text-luxury-muted">
              {t.page} {safePage} / {totalPages}
            </span>
            {safePage < totalPages ? (
              <Link href={makeHref({ page: String(safePage + 1) })} className="rounded-full border border-white/40 bg-white/50 px-4 py-2 text-luxury-muted">
                {t.next} →
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
