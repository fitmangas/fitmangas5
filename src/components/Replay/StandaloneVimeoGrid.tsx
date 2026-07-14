'use client';

import { useMemo, useState } from 'react';
import { Heart, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { StandaloneVimeoLibraryItem } from '@/lib/standalone-vimeo-library';
import { VIMEO_FOLDER_UNCATEGORIZED } from '@/lib/vimeo-folder';

function formatStandaloneDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function normalizeVimeoIframeSrc(url: string): string {
  return url.trim().replace(/&amp;/g, '&');
}

function embedSrc(video: StandaloneVimeoLibraryItem): string {
  const raw = video.embedUrl?.trim();
  if (raw) return normalizeVimeoIframeSrc(raw);
  return `https://player.vimeo.com/video/${video.vimeoVideoId}`;
}

function normalizeFolder(name: string | null | undefined): string | null {
  const key = name?.trim() || '';
  if (!key || key === VIMEO_FOLDER_UNCATEGORIZED || key === 'Sans dossier' || key.toLowerCase() === 'non classé') {
    return null;
  }
  return key;
}

const ACTIVE_CHIP =
  'rounded-full bg-[#C45D3E] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FFF8F0] shadow-[0_6px_18px_rgba(196,93,62,0.28)]';
const IDLE_CHIP =
  'rounded-full border border-white/45 bg-white/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-muted transition hover:bg-white/70';

export function StandaloneVimeoGrid({
  videos,
  lang = 'fr',
  showFeatured = false,
}: {
  videos: StandaloneVimeoLibraryItem[];
  lang?: 'fr' | 'en' | 'es';
  showFeatured?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<StandaloneVimeoLibraryItem | null>(null);
  const [category, setCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<Record<string, boolean>>(
    Object.fromEntries(videos.map((v) => [v.id, v.isFavorite === true])),
  );
  const locale = lang === 'en' ? 'en' : lang === 'es' ? 'es' : 'fr';

  const t =
    lang === 'en'
      ? {
          all: 'All videos',
          removeFav: 'Remove from favorites',
          addFav: 'Add to favorites',
          vimeo: 'Vimeo',
          video: 'Video',
          close: 'Close',
          favError: 'Unable to update favorite right now.',
          latest: 'Latest video',
          play: 'Play',
          noDesc: 'On-demand video from your Fit Mangas library.',
          empty: 'No video in this category.',
          filter: 'Category',
        }
      : lang === 'es'
        ? {
            all: 'Todos los videos',
            removeFav: 'Quitar de favoritos',
            addFav: 'Añadir a favoritos',
            vimeo: 'Vimeo',
            video: 'Video',
            close: 'Cerrar',
            favError: 'No se puede actualizar favorito por ahora.',
            latest: 'Último video',
            play: 'Ver',
            noDesc: 'Video a la carta de tu biblioteca Fit Mangas.',
            empty: 'No hay videos en esta categoría.',
            filter: 'Categoría',
          }
        : {
            all: 'Toutes les vidéos',
            removeFav: 'Retirer des favoris',
            addFav: 'Ajouter aux favoris',
            vimeo: 'Vimeo',
            video: 'Vidéo',
            close: 'Fermer',
            favError: "Impossible d'ajouter ce favori pour le moment.",
            latest: 'Dernière vidéo',
            play: 'Lecture',
            noDesc: 'Vidéo à la demande de ta bibliothèque Fit Mangas.',
            empty: 'Aucune vidéo dans cette catégorie.',
            filter: 'Catégorie',
          };

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const v of videos) {
      const f = normalizeFolder(v.folderName);
      if (f) set.add(f);
    }
    return [...set].sort((a, b) => a.localeCompare(b, locale));
  }, [videos, locale]);

  const filtered = useMemo(() => {
    if (category === 'all') return videos;
    return videos.filter((v) => normalizeFolder(v.folderName) === category);
  }, [videos, category]);

  /** Hero figé sur la dernière vidéo globale — indépendant du filtre. */
  const featured = showFeatured ? videos[0] ?? null : null;
  const gridVideos = useMemo(() => {
    const list = filtered;
    if (!featured) return list;
    return list.filter((v) => v.id !== featured.id);
  }, [filtered, featured]);

  async function toggleFavorite(videoId: string) {
    const next = !(favorites[videoId] === true);
    setFavorites((prev) => ({ ...prev, [videoId]: next }));
    try {
      const res = await fetch('/api/client/replays/standalone-favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, favorite: next }),
      });
      if (!res.ok) {
        throw new Error('toggle failed');
      }
      router.refresh();
    } catch {
      setFavorites((prev) => ({ ...prev, [videoId]: !next }));
      alert(t.favError);
    }
  }

  const categoryFilters = (
    <div className="mb-6">
      <div className="hidden flex-wrap gap-2 md:flex">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={category === 'all' ? ACTIVE_CHIP : IDLE_CHIP}
        >
          {t.all}
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={category === c ? ACTIVE_CHIP : IDLE_CHIP}
          >
            {c}
          </button>
        ))}
      </div>

      <label className="block md:hidden">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">
          {t.filter}
        </span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-full border border-white/45 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none"
        >
          <option value="all">{t.all}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <>
      {featured ? (
        <section className="glass-card mb-8 grid gap-6 overflow-hidden p-6 md:grid-cols-2 md:p-8">
          <button
            type="button"
            onClick={() => setSelected(featured)}
            className="overflow-hidden rounded-t-2xl border border-white/35 bg-white/25 text-left md:rounded-2xl"
          >
            {featured.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.thumbnailUrl}
                alt=""
                className="aspect-[16/10] h-full w-full object-cover md:aspect-auto md:min-h-[260px]"
              />
            ) : (
              <div className="flex aspect-[16/10] min-h-[220px] items-center justify-center bg-gradient-to-br from-[#C45D3E]/80 via-[#E8D5C4] to-[#F7F1EA] md:min-h-[260px]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white">{t.vimeo}</span>
              </div>
            )}
          </button>
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-600">{t.latest}</p>
            <h2 className="hero-signature-title mt-3 break-words text-3xl">{featured.displayTitle}</h2>
            {featured.publishedAt ? (
              <p className="mt-2 text-sm font-medium text-luxury-ink/80">
                {new Date(featured.publishedAt).toLocaleDateString(
                  locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'fr-FR',
                  { day: 'numeric', month: 'long', year: 'numeric' },
                )}
              </p>
            ) : null}
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-luxury-muted">
              {featured.description?.trim() || t.noDesc}
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setSelected(featured)}
                className="btn-luxury-primary px-6 py-2.5 text-[11px] tracking-[0.12em]"
              >
                {t.play}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {categoryFilters}

      {gridVideos.length === 0 ? (
        <p className="text-sm text-luxury-muted">{t.empty}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gridVideos.map((video) => (
            <li key={video.id}>
              <div className="group relative block w-full overflow-hidden rounded-2xl border border-white/50 bg-white/35 text-left shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-[#C45D3E]/40 hover:shadow-md">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void toggleFavorite(video.id);
                  }}
                  className="absolute left-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/45 text-white shadow-lg backdrop-blur-md"
                  aria-label={favorites[video.id] ? t.removeFav : t.addFav}
                >
                  <Heart size={16} className={favorites[video.id] ? 'fill-rose-400 text-rose-400' : 'text-white'} />
                </button>
                <button type="button" onClick={() => setSelected(video)} className="block w-full text-left">
                  <div className="relative aspect-video rounded-t-2xl bg-black/10">
                    {video.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:opacity-95"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-luxury-soft">{t.vimeo}</div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 font-semibold text-luxury-ink">{video.displayTitle}</p>
                    {video.durationSeconds != null ? (
                      <p className="mt-1 text-xs tabular-nums text-luxury-muted">
                        {formatStandaloneDuration(video.durationSeconds)}
                      </p>
                    ) : null}
                  </div>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-labelledby="standalone-video-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
            <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4">
              <div className="min-w-0">
                <h2 id="standalone-video-title" className="text-lg font-semibold text-luxury-ink">
                  {selected.displayTitle}
                </h2>
                <p className="mt-1 text-xs text-luxury-muted">
                  {formatStandaloneDuration(selected.durationSeconds)}
                  {selected.folderName ? ` · ${selected.folderName}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="shrink-0 rounded-full border border-black/10 bg-white p-2 text-luxury-ink transition hover:bg-black/5"
                aria-label={t.close}
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-black/10 bg-black shadow-inner">
                <iframe
                  src={embedSrc(selected)}
                  title={selected.displayTitle}
                  className="h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
