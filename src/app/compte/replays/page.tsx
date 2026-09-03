import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import { CourseLanguageFlag } from '@/components/Calendar/CourseLanguageFlag';
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
import {
  COURSE_SKILL_LEVELS,
  courseSkillLevelLabel,
  isCourseSkillLevel,
} from '@/lib/course-skill-level';
import {
  REPLAY_COURSE_TYPE_OPTIONS,
  isReplayCourseTypeKey,
} from '@/lib/replay-course-type';
import { VIMEO_FOLDER_UNCATEGORIZED } from '@/lib/vimeo-folder';

type SearchParams = Promise<{
  section?: string;
  tab?: string;
  page?: string;
  lang?: string;
  type?: string;
  level?: string;
  folder?: string;
}>;

const PAGE_SIZE = 9;
const CHIP_ACTIVE =
  'rounded-full border border-orange-400 bg-orange-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-orange-900';
const CHIP_IDLE =
  'rounded-full border border-white/40 bg-white/35 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-luxury-muted transition hover:bg-white/55';
const LIVE_FROM_REPLAYS = '/compte/replays';

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

function normalizeFolder(name: string | null | undefined): string | null {
  const key = name?.trim() || '';
  if (!key || key === VIMEO_FOLDER_UNCATEGORIZED || key === 'Sans dossier' || key.toLowerCase() === 'non classé') {
    return null;
  }
  return key;
}

