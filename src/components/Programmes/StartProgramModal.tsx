'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Check, CircleCheck, Clock, Mail, Pause, Play, Smartphone, X } from 'lucide-react';

import { startProgramAction } from '@/app/compte/programmes/actions';
import { addDays, isoWeekday, shortDateLabel } from '@/lib/programmes/engine';
import { LEVELS } from './program-ui';

type Lang = 'fr' | 'es';

const DAYS = {
  fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
};
const TIMES = ['07:00', '12:30', '18:00', '20:00'];

const COPY = {
  fr: {
    kicker: 'Nouveau programme',
    title: (t: string) => `On démarre ${t} ?`,
    intro: (w: number, p: number, m: string) =>
      `${w} semaines · ${p} séances par semaine${m ? ` · ${m}` : ''}. Trois réglages et c’est parti : tu pourras tout changer plus tard.`,
    days: 'Tes jours d’entraînement',
    daysCount: (n: number) => `${n} jour${n > 1 ? 's' : ''} choisi${n > 1 ? 's' : ''}`,
    daysHint: (n: number) => `${n} jours conseillés, avec un jour de repos entre deux séances.`,
    reminder: 'Ton rappel, ces jours-là',
    other: 'Autre heure',
    email: 'Email',
    inapp: 'Notification dans l’espace client',
    push: 'Notification sur le téléphone',
    activate: 'Activer',
    example: (title: string, min: number | null) => `Exemple : « Ta séance du jour t’attend : ${title}${min ? ` (${min} min)` : ''} ».`,
    startTitle: 'Tu commences…',
    today: 'Aujourd’hui',
    monday: 'Lundi prochain',
    advised: 'conseillé',
    rightAway: 'séance 1 tout de suite',
    fullWeek: 'une semaine complète',
    firstOn: (d: string) => `séance 1 le ${d}`,
    test: 'Faire mon test de départ (2 min)',
    testHint: 'Tu le refais à la fin pour voir tes progrès.',
    pause: (t: string, p: number) => (
      <>
        <b className="font-semibold">{t}</b> ({p} %) sera mis en pause. Tu le reprendras quand tu veux, là où tu l’as laissé.
      </>
    ),
    cancel: 'Annuler',
    goToday: 'Commencer aujourd’hui',
    goOn: (d: string) => `Commencer le ${d}`,
    close: 'Fermer',
    pickDay: 'Choisis au moins un jour.',
    badTime: 'Indique une heure au format 18:30.',
    previewNote: 'Aperçu : rien n’est enregistré.',
  },
  es: {
    kicker: 'Nuevo programa',
    title: (t: string) => `¿Empezamos ${t}?`,
    intro: (w: number, p: number, m: string) =>
      `${w} semanas · ${p} sesiones por semana${m ? ` · ${m}` : ''}. Tres ajustes y listo: podrás cambiarlo todo después.`,
    days: 'Tus días de entrenamiento',
    daysCount: (n: number) => `${n} día${n > 1 ? 's' : ''} elegido${n > 1 ? 's' : ''}`,
    daysHint: (n: number) => `Se aconsejan ${n} días, con un día de descanso entre dos sesiones.`,
    reminder: 'Tu recordatorio, esos días',
    other: 'Otra hora',
    email: 'Email',
    inapp: 'Notificación en tu espacio',
    push: 'Notificación en el teléfono',
    activate: 'Activar',
    example: (title: string, min: number | null) => `Ejemplo: « Tu sesión del día te espera: ${title}${min ? ` (${min} min)` : ''} ».`,
    startTitle: 'Empiezas…',
    today: 'Hoy',
    monday: 'El próximo lunes',
    advised: 'aconsejado',
    rightAway: 'sesión 1 enseguida',
    fullWeek: 'una semana completa',
    firstOn: (d: string) => `sesión 1 el ${d}`,
    test: 'Hacer mi test inicial (2 min)',
    testHint: 'Lo repites al final para ver tus progresos.',
    pause: (t: string, p: number) => (
      <>
        <b className="font-semibold">{t}</b> ({p} %) se pondrá en pausa. Lo retomarás cuando quieras, donde lo dejaste.
      </>
    ),
    cancel: 'Cancelar',
    goToday: 'Empezar hoy',
    goOn: (d: string) => `Empezar el ${d}`,
    close: 'Cerrar',
    pickDay: 'Elige al menos un día.',
    badTime: 'Indica una hora con el formato 18:30.',
    previewNote: 'Vista previa: no se guarda nada.',
  },
} as const;

