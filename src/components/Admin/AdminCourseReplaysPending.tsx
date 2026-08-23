'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Play } from 'lucide-react';

import {
  approveCourseReplayAction,
  rejectCourseReplayAction,
} from '@/app/admin/replays/actions';
import { VideoModal } from '@/components/Admin/VideoModal';
import type { AdminVimeoVideoCard } from '@/types/vimeo';

export type PendingCourseReplayCard = {
  id: string;
  vimeo_video_id: string;
  title: string | null;
  thumbnail_url: string | null;
  embed_url: string | null;
  duration_seconds: number | null;
  upload_status: string;
  created_at: string;
  course_id: string;
  course_title: string;
  course_starts_at: string;
};

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function toPreviewCard(v: PendingCourseReplayCard): AdminVimeoVideoCard {
  return {
    id: v.id,
    vimeo_video_id: v.vimeo_video_id,
    title: v.title ?? v.course_title,
    description: `Séance : ${v.course_title}`,
    thumbnail_url: v.thumbnail_url,
    duration_seconds: v.duration_seconds,
    embed_url: v.embed_url,
    validation_status: 'pending',
    vimeo_folder_name: null,
    published_at: null,
    scheduled_publication_at: null,
    rejection_reason: null,
    is_hidden: false,
    hidden_at: null,
    created_at: v.created_at,
  };
}

type Props = {
  pending: PendingCourseReplayCard[];
};

export function AdminCourseReplaysPending({ pending }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PendingCourseReplayCard | null>(null);
  const [, startTransition] = useTransition();

  function runAction(recordingId: string, action: 'approve' | 'reject') {
    setBusyId(recordingId);
    startTransition(async () => {
      try {
        const res =
          action === 'approve'
            ? await approveCourseReplayAction(recordingId)
            : await rejectCourseReplayAction(recordingId);
        if (!res.ok) {
          window.alert(res.message);
          return;
        }
        setPreview(null);
        router.refresh();
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <section id="course-replays-pending" className="scroll-mt-28">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-luxury-soft">
        En attente <span className="text-luxury-orange">({pending.length})</span>
      </h2>

      {pending.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/60 bg-white/30 px-4 py-10 text-center text-sm text-luxury-muted backdrop-blur-md">
          Aucun replay de séance en attente. Liez une vidéo Vimeo depuis{' '}
          <a href="/admin/courses" className="font-medium text-luxury-ink underline">
            Séances
          </a>
          .
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {pending.map((v) => (
            <div
              key={v.id}
              className="glass-card flex flex-col gap-4 border border-white/75 bg-white/45 p-5 shadow-[0_8px_30px_rgba(29,29,31,0.06)] backdrop-blur-[20px] lg:flex-row"
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
                <p className="text-base font-semibold text-luxury-ink">{v.course_title}</p>
                <p className="mt-1 truncate text-sm text-luxury-muted">{v.title ?? `Vidéo ${v.vimeo_video_id}`}</p>
                <p className="mt-2 text-xs text-luxury-muted">
                  Séance{' '}
                  {new Date(v.course_starts_at).toLocaleString('fr-FR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  {' · '}
                  Vimeo {v.vimeo_video_id} · Durée {formatDuration(v.duration_seconds)} · Statut transcode{' '}
                  <span className="font-medium text-luxury-ink/80">{v.upload_status}</span>
                </p>
                {v.upload_status !== 'ready' ? (
                  <p className="mt-2 text-xs text-amber-900">
                    Fichier Vimeo pas lisible. Si ça dépasse 24 h, l’upload a échoué — le MP4 est peut‑être encore
                    sur le serveur live.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setPreview(v)}
                  className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C45D3E] underline-offset-2 hover:underline"
                >
                  Ouvrir la prévisualisation
                </button>
              </div>
              <div className="flex flex-wrap gap-2 lg:items-start">
                <button
                  type="button"
                  disabled={busyId === v.id}
                  onClick={() => runAction(v.id, 'approve')}
                  className="btn-luxury-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  Valider
                </button>
                <button
                  type="button"
                  disabled={busyId === v.id}
                  onClick={() => runAction(v.id, 'reject')}
                  className="rounded-full border border-white/50 bg-white/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-luxury-ink backdrop-blur-md transition hover:bg-white/50 disabled:opacity-50"
                >
                  Rejeter
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
