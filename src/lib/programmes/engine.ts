/**
 * Moteur de programme (pur, sans base) : à partir des séances du programme, de l'inscription
 * (date de début, jours choisis, report) et de la progression, calcule l'état affiché partout :
 * page programme (B02), lecteur (B05), catalogue (B01), tableau de bord (B06), planning (D04),
 * rappels (A07) et relance douce.
 *
 * Règles :
 * - une séance par jour au plus, uniquement les jours choisis (1 = lundi … 7 = dimanche ; vide → lun/mer/ven) ;
 * - les séances non faites sont planifiées à partir d'aujourd'hui (jamais dans le passé) : le programme suit
 *   le rythme de la cliente, une séance manquée glisse simplement au prochain jour choisi ;
 * - « Décaler à demain » = `postponedUntil` : rien n'est planifié avant cette date ;
 * - programme en pause : aucune date planifiée ;
 * - semaine en cours = semaine de la prochaine séance à faire.
 */

export type Lang = 'fr' | 'es';
export type Localized = { fr: string; es: string };
export type Feeling = 'easy' | 'right' | 'hard';

export type EngineStep = {
  /** Identifiant de l'étape (uuid en base, « semaine-position » pour le catalogue). */
  id: string;
  week: number;
  position: number;
  kind: 'video' | 'live';
  minutes: number | null;
  title: Localized;
  titleLong?: Localized | null;
  videoTitle?: string | null;
  videoId?: string | null;
  startS?: number | null;
  endS?: number | null;
  liveStyle?: string | null;
};

export type EngineProgress = {
  stepId: string;
  completedAt: string | null;
  watchedS: number;
  feeling: Feeling | null;
};

export type EngineEnrollment = {
  id: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  /** AAAA-MM-JJ */
  startDate: string;
  chosenDays: number[];
  postponedUntil?: string | null;
  reminderTime?: string | null;
  createdAt?: string | null;
};

export type SessionStatus = 'done' | 'today' | 'planned';

export type SessionState = {
  step: EngineStep;
  /** Numéro de la séance dans le programme (1 = première vidéo). */
  n: number;
  status: SessionStatus;
  /** Faite : jour de validation ; à faire : jour prévu (null si en pause). */
  dateKey: string | null;
  feeling: Feeling | null;
  watchedS: number;
};

export type ProgramState = {
  sessions: SessionState[];
  total: number;
  done: number;
  percent: number;
  next: SessionState | null;
  currentWeek: number;
  weeks: number;
  weekSessions: SessionState[];
  weekDone: number;
  liveStepForWeek: EngineStep | null;
  isComplete: boolean;
  lastDoneDateKey: string | null;
  /** Jours depuis la dernière séance faite (ou depuis le début si aucune). */
  daysSinceActivity: number;
  /** Deux « Difficile » d'affilée sur les dernières séances faites. */
  suggestSofter: boolean;
  chosenDays: number[];
};

const DEFAULT_DAYS = [1, 3, 5];

/* ——— Dates (clés AAAA-MM-JJ, calcul en UTC pour éviter tout décalage) ——— */

export function keyToUtcNoon(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12));
}

export function addDays(key: string, n: number): string {
  const d = keyToUtcNoon(key);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isoWeekday(key: string): number {
  return ((keyToUtcNoon(key).getUTCDay() + 6) % 7) + 1;
}

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((keyToUtcNoon(toKey).getTime() - keyToUtcNoon(fromKey).getTime()) / 86_400_000);
}

export function dayKeyInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function normalizeChosenDays(days: number[] | null | undefined): number[] {
  const list = Array.from(new Set((days ?? []).map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))).sort((a, b) => a - b);
  return list.length ? list : DEFAULT_DAYS;
}

function nextChosenDay(fromKey: string, chosen: number[]): string {
  let key = fromKey;
  for (let i = 0; i < 8; i += 1) {
    if (chosen.includes(isoWeekday(key))) return key;
    key = addDays(key, 1);
  }
  return fromKey;
}

function maxKey(...keys: Array<string | null | undefined>): string {
  return keys.filter((k): k is string => Boolean(k)).sort().pop() as string;
}

/* ——— Calcul principal ——— */

