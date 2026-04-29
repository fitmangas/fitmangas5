'use client';

import { useMemo, useState } from 'react';
import { Heart, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { StandaloneVimeoLibraryItem } from '@/lib/standalone-vimeo-library';

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

export function StandaloneVimeoGrid({
  videos,
  lang = 'fr',
}: {
  videos: StandaloneVimeoLibraryItem[];
  lang?: 'fr' | 'en' | 'es';
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<StandaloneVimeoLibraryItem | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>(
    Object.fromEntries(videos.map((v) => [v.id, v.isFavorite === true])),
  );
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const locale = lang === 'en' ? 'en' : lang === 'es' ? 'es' : 'fr';
  const t =
    lang === 'en'
      ? {
          online: 'Online subscription',
          exclusive: 'Exclusive videos',
          unfold: 'Expand all',
          fold: 'Collapse all',
          show: 'Show',
          hide: 'Hide',
          removeFav: 'Remove from favorites',
          addFav: 'Add to favorites',
          vimeo: 'Vimeo',
          video: 'Video',
          close: 'Close',
          favError: 'Unable to update favorite right now.',
        }
      : lang === 'es'
        ? {
            online: 'Suscripción online',
            exclusive: 'Videos exclusivos',
            unfold: 'Desplegar todo',
            fold: 'Plegar todo',
            show: 'Mostrar',
            hide: 'Ocultar',
            removeFav: 'Quitar de favoritos',
            addFav: 'Añadir a favoritos',
            vimeo: 'Vimeo',
            video: 'Video',
            close: 'Cerrar',
            favError: 'No se puede actualizar favorito por ahora.',
          }
        : {
            online: 'Abonnement online',
            exclusive: 'Vidéos exclusives',
            unfold: 'Tout déplier',
            fold: 'Tout replier',
            show: 'Afficher',
            hide: 'Masquer',
            removeFav: 'Retirer des favoris',
            addFav: 'Ajouter aux favoris',
            vimeo: 'Vimeo',
            video: 'Vidéo',
            close: 'Fermer',
            favError: "Impossible d'ajouter ce favori pour le moment.",
          };

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
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? 'toggle failed');
      }
      router.refresh();
    } catch {
      setFavorites((prev) => ({ ...prev, [videoId]: !next }));
      alert(t.favError);
    }
  }

  const grouped = useMemo(() => {
    const byFolder = new Map<string, StandaloneVimeoLibraryItem[]>();
    for (const video of videos) {
      const key = video.folderName?.trim() || 'Sans dossier';
      const arr = byFolder.get(key) ?? [];
      arr.push(video);
      byFolder.set(key, arr);
    }
    const keys = [...byFolder.keys()].sort((a, b) => a.localeCompare(b, locale));
    return { byFolder, keys };
  }, [videos]);
  const allCollapsed = grouped.keys.length > 0 && grouped.keys.every((k) => collapsedFolders[k] === true);

  function toggleFolder(folder: string) {
    setCollapsedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  }

  function toggleAllFolders() {
    if (grouped.keys.length === 0) return;
    if (allCollapsed) {
      setCollapsedFolders({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const key of grouped.keys) next[key] = true;
    setCollapsedFolders(next);
  }

  return (
    <>
      <div className="mb-12 space-y-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.online}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-luxury-ink">{t.exclusive}</h3>
          {grouped.keys.length > 0 ? (
            <button
              type="button"
              onClick={toggleAllFolders}
              className="mt-3 rounded-full border border-white/45 bg-white/55 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-muted transition hover:bg-white/75"
            >
              {allCollapsed ? t.unfold : t.fold}
            </button>
          ) : null}
        </div>
        {grouped.keys.map((folder) => (
          <div key={folder}>
            <button
              type="button"
              onClick={() => toggleFolder(folder)}
              className="flex w-full items-center justify-between border-b border-white/30 pb-2 text-left"
              aria-expanded={!collapsedFolders[folder]}
            >
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-luxury-ink">{folder}</h4>
              <span className="text-xs font-semibold text-luxury-muted">
                {collapsedFolders[folder] ? t.show : t.hide}
              </span>
            </button>
            {!collapsedFolders[folder] ? (
              <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(grouped.byFolder.get(folder) ?? []).map((video) => (
                <li key={video.id}>
                  <div className="group relative block w-full overflow-hidden rounded-2xl border border-white/50 bg-white/35 text-left shadow-sm backdrop-blur-md transition hover:border-[#ff7a00]/40 hover:shadow-md">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void toggleFavorite(video.id);
                      }}
                      className="absolute left-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/45 text-white shadow-lg backdrop-blur-md"
                      aria-label={favorites[video.id] ? t.removeFav : t.addFav}
                    >
                      <Heart size={16} className={favorites[video.id] ? 'fill-rose-400 text-rose-400' : 'text-white'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelected(video)}
                      className="block w-full text-left"
                    >
                    <div className="relative aspect-video bg-black/10">
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
                      <p className="line-clamp-2 font-semibold text-luxury-ink">{video.title ?? `${t.video} ${video.vimeoVideoId}`}</p>
                      {video.durationSeconds != null ? (
                        <p className="mt-1 text-xs tabular-nums text-luxury-muted">{formatStandaloneDuration(video.durationSeconds)}</p>
                      ) : null}
                    </div>
                    </button>
                  </div>
                </li>
              ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>

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
                  {selected.title ?? `${t.video} ${selected.vimeoVideoId}`}
                </h2>
                <p className="mt-1 text-xs text-luxury-muted">
                  {formatStandaloneDuration(selected.durationSeconds)} · Vimeo {selected.vimeoVideoId}
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
                  title={selected.title ?? t.vimeo}
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
