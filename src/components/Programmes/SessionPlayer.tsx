'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Player from '@vimeo/player';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  CircleCheck,
  Clock,
  Feather,
  Film,
  Flame,
  Info,
  Layers,
  Maximize,
  Play,
  Radio,
  RotateCcw,
  Scissors,
  Smile,
  Sparkle,
  Sparkles,
  Target,
} from 'lucide-react';

import { recordFeelingAction, recordWatchedAction } from '@/app/compte/programmes/actions';
import { ProgramLevelPill, mmss } from './program-ui';

type Lang = 'fr' | 'es';
type Feeling = 'easy' | 'right' | 'hard';

export type SessionPlayerProps = {
  lang: Lang;
  slug: string;
  programTitle: string;
  n: number;
  total: number;
  weekIndex: number;
  weekFocus: string;
  title: string;
  objective: string;
  cues: string[];
  level: number;
  minutes: number | null;
  equipment: string | null;
  videoTitle: string | null;
  /** Partie de la vidéo source quand elle est découpée en plusieurs séances. */
  part: { index: number; count: number } | null;
  /** Début / fin de l'extrait (secondes) ; fin null = jusqu'au bout. */
  startS: number;
  endS: number | null;
  videoDurationS: number | null;
  embedUrl: string | null;
  posterUrl: string;
  enrollmentId: string | null;
  stepId: string;
  initialFeeling: Feeling | null;
  initialDone: boolean;
  prev: { href: string; label: string } | null;
  next: { href: string; label: string; when: string | null } | null;
  weekList: Array<{ n: number; title: string; status: 'done' | 'now' | 'next'; when: string }>;
  live: { when: string } | null;
  softer: { href: string; text: string } | null;
  preview?: boolean;
};

const C = {
  fr: {
    programmes: 'Programmes',
    sessionN: (n: number) => `Séance ${n}`,
    kicker: (w: number, f: string, n: number, t: number) => `Semaine ${w}${f ? ` · ${f}` : ''} · séance ${n} sur ${t}`,
    part: (i: number | null, start: string) => (i ? `Partie ${i} · démarre à ${start}` : `Démarre à ${start}`),
    yourPart: (a: string, b: string, m: number) => `Ta séance : ${a} → ${b} · ${m} min`,
    startsAt: (a: string) => `La vidéo démarre à ${a} et s’arrête seule à la fin de ta partie.`,
    whole: 'La séance suit la vidéo du début à la fin.',
    restart: 'Revoir depuis le début',
    fullscreen: 'Plein écran',
    noVideo: 'La vidéo de cette séance n’est pas encore disponible.',
    objective: 'Objectif du jour',
    cues: 'Les 3 consignes de la semaine',
    after: 'Après la séance',
    howFeel: 'Comment tu te sens ?',
    easy: 'Facile',
    right: 'Juste bien',
    hard: 'Difficile',
    twoHard: 'Deux « Difficile » d’affilée ? On te proposera une version plus douce.',
    validate: 'Valider ma séance',
    validated: 'Séance validée. Bravo !',
    auto: (a: number, b: number) => `Validée automatiquement dès que tu as suivi 80 % de ta partie (${a} min sur ${b}).`,
    thisWeek: 'Cette semaine',
    liveWith: 'Live avec Alejandra',
    question: 'Une question sur un mouvement ?',
    ask: 'Pose-la à Alejandra',
    orLive: ', ou garde-la pour le live.',
    prev: 'Précédente',
    next: 'Suivante',
    nextSession: 'Séance suivante',
    preview: 'Aperçu : la progression n’est pas enregistrée.',
    notEnrolled: 'Tu regardes cette séance sans avoir commencé le programme : ta progression n’est pas enregistrée.',
    partN: (i: number) => `partie ${i}`,
  },
  es: {
    programmes: 'Programas',
    sessionN: (n: number) => `Sesión ${n}`,
    kicker: (w: number, f: string, n: number, t: number) => `Semana ${w}${f ? ` · ${f}` : ''} · sesión ${n} de ${t}`,
    part: (i: number | null, start: string) => (i ? `Parte ${i} · empieza en ${start}` : `Empieza en ${start}`),
    yourPart: (a: string, b: string, m: number) => `Tu sesión: ${a} → ${b} · ${m} min`,
    startsAt: (a: string) => `El video empieza en ${a} y se detiene solo al final de tu parte.`,
    whole: 'La sesión sigue el video de principio a fin.',
    restart: 'Volver a ver desde el inicio',
    fullscreen: 'Pantalla completa',
    noVideo: 'El video de esta sesión todavía no está disponible.',
    objective: 'Objetivo del día',
    cues: 'Las 3 consignas de la semana',
    after: 'Después de la sesión',
    howFeel: '¿Cómo te sientes?',
    easy: 'Fácil',
    right: 'Justo bien',
    hard: 'Difícil',
    twoHard: '¿Dos « Difícil » seguidas? Te propondremos una versión más suave.',
    validate: 'Validar mi sesión',
    validated: 'Sesión validada. ¡Bravo!',
    auto: (a: number, b: number) => `Se valida sola en cuanto hayas seguido el 80 % de tu parte (${a} min de ${b}).`,
    thisWeek: 'Esta semana',
    liveWith: 'Live con Alejandra',
    question: '¿Una pregunta sobre un movimiento?',
    ask: 'Pregúntale a Alejandra',
    orLive: ', o guárdala para el live.',
    prev: 'Anterior',
    next: 'Siguiente',
    nextSession: 'Sesión siguiente',
    preview: 'Vista previa: el progreso no se guarda.',
    notEnrolled: 'Ves esta sesión sin haber empezado el programa: tu progreso no se guarda.',
    partN: (i: number) => `parte ${i}`,
  },
} as const;

