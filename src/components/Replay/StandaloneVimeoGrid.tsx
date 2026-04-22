'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';

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
}: {
  videos: StandaloneVimeoLibraryItem[];
}) {
  const [selected, setSelected] = useState<StandaloneVimeoLibraryItem | null>(null);

  const grouped = useMemo(() => {
    const byFolder = new Map<string, StandaloneVimeoLibraryItem[]>();
    for (const video of videos) {
      const key = video.folderName?.trim() || 'Sans dossier';
      const arr = byFolder.get(key) ?? [];
      arr.push(video);
      byFolder.set(key, arr);
    }
    const keys = [...byFolder.keys()].sort((a, b) => a.localeCompare(b, 'fr'));
    return { byFolder, keys };
  }, [videos]);

  return (
    <>
      <div className="mb-12 space-y-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Abonnement online</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-luxury-ink">Vidéos exclusives</h3>
        </div>
        {grouped.keys.map((folder) => (
          <div key={folder}>
            <h4 className="border-b border-white/30 pb-2 text-sm font-semibold uppercase tracking-[0.12em] text-luxury-ink">
              {folder}
            </h4>
            <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(grouped.byFolder.get(folder) ?? []).map((video) => (
                <li key={video.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(video)}
                    className="group block w-full overflow-hidden rounded-2xl border border-white/50 bg-white/35 text-left shadow-sm backdrop-blur-md transition hover:border-[#ff7a00]/40 hover:shadow-md"
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
                        <div className="flex h-full items-center justify-center text-xs text-luxury-soft">Vimeo</div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 font-semibold text-luxury-ink">{video.title ?? `Vidéo ${video.vimeoVideoId}`}</p>
                      {video.durationSeconds != null ? (
                        <p className="mt-1 text-xs tabular-nums text-luxury-muted">{formatStandaloneDuration(video.durationSeconds)}</p>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
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
                  {selected.title ?? `Vidéo ${selected.vimeoVideoId}`}
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
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-black/10 bg-black shadow-inner">
                <iframe
                  src={embedSrc(selected)}
                  title={selected.title ?? 'Vimeo'}
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