const LONG_WEEKDAY = {
  fr: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
  es: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
};

export type StartProgramInfo = {
  slug: string;
  title: string;
  coverUrl: string;
  level: number;
  weeks: number;
  perWeek: number;
  minutesRange: string;
  tests: Array<{ label: string }>;
  /** Aujourd'hui (AAAA-MM-JJ) dans le fuseau de la cliente. */
  todayKey: string;
  firstSession: { title: string; minutes: number | null } | null;
};

function firstChosenFrom(key: string, days: number[]): string {
  let k = key;
  for (let i = 0; i < 8; i += 1) {
    if (days.includes(isoWeekday(k))) return k;
    k = addDays(k, 1);
  }
  return key;
}

/** « lundi 19 oct. » */
function longDate(key: string, lang: Lang): string {
  const short = shortDateLabel(key, lang).split(' ').slice(1).join(' ');
  return `${LONG_WEEKDAY[lang][isoWeekday(key) - 1]} ${short}`;
}

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onToggle} className={`fm-switch ${on ? 'fm-switch--on' : ''}`} />;
}

export function StartProgramModal({
  info,
  lang = 'fr',
  open,
  onClose,
  preview,
  pause,
}: {
  info: StartProgramInfo;
  lang?: Lang;
  open: boolean;
  onClose: () => void;
  preview?: boolean;
  /** Programme actif qui sera mis en pause. */
  pause?: { title: string; percent: number } | null;
}) {
  const t = COPY[lang];
  const router = useRouter();
  const todayIsMonday = isoWeekday(info.todayKey) === 1;
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [time, setTime] = useState('18:00');
  const [custom, setCustom] = useState(false);
  const [start, setStart] = useState<'today' | 'monday'>(todayIsMonday ? 'today' : 'monday');
  const [channels, setChannels] = useState({ email: true, inapp: true, push: false });
  const [pushReady, setPushReady] = useState(false);
  const [doStartTest, setDoStartTest] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    let alive = true;
    (async () => {
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        const sub = await reg?.pushManager?.getSubscription();
        if (alive && sub) setPushReady(true);
      } catch {
        /* pas de push sur cet appareil */
      }
    })();
    return () => {
      alive = false;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const mondayKey = addDays(info.todayKey, 8 - isoWeekday(info.todayKey));
  const startKey = start === 'today' ? info.todayKey : mondayKey;
  const firstToday = firstChosenFrom(info.todayKey, days.length ? days : [1, 3, 5]);
  const firstMonday = firstChosenFrom(mondayKey, days.length ? days : [1, 3, 5]);
  const todaySub = `${shortDateLabel(info.todayKey, lang)} · ${firstToday === info.todayKey ? t.rightAway : t.firstOn(shortDateLabel(firstToday, lang))}`;
  const mondaySub = `${shortDateLabel(mondayKey, lang)} · ${firstMonday === mondayKey ? t.fullWeek : t.firstOn(shortDateLabel(firstMonday, lang))}`;

  function toggleDay(n: number) {
    setDays((cur) => (cur.includes(n) ? cur.filter((d) => d !== n) : [...cur, n].sort((a, b) => a - b)));
  }

  async function confirm() {
    if (!days.length) {
      setError(t.pickDay);
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
      setError(t.badTime);
      return;
    }
    if (preview) {
      onClose();
      return;
    }
    setBusy(true);
    setError(null);
    const res = await startProgramAction({
      programId: info.slug,
      startDate: startKey,
      chosenDays: days,
      reminderTime: time.trim(),
      reminderEmail: channels.email,
      reminderInapp: channels.inapp,
      reminderPush: channels.push,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    onClose();
    router.push(`/compte/programmes/${info.slug}${doStartTest && info.tests.length ? '?tests=depart' : ''}`);
    router.refresh();
  }

  return (
    <div
      className="kpi-modal-backdrop fixed inset-0 z-[200] flex items-end justify-center bg-[rgba(29,26,23,0.42)] backdrop-blur-[6px] md:items-center md:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-title"
        className="kpi-modal-panel relative flex max-h-[94vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[2rem] bg-cream shadow-[0_40px_100px_-20px_rgba(29,26,23,0.55)] md:max-h-[92vh] md:rounded-[2rem]"
      >
        <div className="fm-media relative h-[132px] shrink-0 md:h-[150px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={info.coverUrl} alt="" className="absolute inset-0 object-[50%_35%]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,26,23,0.15)_0%,rgba(29,26,23,0.72)_100%)]" />
          <span className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-white/70 md:hidden" />
          <button type="button" aria-label={t.close} onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-luxury-ink shadow-md">
            <X size={18} strokeWidth={2.2} />
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
              {t.kicker} · {LEVELS[info.level]?.[lang]}
            </p>
            <h2 id="start-title" className="fm-display mt-1 text-[1.9rem] leading-none !text-white md:text-[2.2rem]">
              {t.title(info.title)}
            </h2>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6 md:px-8">
          <p className="text-[14px] leading-relaxed text-luxury-muted">{t.intro(info.weeks, info.perWeek, info.minutesRange)}</p>

          <section>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-luxury-ink">
                <span className="mr-2 text-luxury-orange">1.</span>
                {t.days}
              </h3>
              <span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${days.length ? 'text-success' : 'text-luxury-soft'}`}>
                <CircleCheck size={14} strokeWidth={2.4} aria-hidden />
                {t.daysCount(days.length)}
              </span>
            </div>
            <p className="fm-hint !mt-1">{t.daysHint(info.perWeek)}</p>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {DAYS[lang].map((d, i) => {
                const on = days.includes(i + 1);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDay(i + 1)}
                    className={`flex h-14 flex-col items-center justify-center rounded-2xl text-[12px] font-semibold ${
                      on ? 'bg-luxury-ink text-white shadow-[0_8px_18px_rgba(29,29,31,0.22)]' : 'border border-black/10 bg-white text-luxury-muted'
                    }`}
                  >
                    {d}
                    {on ? (
                      <span className="mt-1 text-white/80">
                        <Check size={12} strokeWidth={3} aria-hidden />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-[15px] font-semibold text-luxury-ink">
              <span className="mr-2 text-luxury-orange">2.</span>
              {t.reminder}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {TIMES.map((tm) => {
                const on = !custom && time === tm;
                return (
                  <button
                    key={tm}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setCustom(false);
                      setTime(tm);
                    }}
                    className={`rounded-full px-4 py-2.5 text-[13px] font-semibold tabular-nums ${on ? 'bg-luxury-ink text-white' : 'border border-black/10 bg-white text-luxury-ink'}`}
                  >
                    {tm}
                  </button>
                );
              })}
              {custom ? (
                <input
                  type="time"
                  step={1800}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  aria-label={t.other}
                  className="rounded-full border border-luxury-ink bg-white px-4 py-2 text-[13px] font-semibold tabular-nums text-luxury-ink"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setCustom(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-black/20 bg-white/60 px-4 py-2.5 text-[13px] font-medium text-luxury-muted"
                >
                  <Clock size={14} aria-hidden />
                  {t.other}
                </button>
              )}
            </div>
            <div className="mt-4 divide-y divide-black/[0.06] rounded-2xl border border-black/[0.07] bg-white">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="inline-flex items-center gap-2.5 text-[14px] text-luxury-ink">
                  <Mail size={17} className="text-luxury-muted" aria-hidden />
                  {t.email}
                </span>
                <Switch on={channels.email} label={t.email} onToggle={() => setChannels((c) => ({ ...c, email: !c.email }))} />
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="inline-flex items-center gap-2.5 text-[14px] text-luxury-ink">
                  <Bell size={17} className="text-luxury-muted" aria-hidden />
                  {t.inapp}
                </span>
                <Switch on={channels.inapp} label={t.inapp} onToggle={() => setChannels((c) => ({ ...c, inapp: !c.inapp }))} />
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className={`inline-flex flex-wrap items-center gap-2.5 text-[14px] ${channels.push ? 'text-luxury-ink' : 'text-luxury-muted'}`}>
                  <Smartphone size={17} aria-hidden />
                  {t.push}
                  {!pushReady ? (
                    <Link href="/compte/preferences" className="fm-tag !py-0.5 !text-[10px]">
                      {t.activate}
                    </Link>
                  ) : null}
                </span>
                <Switch on={channels.push} label={t.push} onToggle={() => setChannels((c) => ({ ...c, push: !c.push }))} />
              </div>
            </div>
            {info.firstSession ? <p className="fm-hint">{t.example(info.firstSession.title, info.firstSession.minutes)}</p> : null}
          </section>

          <section>
            <h3 className="text-[15px] font-semibold text-luxury-ink">
              <span className="mr-2 text-luxury-orange">3.</span>
              {t.startTitle}
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t.startTitle}>
              {(
                [
                  ['today', t.today, todaySub, false],
                  ['monday', t.monday, mondaySub, true],
                ] as const
              ).map(([key, label, sub, advised]) => {
                const on = start === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setStart(key)}
                    className={`flex items-start gap-3 rounded-2xl p-4 text-left ${on ? 'border-2 border-luxury-orange bg-terracotta-50' : 'border border-black/10 bg-white'}`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-luxury-orange' : 'border-black/20'}`}
                      aria-hidden
                    >
                      {on ? <span className="h-2.5 w-2.5 rounded-full bg-luxury-orange" /> : null}
                    </span>
                    <span>
                      <span className="block text-[14px] font-semibold text-luxury-ink">
                        {label}
                        {advised && !todayIsMonday ? <span className="fm-tag fm-tag--orange ml-1 !py-0.5 !text-[10px]">{t.advised}</span> : null}
                      </span>
                      <span className="block text-[12.5px] text-luxury-muted">{sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {info.tests.length ? (
            <button
              type="button"
              role="checkbox"
              aria-checked={doStartTest}
              onClick={() => setDoStartTest((v) => !v)}
              className="flex w-full items-start gap-4 rounded-2xl border border-black/[0.07] bg-white p-4 text-left"
            >
              <span className={`fm-check mt-0.5 ${doStartTest ? 'fm-check--on' : ''}`} aria-hidden>
                {doStartTest ? <Check size={14} strokeWidth={3} /> : null}
              </span>
              <span>
                <span className="block text-[14px] font-semibold text-luxury-ink">{t.test}</span>
                <span className="mt-0.5 block text-[12.5px] leading-relaxed text-luxury-muted">
                  {info.tests.map((x) => x.label).join(' · ')}. {t.testHint}
                </span>
              </span>
            </button>
          ) : null}

          {pause ? (
            <div className="flex items-start gap-3 rounded-2xl bg-[#fff4e5] p-4 text-[13px] leading-relaxed text-[#8a5a1f]">
              <Pause size={16} strokeWidth={2.2} className="mt-0.5 shrink-0" aria-hidden />
              <p>{t.pause(pause.title, pause.percent)}</p>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          {preview ? <p className="text-[12px] text-luxury-soft">{t.previewNote}</p> : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-black/[0.06] bg-cream/95 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-end md:px-8">
          <button type="button" className="btn-luxury-ghost" onClick={onClose}>
            {t.cancel}
          </button>
          <button type="button" disabled={busy} onClick={() => void confirm()} className="btn-luxury-primary">
            <Play size={14} strokeWidth={2.4} aria-hidden />
            {busy ? '…' : start === 'today' ? t.goToday : t.goOn(longDate(mondayKey, lang))}
          </button>
        </div>
      </div>
    </div>
  );
}