export function computeProgramState(args: {
  steps: EngineStep[];
  progress: EngineProgress[];
  enrollment: EngineEnrollment;
  todayKey: string;
  timeZone: string;
}): ProgramState {
  const { steps, progress, enrollment, todayKey, timeZone } = args;
  const chosen = normalizeChosenDays(enrollment.chosenDays);
  const byStep = new Map(progress.map((p) => [p.stepId, p]));
  const videos = steps
    .filter((s) => s.kind === 'video')
    .sort((a, b) => a.week - b.week || a.position - b.position);
  const weeks = steps.reduce((m, s) => Math.max(m, s.week), 0);

  const sessions: SessionState[] = videos.map((step, i) => {
    const p = byStep.get(step.id);
    const completed = Boolean(p?.completedAt);
    return {
      step,
      n: i + 1,
      status: completed ? 'done' : 'planned',
      dateKey: completed && p?.completedAt ? dayKeyInTimeZone(new Date(p.completedAt), timeZone) : null,
      feeling: p?.feeling ?? null,
      watchedS: p?.watchedS ?? 0,
    };
  });

  const doneDates = sessions.filter((s) => s.status === 'done' && s.dateKey).map((s) => s.dateKey as string);
  const doneToday = doneDates.includes(todayKey);
  const schedulable = enrollment.status === 'active';
  let cursor = maxKey(
    todayKey,
    enrollment.startDate,
    enrollment.postponedUntil && enrollment.postponedUntil > todayKey ? enrollment.postponedUntil : null,
    doneToday ? addDays(todayKey, 1) : null,
  );
  for (const s of sessions) {
    if (s.status === 'done') continue;
    if (!schedulable) {
      s.dateKey = null;
      continue;
    }
    const day = nextChosenDay(cursor, chosen);
    s.dateKey = day;
    s.status = day === todayKey ? 'today' : 'planned';
    cursor = addDays(day, 1);
  }

  const done = sessions.filter((s) => s.status === 'done').length;
  const total = sessions.length;
  const next = sessions.find((s) => s.status !== 'done') ?? null;
  const currentWeek = next?.step.week ?? (weeks || 1);
  const weekSessions = sessions.filter((s) => s.step.week === currentWeek);
  const lastDoneDateKey = doneDates.length ? [...doneDates].sort().pop() ?? null : null;
  const doneByDate = sessions
    .filter((s) => s.status === 'done')
    .sort((a, b) => (a.dateKey ?? '').localeCompare(b.dateKey ?? '') || a.n - b.n);
  const lastTwo = doneByDate.slice(-2);
  const suggestSofter = lastTwo.length === 2 && lastTwo.every((s) => s.feeling === 'hard');

  return {
    sessions,
    total,
    done,
    percent: total ? Math.round((done / total) * 100) : 0,
    next,
    currentWeek,
    weeks: weeks || 1,
    weekSessions,
    weekDone: weekSessions.filter((s) => s.status === 'done').length,
    liveStepForWeek: steps.find((s) => s.kind === 'live' && s.week === currentWeek) ?? null,
    isComplete: total > 0 && done === total,
    lastDoneDateKey,
    daysSinceActivity: Math.max(0, daysBetween(lastDoneDateKey ?? enrollment.startDate, todayKey)),
    suggestSofter,
    chosenDays: chosen,
  };
}

/** Séances à afficher dans le planning entre deux jours (fin exclue). */
export function sessionsInRange(state: ProgramState, fromKey: string, toKeyExclusive: string): SessionState[] {
  return state.sessions.filter((s) => s.dateKey != null && s.dateKey >= fromKey && s.dateKey < toKeyExclusive);
}

/** Relance douce (SPEC §3.5) : aucune séance depuis 4 jours, au plus une fois par semaine. */
export function shouldNudge(state: ProgramState, lastNudgeKey: string | null, todayKey: string, status: EngineEnrollment['status']): boolean {
  if (status !== 'active' || state.isComplete) return false;
  if (state.daysSinceActivity < 4) return false;
  if (lastNudgeKey && daysBetween(lastNudgeKey, todayKey) < 7) return false;
  return true;
}

const WEEKDAY_SHORT: Record<Lang, string[]> = {
  fr: ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'],
  es: ['lun.', 'mar.', 'mié.', 'jue.', 'vie.', 'sáb.', 'dom.'],
};
const WEEKDAY_CAP: Record<Lang, string[]> = {
  fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
};
const MONTH_SHORT: Record<Lang, string[]> = {
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  es: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'],
};

/** « lun. 12 oct. » */
export function shortDateLabel(key: string, lang: Lang): string {
  const d = keyToUtcNoon(key);
  return `${WEEKDAY_SHORT[lang][isoWeekday(key) - 1]} ${d.getUTCDate()} ${MONTH_SHORT[lang][d.getUTCMonth()]}`;
}

/** « lun. 12 » */
export function weekdayDayLabel(key: string, lang: Lang): string {
  return `${WEEKDAY_SHORT[lang][isoWeekday(key) - 1]} ${keyToUtcNoon(key).getUTCDate()}`;
}

/** « 5 oct. » */
export function dayMonthLabel(key: string, lang: Lang): string {
  const d = keyToUtcNoon(key);
  return `${d.getUTCDate()} ${MONTH_SHORT[lang][d.getUTCMonth()]}`;
}

/** « Lun · Mer · Ven » */
export function chosenDaysLabel(days: number[], lang: Lang): string {
  return normalizeChosenDays(days)
    .map((d) => WEEKDAY_CAP[lang][d - 1])
    .join(' · ');
}

/** « aujourd'hui », « demain », sinon « ven. 16 oct. » */
export function relativeDayLabel(key: string, todayKey: string, lang: Lang): string {
  if (key === todayKey) return lang === 'es' ? 'hoy' : 'aujourd’hui';
  if (key === addDays(todayKey, 1)) return lang === 'es' ? 'mañana' : 'demain';
  return shortDateLabel(key, lang);
}

/** « 4 h 25 », « 52 min », « 1 h » */
export function hoursMinutesLabel(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`;
}

/** Semaine ISO (« 2026-W43 ») d'un jour : clé d'unicité de la relance douce. */
export function isoWeekKey(dayKey: string): string {
  const thursday = addDays(dayKey, 4 - isoWeekday(dayKey));
  const year = Number(thursday.slice(0, 4));
  const jan1 = `${year}-01-01`;
  const days = Math.round((Date.parse(`${thursday}T12:00:00Z`) - Date.parse(`${jan1}T12:00:00Z`)) / 86_400_000);
  return `${year}-W${String(Math.floor(days / 7) + 1).padStart(2, '0')}`;
}

