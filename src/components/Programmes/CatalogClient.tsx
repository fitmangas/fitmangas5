'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  ChevronRight,
  CircleCheck,
  CircleDot,
  CircleHelp,
  Dumbbell,
  Flame,
  HeartHandshake,
  HeartPulse,
  Leaf,
  Pause,
  PersonStanding,
  Play,
  Quote,
  Radio,
  RotateCcw,
  Sparkles,
  Timer,
  type LucideIcon,
} from 'lucide-react';

import { ProgramCard, ProgramMetaLine } from './ProgramCard';
import { ProgressRing } from './ProgressRing';
import { WeekDots } from './WeekDots';
import { ProgramLevelPill } from './program-ui';
import { A_VALIDER_LOT3 } from '@/content/a-valider';
import type { CatalogCard, CatalogView } from '@/lib/programmes/catalog-view';
import type { ActiveSummary } from '@/lib/programmes/view-models';

type Lang = 'fr' | 'es';

const GOALS: Array<{ id: string; icon: LucideIcon | null; fr: string; es: string }> = [
  { id: 'all', icon: null, fr: 'Tous', es: 'Todos' },
  { id: 'tonifier', icon: Dumbbell, fr: 'Tonifier', es: 'Tonificar' },
  { id: 'dos', icon: PersonStanding, fr: 'Dos & posture', es: 'Espalda y postura' },
  { id: 'cardio', icon: HeartPulse, fr: 'Cardio', es: 'Cardio' },
  { id: 'souplesse', icon: Leaf, fr: 'Souplesse', es: 'Flexibilidad' },
  { id: 'peu', icon: Timer, fr: 'Peu de temps', es: 'Poco tiempo' },
];

const LEVEL_SECTIONS: Array<{ level: number; kicker: { fr: string; es: string }; title: { fr: string; es: string }; intro: { fr: string; es: string } }> = [
  {
    level: 1,
    kicker: { fr: 'Débutante', es: 'Principiante' },
    title: { fr: 'Je démarre', es: 'Empiezo' },
    intro: {
      fr: 'Tu débutes ou tu reprends : des séances de 20 à 40 minutes et des bases solides.',
      es: 'Empiezas o retomas: sesiones de 20 a 40 minutos y bases sólidas.',
    },
  },
  {
    level: 2,
    kicker: { fr: 'Intermédiaire', es: 'Intermedia' },
    title: { fr: 'Je progresse', es: 'Progreso' },
    intro: {
      fr: 'Tu connais les bases : on ajoute les accessoires, la durée et l’intensité.',
      es: 'Ya conoces las bases: sumamos accesorios, duración e intensidad.',
    },
  },
  {
    level: 3,
    kicker: { fr: 'Avancée', es: 'Avanzada' },
    title: { fr: 'Je me dépasse', es: 'Me supero' },
    intro: {
      fr: 'Pour les habituées : des séances exigeantes, jusqu’à une heure et jusqu’à 4 fois par semaine.',
      es: 'Para las habituales: sesiones exigentes, de hasta una hora y hasta 4 veces por semana.',
    },
  },
];

const TRACKS: Array<{ key: string; icon: LucideIcon; label: { fr: string; es: string } }> = [
  { key: 'pilates', icon: CircleDot, label: { fr: 'Pilates', es: 'Pilates' } },
  { key: 'barre', icon: Sparkles, label: { fr: 'Barre', es: 'Barre' } },
  { key: 'cardio', icon: Flame, label: { fr: 'Cardio & silhouette', es: 'Cardio y silueta' } },
];

