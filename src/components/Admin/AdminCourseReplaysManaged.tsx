'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Play } from 'lucide-react';

import { setCourseReplayClientVisibilityAction } from '@/app/admin/replays/actions';
import { VideoModal } from '@/components/Admin/VideoModal';
import type { PendingCourseReplayCard } from '@/components/Admin/AdminCourseReplaysPending';
import type { AdminVimeoVideoCard } from '@/types/vimeo';

export type ManagedCourseReplayCard = PendingCourseReplayCard & {
  is_ready: boolean;
};

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function toPreviewCard(v: ManagedCourseReplayCard): AdminVimeoVideoCard {
  return {
    id: v.id,
    vimeo_video_id: v.vimeo_video_id,
    title: v.title ?? v.course_title,
    description: `Séance : ${v.course_title}`,
    thumbnail_url: v.thumbnail_url,
    duration_seconds: v.duration_seconds,
    embed_url: v.embed_url,
    validation_status: 'published',
    vimeo_folder_name: null,
    published_at: null,
    scheduled_publication_at: null,
    rejection_reason: null,
    is_hidden: !v.is_ready,
    hidden_at: null,
    created_at: v.created_at,
  };
}

type Props = {
  items: ManagedCourseReplayCard[];
};

export function AdminCourseReplaysManaged({ items }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState<ManagedCourseReplayCard | null>(null);
  const [, startTransition] = useTransition();

  function setVisible(recordingId: string, visible: boolean) {
    setBusyId(recordingId);
    startTransition(async () => {
      try {
        const res = await setCourseReplayClientVisibilityAction(recordingId, visible);
        if (!res.ok) {
          window.alert(res.message);
          return;
        }
        router.refresh();
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <section id="course-replays-approved" className="mt-14 scroll-mt-28">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-luxury-soft">
        Validés <span className="text-luxury-orange">({items.length})</span>
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-luxury-muted">
        Replays déjà validés : vous pouvez les masquer / réafficher côté cliente sans les retirer de cette liste.
      </p>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/60 bg-white/30 px-4 py-10 text-center text-sm text-luxury-muted backdrop-blur-md">
          Aucun replay validé pour le moment.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((v) => (
            <div
              key={v.id}
              className={`glass-card flex flex-col gap-4 border border-white/75 bg-white/45 p-5 shadow-[0_8px_30px_rgba(29,29,31,0.06)] backdrop-blur-[20px] lg:flex-row ${
                !v.is_ready ? 'opacity-70' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setPreview(v)}
                className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black/10 text-left transition hover:ring-2 hover:ring-[#C45D3E]/45 lg:h-40 lg:w-64 lg:shrink-0"
                title="Prévisualiser la vidéo"
              >
                {v.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-medium text-luxury-muted">
                    Vignette indisponible
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-ink shadow">
                    <Play size={12} aria-hidden />
                    Prévisualiser
                  </span>
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-luxury-ink">{v.course_title}</p>
                  {!v.is_ready ? (
                    <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                      Masqué
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                      Visible cliente
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-luxury-muted">{v.title ?? `Vidéo ${v.vimeo_video_id}`}</p>
                <p className="mt-2 text-xs text-luxury-muted">
                  Séance{' '}
                  {new Date(v.course_starts_at).toLocaleString('fr-FR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  {' · '}
                  Vimeo {v.vimeo_video_id} · Durée {formatDuration(v.duration_seconds)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:items-start">
                <button
                  type="button"
                  disabled={busyId === v.id}
                  onClick={() => setVisible(v.id, !v.is_ready)}
                  className="rounded-full border border-[#C45D3E]/40 bg-[#C45D3E]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#C45D3E] transition hover:bg-[#C45D3E]/15 disabled:opacity-50"
                >
                  {v.is_ready ? 'Masquer' : 'Réafficher'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(v)}
                  className="rounded-full border border-white/50 bg-white/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-luxury-ink backdrop-blur-md transition hover:bg-white/50"
                >
                  Prévisualiser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <VideoModal video={preview ? toPreviewCard(preview) : null} onClose={() => setPreview(null)} />
    </section>
  );
}
