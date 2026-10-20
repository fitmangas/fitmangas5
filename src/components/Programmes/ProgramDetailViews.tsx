'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRightLeft,
  Award,
  BellRing,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleCheck,
  CirclePlay,
  HeartHandshake,
  Info,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Settings2,
  TrendingUp,
  X,
} from 'lucide-react';

import {
  abandonProgramAction,
  completeProgramAction,
  pauseProgramAction,
  postponeSessionAction,
  recordProgramTestAction,
  restartProgramAction,
  resumeProgramAction,
  updateEnrollmentSettingsAction,
} from '@/app/compte/programmes/actions';
import type { AboutData, DiscoveryProps, InProgressProps, TestItem } from '@/lib/programmes/view-models';
import { BenefitIcon, GOAL_LABELS, ProgramLevelPill } from './program-ui';
import { StartProgramModal } from './StartProgramModal';

type Lang = 'fr' | 'es';

const C = {
  fr: {
    programmes: 'Programmes',
    startProgram: 'Commencer ce programme',
    firstSession: 'Voir la 1re séance',
    included: 'Inclus dans ton abonnement.',
    pauseNote: (t: string) => ` Tu suis déjà ${t} : il sera mis en pause et tu le reprendras où tu l’as laissé.`,
    duration: 'Durée',
    rhythm: 'Rythme',
    session: 'Séance',
    weeksN: (n: number) => `${n} semaines`,
    perWeekN: (n: number) => `${n} séances/sem.`,
    equipment: 'Matériel :',
    inWeeks: (n: number) => `En ${n} semaines`,
    forYou: 'Pour toi si…',
    notForYou: 'Pas pour toi si…',
    flow: 'Le déroulé',
    eachWeek: (n: number) => `Chaque semaine : ${n} séances vidéo + 1 live`,
    seeDetail: (n: number) => `Voir le détail des ${n} séances`,
    hideDetail: 'Masquer le détail',
    sessionsLine: (n: number, a: number | null, b: number | null) => `${n} séances${a != null && b != null ? ` · ${a === b ? a : `${a}–${b}`} min` : ''}`,
    oneLive: '1 live',
    inc: 'Inclus',
    incReminder: 'Un rappel les jours que tu choisis',
    incTest: 'Un petit test au début et à la fin (2 min)',
    incCertificate: 'Un certificat à la fin',
    unavailable: 'Ce programme ouvre bientôt : il n’est pas encore disponible au démarrage.',
    thisWeek: (i: number, n: number) => `Cette semaine · semaine ${i} sur ${n}`,
    sessionN: (n: number) => `Séance ${n}`,
    today: 'aujourd’hui',
    begin: 'Commencer',
    live: 'Live',
    agenda: 'Agenda',
    whole: 'Tout le programme',
    weekN: (n: number) => `Semaine ${n}`,
    liveOfWeek: 'Live de la semaine',
    tests: 'Mes tests de progrès',
    reminders: 'Mes rappels',
    about: 'À propos du programme',
    aboutHint: 'Objectifs, matériel, questions fréquentes',
    settings: 'Mes réglages',
    paused: 'Programme en pause',
    pausedText: 'Rien n’est planifié pendant la pause. Reprends quand tu veux : tu repars de ta séance suivante.',
    resumeBtn: 'Reprendre le programme',
    postponeQ: 'Pas aujourd’hui ? On décale ta séance à demain. Rien n’est modifié tant que tu n’as pas confirmé.',
    postponeOk: 'C’est noté : ta séance passe à demain.',
    postponeBtn: 'Confirmer : décaler à demain',
    finishTitle: 'Toutes tes séances sont faites',
    finishText: 'Bravo ! Termine le programme pour recevoir ton certificat.',
    finishBtn: 'Terminer le programme',
    close: 'Fermer',
    daysTitle: 'Jours d’entraînement',
    timeTitle: 'Heure du rappel',
    save: 'Enregistrer',
    saved: 'Réglages enregistrés.',
    pause: 'Mettre en pause',
    restart: 'Recommencer depuis le début',
    restartConfirm: 'Recommencer ? Une nouvelle inscription démarre aujourd’hui ; ton parcours actuel reste dans ton historique.',
    quit: 'Quitter ce programme',
    quitConfirm: 'Quitter ce programme ? Tu pourras le recommencer plus tard.',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    testsTitle: 'Tests de progrès',
    testsIntro: 'Mesures de performance seulement (aucune donnée de santé). Fais-les au début, puis à la fin, pour voir tes progrès.',
    phaseStart: 'Départ',
    phaseEnd: 'Arrivée',
    seconds: 'secondes',
    reps: 'répétitions',
    record: 'Enregistrer mes résultats',
    recorded: 'Résultats enregistrés.',
    endLater: 'Le test d’arrivée s’ouvre pendant la dernière semaine.',
    faq: 'Questions fréquentes',
  },
  es: {
    programmes: 'Programas',
    startProgram: 'Empezar este programa',
    firstSession: 'Ver la 1.ª sesión',
    included: 'Incluido en tu suscripción.',
    pauseNote: (t: string) => ` Ya sigues ${t}: se pondrá en pausa y lo retomarás donde lo dejaste.`,
    duration: 'Duración',
    rhythm: 'Ritmo',
    session: 'Sesión',
    weeksN: (n: number) => `${n} semanas`,
    perWeekN: (n: number) => `${n} sesiones/sem.`,
    equipment: 'Material:',
    inWeeks: (n: number) => `En ${n} semanas`,
    forYou: 'Para ti si…',
    notForYou: 'No es para ti si…',
    flow: 'El recorrido',
    eachWeek: (n: number) => `Cada semana: ${n} sesiones en video + 1 live`,
    seeDetail: (n: number) => `Ver el detalle de las ${n} sesiones`,
    hideDetail: 'Ocultar el detalle',
    sessionsLine: (n: number, a: number | null, b: number | null) => `${n} sesiones${a != null && b != null ? ` · ${a === b ? a : `${a}–${b}`} min` : ''}`,
    oneLive: '1 live',
    inc: 'Incluido',
    incReminder: 'Un recordatorio los días que elijas',
    incTest: 'Un pequeño test al inicio y al final (2 min)',
    incCertificate: 'Un certificado al final',
    unavailable: 'Este programa abre pronto: todavía no se puede empezar.',
    thisWeek: (i: number, n: number) => `Esta semana · semana ${i} de ${n}`,
    sessionN: (n: number) => `Sesión ${n}`,
    today: 'hoy',
    begin: 'Empezar',
    live: 'Live',
    agenda: 'Agenda',
    whole: 'Todo el programa',
    weekN: (n: number) => `Semana ${n}`,
    liveOfWeek: 'Live de la semana',
    tests: 'Mis tests de progreso',
    reminders: 'Mis recordatorios',
    about: 'Sobre el programa',
    aboutHint: 'Objetivos, material, preguntas frecuentes',
    settings: 'Mis ajustes',
    paused: 'Programa en pausa',
    pausedText: 'No se planifica nada durante la pausa. Retómalo cuando quieras: sigues con tu próxima sesión.',
    resumeBtn: 'Retomar el programa',
    postponeQ: '¿Hoy no? Pasamos tu sesión a mañana. No se cambia nada hasta que lo confirmes.',
    postponeOk: 'Anotado: tu sesión pasa a mañana.',
    postponeBtn: 'Confirmar: pasar a mañana',
    finishTitle: 'Hiciste todas tus sesiones',
    finishText: '¡Bravo! Termina el programa para recibir tu certificado.',
    finishBtn: 'Terminar el programa',
    close: 'Cerrar',
    daysTitle: 'Días de entrenamiento',
    timeTitle: 'Hora del recordatorio',
    save: 'Guardar',
    saved: 'Ajustes guardados.',
    pause: 'Poner en pausa',
    restart: 'Empezar de nuevo',
    restartConfirm: '¿Empezar de nuevo? Una nueva inscripción empieza hoy; tu recorrido actual queda en tu historial.',
    quit: 'Dejar este programa',
    quitConfirm: '¿Dejar este programa? Podrás empezarlo de nuevo más tarde.',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    testsTitle: 'Tests de progreso',
    testsIntro: 'Solo medidas de rendimiento (ningún dato de salud). Hazlos al inicio y al final para ver tus progresos.',
    phaseStart: 'Inicio',
    phaseEnd: 'Final',
    seconds: 'segundos',
    reps: 'repeticiones',
    record: 'Guardar mis resultados',
    recorded: 'Resultados guardados.',
    endLater: 'El test final se abre durante la última semana.',
    faq: 'Preguntas frecuentes',
  },
} as const;

