'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { VideoModal } from '@/components/Admin/VideoModal';
import { GroupCollapse } from '@/components/Admin/GroupCollapse';
import { VideoValidationSection } from '@/components/Admin/VideoValidationSection';
import { VimeoSyncAllButton } from '@/components/Admin/VimeoSyncAllButton';
import type { AdminVimeoVideoCard } from '@/types/vimeo';

export type AdminVimeoLibraryPayload = {
  awaiting: AdminVimeoVideoCard[];
  publishedByFolder: Record<string, AdminVimeoVideoCard[]>;
  publishedFolderKeys: string[];
  rejected: AdminVimeoVideoCard[];
  fetchError?: string | null;
};

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AdminVimeoLibraryClient({
  awaiting,
  publishedByFolder,
  publishedFolderKeys,
  rejected,
  fetchError,
}: AdminVimeoLibraryPayload) {
  const [preview, setPreview] = useState<AdminVimeoVideoCard | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let toastTimer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const r = await fetch('/api/admin/standalone-videos/pending-count');
        const d = (await r.json()) as { pending?: number };
        const n = typeof d.pending === 'number' ? d.pending : 0;
        if (cancelled) return;
        if (prevCountRef.current !== null && n > prevCountRef.current) {
          setToast('Nouvelle vidéo à valider');
          toastTimer = setTimeout(() => setToast(null), 6000);
        }
        prevCountRef.current = n;
      } catch {
        if (!cancelled) prevCountRef.current = null;
      }
    }

    void poll();
    const interval = setInterval(() => void poll(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, []);

  const publishedCount = publishedFolderKeys.reduce(
    (acc, k) => acc + (publishedByFolder[k]?.length ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[600] max-w-sm -translate-x-1/2 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-medium text-orange-950 shadow-lg">
          {toast}
        </div>
      ) : null}

      <VideoModal video={preview} onClose={() => setPreview(null)} />

      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-white/25 pb-8">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Vimeo</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-luxury-ink md:text-4xl">Bibliothèque vidéo</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-luxury-muted">
            Webhook → <strong>en attente</strong> ; validation ou publication programmée ; clients abonnés online uniquement.
          </p>
          {fetchError ? (
            <p className="mt-3 text-sm text-red-700">
              Impossible de lire la bibliothèque : {fetchError}. Vérifie les migrations Supabase (010–012).
            </p>
          ) : null}
          <div className="mt-6">
            <VimeoSyncAllButton />
          </div>
        </div>
        <Link href="/admin" className="btn-luxury-ghost shrink-0 px-5 py-2.5 text-[10px] tracking-[0.14em]">
          ← Dashboard
        </Link>
      </div>

      <VideoValidationSection videos={awaiting} />

      <section className="mt-14">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-luxury-soft">
          Publiées <span className="text-luxury-muted">({publishedCount})</span>
        </h2>
        {publishedCount === 0 ? (
          <p className="mt-5 text-center text-sm text-luxury-muted">Aucune vidéo publiée pour l’instant.</p>
        ) : (
          <div className="mt-8 space-y-10">
            {publishedFolderKeys.map((folder) => (
              <GroupCollapse key={folder} groupKey={folder} title={folder} count={publishedByFolder[folder]?.length ?? 0}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {(publishedByFolder[folder] ?? []).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setPreview(v)}
                      className="glass-card overflow-hidden border border-white/75 bg-white/45 text-left shadow-[0_8px_30px_rgba(29,29,31,0.06)] backdrop-blur-[20px] transition hover:border-white hover:shadow-[0_14px_40px_rgba(29,29,31,0.09)]"
                    >
                      <div className="relative aspect-video bg-black/10">
                        {v.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[11px] text-luxury-soft">
                            Pas d’aperçu
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="line-clamp-2 text-sm font-semibold text-luxury-ink">
                          {v.title ?? `Vidéo ${v.vimeo_video_id}`}
                        </p>
                        <p className="mt-1 text-[11px] text-luxury-muted">{formatDuration(v.duration_seconds)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </GroupCollapse>
            ))}
          </div>
        )}
      </section>

      {rejected.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-luxury-soft">
            Rejetées <span className="text-luxury-muted">({rejected.length})</span>
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-luxury-muted">
            {rejected.map((v) => (
              <li key={v.id}>
                {v.title ?? v.vimeo_video_id} · ID {v.vimeo_video_id}
                {v.vimeo_folder_name ? ` · ${v.vimeo_folder_name}` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