export default async function CompteReplaysPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');
  const [lang, hasVisioAccess] = await Promise.all([getClientLang(supabase, user.id), hasVisioClientAccess(user.id)]);
  const uiLang = lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';
  const t =
    lang === 'en'
      ? {
          title: 'My replays & my library',
          emptyFav: 'No favorite replay yet.',
          emptyAll: 'No replay available right now.',
          emptyLibrary: 'No library video available right now.',
          emptyFiltered: 'No video matches these filters.',
          dashboard: 'Dashboard',
          sectionReplays: 'Replays',
          sectionLibrary: 'Library',
          all: 'All replays',
          allLibrary: 'All videos',
          fav: 'My favorites',
          latest: 'Latest replay',
          latestLibrary: 'Latest video',
          history: 'Replay history',
          prev: 'Previous',
          next: 'Load more',
          page: 'Page',
          play: 'Play',
          soon: 'Coming soon',
          unknown: 'Status unknown · retry later',
        }
      : lang === 'es'
        ? {
            title: 'Mis replays y mi biblioteca',
            emptyFav: 'Aún no hay replays favoritos.',
            emptyAll: 'No hay replays disponibles por ahora.',
            emptyLibrary: 'No hay videos de biblioteca por ahora.',
            emptyFiltered: 'Ningún video coincide con estos filtros.',
            dashboard: 'Dashboard',
            sectionReplays: 'Replays',
            sectionLibrary: 'Biblioteca',
            all: 'Todos los replays',
            allLibrary: 'Todos los videos',
            fav: 'Mis favoritos',
            latest: 'Último replay',
            latestLibrary: 'Último video',
            history: 'Historial de replays',
            prev: 'Anterior',
            next: 'Cargar más',
            page: 'Página',
            play: 'Ver replay',
            soon: 'Pronto disponible',
            unknown: 'Estado desconocido · reintentar',
          }
        : {
            title: 'Mes replays & ma bibliothèque',
            emptyFav: 'Aucun replay favori pour le moment.',
            emptyAll: 'Aucun replay disponible pour le moment.',
            emptyLibrary: 'Aucune vidéo de bibliothèque pour le moment.',
            emptyFiltered: 'Aucune vidéo ne correspond à ces filtres.',
            dashboard: 'Dashboard',
            sectionReplays: 'Replays',
            sectionLibrary: 'Bibliothèque',
            all: 'Tous les replays',
            allLibrary: 'Toutes les vidéos',
            fav: 'Mes favoris',
            latest: 'Dernier replay',
            latestLibrary: 'Dernière vidéo',
            history: 'Historique des replays',
            prev: 'Précédent',
            next: 'Charger plus',
            page: 'Page',
            play: 'Lecture',
            soon: 'Bientôt disponible',
            unknown: 'Statut inconnu · réessayer',
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
  const section = sp.section === 'library' ? 'library' : 'replays';
  const tab = sp.tab === 'favorites' ? 'favorites' : 'all';
  const page = Math.max(1, Number(sp.page ?? '1') || 1);

  const langFilter = sp.lang === 'fr' || sp.lang === 'es' ? sp.lang : null;
  const typeFilter = isReplayCourseTypeKey(sp.type ?? '') ? sp.type : null;
  const levelFilter =
    typeof sp.level === 'string' && isCourseSkillLevel(sp.level) && sp.level !== 'all_levels' ? sp.level : null;
  const folderFilter = (sp.folder ?? '').trim() || null;

  await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('kind', 'replay_video')
    .is('read_at', null);

  const all = await getReplayLibraryForUser(user.id);
  const standalone = await getStandaloneVimeoLibraryForUser();

  const makeHref = (
    overrides: Partial<{
      section: string;
      tab: string;
      page: string;
      lang: string;
      type: string;
      level: string;
      folder: string;
    }> = {},
  ) => {
    const p = new URLSearchParams();
    const nextSection = overrides.section ?? section;
    const nextTab = overrides.tab ?? tab;
    const nextPage = overrides.page ?? String(page);
    const nextLang = overrides.lang !== undefined ? overrides.lang : langFilter ?? '';
    const nextType = overrides.type !== undefined ? overrides.type : typeFilter ?? '';
    const nextLevel = overrides.level !== undefined ? overrides.level : levelFilter ?? '';
    const nextFolder = overrides.folder !== undefined ? overrides.folder : folderFilter ?? '';
    if (nextSection !== 'replays') p.set('section', nextSection);
    if (nextTab !== 'all') p.set('tab', nextTab);
    if (nextPage !== '1') p.set('page', nextPage);
    if (nextLang) p.set('lang', nextLang);
    if (nextType) p.set('type', nextType);
    if (nextLevel) p.set('level', nextLevel);
    if (nextFolder) p.set('folder', nextFolder);
    const qs = p.toString();
    return qs ? `/compte/replays?${qs}` : '/compte/replays';
  };

  const sectionToggle = (
    <div className="mt-8 flex rounded-full border border-brand-ink/10 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      <Link
        href={makeHref({ section: 'replays', page: '1', folder: '', type: '', level: '', lang: '' })}
        className={`flex-1 rounded-full py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] transition-all ${
          section === 'replays'
            ? 'bg-[#C45D3E] text-[#FFF8F0] shadow-[0_6px_18px_rgba(196,93,62,0.35)]'
            : 'text-brand-ink/60 hover:text-brand-ink'
        }`}
      >
        {t.sectionReplays}
      </Link>
      <Link
        href={makeHref({ section: 'library', page: '1', type: '', level: '', lang: '', folder: '' })}
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
    const sortedStandalone = [...standalone].sort(
      (a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime(),
    );
    const featured = sortedStandalone[0] ?? null;
    const libraryFavoriteCount = standalone.filter((v) => v.isFavorite).length;

    const folderSet = new Set<string>();
    for (const v of standalone) {
      const f = normalizeFolder(v.folderName);
      if (f) folderSet.add(f);
    }
    const folders = [...folderSet].sort((a, b) => a.localeCompare(b, uiLang === 'es' ? 'es' : 'fr'));

    let filteredStandalone = tab === 'favorites' ? standalone.filter((v) => v.isFavorite) : standalone;
    if (folderFilter) {
      filteredStandalone = filteredStandalone.filter((v) => normalizeFolder(v.folderName) === folderFilter);
    }
    filteredStandalone = [...filteredStandalone].sort(
      (a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime(),
    );

    return (
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
        <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
        <header>
          <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
        </header>

        {sectionToggle}

        {featured || filteredStandalone.length > 0 ? (
          <section className="mt-10">
            <StandaloneVimeoGrid
              videos={filteredStandalone}
              lang={lang}
              showFeatured={Boolean(featured)}
              hideCategoryFilters
              featuredVideo={featured}
              filtersSlot={
                <div className="mt-10 space-y-3">
                  {/* Ligne 1 — Toutes / Favoris */}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={makeHref({ tab: 'all', page: '1', section: 'library', folder: '' })}
                      className={tab === 'all' ? CHIP_ACTIVE : CHIP_IDLE}
                    >
                      {t.allLibrary}
                    </Link>
                    <Link
                      href={makeHref({ tab: 'favorites', page: '1', section: 'library' })}
                      className={tab === 'favorites' ? CHIP_ACTIVE : CHIP_IDLE}
                    >
                      {t.fav} ({libraryFavoriteCount})
                    </Link>
                  </div>

                  {/* Ligne 2 — Catégories (dossiers Vimeo) */}
                  {folders.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={makeHref({ folder: '', page: '1', section: 'library' })}
                        className={!folderFilter ? CHIP_ACTIVE : CHIP_IDLE}
                      >
                        {t.allLibrary}
                      </Link>
                      {folders.map((folder) => (
                        <Link
                          key={folder}
                          href={makeHref({
                            folder: folderFilter === folder ? '' : folder,
                            page: '1',
                            section: 'library',
                          })}
                          className={folderFilter === folder ? CHIP_ACTIVE : CHIP_IDLE}
                        >
                          {folder}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              }
            />
          </section>
        ) : (
          <p className="mt-10 text-sm text-luxury-muted">
            {tab === 'favorites' ? t.emptyFav : t.emptyLibrary}
          </p>
        )}
      </main>
    );
  }

  // ——— REPLAYS ———
  // Hero = dernier replay global (indépendant des filtres)
  const hero =
    all.find((i) => i.isPlayable && i.playbackStatus === 'ready') ??
    all.find((i) => i.playbackStatus === 'unknown') ??
    all[0] ??
    null;

  const favorites = all.filter((i) => i.isFavorite);
  const tabbed = tab === 'favorites' ? all.filter((i) => i.isFavorite) : all;
  const filtered = tabbed.filter((i) => {
    if (langFilter && i.courseLanguage !== langFilter) return false;
    if (typeFilter && i.courseTypeKey !== typeFilter) return false;
    if (levelFilter && i.courseSkillLevel !== levelFilter) return false;
    return true;
  });

  const rest = hero ? filtered.filter((i) => i.recordingId !== hero.recordingId) : filtered;
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = rest.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const typeCounts = new Map<string, number>();
  for (const item of tabbed) {
    typeCounts.set(item.courseTypeKey, (typeCounts.get(item.courseTypeKey) ?? 0) + 1);
  }

  const heroDescription =
    hero?.courseDescription?.trim() ||
    (hero ? getReplayFallbackDescription(hero.courseTitle, lang) : '');
  const heroDate = hero ? formatFrenchSessionDate(hero.startsAt) : '';
  const heroPlayable = hero?.isPlayable === true && hero.playbackStatus === 'ready';
  const heroUnknown = hero?.playbackStatus === 'unknown';

  const filterBlock = (
    <div className="mt-10 space-y-3">
      {/* Ligne 1 — Tous / Favoris */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={makeHref({ tab: 'all', page: '1', lang: '', type: '', level: '' })}
          className={tab === 'all' ? CHIP_ACTIVE : CHIP_IDLE}
        >
          {t.all}
        </Link>
        <Link href={makeHref({ tab: 'favorites', page: '1' })} className={tab === 'favorites' ? CHIP_ACTIVE : CHIP_IDLE}>
          {t.fav} ({favorites.length})
        </Link>
      </div>

      {/* Ligne 2 — Langue */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={makeHref({ lang: langFilter === 'fr' ? '' : 'fr', page: '1' })}
          className={langFilter === 'fr' ? CHIP_ACTIVE : CHIP_IDLE}
        >
          FR
        </Link>
        <Link
          href={makeHref({ lang: langFilter === 'es' ? '' : 'es', page: '1' })}
          className={langFilter === 'es' ? CHIP_ACTIVE : CHIP_IDLE}
        >
          ES
        </Link>
      </div>

      {/* Ligne 3 — Type de cours */}
      <div className="flex flex-wrap gap-2">
        {REPLAY_COURSE_TYPE_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={makeHref({ type: typeFilter === opt.value ? '' : opt.value, page: '1' })}
            className={typeFilter === opt.value ? CHIP_ACTIVE : CHIP_IDLE}
          >
            {opt.label}
            {(typeCounts.get(opt.value) ?? 0) > 0 ? ` (${typeCounts.get(opt.value)})` : ''}
          </Link>
        ))}
      </div>

      {/* Ligne 4 — Niveau */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={makeHref({ level: '', page: '1' })}
          className={!levelFilter ? CHIP_ACTIVE : CHIP_IDLE}
        >
          {courseSkillLevelLabel('all_levels', uiLang)}
        </Link>
        {COURSE_SKILL_LEVELS.filter((l) => l !== 'all_levels').map((level) => (
          <Link
            key={level}
            href={makeHref({ level: levelFilter === level ? '' : level, page: '1' })}
            className={levelFilter === level ? CHIP_ACTIVE : CHIP_IDLE}
          >
            {courseSkillLevelLabel(level, uiLang)}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
      <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
      <header>
        <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
      </header>

      {sectionToggle}

      {!hero ? (
        <p className="mt-10 text-sm text-luxury-muted">{t.emptyAll}</p>
      ) : (
        <>
          <section className="glass-card mt-10 grid gap-6 overflow-hidden p-6 md:grid-cols-2 md:p-8">
            <div className="relative overflow-hidden rounded-t-2xl border border-white/35 bg-white/25 md:rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.coverImageUrl}
                alt=""
                className="aspect-[16/10] h-full w-full object-cover md:aspect-auto md:min-h-[260px]"
              />
              {hero.courseLanguage ? (
                <span className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-lg shadow-md backdrop-blur-md md:h-10 md:w-10 md:text-xl">
                  <CourseLanguageFlag language={hero.courseLanguage} uiLang={lang} className="text-lg md:text-xl" />
                </span>
              ) : null}
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
                    {heroUnknown ? t.unknown : t.soon}
                  </span>
                )}
              </div>
            </div>
          </section>

          {filterBlock}

          {paginated.length > 0 ? (
            <section className="mt-10">
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
          ) : (
            <p className="mt-10 text-sm text-luxury-muted">
              {tab === 'favorites' && favorites.length === 0 ? t.emptyFav : t.emptyFiltered}
            </p>
          )}
        </>
      )}
    </main>
  );
}
