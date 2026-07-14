'use client';

import { useState } from 'react';
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

/** Grille plate (dashboard) : 3 vignettes sans dossiers. */
export function StandaloneVimeoFlatCards({
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
  const t =
    lang === 'en'
      ? { removeFav: 'Remove from favorites', addFav: 'Add to favorites', video: 'Video', close: 'Close', favError: 'Unable to update favorite.' }
      : lang === 'es'
        ? { removeFav: 'Quitar de favoritos', addFav: 'Añadir a favoritos', video: 'Video', close: 'Cerrar', favError: 'No se puede actualizar favorito.' }
        : { removeFav: 'Retirer des favoris', addFav: 'Ajouter aux favoris', video: 'Vidéo', close: 'Fermer', favError: "Impossible d'ajouter ce favori." };

  async function toggleFavorite(videoId: string) {
    const next = !(favorites[videoId] === true);
    setFavorites((prev) => ({ ...prev, [videoId]: next }));
    try {
      const res = await fetch('/api/client/replays/standalone-favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, favorite: next }),
      });
      if (!res.ok) throw new Error('toggle failed');
      router.refresh();
    } catch {
      setFavorites((prev) => ({ ...prev, [videoId]: !next }));
      alert(t.favError);
    }
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
        {videos.map((video) => (
          <li key={video.id}>
            <div className="group relative overflow-hidden rounded-2xl border border-white/50 bg-white/35 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-[#C45D3E]/40">
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
                    <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#C45D3E]/70 to-[#E8D5C4] text-xs text-white">
                      Vimeo
                    </div>
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

      {selected ? (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
            <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-lg font-semibold text-luxury-ink">{selected.displayTitle}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="shrink-0 rounded-full border border-black/10 bg-white p-2.5"
                aria-label={t.close}
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-5 pb-5 pt-4">
              <div className="aspect-video overflow-hidden rounded-2xl bg-black">
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
