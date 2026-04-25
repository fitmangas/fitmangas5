import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ReplayLibraryCard } from '@/components/Replay/ReplayLibraryCard';
import { getReplayLibraryForUser } from '@/lib/replay-library';
import { StandaloneVimeoGrid } from '@/components/Replay/StandaloneVimeoGrid';
import { getStandaloneVimeoLibraryForUser } from '@/lib/standalone-vimeo-library';
import { createClient } from '@/lib/supabase/server';

type SearchParams = Promise<{ q?: string; tab?: string; sort?: string; page?: string }>;
const PAGE_SIZE = 9;

function normalize(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

export default async function CompteReplaysPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');

  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 80);
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
  const searched = q
    ? all.filter((i) => normalize(i.courseTitle).includes(normalize(q)) || normalize(i.replayTitle ?? '').includes(normalize(q)))
    : all;
  const base = tab === 'favorites' ? searched.filter((i) => i.isFavorite) : searched;
  const sorted = [...base].sort((a, b) => {
    if (sort === 'duration') return (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0);
    if (sort === 'oldest') return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
  });

  const hero = sorted[0];
  const rest = sorted.slice(1);
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = rest.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const makeHref = (overrides: Partial<{ q: string; tab: string; sort: string; page: string }> = {}) => {
    const p = new URLSearchParams();
    const nextQ = overrides.q ?? q;
    const nextTab = overrides.tab ?? tab;
    const nextSort = overrides.sort ?? sort;
    const nextPage = overrides.page ?? String(safePage);
    if (nextQ) p.set('q', nextQ);
    if (nextTab !== 'all') p.set('tab', nextTab);
    if (nextSort !== 'recent') p.set('sort', nextSort);
    if (nextPage !== '1') p.set('page', nextPage);
    const qs = p.toString();
    return qs ? `/compte/replays?${qs}` : '/compte/replays';
  };

  const favorites = all.filter((i) => i.isFavorite);

  if (!hero && standalone.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-6 md:px-8">
        <h1 className="hero-signature-title text-4xl">Mes replays</h1>
        <p className="mt-4 text-sm text-luxury-muted">
          {tab === 'favorites' ? 'Aucun replay favori pour le moment.' : 'Aucun replay disponible pour le moment.'}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Espace client</p>
          <h1 className="hero-signature-title mt-2 text-4xl md:text-5xl">Mes replays</h1>
          <p className="mt-2 text-sm text-luxury-muted">Dernier replay en vedette, favoris et historique complet.</p>
        </div>
        <Link href="/compte" className="btn-luxury-ghost px-5 py-2.5 text-[10px] tracking-[0.14em]">
          ← Retour dashboard
        </Link>
      </header>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href={makeHref({ tab: 'all', page: '1' })}
          className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] ${
            tab === 'all' ? 'border-orange-400 bg-orange-50 text-orange-900' : 'border-white/40 bg-white/35 text-luxury-muted'
          }`}
        >
          Tous les replays
        </Link>
        <Link
          href={makeHref({ tab: 'favorites', page: '1' })}
          className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] ${
            tab === 'favorites'
              ? 'border-orange-400 bg-orange-50 text-orange-900'
              : 'border-white/40 bg-white/35 text-luxury-muted'
          }`}
        >
          Mes favoris
        </Link>
      </div>

      <form method="get" className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <input type="hidden" name="tab" value={tab} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher un replay..."
          className="min-w-0 flex-1 rounded-full border border-white/45 bg-white/55 px-5 py-3 text-sm text-luxury-ink outline-none ring-orange-400/25 focus:ring-2"
        />
        <select name="sort" defaultValue={sort} className="rounded-full border border-white/45 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none">
          <option value="recent">Plus récents</option>
          <option value="oldest">Plus anciens</option>
          <option value="duration">Plus longs</option>
        </select>
        <button type="submit" className="btn-luxury-primary px-7 py-3 text-[11px] tracking-[0.14em]">
          Filtrer
        </button>
      </form>

      <section className="glass-card mt-10 rounded-[2rem] border border-white/40 p-5 md:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-600">Dernier replay</p>
        {hero ? (
          <div className="mt-4 max-w-xl">
            <ReplayLibraryCard item={hero} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-luxury-muted">Aucun replay live pour le moment. Les vidéos standalone sont disponibles ci-dessous.</p>
        )}
      </section>

      {favorites.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Dossier favoris replay</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {favorites.map((f) => (
              <Link
                key={f.recordingId}
                href={`/live/${f.courseId}`}
                className="rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700"
              >
                ♥ {f.courseTitle}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {hero || paginated.length > 0 ? (
        <section className="mt-12">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">
          {tab === 'favorites' ? 'Historique des favoris' : 'Historique des replays'}
        </h2>
        <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((item) => (
            <li key={item.recordingId}>
              <ReplayLibraryCard item={item} />
            </li>
          ))}
        </ul>
        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            {safePage > 1 ? (
              <Link href={makeHref({ page: String(safePage - 1) })} className="rounded-full border border-white/40 bg-white/50 px-4 py-2 text-luxury-muted">
                ← Précédent
              </Link>
            ) : null}
            <span className="text-luxury-muted">
              Page {safePage} / {totalPages}
            </span>
            {safePage < totalPages ? (
              <Link href={makeHref({ page: String(safePage + 1) })} className="rounded-full border border-white/40 bg-white/50 px-4 py-2 text-luxury-muted">
                Charger plus →
              </Link>
            ) : null}
          </div>
        ) : null}
        </section>
      ) : null}

      {standalone.length > 0 ? (
        <section className="mt-12">
          <StandaloneVimeoGrid videos={standalone} />
        </section>
      ) : null}
    </main>
  );
}
