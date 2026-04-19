import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';

import { getReplayLibraryForUser, type ReplayLibraryItem } from '@/lib/replay-library';

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

function ReplayCard({ item }: { item: ReplayLibraryItem }) {
  const thumb = item.thumbnailUrl?.trim() ?? null;
  const sessionLabel = formatFrenchSessionDate(item.startsAt);
  const replayLabel = item.replayTitle?.trim();
  const showReplaySubtitle =
    replayLabel && replayLabel.toLowerCase() !== item.courseTitle.toLowerCase();

  return (
    <Link
      href={`/live/${item.courseId}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-brand-ink/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-brand-ink/[0.06] transition duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.14)] hover:ring-brand-accent/25"
    >
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
  );
}

export async function MyReplaysSection({ userId }: { userId: string }) {
  let items: ReplayLibraryItem[] = [];
  try {
    items = await getReplayLibraryForUser(userId);
  } catch {
    items = [];
  }

  return (
    <section className="rounded-[32px] border border-brand-ink/[0.04] bg-gradient-to-b from-[#faf8f5] via-white to-[#f7f5f2] p-8 shadow-[0_16px_56px_rgba(0,0,0,0.06)] md:p-10">
      <div className="mb-10 flex flex-col gap-3 border-b border-brand-ink/[0.06] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-brand-accent">Bibliothèque</p>
          <h2 className="mt-2 font-serif text-3xl italic tracking-tight text-brand-ink md:text-[2.1rem]">Mes replays</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-ink/50">
            Une sélection de tes séances enregistrées — même esprit qu’un catalogue streaming, pensé pour le bien-être.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-ink/[0.1] bg-white/60 px-6 py-16 text-center backdrop-blur-sm">
          <p className="font-serif text-xl italic text-brand-ink/45">Aucun replay pour l’instant</p>
          <p className="mt-3 text-sm leading-relaxed text-brand-ink/42">
            Dès qu’une vidéo est publiée pour une séance terminée, elle apparaît ici.
          </p>
        </div>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
          {items.map((item) => (
            <li key={item.recordingId}>
              <ReplayCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