function playedWithin(played: unknown, from: number, to: number): number {
  let total = 0;
  for (const range of (played as Array<[number, number] | { start: number; end: number }>) ?? []) {
    const a = Array.isArray(range) ? range[0] : range.start;
    const b = Array.isArray(range) ? range[1] : range.end;
    const lo = Math.max(a, from);
    const hi = Math.min(b, to);
    if (hi > lo) total += hi - lo;
  }
  return total;
}

export function SessionPlayer(props: SessionPlayerProps) {
  const { lang } = props;
  const t = C[lang];
  const router = useRouter();
  const host = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const lastSent = useRef(0);
  const [current, setCurrent] = useState(props.startS);
  const [duration, setDuration] = useState<number>(props.videoDurationS ?? 0);
  const [feeling, setFeeling] = useState<Feeling | null>(props.initialFeeling);
  const [done, setDone] = useState(props.initialDone);
  const [pending, start] = useTransition();
  const canRecord = Boolean(props.enrollmentId) && !props.preview;

  const segEnd = props.endS ?? (duration || props.videoDurationS || 0);
  const segLen = Math.max(1, segEnd - props.startS);
  const segMinutes = Math.max(1, Math.round(segLen / 60));
  const isPart = props.startS > 0 || (props.endS != null && props.videoDurationS != null && props.endS < props.videoDurationS - 5);

  const report = useCallback(
    async (player: Player) => {
      if (!canRecord || !props.enrollmentId) return;
      try {
        const played = await player.getPlayed();
        const watched = Math.round(playedWithin(played, props.startS, segEnd || Number.MAX_SAFE_INTEGER));
        if (watched <= lastSent.current) return;
        lastSent.current = watched;
        await recordWatchedAction({ enrollmentId: props.enrollmentId, stepId: props.stepId, watchedS: watched });
        if (!done && watched >= 0.8 * segLen) {
          setDone(true);
          router.refresh();
        }
      } catch {
        /* lecteur pas prêt */
      }
    },
    [canRecord, props.enrollmentId, props.stepId, props.startS, segEnd, segLen, done, router],
  );

  useEffect(() => {
    if (!host.current || !props.embedUrl || props.preview) return;
    const player = new Player(host.current, {
      url: props.embedUrl,
      dnt: true,
      autoplay: false,
      responsive: true,
    } as ConstructorParameters<typeof Player>[1]);
    playerRef.current = player;
    let seeked = false;
    const seekStart = () => {
      if (seeked || props.startS <= 0) return;
      seeked = true;
      void player.setCurrentTime(props.startS).catch(() => {
        seeked = false;
      });
    };
    player.on('loaded', seekStart);
    // iOS : la position ne peut être changée qu'après la première lecture.
    player.on('play', seekStart);
    player.on('timeupdate', (e: { seconds: number; duration: number }) => {
      setCurrent(e.seconds);
      if (e.duration && !duration) setDuration(e.duration);
      if (props.endS != null && e.seconds >= props.endS) void player.pause();
    });
    player.on('pause', () => void report(player));
    player.on('ended', () => void report(player));
    const tick = window.setInterval(() => void report(player), 15000);
    return () => {
      window.clearInterval(tick);
      void report(player);
      void player.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.embedUrl, props.preview, props.startS, props.endS]);

  function chooseFeeling(v: Feeling) {
    setFeeling(v);
    if (canRecord && props.enrollmentId) void recordFeelingAction({ enrollmentId: props.enrollmentId, stepId: props.stepId, feeling: v });
  }

  function validate() {
    start(async () => {
      if (canRecord && props.enrollmentId) {
        const res = await recordWatchedAction({ enrollmentId: props.enrollmentId, stepId: props.stepId, watchedS: Math.round(segLen), autoComplete: true });
        if (!res.ok) return;
        router.refresh();
      }
      setDone(true);
    });
  }

  const feelings: Array<{ id: Feeling; label: string; Icon: typeof Feather }> = [
    { id: 'easy', label: t.easy, Icon: Feather },
    { id: 'right', label: t.right, Icon: Smile },
    { id: 'hard', label: t.hard, Icon: Flame },
  ];
  const leftPct = duration ? (props.startS / duration) * 100 : 0;
  const rightPct = duration && props.endS != null ? 100 - (props.endS / duration) * 100 : 0;
  const posPct = duration ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1280px] min-w-0 space-y-6 pb-16 pt-3 md:px-8 md:pt-8">
      <nav className="flex flex-wrap items-center gap-1.5 px-1 text-[12px] font-medium text-luxury-muted" aria-label="Fil d’Ariane">
        <Link href="/compte/programmes" className="inline-flex items-center gap-1 hover:text-luxury-ink">
          <ChevronLeft size={14} />
          {t.programmes}
        </Link>
        <span className="text-luxury-soft">/</span>
        <Link href={`/compte/programmes/${props.slug}`} className="hover:text-luxury-ink">
          {props.programTitle}
        </Link>
        <span className="text-luxury-soft">/</span>
        <span className="text-luxury-ink">{t.sessionN(props.n)}</span>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <div className="glass-card glass-card--dark fm-dark overflow-hidden !rounded-[1.75rem] max-md:-mx-1">
            <div className="relative aspect-video bg-black">
              {props.embedUrl && !props.preview ? (
                <div ref={host} className="absolute inset-0 [&>div]:!h-full [&>div]:!pt-0 [&_iframe]:h-full [&_iframe]:w-full" />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={props.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,16,12,0.35)_0%,rgba(20,16,12,0.1)_45%,rgba(20,16,12,0.75)_100%)]" />
                  {props.preview ? (
                    <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-luxury-ink shadow-[0_18px_40px_rgba(0,0,0,0.35)] md:h-24 md:w-24">
                      <Play size={34} strokeWidth={2.2} className="ml-1" />
                    </span>
                  ) : (
                    <p className="absolute inset-x-6 bottom-6 text-center text-[14px] text-white/85">{t.noVideo}</p>
                  )}
                </>
              )}
              {isPart ? (
                <div className="pointer-events-none absolute left-4 top-4 md:left-5 md:top-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-luxury-ink">
                    <Scissors size={13} />
                    {t.part(props.part?.index ?? null, mmss(props.startS))}
                  </span>
                </div>
              ) : null}
            </div>
            {isPart && duration ? (
              <div className="px-5 pt-4 md:px-6">
                <div className="flex items-center justify-between text-[11px] font-semibold tabular-nums text-white/85">
                  <span>0:00</span>
                  <span className="hidden text-white/70 sm:inline">{t.yourPart(mmss(props.startS), mmss(segEnd), segMinutes)}</span>
                  <span>{mmss(duration)}</span>
                </div>
                <div className="relative mt-2 h-2 rounded-full bg-white/20" aria-hidden>
                  <span className="absolute inset-y-0 rounded-full bg-[linear-gradient(90deg,#f3c58e,#e8967a,#c45d3e)]" style={{ left: `${leftPct}%`, right: `${rightPct}%` }} />
                  <span className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-luxury-orange shadow" style={{ left: `calc(${posPct}% - 8px)` }} />
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-[12.5px] text-white/70 md:px-6">
              <span className="inline-flex items-center gap-2">
                <Info size={14} />
                {isPart ? t.startsAt(mmss(props.startS)) : t.whole}
              </span>
              <span className="inline-flex items-center gap-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-white/85 hover:text-white"
                  onClick={() => {
                    const p = playerRef.current;
                    if (!p) return;
                    void p.setCurrentTime(props.startS).then(() => p.play()).catch(() => {});
                  }}
                >
                  <RotateCcw size={14} />
                  {t.restart}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-white/85 hover:text-white"
                  onClick={() => void playerRef.current?.requestFullscreen().catch(() => {})}
                >
                  <Maximize size={14} />
                  {t.fullscreen}
                </button>
              </span>
            </div>
          </div>

          {props.preview || !props.enrollmentId ? (
            <p className="rounded-2xl bg-white/70 px-4 py-3 text-[12.5px] text-luxury-muted">{props.preview ? t.preview : t.notEnrolled}</p>
          ) : null}

          <div className="px-1">
            <p className="fm-kicker fm-kicker--orange">{t.kicker(props.weekIndex, props.weekFocus, props.n, props.total)}</p>
            <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-luxury-ink md:text-[2.1rem]">{props.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ProgramLevelPill level={props.level} lang={lang} />
              {props.minutes ? (
                <span className="fm-tag">
                  <Clock size={13} />
                  {props.minutes} min
                </span>
              ) : null}
              {props.equipment ? (
                <span className="fm-tag">
                  <Layers size={13} />
                  {props.equipment}
                </span>
              ) : null}
              {props.videoTitle ? (
                <span className="fm-tag">
                  <Film size={13} />
                  {props.videoTitle}
                  {props.part ? ` · ${t.partN(props.part.index)}` : ''}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="glass-card glass-card--kpi p-6">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-luxury-ink">
                <span className="kpi-icon-wrap kpi-icon-wrap--orange !h-9 !w-9">
                  <Target size={17} />
                </span>
                {t.objective}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-luxury-ink">{props.objective}</p>
            </div>
            {props.cues.length ? (
              <div className="glass-card glass-card--kpi p-6">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-luxury-ink">
                  <span className="kpi-icon-wrap kpi-icon-wrap--logo !h-9 !w-9">
                    <Sparkles size={17} />
                  </span>
                  {t.cues}
                </p>
                <ol className="mt-4 space-y-3">
                  {props.cues.slice(0, 3).map((c, i) => (
                    <li key={c} className="flex items-start gap-3 text-[14.5px] leading-snug text-luxury-ink">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta-50 text-[12px] font-semibold text-luxury-orange">{i + 1}</span>
                      {c}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 px-1">
            {props.prev ? (
              <Link href={props.prev.href} className="inline-flex items-center gap-2 text-[13px] font-semibold text-luxury-muted hover:text-luxury-ink">
                <ArrowLeft size={16} />
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-luxury-soft">{t.prev}</span>
                  {props.prev.label}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {props.next ? (
              <Link href={props.next.href} className="inline-flex items-center gap-2 text-right text-[13px] font-semibold text-luxury-ink">
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-luxury-soft">
                    {t.next}
                    {props.next.when ? ` · ${props.next.when}` : ''}
                  </span>
                  {props.next.label}
                </span>
                <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="glass-card glass-card--kpi p-6">
            <p className="fm-kicker">{t.after}</p>
            <p className="mt-2 text-[17px] font-semibold text-luxury-ink">{t.howFeel}</p>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {feelings.map(({ id, label, Icon }) => {
                const on = feeling === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => chooseFeeling(id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-[12.5px] font-semibold ${
                      on ? 'bg-luxury-ink text-white shadow-[0_10px_22px_rgba(29,29,31,0.22)]' : 'border border-black/10 bg-white text-luxury-ink'
                    }`}
                  >
                    <span className={on ? 'text-[#f3c58e]' : 'text-luxury-orange'}>
                      <Icon size={22} />
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
            {props.softer ? (
              <p className="mt-3 rounded-xl bg-[#fff4e5] px-3 py-2 text-[12.5px] leading-relaxed text-[#8a5a1f]">
                {props.softer.text}{' '}
                <Link href={props.softer.href} className="font-semibold text-luxury-orange">
                  {lang === 'es' ? 'Ver' : 'Voir'}
                </Link>
              </p>
            ) : (
              <p className="mt-3 text-[12px] leading-relaxed text-luxury-muted">{t.twoHard}</p>
            )}
            {done ? (
              <>
                <p className="mt-5 flex items-center gap-2 rounded-2xl bg-success-50 px-4 py-3 text-[13.5px] font-semibold text-success">
                  <CircleCheck size={16} />
                  {t.validated}
                </p>
                {props.next ? (
                  <Link href={props.next.href} className="btn-luxury-ghost mt-3 w-full">
                    {t.nextSession}
                    <ArrowRight size={14} />
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <button type="button" disabled={pending} onClick={validate} className="btn-luxury-primary mt-5 w-full">
                  <CircleCheck size={15} strokeWidth={2.4} />
                  {t.validate}
                </button>
                <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-luxury-muted">
                  <Sparkle size={13} className="mt-0.5 shrink-0 text-luxury-gold-deep" />
                  {t.auto(Math.max(1, Math.round((segLen * 0.8) / 60)), segMinutes)}
                </p>
              </>
            )}
          </div>

          {props.weekList.length ? (
            <div className="glass-card glass-card--kpi p-6">
              <div className="flex items-center justify-between">
                <p className="fm-kicker">{t.thisWeek}</p>
                <span className="text-[12px] font-semibold text-luxury-orange">
                  {props.weekList.filter((w) => w.status === 'done').length} / {props.weekList.length}
                </span>
              </div>
              <ol className="mt-4 space-y-3">
                {props.weekList.map((w) => (
                  <li key={w.n} className="flex items-center gap-3">
                    {w.status === 'done' ? (
                      <span className="fm-check fm-check--done">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    ) : w.status === 'now' ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-luxury-orange text-white">
                        <Play size={11} strokeWidth={2.8} />
                      </span>
                    ) : (
                      <span className="fm-check" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[13.5px] font-semibold ${w.status === 'done' ? 'text-luxury-muted line-through decoration-black/20' : 'text-luxury-ink'}`}>
                        {t.sessionN(w.n)} · {w.title}
                      </p>
                    </div>
                    <span className="shrink-0 text-[12px] text-luxury-muted">{w.when}</span>
                  </li>
                ))}
                {props.live ? (
                  <li className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-luxury-ink text-[#f3c58e]">
                      <Radio size={12} strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-luxury-ink">{t.liveWith}</p>
                    </div>
                    <span className="shrink-0 text-[12px] text-luxury-muted">{props.live.when}</span>
                  </li>
                ) : null}
              </ol>
            </div>
          ) : null}

          <div className="glass-card glass-card--kpi flex items-center gap-4 p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/alejandra-avatar.jpg" alt="" className="h-12 w-12 rounded-full object-cover object-top ring-2 ring-white" />
            <p className="text-[13px] leading-relaxed text-luxury-muted">
              {t.question}{' '}
              <button type="button" className="font-semibold text-luxury-orange" onClick={() => document.dispatchEvent(new Event('fm-open-support'))}>
                {t.ask}
              </button>
              {t.orLive}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