const C = {
  fr: {
    kicker: (n: number) => `Programmes · ${n} parcours guidés`,
    title1: 'Ton plan,',
    title2: 'semaine après semaine.',
    subtitle: 'Des programmes guidés avec les vidéos d’Alejandra, plus un live par semaine où elle te voit et te corrige.',
    current: 'Ton programme en cours',
    currentPaused: 'Ton programme (en pause)',
    sessions: 'Séances',
    time: 'Temps',
    end: 'Fin prévue',
    start: 'Commencer',
    resume: 'Reprendre',
    startSession: 'Commencer la séance',
    resumeSession: 'Reprendre la séance',
    resumeProgram: 'Reprendre le programme',
    finish: 'Terminer le programme',
    allDone: 'Toutes les séances sont faites. Bravo !',
    allDoneSub: 'Valide la fin du programme pour recevoir ton certificat.',
    pausedText: 'Ton programme est en pause : tes séances reprennent dès que tu le relances.',
    thisWeek: 'Cette semaine',
    goal: 'Ton objectif',
    testTitle: 'Pas sûre de ton niveau ?',
    testSub: '3 questions, 2 minutes →',
    goTo: 'Aller à',
    count: (n: number) => `${n} programme${n > 1 ? 's' : ''}`,
    wellKicker: 'Tous niveaux · à combiner',
    wellTitle: 'Bien-être',
    wellIntro: 'À glisser entre deux programmes, ou à suivre seul pour gagner en souplesse et mieux récupérer.',
    redo: 'Refaire le programme',
    detail: 'Voir le détail',
    discover: 'Découvrir le programme',
    certificate: 'Certificat',
    tracksKicker: 'Les parcours',
    tracksTitle: 'Progresse d’un niveau à l’autre',
    tracksIntro: 'Chaque programme mène au suivant. À la fin, on te propose la suite logique.',
    inProgress: (p: number) => `En cours · ${p} %`,
    pausedShort: 'En pause',
    doneShort: 'Terminé',
    weeksShort: (n: number) => `${n} sem.`,
    helpTestTitle: 'Pas sûre de ton niveau ?',
    helpTestText: '3 questions, 2 minutes : on te recommande le programme qui te correspond.',
    helpTestCta: 'Faire le test',
    bodyTitle: 'Écoute ton corps',
    bodyText:
      'En cas de douleur, de grossesse, de rééducation ou de problème de santé, demande l’avis d’un professionnel de santé avant de commencer.',
    coach: 'Ta coach',
    empty: 'Les programmes arrivent très bientôt.',
    emptyFilter: 'Aucun programme pour cet objectif pour le moment.',
    all: 'Tous',
  },
  es: {
    kicker: (n: number) => `Programas · ${n} recorridos guiados`,
    title1: 'Tu plan,',
    title2: 'semana tras semana.',
    subtitle: 'Programas guiados con los videos de Alejandra, más un live por semana en el que te ve y te corrige.',
    current: 'Tu programa en curso',
    currentPaused: 'Tu programa (en pausa)',
    sessions: 'Sesiones',
    time: 'Tiempo',
    end: 'Fin prevista',
    start: 'Empezar',
    resume: 'Retomar',
    startSession: 'Empezar la sesión',
    resumeSession: 'Retomar la sesión',
    resumeProgram: 'Retomar el programa',
    finish: 'Terminar el programa',
    allDone: 'Hiciste todas las sesiones. ¡Bravo!',
    allDoneSub: 'Valida el final del programa para recibir tu certificado.',
    pausedText: 'Tu programa está en pausa: tus sesiones vuelven en cuanto lo reanudes.',
    thisWeek: 'Esta semana',
    goal: 'Tu objetivo',
    testTitle: '¿No sabes tu nivel?',
    testSub: '3 preguntas, 2 minutos →',
    goTo: 'Ir a',
    count: (n: number) => `${n} programa${n > 1 ? 's' : ''}`,
    wellKicker: 'Todos los niveles · para combinar',
    wellTitle: 'Bienestar',
    wellIntro: 'Para intercalar entre dos programas, o para seguirlo solo y ganar flexibilidad y recuperarte mejor.',
    redo: 'Repetir el programa',
    detail: 'Ver el detalle',
    discover: 'Descubrir el programa',
    certificate: 'Certificado',
    tracksKicker: 'Los recorridos',
    tracksTitle: 'Progresa de un nivel al siguiente',
    tracksIntro: 'Cada programa lleva al siguiente. Al final, te proponemos el paso lógico.',
    inProgress: (p: number) => `En curso · ${p} %`,
    pausedShort: 'En pausa',
    doneShort: 'Terminado',
    weeksShort: (n: number) => `${n} sem.`,
    helpTestTitle: '¿No sabes tu nivel?',
    helpTestText: '3 preguntas, 2 minutos: te recomendamos el programa que te corresponde.',
    helpTestCta: 'Hacer el test',
    bodyTitle: 'Escucha a tu cuerpo',
    bodyText:
      'En caso de dolor, embarazo, rehabilitación o problema de salud, pide la opinión de un profesional de la salud antes de empezar.',
    coach: 'Tu coach',
    empty: 'Los programas llegan muy pronto.',
    emptyFilter: 'Todavía no hay programas para este objetivo.',
    all: 'Todos',
  },
} as const;

