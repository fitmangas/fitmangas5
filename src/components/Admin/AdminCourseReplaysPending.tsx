'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  approveCourseReplayAction,
  rejectCourseReplayAction,
} from '@/app/admin/replays/actions';

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

type Props = {
  pending: PendingCourseReplayCard[];
};

export function AdminCourseReplaysPending({ pending }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
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
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black/10 lg:h-40 lg:w-64 lg:shrink-0">
                {v.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-medium text-luxury-muted">
                    Vignette indisponible
                  </div>
                )}
              </div>
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
    </section>
  );
}