const DAY_LABELS = {
  fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
};

function Breadcrumb({ lang, title }: { lang: Lang; title: string }) {
  return (
    <nav className="flex items-center gap-1.5 px-1 text-[12px] font-medium text-luxury-muted" aria-label="Fil d’Ariane">
      <Link href="/compte/programmes" className="inline-flex items-center gap-1 hover:text-luxury-ink">
        <ChevronLeft size={14} />
        {C[lang].programmes}
      </Link>
      <span className="text-luxury-soft">/</span>
      <span className="truncate text-luxury-ink">{title}</span>
    </nav>
  );
}

function Modal({ title, onClose, children, lang }: { title: string; onClose: () => void; children: React.ReactNode; lang: Lang }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[rgba(29,26,23,0.42)] backdrop-blur-[6px] md:items-center md:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="relative flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[2rem] bg-cream shadow-[0_40px_100px_-20px_rgba(29,26,23,0.55)] md:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 className="text-[17px] font-semibold text-luxury-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label={C[lang].close} className="flex h-9 w-9 items-center justify-center rounded-full text-luxury-muted hover:bg-black/[0.04]">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ——— Blocs « À propos » (découverte et modale) ——— */

function BenefitsCard({ about, lang }: { about: AboutData; lang: Lang }) {
  const t = C[lang];
  return (
    <section className="glass-card glass-card--kpi grid gap-6 p-6 md:grid-cols-[1.2fr_1fr] md:p-8">
      <div>
        <p className="fm-kicker">{t.inWeeks(about.weeks)}</p>
        <ul className="mt-4 space-y-3">
          {about.benefits.map((b) => (
            <li key={b.text} className="flex items-start gap-3 text-[15px] font-medium text-luxury-ink">
              <span className="kpi-icon-wrap kpi-icon-wrap--logo !h-9 !w-9 shrink-0">
                <BenefitIcon name={b.icon} />
              </span>
              <span className="pt-1.5">{b.text}</span>
            </li>
          ))}
        </ul>
      </div>
      {about.forWho || about.notFor ? (
        <div className="space-y-4 border-black/[0.06] md:border-l md:pl-6">
          {about.forWho ? (
            <div>
              <p className="flex items-center gap-2 text-[13px] font-semibold text-success">
                <CircleCheck size={15} strokeWidth={2.2} />
                {t.forYou}
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-luxury-ink">{about.forWho}</p>
            </div>
          ) : null}
          {about.notFor ? (
            <div>
              <p className="flex items-center gap-2 text-[13px] font-semibold text-luxury-muted">
                <ArrowRightLeft size={15} strokeWidth={2.2} />
                {t.notForYou}
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-luxury-ink">{about.notFor}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function IncludedAndFaq({ about, lang }: { about: AboutData; lang: Lang }) {
  const t = C[lang];
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <div className="glass-card p-6">
        <p className="fm-kicker">{t.inc}</p>
        <ul className="mt-4 space-y-2.5 text-[14px] text-luxury-ink">
          <li className="flex items-center gap-3">
            <BellRing size={16} className="text-luxury-orange" />
            {t.incReminder}
          </li>
          {about.tests.length ? (
            <li className="flex items-center gap-3">
              <TrendingUp size={16} className="text-luxury-orange" />
              {t.incTest}
            </li>
          ) : null}
          <li className="flex items-center gap-3">
            <Award size={16} className="text-luxury-orange" />
            {t.incCertificate}
          </li>
        </ul>
      </div>
      {about.faq.length ? (
        <div className="glass-card divide-y divide-black/[0.06] overflow-hidden">
          {about.faq.map((f) => (
            <details key={f.q} className="group px-6 py-3.5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14.5px] font-semibold text-luxury-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown size={17} className="shrink-0 text-luxury-soft transition group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-[13.5px] leading-relaxed text-luxury-muted">{f.a}</p>
            </details>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SafetyNote({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p className="flex items-start gap-2 px-1 text-[12px] leading-relaxed text-luxury-muted">
      <HeartHandshake size={15} className="mt-0.5 shrink-0 text-luxury-soft" />
      {text}
    </p>
  );
}

/* ===================== B03 — découverte ===================== */

export function ProgramDiscovery(props: DiscoveryProps & { preview?: boolean; startOpen?: boolean }) {
  const { lang, about } = props;
  const t = C[lang];
  const [open, setOpen] = useState(Boolean(props.startOpen));
  const closeStart = useCallback(() => setOpen(false), []);
  const [detail, setDetail] = useState(false);
  return (
    <div className="mx-auto max-w-[1180px] min-w-0 space-y-7 pb-16 pt-3 md:space-y-9 md:px-8 md:pt-8">
      <Breadcrumb lang={lang} title={props.title} />

      <section className="glass-card glass-card--kpi relative grid overflow-hidden md:grid-cols-[1.1fr_1fr]">
        <div className="relative z-[1] order-2 flex flex-col p-6 md:order-1 md:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <ProgramLevelPill level={props.level} lang={lang} />
            {props.goals
              .filter((g) => GOAL_LABELS[g])
              .map((g) => (
                <span key={g} className="fm-tag">
                  {GOAL_LABELS[g][lang]}
                </span>
              ))}
          </div>
          <h1 className="fm-display mt-4 text-[2.4rem] leading-[1.02] text-luxury-ink md:text-[3.2rem]">{props.title}</h1>
          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-luxury-muted">{props.promise}</p>
          <dl className="mt-6 grid max-w-md grid-cols-3 gap-4">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">{t.duration}</dt>
              <dd className="mt-1 text-[17px] font-semibold text-luxury-ink">{t.weeksN(props.weeks)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">{t.rhythm}</dt>
              <dd className="mt-1 text-[17px] font-semibold text-luxury-ink">{t.perWeekN(props.perWeek)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">{t.session}</dt>
              <dd className="mt-1 text-[17px] font-semibold text-luxury-ink">{props.minutesRange}</dd>
            </div>
          </dl>
          {about.equipment.length ? (
            <p className="mt-4 text-[13px] text-luxury-muted">
              <span className="font-semibold text-luxury-ink">{t.equipment}</span> {about.equipment.join(' · ')}
            </p>
          ) : null}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button type="button" className="btn-luxury-primary" onClick={() => setOpen(true)} disabled={!props.canStart && !props.preview}>
              <Play size={14} strokeWidth={2.4} />
              {t.startProgram}
            </button>
            {props.firstSessionHref ? (
              <Link href={props.firstSessionHref} className="btn-luxury-ghost">
                <CirclePlay size={15} />
                {t.firstSession}
              </Link>
            ) : null}
          </div>
          <p className="mt-4 text-[12.5px] text-luxury-muted">
            {props.canStart || props.preview ? t.included : t.unavailable}
            {props.otherActive ? t.pauseNote(props.otherActive.title) : ''}
          </p>
        </div>
        <div className="fm-media relative order-1 min-h-[230px] md:order-2 md:min-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={props.coverUrl} alt="" className="absolute inset-0" />
        </div>
      </section>

      <BenefitsCard about={about} lang={lang} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <p className="fm-kicker">{t.flow}</p>
            <h2 className="mt-1.5 text-[1.45rem] font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">{t.eachWeek(props.perWeek)}</h2>
          </div>
          <button type="button" onClick={() => setDetail((v) => !v)} className="text-[12.5px] font-semibold text-luxury-orange" aria-expanded={detail}>
            {detail ? t.hideDetail : t.seeDetail(props.totalSessions)}
            <ChevronDown size={14} className={`ml-1 inline transition ${detail ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className={`grid gap-3 sm:grid-cols-2 ${props.schedule.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {props.schedule.map((w) => (
            <article key={w.week} className="glass-card flex flex-col p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-luxury-ink text-[14px] font-semibold text-white">{w.week}</span>
              <p className="mt-3 text-[15px] font-semibold leading-snug text-luxury-ink">{w.focus}</p>
              {w.cue ? <p className="mt-1 text-[12.5px] leading-relaxed text-luxury-muted">{w.cue}.</p> : null}
              {detail ? (
                <ul className="mt-3 space-y-1.5 border-t border-black/[0.06] pt-3 text-[12.5px] text-luxury-ink">
                  {w.details.map((d) => (
                    <li key={d.n} className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0">
                        {t.sessionN(d.n)} · {d.title}
                      </span>
                      {d.minutes ? <span className="shrink-0 text-luxury-muted">{d.minutes} min</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-auto pt-3 text-[12px] font-medium text-luxury-muted">
                <CirclePlay size={13} className="mr-1 inline text-luxury-orange" />
                {t.sessionsLine(w.sessions, w.minMin, w.maxMin)}
                {w.hasLive ? (
                  <>
                    {' · '}
                    <Radio size={13} className="mx-1 inline text-luxury-orange" />
                    {t.oneLive}
                  </>
                ) : null}
              </p>
            </article>
          ))}
        </div>
      </section>

      <IncludedAndFaq about={about} lang={lang} />
      <SafetyNote text={about.safety} />

      <StartProgramModal
        info={{
          slug: props.slug,
          title: props.title,
          coverUrl: props.coverUrl,
          level: props.level,
          weeks: props.weeks,
          perWeek: props.perWeek,
          minutesRange: props.minutesRange,
          tests: about.tests,
          todayKey: props.todayKey,
          firstSession: props.firstSession,
        }}
        lang={lang}
        open={open}
        onClose={closeStart}
        preview={props.preview}
        pause={props.otherActive}
      />
    </div>
  );
}

/* ===================== B02 — en cours ===================== */

function SettingsModal({ props, onClose }: { props: InProgressProps & { preview?: boolean }; onClose: () => void }) {
  const { lang } = props;
  const t = C[lang];
  const router = useRouter();
  const [days, setDays] = useState<number[]>(props.settings.chosenDays);
  const [time, setTime] = useState(props.settings.reminderTime);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<'restart' | 'quit' | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) =>
    start(async () => {
      setErr(null);
      setMsg(null);
      if (props.preview) {
        setMsg(t.saved);
        return;
      }
      const res = await fn();
      if (!res.ok) setErr('message' in res && res.message ? res.message : '—');
      else {
        after?.();
        router.refresh();
      }
    });

  return (
    <Modal title={t.settings} onClose={onClose} lang={lang}>
      <div className="space-y-6">
        <section>
          <h3 className="text-[14px] font-semibold text-luxury-ink">{t.daysTitle}</h3>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {DAY_LABELS[lang].map((d, i) => {
              const on = days.includes(i + 1);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setDays((cur) => (cur.includes(i + 1) ? cur.filter((x) => x !== i + 1) : [...cur, i + 1].sort((a, b) => a - b)))}
                  className={`flex h-12 items-center justify-center rounded-2xl text-[12px] font-semibold ${on ? 'bg-luxury-ink text-white' : 'border border-black/10 bg-white text-luxury-muted'}`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </section>
        <section>
          <label className="block">
            <span className="text-[14px] font-semibold text-luxury-ink">{t.timeTitle}</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="fm-input mt-2 max-w-[160px]" />
          </label>
        </section>
        <button
          type="button"
          disabled={pending}
          className="btn-luxury-primary w-full"
          onClick={() => run(() => updateEnrollmentSettingsAction({ enrollmentId: props.enrollmentId, chosenDays: days, reminderTime: time }), () => setMsg(t.saved))}
        >
          {t.save}
        </button>
        {msg ? <p className="rounded-xl bg-success-50 px-4 py-3 text-[13px] text-success">{msg}</p> : null}
        {err ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800" role="alert">
            {err}
          </p>
        ) : null}
        <div className="space-y-2 border-t border-black/[0.06] pt-5">
          {props.paused ? (
            <button type="button" disabled={pending} className="btn-luxury-ghost w-full" onClick={() => run(() => resumeProgramAction(props.enrollmentId), onClose)}>
              <Play size={14} />
              {t.resumeBtn}
            </button>
          ) : (
            <button type="button" disabled={pending} className="btn-luxury-ghost w-full" onClick={() => run(() => pauseProgramAction(props.enrollmentId), onClose)}>
              <Pause size={14} />
              {t.pause}
            </button>
          )}
          {confirming ? (
            <div className="rounded-2xl bg-white p-4 text-[13px] text-luxury-ink">
              <p>{confirming === 'restart' ? t.restartConfirm : t.quitConfirm}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="btn-luxury-primary"
                  onClick={() =>
                    run(
                      () => (confirming === 'restart' ? restartProgramAction(props.enrollmentId) : abandonProgramAction(props.enrollmentId)),
                      () => {
                        onClose();
                        if (confirming === 'quit') router.push('/compte/programmes');
                      },
                    )
                  }
                >
                  {t.confirm}
                </button>
                <button type="button" className="btn-luxury-ghost" onClick={() => setConfirming(null)}>
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-between gap-2 pt-1 text-[13px] font-semibold">
              <button type="button" className="inline-flex items-center gap-1.5 text-luxury-muted hover:text-luxury-ink" onClick={() => setConfirming('restart')}>
                <RotateCcw size={14} />
                {t.restart}
              </button>
              <button type="button" className="text-red-700/80 hover:text-red-800" onClick={() => setConfirming('quit')}>
                {t.quit}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function TestsModal({
  lang,
  items,
  enrollmentId,
  startDone,
  endDone,
  canRecordEnd,
  preview,
  onClose,
}: {
  lang: Lang;
  items: TestItem[];
  enrollmentId: string;
  startDone: boolean;
  endDone: boolean;
  canRecordEnd: boolean;
  preview?: boolean;
  onClose: () => void;
}) {
  const t = C[lang];
  const router = useRouter();
  const phase: 'start' | 'end' = startDone ? 'end' : 'start';
  const [values, setValues] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const blocked = phase === 'end' && (!canRecordEnd || endDone);
  return (
    <Modal title={t.testsTitle} onClose={onClose} lang={lang}>
      <p className="text-[13.5px] leading-relaxed text-luxury-muted">{t.testsIntro}</p>
      <p className="mt-4 fm-kicker fm-kicker--orange">{phase === 'start' ? t.phaseStart : t.phaseEnd}</p>
      <ul className="mt-3 space-y-4">
        {items.map((it) => (
          <li key={it.key} className="rounded-2xl bg-white p-4">
            <p className="text-[14px] font-semibold text-luxury-ink">{it.label}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-luxury-muted">{it.how}</p>
            {it.type === 'scale' && it.scale ? (
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={it.label}>
                {it.scale.map((opt, i) => {
                  const on = values[it.key] === String(i);
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={blocked}
                      onClick={() => setValues((v) => ({ ...v, [it.key]: String(i) }))}
                      className={`rounded-full px-4 py-2 text-[13px] font-semibold ${on ? 'bg-luxury-ink text-white' : 'border border-black/10 bg-white text-luxury-ink'}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <label className="mt-3 flex items-center gap-2 text-[13px] text-luxury-muted">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  disabled={blocked}
                  value={values[it.key] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [it.key]: e.target.value }))}
                  className="fm-input w-28"
                  aria-label={it.label}
                />
                {it.type === 'seconds' ? t.seconds : t.reps}
              </label>
            )}
          </li>
        ))}
      </ul>
      {blocked ? <p className="mt-4 text-[13px] text-luxury-muted">{endDone ? t.recorded : t.endLater}</p> : null}
      {!blocked ? (
        <button
          type="button"
          disabled={pending}
          className="btn-luxury-primary mt-5 w-full"
          onClick={() =>
            start(async () => {
              setErr(null);
              if (preview) {
                setMsg(t.recorded);
                return;
              }
              const results: Record<string, number> = {};
              for (const [k, v] of Object.entries(values)) if (v !== '' && Number.isFinite(Number(v))) results[k] = Number(v);
              const res = await recordProgramTestAction({ enrollmentId, phase, results });
              if (!res.ok) setErr(res.message);
              else {
                setMsg(t.recorded);
                router.refresh();
              }
            })
          }
        >
          {t.record}
        </button>
      ) : null}
      {msg ? <p className="mt-3 rounded-xl bg-success-50 px-4 py-3 text-[13px] text-success">{msg}</p> : null}
      {err ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800" role="alert">
          {err}
        </p>
      ) : null}
    </Modal>
  );
}

function AboutModal({ about, lang, onClose }: { about: AboutData; lang: Lang; onClose: () => void }) {
  const t = C[lang];
  return (
    <Modal title={t.about} onClose={onClose} lang={lang}>
      <div className="space-y-5">
        <BenefitsCard about={about} lang={lang} />
        {about.equipment.length ? (
          <p className="text-[13.5px] text-luxury-muted">
            <span className="font-semibold text-luxury-ink">{t.equipment}</span> {about.equipment.join(' · ')}
          </p>
        ) : null}
        {about.faq.length ? (
          <div>
            <p className="fm-kicker">{t.faq}</p>
            <div className="mt-2 divide-y divide-black/[0.06] overflow-hidden rounded-2xl bg-white">
              {about.faq.map((f) => (
                <details key={f.q} className="group px-5 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-semibold text-luxury-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown size={16} className="shrink-0 text-luxury-soft transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-[13px] leading-relaxed text-luxury-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        ) : null}
        <SafetyNote text={about.safety} />
      </div>
    </Modal>
  );
}

function PostponeBanner({ lang, enrollmentId, preview }: { lang: Lang; enrollmentId: string; preview?: boolean }) {
  const t = C[lang];
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  if (done) return <p className="rounded-[1.75rem] bg-success-50 px-5 py-4 text-[14px] text-success">{t.postponeOk}</p>;
  return (
    <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-5">
      <p className="text-[14px] text-luxury-ink">{t.postponeQ}</p>
      <button
        type="button"
        className="btn-luxury-primary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (preview) {
              setDone(true);
              return;
            }
            const res = await postponeSessionAction(enrollmentId);
            if (res.ok) {
              setDone(true);
              router.refresh();
            }
          })
        }
      >
        {t.postponeBtn}
      </button>
    </div>
  );
}

export function ProgramInProgress(props: InProgressProps & { preview?: boolean; openTests?: boolean }) {
  const { lang } = props;
  const t = C[lang];
  const router = useRouter();
  const [modal, setModal] = useState<'settings' | 'tests' | 'about' | null>(props.openTests ? 'tests' : null);
  const [pending, start] = useTransition();

  return (
    <div className="mx-auto max-w-[1180px] min-w-0 space-y-7 pb-16 pt-3 md:space-y-9 md:px-8 md:pt-8">
      <Breadcrumb lang={lang} title={props.title} />

      {props.postponePrompt && !props.paused ? <PostponeBanner lang={lang} enrollmentId={props.enrollmentId} preview={props.preview} /> : null}

      <section className="glass-card glass-card--kpi grid items-center gap-5 p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-7 md:p-7">
        <span className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[1.4rem] md:h-[104px] md:w-[104px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={props.coverUrl} alt="" className="h-full w-full object-cover object-top" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ProgramLevelPill level={props.level} lang={lang} />
            <span className="text-[12px] font-medium text-luxury-muted">{props.startedLabel}</span>
          </div>
          <h1 className="fm-display mt-2 text-[2rem] leading-[1.05] text-luxury-ink md:text-[2.6rem]">{props.title}</h1>
          <div className="mt-3 flex max-w-md items-center gap-3">
            <div className="fm-progress flex-1" role="progressbar" aria-valuenow={props.percent} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${props.percent}%` }} />
            </div>
            <span className="text-[12.5px] font-semibold tabular-nums text-luxury-ink">
              {props.done} / {props.total} {lang === 'es' ? 'sesiones' : 'séances'}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          {props.resume && !props.paused ? (
            <Link href={props.resume.href} className="btn-luxury-primary">
              <Play size={14} strokeWidth={2.4} />
              {props.resume.label}
            </Link>
          ) : null}
          <button type="button" onClick={() => setModal('settings')} className="text-center text-[12px] font-semibold text-luxury-muted hover:text-luxury-ink md:text-right">
            <Settings2 size={13} className="mr-1 inline" />
            {t.settings}
          </button>
        </div>
      </section>

      {props.paused ? (
        <section className="glass-card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-[15px] font-semibold text-luxury-ink">{t.paused}</p>
            <p className="mt-1 text-[13px] text-luxury-muted">{t.pausedText}</p>
          </div>
          <button
            type="button"
            className="btn-luxury-primary"
            disabled={pending}
            onClick={() =>
              start(async () => {
                if (props.preview) return;
                const res = await resumeProgramAction(props.enrollmentId);
                if (res.ok) router.refresh();
              })
            }
          >
            <Play size={14} />
            {t.resumeBtn}
          </button>
        </section>
      ) : null}

      {props.completable ? (
        <section className="glass-card glass-card--kpi flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-[15px] font-semibold text-luxury-ink">{t.finishTitle}</p>
            <p className="mt-1 text-[13px] text-luxury-muted">{t.finishText}</p>
          </div>
          <button
            type="button"
            className="btn-luxury-primary"
            disabled={pending}
            onClick={() =>
              start(async () => {
                if (props.preview) return;
                const res = await completeProgramAction(props.enrollmentId);
                if (res.ok) {
                  router.push(`/compte/programmes/${props.slug}/termine`);
                  router.refresh();
                }
              })
            }
          >
            <Award size={15} />
            {t.finishBtn}
          </button>
        </section>
      ) : null}

      {props.softer ? (
        <section className="glass-card flex flex-wrap items-center justify-between gap-3 border border-[#f3c58e]/60 p-5">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-luxury-ink">{props.softer.title}</p>
            <p className="mt-1 text-[13px] text-luxury-muted">{props.softer.text}</p>
          </div>
          <Link href={props.softer.href} className="btn-luxury-ghost">
            {lang === 'es' ? 'Ver' : 'Voir'}
          </Link>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <p className="fm-kicker fm-kicker--orange">{t.thisWeek(props.week.index, props.week.weeks)}</p>
            <h2 className="mt-1.5 text-[1.45rem] font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">{props.week.focus}</h2>
            {props.week.cue ? <p className="mt-1 text-[13.5px] text-luxury-muted">{props.week.cue}.</p> : null}
          </div>
          <span className="fm-tag fm-tag--orange">
            <Play size={11} strokeWidth={2.6} />
            {props.week.tag}
          </span>
        </div>
        <ol className="glass-card glass-card--kpi divide-y divide-black/[0.05] overflow-hidden">
          {props.weekRows.map((row) => {
            if (row.kind === 'video') {
              const st = row.status;
              return (
                <li key={row.key} className={`flex items-center gap-3 px-4 py-3.5 md:gap-4 md:px-5 ${st === 'today' ? 'bg-terracotta-50/60' : ''}`}>
                  <Link href={row.href} className="fm-media relative h-[58px] w-[88px] shrink-0 rounded-xl md:h-[64px] md:w-[104px]" aria-label={`${t.sessionN(row.n)} · ${row.title}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={row.thumb} alt="" />
                    {row.minutes ? <span className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">{row.minutes} min</span> : null}
                    {st === 'done' ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-[rgba(47,125,91,0.55)] text-white">
                        <Check size={22} strokeWidth={3} />
                      </span>
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${st === 'today' ? 'text-luxury-orange' : 'text-luxury-soft'}`}>
                      {t.sessionN(row.n)}
                      {st === 'today' ? ` · ${t.today}` : ''}
                    </p>
                    <p className={`mt-0.5 text-[14.5px] font-semibold leading-snug ${st === 'done' ? 'text-luxury-muted' : 'text-luxury-ink'}`}>{row.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {st === 'done' ? (
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success">
                        <CircleCheck size={15} strokeWidth={2.4} />
                        <span className="hidden sm:inline">{row.dateLabel}</span>
                      </span>
                    ) : st === 'today' && !props.paused ? (
                      <Link href={row.href} className="btn-luxury-primary !px-4 !py-2.5">
                        <Play size={13} strokeWidth={2.4} />
                        <span className="hidden sm:inline">{t.begin}</span>
                      </Link>
                    ) : (
                      <span className="text-[12px] font-medium text-luxury-muted">{row.dateLabel ?? ''}</span>
                    )}
                  </div>
                </li>
              );
            }
            if (row.kind === 'live') {
              return (
                <li key={row.key} className="flex items-center gap-3 px-4 py-3.5 md:gap-4 md:px-5">
                  <div className="flex h-[58px] w-[88px] shrink-0 flex-col items-center justify-center rounded-xl bg-luxury-ink text-white md:h-[64px] md:w-[104px]">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">{row.dayShort}</span>
                    <span className="text-[20px] font-semibold leading-none">{row.dayNum}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-luxury-orange">
                      <Radio size={11} strokeWidth={2.4} />
                      {t.live}
                    </span>
                    <p className="mt-1 text-[14.5px] font-semibold leading-snug text-luxury-ink">{row.title}</p>
                    <p className="text-[12px] text-luxury-muted">{row.sub}</p>
                  </div>
                  <a href={row.agendaHref} className="btn-luxury-ghost hidden shrink-0 !px-4 !py-2.5 sm:inline-flex">
                    <CalendarPlus size={14} />
                    {t.agenda}
                  </a>
                </li>
              );
            }
            return (
              <li key={row.key} className="flex items-center gap-3 px-4 py-3.5 text-[13px] text-luxury-muted md:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-luxury-ink text-[#f3c58e]">
                  <Radio size={14} strokeWidth={2.4} />
                </span>
                {row.text}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="space-y-3">
        <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.whole}</p>
        <div className="glass-card glass-card--kpi divide-y divide-black/[0.05] overflow-hidden">
          {props.allWeeks.map((w) => (
            <details key={w.index} className="group px-5 py-4" open={w.state === 'done' && w.index === props.week.index - 1}>
              <summary className="flex cursor-pointer list-none items-center gap-4 [&::-webkit-details-marker]:hidden">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-semibold text-white ${
                    w.state === 'done' ? 'bg-success' : w.state === 'current' ? 'bg-luxury-orange' : 'bg-luxury-ink'
                  }`}
                >
                  {w.state === 'done' ? <Check size={16} strokeWidth={3} /> : w.index}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-luxury-ink">
                    {t.weekN(w.index)} · {w.focus}
                  </span>
                  <span className="block text-[12.5px] text-luxury-muted">{w.subtitle}</span>
                </span>
                <ChevronDown size={18} className="text-luxury-soft transition group-open:rotate-180" />
              </summary>
              <ul className="mt-3 space-y-1.5 pl-[52px] text-[13.5px] text-luxury-ink">
                {w.sessions.map((s) => (
                  <li key={s.n} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {t.sessionN(s.n)} · {s.title}
                    </span>
                    <span className={`shrink-0 text-[12px] ${s.done ? 'text-success' : 'text-luxury-muted'}`}>{s.right}</span>
                  </li>
                ))}
                <li className="flex items-center gap-2 text-[12.5px] text-luxury-muted">
                  <Radio size={13} className="text-luxury-orange" />
                  {t.liveOfWeek}
                </li>
              </ul>
            </details>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {props.tests.items.length ? (
          <button type="button" onClick={() => setModal('tests')} className="glass-card flex items-start gap-3 p-4 text-left">
            <span className="kpi-icon-wrap kpi-icon-wrap--logo !h-10 !w-10 shrink-0">
              <TrendingUp size={17} />
            </span>
            <span>
              <span className="block text-[14px] font-semibold text-luxury-ink">{t.tests}</span>
              <span className="block text-[12.5px] text-luxury-muted">{props.testsSummary}</span>
            </span>
          </button>
        ) : null}
        <button type="button" onClick={() => setModal('settings')} className="glass-card flex items-start gap-3 p-4 text-left">
          <span className="kpi-icon-wrap kpi-icon-wrap--logo !h-10 !w-10 shrink-0">
            <BellRing size={17} />
          </span>
          <span>
            <span className="block text-[14px] font-semibold text-luxury-ink">{t.reminders}</span>
            <span className="block text-[12.5px] text-luxury-muted">{props.remindersSummary}</span>
          </span>
        </button>
        <button type="button" onClick={() => setModal('about')} className="glass-card flex items-start gap-3 p-4 text-left">
          <span className="kpi-icon-wrap kpi-icon-wrap--logo !h-10 !w-10 shrink-0">
            <Info size={17} />
          </span>
          <span>
            <span className="block text-[14px] font-semibold text-luxury-ink">{t.about}</span>
            <span className="block text-[12.5px] text-luxury-muted">{t.aboutHint}</span>
          </span>
        </button>
      </section>

      {modal === 'settings' ? <SettingsModal props={props} onClose={() => setModal(null)} /> : null}
      {modal === 'tests' ? (
        <TestsModal
          lang={lang}
          items={props.tests.items}
          enrollmentId={props.enrollmentId}
          startDone={props.tests.startDone}
          endDone={props.tests.endDone}
          canRecordEnd={props.tests.canRecordEnd}
          preview={props.preview}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'about' ? <AboutModal about={props.about} lang={lang} onClose={() => setModal(null)} /> : null}
    </div>
  );
}

/* ===================== Terminé (bandeau) ===================== */

export function ProgramFinished({
  lang,
  slug,
  title,
  coverUrl,
  level,
  certificateNumber,
  enrollmentId,
  preview,
}: {
  lang: Lang;
  slug: string;
  title: string;
  coverUrl: string;
  level: number;
  certificateNumber: string | null;
  enrollmentId: string;
  preview?: boolean;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const es = lang === 'es';
  return (
    <div className="mx-auto max-w-[1180px] min-w-0 space-y-7 pb-16 pt-3 md:px-8 md:pt-8">
      <Breadcrumb lang={lang} title={title} />
      <section className="glass-card glass-card--kpi grid items-center gap-5 p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-7 md:p-7">
        <span className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[1.4rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="" className="h-full w-full object-cover object-top" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ProgramLevelPill level={level} lang={lang} />
            <span className="fm-tag fm-tag--green">
              <Award size={12} />
              {es ? 'Programa terminado' : 'Programme terminé'}
            </span>
          </div>
          <h1 className="fm-display mt-2 text-[2rem] leading-[1.05] text-luxury-ink md:text-[2.6rem]">{title}</h1>
          {certificateNumber ? <p className="mt-1 text-[12.5px] text-luxury-muted">{es ? 'Certificado' : 'Certificat'} {certificateNumber}</p> : null}
        </div>
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <Link href={`/compte/programmes/${slug}/termine`} className="btn-luxury-primary">
            <Award size={15} />
            {es ? 'Ver mi balance' : 'Voir mon bilan'}
          </Link>
          <button type="button" onClick={() => setConfirm(true)} className="text-center text-[12px] font-semibold text-luxury-muted hover:text-luxury-ink md:text-right">
            <RotateCcw size={13} className="mr-1 inline" />
            {es ? 'Empezar de nuevo' : 'Recommencer'}
          </button>
        </div>
      </section>
      {confirm ? (
        <div className="glass-card p-5 text-[14px] text-luxury-ink">
          <p>{C[lang].restartConfirm}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              className="btn-luxury-primary"
              onClick={() =>
                start(async () => {
                  if (preview) return;
                  const res = await restartProgramAction(enrollmentId);
                  if (res.ok) router.refresh();
                })
              }
            >
              {C[lang].confirm}
            </button>
            <button type="button" className="btn-luxury-ghost" onClick={() => setConfirm(false)}>
              {C[lang].cancel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
