'use client';

import { X } from 'lucide-react';

import type { AdminVimeoVideoCard } from '@/types/vimeo';

function normalizeVimeoIframeSrc(url: string): string {
  return url.trim().replace(/&amp;/g, '&');
}

function embedSrc(v: AdminVimeoVideoCard): string {
  const u = v.embed_url?.trim();
  if (u) return normalizeVimeoIframeSrc(u);
  return `https://player.vimeo.com/video/${v.vimeo_video_id}`;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type Props = {
  video: AdminVimeoVideoCard | null;
  onClose: () => void;
};

export function VideoModal({ video, onClose }: Props) {
  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-labelledby="vimeo-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4">
          <div className="min-w-0">
            <h2 id="vimeo-modal-title" className="text-lg font-semibold text-luxury-ink">
              {video.title ?? `Vidéo ${video.vimeo_video_id}`}
            </h2>
            <p className="mt-1 text-xs text-luxury-muted">
              {formatDuration(video.duration_seconds)} · Vimeo {video.vimeo_video_id}
              {video.vimeo_folder_name ? ` · ${video.vimeo_folder_name}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-black/10 bg-white p-2 text-luxury-ink transition hover:bg-black/5"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-black/10 bg-black shadow-inner">
            <iframe
              src={embedSrc(video)}
              title={video.title ?? 'Vimeo'}
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
          {video.description ? (
            <div className="mt-5 text-sm leading-relaxed text-luxury-ink/90">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Description</p>
              <p className="mt-2 whitespace-pre-wrap">{video.description}</p>
            </div>
          ) : (
            <p className="mt-5 text-sm text-luxury-muted">Aucune description.</p>
          )}
        </div>
      </div>
    </div>
  );
}