const GOAL_KEY = 'fm_program_goal';

function matchesGoal(card: CatalogCard, goal: string): boolean {
  if (goal === 'all') return true;
  if (goal === 'peu') return card.goals.includes('express');
  return card.goals.includes(goal);
}

const lowerFirst = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s.charAt(0).toLowerCase() + s.slice(1) : s);

function LevelBars({ level }: { level: number }) {
  return (
    <span className={`fm-level--${level} inline-flex`} aria-hidden>
      <span className="fm-level__bars">
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}

function SectionHead({ kicker, title, intro, id }: { kicker: string; title: string; intro?: string; id?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-1" id={id}>
      <div className="min-w-0">
        <p className="fm-kicker">{kicker}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-luxury-ink md:mt-2 md:text-[1.7rem]">{title}</h2>
        {intro ? <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-luxury-muted">{intro}</p> : null}
      </div>
    </div>
  );
}

function ActiveHero({ a, lang }: { a: ActiveSummary; lang: Lang }) {
  const t = C[lang];
  const nextLabel = a.next ? (a.next.started ? t.resumeSession : t.startSession) : null;
  return (
    <section className="glass-card glass-card--dark fm-dark glass-card--kpi relative overflow-hidden">
      <div className="fm-media absolute inset-y-0 right-0 hidden w-[52%] md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.coverUrl} alt="" className="absolute inset-0" />
        <div className="fm-dark-fade-x absolute inset-0" />
      </div>
      <div className="fm-media relative h-[230px] md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.coverUrl} alt="" className="absolute inset-0 object-[50%_30%]" />
        <div className="fm-dark-fade-y absolute inset-0" />
      </div>
      <div className="relative grid md:grid-cols-[1.25fr_1fr]">
        <div className="relative z-[1] -mt-10 p-6 pt-0 md:mt-0 md:p-10">
          <p className="fm-kicker !text-white/55">{a.paused ? t.currentPaused : t.current}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ProgramLevelPill level={a.level} lang={lang} />
            <span className="text-[12px] font-medium text-white/70">{a.metaLine}</span>
          </div>
          <h2 className="fm-display mt-4 text-[2.1rem] leading-[1.02] !text-white md:text-[2.9rem]">
            <Link href={a.programHref}>{a.title}</Link>
          </h2>
          {a.weekFocus ? (
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-white/70">
              {lang === 'es' ? 'Semana' : 'Semaine'} {a.weekIndex} · <span className="text-white">{a.weekFocus}</span>
              {a.weekCue ? ` — ${lowerFirst(a.weekCue).replace(/\.$/, '')}.` : ''}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <ProgressRing percent={a.percent} dark />
            <dl className="grid grid-cols-3 gap-5 text-white">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">{t.sessions}</dt>
                <dd className="mt-1 text-[22px] font-semibold tabular-nums">
                  {a.done}
                  <span className="text-[14px] text-white/50"> / {a.total}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">{t.time}</dt>
                <dd className="mt-1 whitespace-nowrap text-[22px] font-semibold tabular-nums">{a.timeLabel}</dd>
              </div>
              {a.endLabel ? (
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">{t.end}</dt>
                  <dd className="mt-1 whitespace-nowrap text-[22px] font-semibold tabular-nums">{a.endLabel}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {a.completable ? (
            <div className="mt-7 rounded-[1.4rem] bg-white/[0.07] p-4 ring-1 ring-white/10">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-white">
                <CircleCheck size={18} className="text-[#9fd7a6]" aria-hidden /> {t.allDone}
              </p>
              <p className="mt-1 text-[13px] text-white/65">{t.allDoneSub}</p>
              <Link href={a.programHref} className="btn-luxury-primary mt-4">
                <Award size={14} aria-hidden />
                {t.finish}
              </Link>
            </div>
          ) : a.paused ? (
            <div className="mt-7 rounded-[1.4rem] bg-white/[0.07] p-4 ring-1 ring-white/10">
              <p className="flex items-center gap-2 text-[14px] text-white/80">
                <Pause size={16} aria-hidden /> {t.pausedText}
              </p>
              <Link href={a.programHref} className="btn-luxury-primary mt-4">
                <Play size={14} strokeWidth={2.4} aria-hidden />
                {t.resumeProgram}
              </Link>
            </div>
          ) : a.next ? (
            <div className="mt-7 rounded-[1.4rem] bg-white/[0.07] p-3 ring-1 ring-white/10">
              <div className="flex items-center gap-4">
                <Link href={a.next.href} className="fm-media aspect-[4/3] w-[92px] shrink-0 rounded-2xl sm:aspect-video sm:w-[128px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.next.thumb} alt="" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-luxury-ink">
                      <Play size={14} strokeWidth={2.6} aria-hidden />
                    </span>
                  </span>
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f3c58e]">{a.next.kicker}</p>
                  <p className="mt-1 text-[16px] font-semibold leading-snug text-white">{a.next.title}</p>
                  {a.next.meta ? <p className="mt-1 text-[12.5px] text-white/60">{a.next.meta}</p> : null}
                </div>
                <div className="hidden shrink-0 sm:block">
                  <Link href={a.next.href} className="btn-luxury-primary">
                    <Play size={14} strokeWidth={2.4} aria-hidden />
                    {a.next.started ? t.resume : t.start}
                  </Link>
                </div>
              </div>
              <div className="mt-3 sm:hidden">
                <Link href={a.next.href} className="btn-luxury-primary w-full">
                  <Play size={14} strokeWidth={2.4} aria-hidden />
                  {nextLabel}
                </Link>
              </div>
            </div>
          ) : null}

          {!a.paused ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50 sm:inline">{t.thisWeek}</span>
                <WeekDots days={a.weekDots} dark />
              </div>
              {a.live ? (
                <Link
                  href={a.live.href}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12px] font-medium text-white/85 ring-1 ring-white/15"
                >
                  <Radio size={14} aria-hidden />
                  {a.live.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="hidden md:block" />
      </div>
    </section>
  );
}

function WellbeingBand({ card, lang }: { card: CatalogCard; lang: Lang }) {
  const t = C[lang];
  return (
    <article className="glass-card glass-card--kpi grid overflow-hidden md:grid-cols-[1.1fr_1fr]">
      <div className="fm-media min-h-[220px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.coverUrl} alt="" className="absolute inset-0" loading="lazy" />
        <div className="absolute left-4 top-4">
          <ProgramLevelPill level={card.level} lang={lang} />
        </div>
      </div>
      <div className="flex flex-col p-6 md:p-9">
        {card.state === 'done' ? (
          <div className="flex flex-wrap items-center gap-2">
            {card.doneLabel ? (
              <span className="fm-tag fm-tag--green">
                <CircleCheck size={13} strokeWidth={2.4} aria-hidden />
                {card.doneLabel}
              </span>
            ) : null}
            {card.certificateHref ? (
              <a href={card.certificateHref} target="_blank" rel="noopener" className="fm-tag fm-tag--gold">
                <Award size={13} aria-hidden />
                {t.certificate}
              </a>
            ) : null}
          </div>
        ) : card.state === 'active' || card.state === 'paused' ? (
          <div className="flex items-center gap-2">
            <span className="fm-tag">{card.state === 'active' ? t.inProgress(card.percent) : t.pausedShort}</span>
          </div>
        ) : null}
        <h3 className={`text-[24px] font-semibold tracking-tight text-luxury-ink ${card.state === 'discover' ? '' : 'mt-4'}`}>{card.title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-luxury-muted">{card.promise}</p>
        <div className="mt-4">
          <ProgramMetaLine card={card} lang={lang} compact={false} />
        </div>
        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          {card.state === 'done' ? (
            <>
              <Link href={card.href} className="btn-luxury-ghost">
                <RotateCcw size={14} aria-hidden />
                {t.redo}
              </Link>
              <Link href={card.href} className="btn-luxury-gold">
                {t.detail}
              </Link>
            </>
          ) : card.state === 'active' || card.state === 'paused' ? (
            <Link href={card.href} className="btn-luxury-primary">
              <Play size={14} strokeWidth={2.4} aria-hidden />
              {t.resume}
            </Link>
          ) : (
            <Link href={card.href} className="btn-luxury-primary">
              {t.discover}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function Tracks({ cards, lang }: { cards: CatalogCard[]; lang: Lang }) {
  const t = C[lang];
  const bySlug = new Map(cards.map((c) => [c.slug, c]));
  const rows = TRACKS.map((tr) => {
    const first = cards.find((c) => c.track === tr.key && c.level === 1 && c.nextSlug) ?? cards.find((c) => c.track === tr.key && c.level === 1);
    const chain: CatalogCard[] = [];
    let cur: CatalogCard | undefined = first;
    while (cur && chain.length < 5 && !chain.includes(cur)) {
      chain.push(cur);
      cur = cur.nextSlug ? bySlug.get(cur.nextSlug) : undefined;
    }
    return { ...tr, chain };
  }).filter((r) => r.chain.length > 1);
  if (!rows.length) return null;
  return (
    <section className="space-y-5">
      <SectionHead kicker={t.tracksKicker} title={t.tracksTitle} intro={t.tracksIntro} />
      <div className="grid gap-4">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} className="glass-card glass-card--kpi flex flex-col gap-4 p-5 md:flex-row md:items-center md:gap-6 md:p-6">
              <div className="flex w-full items-center gap-3 md:w-56 md:shrink-0">
                <span className="kpi-icon-wrap kpi-icon-wrap--logo">
                  <Icon size={19} aria-hidden />
                </span>
                <p className="text-[15px] font-semibold text-luxury-ink">{r.label[lang]}</p>
              </div>
              <ol className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-0">
                {r.chain.map((c, i) => {
                  const current = c.state === 'active';
                  return (
                    <li key={c.slug} className="flex flex-1 items-center gap-3 md:min-w-0">
                      <Link
                        href={c.href}
                        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-full shadow-md ${
                          current ? 'ring-[3px] ring-luxury-orange ring-offset-2 ring-offset-white' : 'ring-2 ring-white'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </Link>
                      <div className="min-w-0">
                        <Link href={c.href} className="block truncate text-[14px] font-semibold text-luxury-ink">
                          {c.title}
                        </Link>
                        <p className="text-[12px] text-luxury-muted">
                          {current ? (
                            <span className="font-semibold text-luxury-orange">{t.inProgress(c.percent)}</span>
                          ) : c.state === 'done' ? (
                            <span className="font-semibold text-success">{t.doneShort}</span>
                          ) : c.state === 'paused' ? (
                            <span className="font-semibold text-luxury-ink">{t.pausedShort}</span>
                          ) : (
                            `${LEVEL_SECTIONS.find((s) => s.level === c.level)?.kicker[lang] ?? ''} · ${t.weeksShort(c.weeks)}`
                          )}
                        </p>
                      </div>
                      {i < r.chain.length - 1 ? (
                        <>
                          <span className="mx-2 hidden h-px flex-1 border-t-[1.5px] border-dashed border-luxury-gold/60 md:block" aria-hidden />
                          <span className="hidden text-luxury-gold md:block" aria-hidden>
                            <ChevronRight size={18} />
                          </span>
                        </>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CatalogClient({ view }: { view: CatalogView }) {
  const lang: Lang = view.lang === 'es' ? 'es' : 'fr';
  const t = C[lang];
  const [goal, setGoal] = useState('all');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GOAL_KEY);
      if (saved && GOALS.some((g) => g.id === saved)) setGoal(saved);
    } catch {
      /* stockage indisponible : filtre « Tous » */
    }
  }, []);

  function pick(next: string) {
    setGoal(next);
    try {
      localStorage.setItem(GOAL_KEY, next);
    } catch {
      /* ignore */
    }
  }

  const filtered = useMemo(() => view.cards.filter((c) => matchesGoal(c, goal)), [view.cards, goal]);
  const wellbeing = filtered.filter((c) => c.level === 0);
  const advice = A_VALIDER_LOT3.catalogAdvice;

  return (
    <div className="mx-auto max-w-[1280px] min-w-0 space-y-10 pb-16 pt-3 md:space-y-14 md:px-8 md:pt-10">
      <section className="grid items-end gap-6 px-1 md:grid-cols-[1fr_auto]">
        <div>
          <p className="fm-kicker fm-kicker--orange">{t.kicker(view.cards.length)}</p>
          <h1 className="hero-signature-title mt-3 text-[2.6rem] text-luxury-ink md:text-[4.2rem]">
            {t.title1}
            <br className="md:hidden" /> {t.title2}
          </h1>
          <p className="hero-signature-subtitle mt-3 max-w-2xl text-[15px] leading-relaxed md:text-[17px]">{t.subtitle}</p>
        </div>
      </section>

      {view.active ? <ActiveHero a={view.active} lang={lang} /> : null}

      {view.cards.length === 0 ? (
        <p className="glass-card glass-card--kpi p-6 text-[15px] text-luxury-muted">{t.empty}</p>
      ) : (
        <>
          <section className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <div className="flex w-max items-center gap-2 md:w-auto md:flex-wrap" role="group" aria-label={t.goal}>
                <span className="mr-1 hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-luxury-soft md:inline">{t.goal}</span>
                {GOALS.map((g) => {
                  const Icon = g.icon;
                  const on = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => pick(g.id)}
                      className={on ? 'fm-chip fm-chip--active' : 'fm-chip fm-chip--soft'}
                    >
                      {Icon ? <Icon size={15} aria-hidden /> : null}
                      {g[lang]}
                    </button>
                  );
                })}
              </div>
            </div>
            <Link href="/test-niveau" className="glass-card flex items-center gap-3 rounded-full py-2 pl-2 pr-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/alejandra-avatar.jpg" alt="" className="h-10 w-10 rounded-full object-cover object-top" />
              <span className="leading-tight">
                <span className="block text-[13px] font-semibold text-luxury-ink">{t.testTitle}</span>
                <span className="block text-[12px] font-semibold text-luxury-orange">{t.testSub}</span>
              </span>
            </Link>
          </section>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[13px] font-semibold text-luxury-muted" aria-label={t.goTo}>
            <span className="text-[11px] uppercase tracking-[0.16em] text-luxury-soft">{t.goTo}</span>
            {LEVEL_SECTIONS.filter((s) => filtered.some((c) => c.level === s.level)).map((s) => (
              <a key={s.level} href={`#niveau-${s.level}`} className="inline-flex items-center gap-1.5 hover:text-luxury-ink">
                <LevelBars level={s.level} />
                {s.title[lang]}
              </a>
            ))}
            {wellbeing.length ? (
              <a href="#niveau-0" className="inline-flex items-center gap-1.5 hover:text-luxury-ink">
                <Leaf size={14} aria-hidden />
                {t.wellTitle}
              </a>
            ) : null}
          </nav>

          {filtered.length === 0 ? <p className="px-1 text-[15px] text-luxury-muted">{t.emptyFilter}</p> : null}

          {LEVEL_SECTIONS.map((s) => {
            const list = filtered.filter((c) => c.level === s.level);
            if (!list.length) return null;
            return (
              <section key={s.level} className="scroll-mt-28 space-y-5" id={`niveau-${s.level}`}>
                <SectionHead kicker={`${s.kicker[lang]} · ${t.count(list.length)}`} title={s.title[lang]} intro={s.intro[lang]} />
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {list.map((c) => (
                    <ProgramCard key={c.slug} card={c} lang={lang} />
                  ))}
                  {s.level === 3 ? (
                    <article className="glass-card glass-card--kpi fm-card-blush flex h-full flex-col justify-between overflow-hidden p-6">
                      <div>
                        <span className="kpi-icon-wrap kpi-icon-wrap--logo">
                          <Quote size={18} aria-hidden />
                        </span>
                        <p className="fm-display mt-5 text-[1.3rem] leading-[1.25] text-luxury-ink">
                          « {advice.before[lang]}
                          <span className="text-luxury-orange">{advice.highlight[lang]}</span>
                          {advice.after[lang]} »
                        </p>
                        <p className="mt-3 text-[13px] leading-relaxed text-luxury-muted">{advice.note[lang]}</p>
                      </div>
                      <div className="mt-6 flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/landing/alejandra-avatar.jpg" alt="" className="h-11 w-11 rounded-full bg-white object-cover object-top ring-2 ring-white" />
                        <div className="leading-tight">
                          <p className="text-[13px] font-semibold text-luxury-ink">Alejandra</p>
                          <p className="text-[12px] text-luxury-muted">{t.coach}</p>
                        </div>
                      </div>
                    </article>
                  ) : null}
                </div>
              </section>
            );
          })}

          {wellbeing.length ? (
            <section className="scroll-mt-28 space-y-5" id="niveau-0">
              <SectionHead kicker={t.wellKicker} title={t.wellTitle} intro={t.wellIntro} />
              {wellbeing.map((c) => (
                <WellbeingBand key={c.slug} card={c} lang={lang} />
              ))}
            </section>
          ) : null}

          <Tracks cards={view.cards} lang={lang} />

          <section className="grid gap-5 md:grid-cols-2">
            <div className="glass-card glass-card--kpi flex items-start gap-4 p-6">
              <span className="kpi-icon-wrap kpi-icon-wrap--orange">
                <CircleHelp size={20} aria-hidden />
              </span>
              <div>
                <p className="text-[16px] font-semibold text-luxury-ink">{t.helpTestTitle}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-luxury-muted">{t.helpTestText}</p>
                <Link href="/test-niveau" className="btn-luxury-primary mt-4">
                  {t.helpTestCta}
                </Link>
              </div>
            </div>
            <div className="glass-card glass-card--kpi flex items-start gap-4 p-6">
              <span className="kpi-icon-wrap kpi-icon-wrap--green">
                <HeartHandshake size={20} aria-hidden />
              </span>
              <div>
                <p className="text-[16px] font-semibold text-luxury-ink">{t.bodyTitle}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-luxury-muted">{t.bodyText}</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
