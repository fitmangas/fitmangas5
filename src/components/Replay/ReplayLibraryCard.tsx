'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { toggleReplayFavoriteAction } from '@/app/compte/actions';
import { liveCourseHref } from '@/lib/live/live-back-url';
import type { ReplayLibraryItem } from '@/lib/replay-library';

function formatFrenchSessionDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return `${h} h ${rest} min`;
  }
  return `${m} min`;
}

function progressLabel(progressSeconds: number | null | undefined, durationSeconds: number | null, prefix: string): string | null {
  if (progressSeconds == null || progressSeconds <= 0) return null;
  if (durationSeconds != null && durationSeconds > 0) {
    const pct = Math.min(100, Math.round((progressSeconds / durationSeconds) * 100));
    return `${prefix} ${pct} %`;
  }
  return `${prefix} ${Math.floor(progressSeconds / 60)} min`;
}

export function ReplayLibraryCard({
  item,
  lang = 'fr',
  from = '/compte/replays',
}: {
  item: ReplayLibraryItem;
  lang?: 'fr' | 'en' | 'es';
  from?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fav, setFav] = useState(item.isFavorite ?? false);
  const playable = item.isPlayable !== false;

  useEffect(() => {
    setFav(item.isFavorite ?? false);
  }, [item.isFavorite, item.recordingId]);

  const sessionLabel = formatFrenchSessionDate(item.startsAt);
  const t =
    lang === 'en'
      ? {
          removeFav: 'Remove from favorites',
          addFav: 'Add to favorites',
          session: 'Session',
          available: 'Replay available · Fit Mangas',
          play: 'Play',
          soon: 'Coming soon',
          preview: 'Video preview',
          resumeAt: 'Resume at',
        }
      : lang === 'es'
        ? {
            removeFav: 'Quitar de favoritos',
            addFav: 'Añadir a favoritos',
            session: 'Sesión',
            available: 'Replay disponible · Fit Mangas',
            play: 'Ver replay',
            soon: 'Pronto disponible',
            preview: 'Vista previa de video',
            resumeAt: 'Reanudar en',
          }
        : {
            removeFav: 'Retirer des favoris',
            addFav: 'Ajouter aux favoris',
            session: 'Séance',
            available: 'Replay disponible · Fit Mangas',
            play: 'Lecture',
            soon: 'Bientôt disponible',
            preview: 'Aperçu vidéo',
            resumeAt: 'Reprise à',
          };
  const replayLabel = item.replayTitle?.trim();
  const showReplaySubtitle =
    replayLabel &&
    !/\.mp4$/i.test(replayLabel) &&
    !/^fitmangas[-_]/i.test(replayLabel) &&
    replayLabel.toLowerCase() !== item.courseTitle.toLowerCase();
  const resumeHint = progressLabel(item.progressSeconds ?? null, item.durationSeconds, t.resumeAt);
  const href = liveCourseHref(item.courseId, { from });

  function onFavoriteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const next = !fav;
      setFav(next);
      const res = await toggleReplayFavoriteAction(item.recordingId);
      if (!res.ok) {
        setFav(!next);
        return;
      }
      router.refresh();
    });
  }

  const media = (
    <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-[#E8D5C4]">
      <Image
        src={item.coverImageUrl}
        alt={`${t.preview} · ${item.courseTitle}`}
        fill
        className="object-cover opacity-[0.97] transition duration-700 ease-out group-hover:scale-[1.05] group-hover:opacity-100"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.88] via-black/28 to-transparent" />

      {item.durationSeconds ? (
        <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold tabular-nums text-white backdrop-blur-md">
          {formatDuration(item.durationSeconds)}
        </span>
      ) : null}

      {resumeHint ? (
        <span className="absolute right-3 top-14 max-w-[72%] rounded-full bg-emerald-500/95 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md">
          {resumeHint}
        </span>
      ) : null}

      {!playable ? (
        <span className="absolute left-3 top-3 rounded-full bg-[#C45D3E] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-md">
          {t.soon}
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 p-5 pt-16 md:p-6 md:pt-20">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/65">{t.session}</p>
        <h3 className="text-xl font-semibold leading-snug tracking-tight text-white drop-shadow-md md:text-[1.35rem]">
          {item.courseTitle}
        </h3>
        {sessionLabel ? (
          <p className="mt-2 text-[13px] font-medium leading-snug text-white/90">{sessionLabel}</p>
        ) : null}
      </div>
    </div>
  );

  const footer = (
    <div className="flex flex-1 flex-col justify-between gap-3 border-t border-white/30 bg-white/[0.35] px-5 py-5 backdrop-blur-md md:px-6">
      {showReplaySubtitle ? (
        <p className="text-[13px] leading-relaxed text-luxury-muted">&ldquo;{replayLabel}&rdquo;</p>
      ) : (
        <p className="text-[13px] leading-relaxed text-luxury-soft">{playable ? t.available : t.soon}</p>
      )}
      {playable ? (
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-luxury-orange transition group-hover:gap-3">
          {t.play}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-luxury-muted">
          {t.soon}
        </span>
      )}
    </div>
  );

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/35 bg-white/[0.32] shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-[20px] transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-white/55 hover:shadow-[0_16px_34px_rgba(15,23,42,0.13)]">
      <button
        type="button"
        onClick={onFavoriteClick}
        disabled={pending}
        title={fav ? t.removeFav : t.addFav}
        className="absolute left-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/40 text-white shadow-lg shadow-black/20 backdrop-blur-md transition hover:bg-slate-900/55 disabled:opacity-50"
        aria-label={fav ? t.removeFav : t.addFav}
      >
        <Heart size={20} className={fav ? 'fill-rose-400 text-rose-400' : 'text-white'} aria-hidden />
      </button>

      {playable ? (
        <Link href={href} className="flex flex-1 flex-col">
          {media}
          {footer}
        </Link>
      ) : (
        <div className="flex flex-1 flex-col" aria-disabled>
          {media}
          {footer}
        </div>
      )}
    </div>
  );
}
