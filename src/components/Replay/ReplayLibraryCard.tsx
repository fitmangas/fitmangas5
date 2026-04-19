'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { toggleReplayFavoriteAction } from '@/app/compte/actions';
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

function progressLabel(progressSeconds: number | null | undefined, durationSeconds: number | null): string | null {
  if (progressSeconds == null || progressSeconds <= 0) return null;
  if (durationSeconds != null && durationSeconds > 0) {
    const pct = Math.min(100, Math.round((progressSeconds / durationSeconds) * 100));
    return `Reprise à ${pct} %`;
  }
  return `Reprise à ${Math.floor(progressSeconds / 60)} min`;
}

export function ReplayLibraryCard({ item }: { item: ReplayLibraryItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fav, setFav] = useState(item.isFavorite ?? false);

  useEffect(() => {
    setFav(item.isFavorite ?? false);
  }, [item.isFavorite, item.recordingId]);

  const thumb = item.thumbnailUrl?.trim() ?? null;
  const sessionLabel = formatFrenchSessionDate(item.startsAt);
  const replayLabel = item.replayTitle?.trim();
  const showReplaySubtitle =
    replayLabel && replayLabel.toLowerCase() !== item.courseTitle.toLowerCase();
  const resumeHint = progressLabel(item.progressSeconds ?? null, item.durationSeconds);

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

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-brand-ink/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-brand-ink/[0.06] transition duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.14)] hover:ring-brand-accent/25">
      <button
        type="button"
        onClick={onFavoriteClick}
        disabled={pending}
        title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-50"
        aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        <Heart
          size={20}
          className={fav ? 'fill-red-400 text-red-400' : 'text-white'}
          aria-hidden
        />
      </button>

      <Link href={`/live/${item.courseId}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#2a2622] to-[#1a1816]">
          {thumb ? (
            <Image
              src={thumb}
              alt={`Aperçu vidéo · ${item.courseTitle}`}
              fill
              className="object-cover opacity-[0.96] transition duration-700 ease-out group-hover:scale-[1.06] group-hover:opacity-100"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full min-h-[160px] items-center justify-center bg-gradient-to-br from-brand-sand/30 via-brand-beige to-brand-sand/50">
              <Play className="h-16 w-16 text-white/25" strokeWidth={1} aria-hidden />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.82] via-black/25 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-accent/[0.07] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

          {item.durationSeconds ? (
            <span className="absolute right-3 top-3 rounded-md bg-black/55 px-2 py-1 text-[10px] font-semibold tabular-nums text-white backdrop-blur-[2px]">
              {formatDuration(item.durationSeconds)}
            </span>
          ) : null}

          {resumeHint ? (
            <span className="absolute right-3 top-14 max-w-[70%] rounded-md bg-brand-accent/90 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
              {resumeHint}
            </span>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 p-5 pt-16 md:p-6 md:pt-20">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/65">Séance</p>
            <h3 className="font-serif text-xl italic leading-snug tracking-tight text-white drop-shadow-md md:text-[1.35rem]">
              {item.courseTitle}
            </h3>
            {sessionLabel ? (
              <p className="mt-2 text-[13px] font-medium leading-snug text-white/88">{sessionLabel}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-3 border-t border-brand-ink/[0.06] bg-white px-5 py-4 md:px-6">
          {showReplaySubtitle ? (
            <p className="text-[13px] leading-relaxed text-brand-ink/65">&ldquo;{replayLabel}&rdquo;</p>
          ) : (
            <p className="text-[13px] leading-relaxed text-brand-ink/45">Replay disponible · Fit Mangas</p>
          )}
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-accent opacity-90 transition group-hover:gap-3">
            Lecture
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
      </Link>
    </div>
  );
}
