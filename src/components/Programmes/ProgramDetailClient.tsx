'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, Play, Repeat } from 'lucide-react';

import { LevelPill } from './LevelPill';
import { StartProgramModal } from './StartProgramModal';
import { WeekTimeline } from './WeekTimeline';
import { coverUrl, LEVEL_LABEL, type CatalogProgram } from '@/lib/programmes/catalogue';
import { postponeSessionAction } from '@/app/compte/programmes/actions';

export function ProgramDetailClient({
  program,
  mode,
  postponePrompt,
  enrollmentId,
  preview,
}: {
  program: CatalogProgram;
  mode: 'discovery' | 'active' | 'done';
  postponePrompt?: boolean;
  enrollmentId?: string;
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = LEVEL_LABEL[program.level]?.fr ?? '';
  const videoSteps = (program.weeks_detail ?? []).flatMap((w) =>
    (w.steps ?? [])
      .filter((s) => s.kind === 'video')
      .map((s, i) => ({
        id: `${w.week}-${i}`,
        kind: 'video' as const,
        title: s.objective?.fr || s.video_title || `Séance ${i + 1}`,
        minutes: s.minutes,
        href: `/compte/programmes/${program.slug}/seance/${w.week}-${i + 1}`,
      })),
  );

  if (mode === 'discovery') {
    return (
      <div className="mx-auto max-w-[1280px] min-w-0 space-y-8 pb-16 pt-3 md:px-8 md:pt-8">
        <section className="glass-card glass-card--kpi relative grid overflow-hidden md:grid-cols-[1.05fr_1fr]">
          <div className="order-2 p-6 md:order-1 md:p-11">
            <LevelPill level={program.level} label={label} />
            <h1 className="fm-display mt-5 text-[2.5rem] leading-[1.02] text-luxury-ink md:text-[3.6rem]">{program.title.fr}</h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-luxury-muted">{program.promise.fr}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-luxury-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} /> {program.weeks} semaines
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Repeat size={14} /> {program.sessions_per_week} séances / sem.
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} /> {program.minutes_range}
              </span>
            </div>
            <div className="mt-10">
              <button type="button" className="btn-luxury-primary" onClick={() => setOpen(true)}>
                Commencer ce programme
              </button>
            </div>
          </div>
          <div className="fm-media order-1 min-h-[250px] md:order-2 md:min-h-[520px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl(program)} alt="" className="absolute inset-0" />
          </div>
        </section>
        <section className="glass-card p-6">
          <h2 className="text-[17px] font-semibold text-luxury-ink">Pour toi ?</h2>
          <ul className="mt-4 space-y-2 text-[14px] text-luxury-ink">
            {program.benefits.slice(0, 3).map((b) => (
              <li key={b.fr}>{b.fr}</li>
            ))}
          </ul>
          {program.for_who ? <p className="mt-4 text-[13.5px] text-luxury-muted">{program.for_who.fr}</p> : null}
          {program.not_for ? <p className="mt-2 text-[13.5px] text-luxury-muted">Pas pour toi si : {program.not_for.fr}</p> : null}
        </section>
        <section className="space-y-3">
          <h2 className="text-[17px] font-semibold text-luxury-ink">Le déroulé</h2>
          {(program.weeks_detail ?? []).map((w) => {
            const videos = (w.steps ?? []).filter((s) => s.kind === 'video');
            const mins = videos.reduce((s, st) => s + (st.minutes ?? 0), 0);
            return (
              <details key={w.week} className="glass-card p-5">
                <summary className="cursor-pointer text-[15px] font-semibold text-luxury-ink">
                  Semaine {w.week} · {w.focus.fr}
                  <span className="ml-2 text-[12px] font-normal text-luxury-muted">
                    {videos.length} séances · {mins} min · 1 live
                  </span>
                </summary>
                <p className="mt-3 text-[13px] font-medium text-luxury-orange">Voir le détail des {videos.length} séances</p>
                <div className="mt-3">
                  <WeekTimeline
                    steps={videos.map((s, i) => ({
                      id: `${w.week}-${i}`,
                      kind: 'video',
                      title: s.objective?.fr || s.video_title || `Séance ${i + 1}`,
                      minutes: s.minutes,
                    }))}
                  />
                </div>
              </details>
            );
          })}
        </section>
        <StartProgramModal program={program} open={open} onClose={() => setOpen(false)} preview />
      </div>
    );
  }

  if (mode === 'done') {
    return (
      <div className="mx-auto max-w-[800px] space-y-6 p-8">
        <p className="fm-kicker">Programme terminé</p>
        <h1 className="hero-signature-title text-4xl">{program.title.fr}</h1>
        <Link href={`/compte/programmes/${program.slug}/termine`} className="btn-luxury-primary">
          Voir le bilan
        </Link>
        <button type="button" className="btn-luxury-ghost" onClick={() => setOpen(true)}>
          Recommencer
        </button>
        <StartProgramModal program={program} open={open} onClose={() => setOpen(false)} preview />
      </div>
    );
  }

  const thisWeek = program.weeks_detail?.[1] ?? program.weeks_detail?.[0];
  return (
    <div className="mx-auto max-w-[1280px] min-w-0 space-y-8 pb-16 pt-3 md:px-8 md:pt-8">
      {postponePrompt ? (
        <PostponeBanner enrollmentId={enrollmentId} preview={preview} />
      ) : null}
      <section className="glass-card flex flex-wrap items-center gap-4 p-5">
        <span className="h-16 w-16 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl(program)} alt="" className="h-full w-full object-cover" />
        </span>
        <div className="min-w-0 flex-1">
          <LevelPill level={program.level} label={label} />
          <h1 className="mt-1 text-[20px] font-semibold text-luxury-ink">{program.title.fr}</h1>
          <p className="text-[12px] text-luxury-muted">Commencé le 5 oct. · jours choisis lun. mer. ven.</p>
          <div className="fm-progress mt-2 max-w-xs">
            <span style={{ width: '44%' }} />
          </div>
        </div>
        <Link href={videoSteps[4]?.href ?? videoSteps[0]?.href ?? '#'} className="btn-luxury-primary">
          <Play size={14} /> Reprendre · séance 5
        </Link>
      </section>
      <section className="glass-card p-6">
        <h2 className="text-[17px] font-semibold">Cette semaine</h2>
        <p className="mt-1 text-[13px] text-luxury-muted">{thisWeek?.focus.fr}</p>
        <div className="mt-4">
          <WeekTimeline steps={(thisWeek?.steps ?? []).filter((s) => s.kind === 'video').map((s, i) => ({
            id: `w-${i}`,
            kind: 'video' as const,
            title: s.objective?.fr || s.video_title || `Séance ${i + 1}`,
            minutes: s.minutes,
            href: `/compte/programmes/${program.slug}/seance/${thisWeek?.week ?? 1}-${i + 1}`,
          }))} />
        </div>
        <p className="mt-4 text-[13px] text-luxury-muted">Pas encore au planning : tu recevras le rappel la veille dès qu&apos;il sera publié.</p>
      </section>
      <details className="glass-card p-6">
        <summary className="cursor-pointer text-[17px] font-semibold">Tout le programme</summary>
        {(program.weeks_detail ?? []).map((w) => (
          <div key={w.week} className="mt-4">
            <p className="text-[14px] font-semibold">
              Semaine {w.week} · {w.focus.fr}
            </p>
          </div>
        ))}
      </details>
      <div className="flex flex-wrap gap-4 text-[13px] font-semibold text-luxury-orange">
        <Link href="#tests">Tests de progrès</Link>
        <Link href="/compte/preferences">Rappels</Link>
        <Link href="#about">À propos du programme</Link>
      </div>
    </div>
  );
}

function PostponeBanner({ enrollmentId, preview }: { enrollmentId?: string; preview?: boolean }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  if (done) {
    return (
      <p className="rounded-[1.75rem] bg-emerald-50 px-5 py-4 text-[14px] text-emerald-950">
        C’est noté : on te rappelle demain.
      </p>
    );
  }
  return (
    <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-5">
      <p className="text-[14px] text-luxury-ink">Pas aujourd’hui ? On décale le rappel à demain. Rien n’est modifié tant que tu n’as pas confirmé.</p>
      <button
        type="button"
        className="btn-luxury-primary"
        disabled={busy}
        onClick={async () => {
          if (preview || !enrollmentId) {
            setDone(true);
            return;
          }
          setBusy(true);
          const res = await postponeSessionAction(enrollmentId);
          setBusy(false);
          if (res.ok) setDone(true);
        }}
      >
        Confirmer : décaler à demain
      </button>
    </div>
  );
}
