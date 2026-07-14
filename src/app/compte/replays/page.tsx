import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import { ReplayLibraryCard } from '@/components/Replay/ReplayLibraryCard';
import { VisioLock } from '@/components/Premium/VisioLock';
import { getReplayLibraryForUser } from '@/lib/replay-library';
import { getReplayFallbackDescription } from '@/lib/replay-cover';
import { liveCourseHref } from '@/lib/live/live-back-url';
import { StandaloneVimeoGrid } from '@/components/Replay/StandaloneVimeoGrid';
import { getStandaloneVimeoLibraryForUser } from '@/lib/standalone-vimeo-library';
import { getClientLang } from '@/lib/compte/i18n';
import { hasVisioClientAccess } from '@/lib/access-control';
import { createClient } from '@/lib/supabase/server';

type SearchParams = Promise<{ q?: string; section?: string; tab?: string; sort?: string; page?: string }>;
const PAGE_SIZE = 9;
const LIVE_FROM_REPLAYS = '/compte/replays';

function normalize(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

function formatFrenchSessionDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default async function CompteReplaysPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');
  const [lang, hasVisioAccess] = await Promise.all([getClientLang(supabase, user.id), hasVisioClientAccess(user.id)]);
  const t =
    lang === 'en'
      ? {
          title: 'My replays & my library',
          emptyFav: 'No favorite replay yet.',
          emptyAll: 'No replay available right now.',
          emptyLibrary: 'No library video available right now.',
          dashboard: 'Dashboard',
          sectionReplays: 'Replays',
          sectionLibrary: 'Library',
          all: 'All replays',
          fav: 'My favorites',
          search: 'Search a replay...',
          searchLibrary: 'Search a video...',
          recent: 'Most recent',
          oldest: 'Oldest first',
          longest: 'Longest',
          filter: 'Filter',
          latest: 'Latest replay',
          noLive: 'No live replay yet.',
          favFolder: 'Favorite replay folder',
          history: 'Replay history',
          prev: 'Previous',
          next: 'Load more',
          page: 'Page',
          play: 'Play',
          soon: 'Coming soon',
        }
      : lang === 'es'
        ? {
            title: 'Mis replays y mi biblioteca',
            emptyFav: 'Aún no hay replays favoritos.',
            emptyAll: 'No hay replays disponibles por ahora.',
            emptyLibrary: 'No hay videos de biblioteca por ahora.',
            dashboard: 'Dashboard',
            sectionReplays: 'Replays',
            sectionLibrary: 'Biblioteca',
            all: 'Todos los replays',
            fav: 'Mis favoritos',
            search: 'Buscar un replay...',
            searchLibrary: 'Buscar un video...',
            recent: 'Más recientes',
            oldest: 'Más antiguos',
            longest: 'Más largos',
            filter: 'Filtrar',
            latest: 'Último replay',
            noLive: 'Aún no hay replay live.',
            favFolder: 'Carpeta favoritos replay',
            history: 'Historial de replays',
            prev: 'Anterior',
            next: 'Cargar más',
            page: 'Página',
            play: 'Ver replay',
            soon: 'Pronto disponible',
          }
        : {
            title: 'Mes replays & ma bibliothèque',
            emptyFav: 'Aucun replay favori pour le moment.',
            emptyAll: 'Aucun replay disponible pour le moment.',
            emptyLibrary: 'Aucune vidéo de bibliothèque pour le moment.',
            dashboard: 'Dashboard',
            sectionReplays: 'Replays',
            sectionLibrary: 'Bibliothèque',
            all: 'Tous les replays',
            fav: 'Mes favoris',
            search: 'Rechercher un replay...',
            searchLibrary: 'Rechercher une vidéo...',
            recent: 'Plus récents',
            oldest: 'Plus anciens',
            longest: 'Plus longs',
            filter: 'Filtrer',
            latest: 'Dernier replay',
            noLive: 'Aucun replay live pour le moment.',
            favFolder: 'Dossier favoris replay',
            history: 'Historique des replays',
            prev: 'Précédent',
            next: 'Charger plus',
            page: 'Page',
            play: 'Lecture',
            soon: 'Bientôt disponible',
          };

  if (!hasVisioAccess) {
    return (
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-6 md:px-8">
        <header>
          <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
        </header>
        <div className="mt-8">
          <VisioLock
            hasAccess={false}
            locale={lang === 'es' ? 'es' : 'fr'}
            featureDescription_fr="Les replays et vidéos à la demande sont inclus dans l’abonnement Visio collectif à 39€/mois."
            featureDescription_es="Los replays y videos a la carta están incluidos en la suscripción Visio grupal a 39€/mes."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-56 rounded-3xl border border-white/60 bg-white/60" />
              ))}
            </div>
          </VisioLock>
        </div>
      </main>
    );
  }

  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 80);
  const section = sp.section === 'library' ? 'library' : 'replays';
  const tab = sp.tab === 'favorites' ? 'favorites' : 'all';
  const sort = sp.sort === 'duration' || sp.sort === 'oldest' ? sp.sort : 'recent';
  const page = Math.max(1, Number(sp.page ?? '1') || 1);

  await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('kind', 'replay_video')
    .is('read_at', null);

  const all = await getReplayLibraryForUser(user.id);
  const standalone = await getStandaloneVimeoLibraryForUser();

  const makeHref = (
    overrides: Partial<{ q: string; section: string; tab: string; sort: string; page: string }> = {},
  ) => {
    const p = new URLSearchParams();
    const nextQ = overrides.q ?? q;
    const nextSection = overrides.section ?? section;
    const nextTab = overrides.tab ?? tab;
    const nextSort = overrides.sort ?? sort;
    const nextPage = overrides.page ?? String(page);
    if (nextSection !== 'replays') p.set('section', nextSection);
    if (nextQ) p.set('q', nextQ);
    if (nextTab !== 'all') p.set('tab', nextTab);
    if (nextSort !== 'recent') p.set('sort', nextSort);
    if (nextPage !== '1') p.set('page', nextPage);
    const qs = p.toString();
    return qs ? `/compte/replays?${qs}` : '/compte/replays';
  };

  const sectionToggle = (
    <div className="mt-8 flex rounded-full border border-brand-ink/10 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      <Link
        href={makeHref({ section: 'replays', page: '1' })}
        className={`flex-1 rounded-full py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] transition-all ${
          section === 'replays'
            ? 'bg-[#C45D3E] text-[#FFF8F0] shadow-[0_6px_18px_rgba(196,93,62,0.35)]'
            : 'text-brand-ink/60 hover:text-brand-ink'
        }`}
      >
        {t.sectionReplays}
      </Link>
      <Link
        href={makeHref({ section: 'library', page: '1' })}
        className={`flex-1 rounded-full py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] transition-all ${
          section === 'library'
            ? 'bg-[#C45D3E] text-[#FFF8F0] shadow-[0_6px_18px_rgba(196,93,62,0.35)]'
            : 'text-brand-ink/60 hover:text-brand-ink'
        }`}
      >
        {t.sectionLibrary}
      </Link>
    </div>
  );

  if (section === 'library') {
    const filteredStandalone =
      tab === 'favorites' ? standalone.filter((v) => v.isFavorite) : standalone;
    const libraryFavoriteCount = standalone.filter((v) => v.isFavorite).length;

    return (
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
        <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
        <header>
          <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
        </header>

        {sectionToggle}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={makeHref({ tab: 'all', page: '1' })}
            className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] ${
              tab === 'all' ? 'border-orange-400 bg-orange-50 text-orange-900' : 'border-white/40 bg-white/35 text-luxury-muted'
            }`}
          >
            {t.sectionLibrary}
          </Link>
          <Link
            href={makeHref({ tab: 'favorites', page: '1' })}
            className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] ${
              tab === 'favorites'
                ? 'border-orange-400 bg-orange-50 text-orange-900'
                : 'border-white/40 bg-white/35 text-luxury-muted'
            }`}
          >
            {t.fav} ({libraryFavoriteCount})
          </Link>
        </div>

        {filteredStandalone.length > 0 ? (
          <section className="mt-8">
            <StandaloneVimeoGrid videos={filteredStandalone} lang={lang} showFeatured />
          </section>
        ) : (
          <p className="mt-10 text-sm text-luxury-muted">{tab === 'favorites' ? t.emptyFav : t.emptyLibrary}</p>
        )}
      </main>
    );
  }

  const searched = q
    ? all.filter(
        (i) =>
          normalize(i.courseTitle).includes(normalize(q)) ||
          normalize(i.replayTitle ?? '').includes(normalize(q)),
      )
    : all;
  const base = tab === 'favorites' ? searched.filter((i) => i.isFavorite) : searched;
  const sorted = [...base].sort((a, b) => {
    if (sort === 'duration') return (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0);
    if (sort === 'oldest') return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
  });

  const hero = sorted.find((i) => i.isPlayable !== false) ?? null;
  const rest = hero ? sorted.filter((i) => i.recordingId !== hero.recordingId) : sorted;
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = rest.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const favorites = all.filter((i) => i.isFavorite);

  const heroDescription =
    hero?.courseDescription?.trim() ||
    (hero ? getReplayFallbackDescription(hero.courseTitle, lang) : '');
  const heroDate = hero ? formatFrenchSessionDate(hero.startsAt) : '';
  const heroPlayable = hero?.isPlayable !== false;

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
      <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
      <header>
        <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
      </header>

      {sectionToggle}

      <div className="mt-4 flex flex-wrap gap-2">
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
          {t.fav} ({favorites.length})
        </Link>
      </div>

      <form method="get" className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <input type="hidden" name="section" value="replays" />
        <input type="hidden" name="tab" value={tab} />
        <input
          name="q"
          defaultValue={q}
          placeholder={t.search}
          className="min-w-0 flex-1 rounded-full border border-white/45 bg-white/55 px-5 py-3 text-sm text-luxury-ink outline-none ring-orange-400/25 focus:ring-2"
        />
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-full border border-white/45 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none"
        >
          <option value="recent">{t.recent}</option>
          <option value="oldest">{t.oldest}</option>
          <option value="duration">{t.longest}</option>
        </select>
        <button type="submit" className="btn-luxury-primary px-7 py-3 text-[11px] tracking-[0.14em]">
          {t.filter}
        </button>
      </form>

      {!hero ? (
        <p className="mt-10 text-sm text-luxury-muted">{tab === 'favorites' ? t.emptyFav : t.emptyAll}</p>
      ) : (
        <>
          <section className="glass-card mt-10 grid gap-6 overflow-hidden p-6 md:grid-cols-2 md:p-8">
            <div className="overflow-hidden rounded-t-2xl border border-white/35 bg-white/25 md:rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.coverImageUrl}
                alt=""
                className="aspect-[16/10] h-full w-full object-cover md:aspect-auto md:min-h-[260px]"
              />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-600">{t.latest}</p>
              <h2 className="hero-signature-title mt-3 break-words text-3xl">{hero.courseTitle}</h2>
              {heroDate ? <p className="mt-2 text-sm font-medium text-luxury-ink/80">{heroDate}</p> : null}
              <p className="mt-3 text-sm leading-relaxed text-luxury-muted">{heroDescription}</p>
              <div className="mt-5">
                {heroPlayable ? (
                  <Link
                    href={liveCourseHref(hero.courseId, { from: LIVE_FROM_REPLAYS })}
                    className="btn-luxury-primary px-6 py-2.5 text-[11px] tracking-[0.12em]"
                  >
                    {t.play}
                  </Link>
                ) : (
                  <span className="inline-flex rounded-full border border-white/50 bg-white/45 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-muted">
                    {t.soon}
                  </span>
                )}
              </div>
            </div>
          </section>

          {favorites.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">{t.favFolder}</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {favorites.map((f) =>
                  f.isPlayable === false ? (
                    <span
                      key={f.recordingId}
                      className="rounded-full border border-white/45 bg-white/40 px-4 py-2 text-xs font-semibold text-luxury-muted"
                    >
                      ♥ {f.courseTitle} · {t.soon}
                    </span>
                  ) : (
                    <Link
                      key={f.recordingId}
                      href={liveCourseHref(f.courseId, { from: LIVE_FROM_REPLAYS })}
                      className="rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700"
                    >
                      ♥ {f.courseTitle}
                    </Link>
                  ),
                )}
              </div>
            </section>
          ) : null}

          {paginated.length > 0 ? (
            <section className="mt-12">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">{t.history}</h2>
              <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginated.map((item) => (
                  <li key={item.recordingId}>
                    <ReplayLibraryCard item={item} lang={lang} from={LIVE_FROM_REPLAYS} />
                  </li>
                ))}
              </ul>
              {totalPages > 1 ? (
                <div className="mt-8 flex items-center justify-center gap-4 text-sm">
                  {safePage > 1 ? (
                    <Link
                      href={makeHref({ page: String(safePage - 1) })}
                      className="rounded-full border border-white/40 bg-white/50 px-4 py-2 text-luxury-muted"
                    >
                      ← {t.prev}
                    </Link>
                  ) : null}
                  <span className="text-luxury-muted">
                    {t.page} {safePage} / {totalPages}
                  </span>
                  {safePage < totalPages ? (
                    <Link
                      href={makeHref({ page: String(safePage + 1) })}
                      className="rounded-full border border-white/40 bg-white/50 px-4 py-2 text-luxury-muted"
                    >
                      {t.next} →
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
