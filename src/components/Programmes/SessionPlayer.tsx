'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Player from '@vimeo/player';

import { FeelingPicker } from './FeelingPicker';
import { SegmentBar } from './SegmentBar';
import { recordFeelingAction, recordWatchedAction } from '@/app/compte/programmes/actions';
import { isStepCompleteAt80 } from '@/lib/programmes/progress';

export function SessionPlayer({
  programTitle,
  slug,
  sessionTitle,
  weekLabel,
  objective,
  cues,
  startS,
  endS,
  durationS,
  embedUrl,
  enrollmentId,
  stepId,
  preview,
  prevHref,
  nextHref,
  softerHref,
}: {
  programTitle: string;
  slug: string;
  sessionTitle: string;
  weekLabel: string;
  objective: string;
  cues: string[];
  startS: number;
  endS: number;
  durationS: number;
  embedUrl?: string | null;
  enrollmentId?: string;
  stepId?: string;
  preview?: boolean;
  prevHref?: string | null;
  nextHref?: string | null;
  softerHref?: string | null;
}) {
  const host = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [current, setCurrent] = useState(startS);
  const [feeling, setFeeling] = useState<'easy' | 'right' | 'hard' | null>(null);
  const [done, setDone] = useState(false);
  const seg = Math.max(1, endS - startS);

  useEffect(() => {
    if (!host.current || !embedUrl || preview) return;
    const player = new Player(host.current, { url: embedUrl, dnt: true, autoplay: false } as ConstructorParameters<typeof Player>[1]);
    playerRef.current = player;
    const onLoaded = () => {
      void player.setCurrentTime(startS);
    };
    player.on('loaded', onLoaded);
    const tick = window.setInterval(async () => {
      try {
        const played = (await player.getPlayed()) as Array<[number, number] | { start: number; end: number }>;
        let watched = 0;
        for (const range of played) {
          const a = Array.isArray(range) ? range[0] : range.start;
          const b = Array.isArray(range) ? range[1] : range.end;
          const from = Math.max(a, startS);
          const to = Math.min(b, endS);
          if (to > from) watched += to - from;
        }
        const t = await player.getCurrentTime();
        setCurrent(t);
        if (t >= endS) void player.pause();
        if (enrollmentId && stepId) {
          void recordWatchedAction({ enrollmentId, stepId, watchedS: Math.round(watched) });
        }
        if (isStepCompleteAt80(watched, seg)) setDone(true);
      } catch {
        /* player not ready */
      }
    }, 15000);
    return () => {
      window.clearInterval(tick);
      player.off('loaded', onLoaded);
      void player.destroy();
    };
  }, [embedUrl, startS, endS, enrollmentId, stepId, preview, seg]);

  return (
    <div className="mx-auto max-w-[1280px] min-w-0 space-y-6 pb-16 pt-3 md:px-8 md:pt-8">
      <nav className="flex flex-wrap items-center gap-1.5 px-1 text-[12px] font-medium text-luxury-muted">
        <Link href="/compte/programmes" className="inline-flex items-center gap-1">
          Programmes
        </Link>
        <span>/</span>
        <Link href={`/compte/programmes/${slug}`}>{programTitle}</Link>
        <span>/</span>
        <span className="text-luxury-ink">{sessionTitle}</span>
      </nav>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <div className="glass-card glass-card--dark fm-dark overflow-hidden !rounded-[1.75rem]">
            <div className="fm-media relative aspect-video">
              {embedUrl && !preview ? <div ref={host} className="absolute inset-0" /> : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/programmes/alejandra-tapis.jpg" alt="" className="absolute inset-0 object-cover" />
              )}
              <div className="absolute inset-x-4 bottom-4 md:inset-x-6">
                <div className="flex items-center justify-between text-[11px] font-semibold tabular-nums text-white/85">
                  <span>{fmt(startS)}</span>
                  <span>Ta séance : {fmt(startS)} → {fmt(endS)}</span>
                  <span>{fmt(durationS || endS)}</span>
                </div>
                <SegmentBar startS={startS} endS={endS} durationS={durationS || endS} currentS={current} />
              </div>
            </div>
            <p className="px-5 py-3.5 text-[12.5px] text-white/70">La vidéo démarre à {fmt(startS)} et s&apos;arrête seule à la fin de ta partie.</p>
          </div>
          <div className="px-1">
            <p className="fm-kicker fm-kicker--orange">{weekLabel}</p>
            <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-luxury-ink md:text-[2.1rem]">{sessionTitle}</h1>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="glass-card p-6">
              <p className="text-[13px] font-semibold text-luxury-ink">Objectif du jour</p>
              <p className="mt-3 text-[15px] leading-relaxed text-luxury-ink">{objective}</p>
            </div>
            <div className="glass-card p-6">
              <p className="text-[13px] font-semibold text-luxury-ink">Les 3 consignes de la semaine</p>
              <ol className="mt-4 space-y-3">
                {cues.map((c, i) => (
                  <li key={c} className="flex items-start gap-3 text-[14.5px] text-luxury-ink">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta-50 text-[12px] font-semibold text-luxury-orange">{i + 1}</span>
                    {c}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="glass-card p-6">
            <p className="fm-kicker">Après la séance</p>
            <p className="mt-2 text-[17px] font-semibold text-luxury-ink">Comment tu te sens&nbsp;?</p>
            <FeelingPicker
              value={feeling}
              onChange={(v) => {
                setFeeling(v);
                if (!preview && enrollmentId && stepId) void recordFeelingAction({ enrollmentId, stepId, feeling: v });
              }}
            />
            {feeling === 'hard' ? (
              <p className="mt-3 rounded-xl bg-[#fff4e5] px-3 py-2 text-[12px] text-[#8a5a1f]">
                Fais seulement la première moitié de la séance, ou Souplesse & récupération.
                {softerHref ? (
                  <>
                    {' '}
                    <Link href={softerHref} className="font-semibold text-luxury-orange">
                      Version plus douce
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}
            <p className="mt-3 text-[12px] leading-relaxed text-luxury-muted">Deux « Difficile » d&apos;affilée ? On te proposera une version plus douce.</p>
            <button
              type="button"
              className="btn-luxury-primary mt-4 w-full"
              onClick={() => {
                setDone(true);
                if (!preview && enrollmentId && stepId) void recordWatchedAction({ enrollmentId, stepId, watchedS: seg, autoComplete: true });
              }}
            >
              Valider ma séance
            </button>
            {done ? <p className="mt-2 text-[13px] text-success">Séance validée.</p> : null}
          </div>
          <button type="button" className="btn-luxury-ghost w-full" onClick={() => document.dispatchEvent(new Event('fm-open-support'))}>
            Pose-la à Alejandra
          </button>
          {prevHref || nextHref ? (
            <div className="flex gap-3">
              {prevHref ? (
                <Link href={prevHref} className="btn-luxury-ghost flex-1 text-center">
                  Séance précédente
                </Link>
              ) : null}
              {nextHref ? (
                <Link href={nextHref} className="btn-luxury-ghost flex-1 text-center">
                  Séance suivante
                </Link>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}
