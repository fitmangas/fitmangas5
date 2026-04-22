'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ScheduleModal } from '@/components/Admin/ScheduleModal';
import type { AdminVimeoVideoCard } from '@/types/vimeo';
import { VIMEO_FOLDER_UNCATEGORIZED } from '@/lib/vimeo-folder';

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function Countdown({ iso }: { iso: string }) {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(iso).getTime();
  const diff = target - Date.now();
  if (diff <= 0) {
    return <span className="font-medium text-luxury-orange">Publication imminente…</span>;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return <span>Dans {d} j {h} h</span>;
  if (h > 0) return <span>Dans {h} h {m} min</span>;
  if (m > 0) return <span>Dans {m} min {s} s</span>;
  return <span>Dans {s} s</span>;
}

type Props = {
  videos: AdminVimeoVideoCard[];
};

export function VideoValidationSection({ videos }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [scheduleFor, setScheduleFor] = useState<AdminVimeoVideoCard | null>(null);

  async function validate(videoId: string, action: 'approve' | 'reject') {
    setBusyId(videoId);
    try {
      const body =
        action === 'reject'
          ? { action: 'reject' as const, rejection_reason: null }
          : { action: 'approve' as const };

      const res = await fetch(`/api/admin/vimeo/${videoId}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        window.alert(json.error ?? 'Action impossible.');
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function scheduleSave(isoUtc: string) {
    if (!scheduleFor) return;
    const res = await fetch(`/api/admin/vimeo/${scheduleFor.id}/schedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduled_at: isoUtc }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      throw new Error(json.error ?? 'Programmation impossible.');
    }
    router.refresh();
  }

  async function clearSchedule(videoId: string) {
    setBusyId(videoId);
    try {
      const res = await fetch(`/api/admin/vimeo/${videoId}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: null }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        window.alert(json.error ?? 'Impossible d’annuler.');
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <section id="vimeo-pending-section" className="mt-10 scroll-mt-28">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-luxury-soft">
          En attente <span className="text-luxury-orange">({videos.length})</span>
        </h2>

        {videos.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/60 bg-white/30 px-4 py-10 text-center text-sm text-luxury-muted backdrop-blur-md">
            Aucune vidéo en attente. Les uploads Vimeo arrivent via le webhook{' '}
            <code className="rounded bg-white/50 px-1.5 py-0.5 font-mono text-xs text-luxury-ink">/api/webhooks/vimeo</code>{' '}
            ; la synchro manuelle ne remplace pas une file d’attente.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {videos.map((v) => (
              <div
                key={v.id}
                className="glass-card flex flex-col gap-4 border border-white/75 bg-white/45 p-5 shadow-[0_8px_30px_rgba(29,29,31,0.06)] backdrop-blur-[20px] sm:flex-row sm:items-center"
              >
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-black/10 sm:h-28 sm:w-44">
                  {v.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[11px] text-luxury-soft">Pas d’aperçu</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-luxury-ink">{v.title ?? `Vidéo ${v.vimeo_video_id}`}</p>
                  <p className="mt-1 text-xs text-luxury-muted">
                    <span className="font-medium text-luxury-ink/80">{v.vimeo_folder_name ?? VIMEO_FOLDER_UNCATEGORIZED}</span>
                    {' · '}
                    Vimeo ID {v.vimeo_video_id} · Durée {formatDuration(v.duration_seconds)} · Reçue{' '}
                    {new Date(v.created_at).toLocaleString('fr-FR')}
                  </p>
                  {v.validation_status === 'scheduled' && v.scheduled_publication_at ? (
                    <div className="mt-2 space-y-1 text-xs">
                      <p className="text-luxury-ink">
                        <span className="font-semibold text-luxury-orange">Publication programmée : </span>
                        {new Intl.DateTimeFormat('fr-FR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(v.scheduled_publication_at))}
                      </p>
                      <p className="text-luxury-muted">
                        <Countdown iso={v.scheduled_publication_at} />
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === v.id}
                      onClick={() => validate(v.id, 'approve')}
                      className="rounded-full bg-[#ff7a00] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_8px_22px_rgba(255,122,0,0.35)] transition hover:-translate-y-px disabled:opacity-50"
                    >
                      Valider
                    </button>
                    <button
                      type="button"
                      disabled={busyId === v.id}
                      onClick={() => validate(v.id, 'reject')}
                      className="rounded-full border border-white/50 bg-white/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-luxury-ink backdrop-blur-md transition hover:bg-white/50 disabled:opacity-50"
                    >
                      Rejeter
                    </button>
                    <button
                      type="button"
                      disabled={busyId === v.id}
                      onClick={() => setScheduleFor(v)}
                      className="rounded-full border border-[#ff7a00]/40 bg-orange-50/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#c2410c] transition hover:bg-orange-100 disabled:opacity-50"
                    >
                      Programmer
                    </button>
                  </div>
                  {v.validation_status === 'scheduled' ? (
                    <button
                      type="button"
                      disabled={busyId === v.id}
                      onClick={() => void clearSchedule(v.id)}
                      className="text-[10px] font-semibold uppercase tracking-widest text-luxury-muted underline-offset-4 hover:text-luxury-ink hover:underline"
                    >
                      Annuler la programmation
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ScheduleModal
        open={scheduleFor != null}
        videoTitle={scheduleFor?.title ?? null}
        defaultIso={scheduleFor?.scheduled_publication_at ?? null}
        onClose={() => setScheduleFor(null)}
        onConfirm={scheduleSave}
      />
    </>
  );
}
