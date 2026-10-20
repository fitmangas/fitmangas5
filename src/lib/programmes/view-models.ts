/**
 * Données d'affichage des écrans programme (B02 en cours, B03 découverte, B05 lecteur, B01/B06 carte « en cours »).
 * Fonctions pures : la page serveur et les aperçus de développement produisent exactement les mêmes données.
 */
import type { CatalogProgram } from '@/lib/programmes/catalogue';
import programCatalog from '@/lib/programmes/catalogue.json';
import {
  addDays,
  chosenDaysLabel,
  hoursMinutesLabel,
  dayMonthLabel,
  isoWeekday,
  keyToUtcNoon,
  relativeDayLabel,
  shortDateLabel,
  weekdayDayLabel,
  type EngineStep,
  type Lang,
  type ProgramState,
  type SessionState,
} from '@/lib/programmes/engine';
import type { EnrollmentData, ProgramDefinition, StepVideo, WeeklyLive } from '@/lib/programmes/load';
import { LEVELS_TEXT } from '@/lib/programmes/texts';

type Faq = { q: { fr: string; es: string }; a: { fr: string; es: string } };
const CATALOG_FAQ = (programCatalog as { faq?: Faq[] }).faq ?? [];
const CATALOG_SAFETY = (programCatalog as { safety?: { fr: string; es: string } }).safety ?? { fr: '', es: '' };

export type TestItem = {
  key: string;
  label: string;
  how: string;
  /** seconds · count · scale */
  type: string;
  /** Échelle (type « scale ») : du moins bon au meilleur. */
  scale: string[] | null;
};

export type AboutData = {
  benefits: Array<{ text: string; icon?: string | null }>;
  forWho: string | null;
  notFor: string | null;
  equipment: string[];
  faq: Array<{ q: string; a: string }>;
  safety: string;
  tests: TestItem[];
  weeks: number;
};

export type DiscoveryProps = {
  lang: Lang;
  slug: string;
  canStart: boolean;
  title: string;
  promise: string;
  level: number;
  goals: string[];
  weeks: number;
  perWeek: number;
  minutesRange: string;
  coverUrl: string;
  schedule: Array<{
    week: number;
    focus: string;
    cue: string | null;
    sessions: number;
    minMin: number | null;
    maxMin: number | null;
    hasLive: boolean;
    details: Array<{ n: number; title: string; minutes: number | null }>;
  }>;
  totalSessions: number;
  firstSessionHref: string | null;
  /** Programme actif qui sera mis en pause si elle démarre celui-ci. */
  otherActive: { title: string; percent: number } | null;
  /** Aujourd'hui dans le fuseau de la cliente (modale de démarrage B04). */
  todayKey: string;
  firstSession: { title: string; minutes: number | null } | null;
  about: AboutData;
};

export type WeekRow =
  | {
      kind: 'video';
      key: string;
      n: number;
      title: string;
      minutes: number | null;
      thumb: string;
      status: SessionState['status'];
      dateLabel: string | null;
      href: string;
    }
  | {
      kind: 'live';
      key: string;
      dayShort: string;
      dayNum: string;
      title: string;
      sub: string;
      agendaHref: string;
    }
  | { kind: 'live-none'; key: string; text: string };

export type AllWeek = {
  index: number;
  focus: string;
  state: 'done' | 'current' | 'future';
  subtitle: string;
  sessions: Array<{ n: number; title: string; right: string; done: boolean }>;
};

export type InProgressProps = {
  lang: Lang;
  slug: string;
  enrollmentId: string;
  paused: boolean;
  title: string;
  coverUrl: string;
  level: number;
  startedLabel: string;
  done: number;
  total: number;
  percent: number;
  resume: { href: string; label: string } | null;
  week: { index: number; weeks: number; focus: string; cue: string | null; tag: string };
  weekRows: WeekRow[];
  allWeeks: AllWeek[];
  testsSummary: string;
  remindersSummary: string;
  settings: { chosenDays: number[]; reminderTime: string };
  about: AboutData;
  tests: { items: TestItem[]; startDone: boolean; endDone: boolean; canRecordEnd: boolean };
  postponePrompt: boolean;
  softer: { href: string; title: string; text: string } | null;
  completable: boolean;
};

const T = {
  fr: {
    started: 'Commencé le',
    startsOn: 'Commence le',
    resume: 'Reprendre · séance',
    start: 'Commencer · séance',
    weekTag: (d: number, t: number) => `${d} séance${d > 1 ? 's' : ''} sur ${t} faite${d > 1 ? 's' : ''}`,
    liveTitle: 'Le live de la semaine avec Alejandra',
    liveSub: 'elle te voit et te corrige',
    liveNone: 'Pas encore au planning : tu recevras le rappel la veille dès qu’il sera publié.',
    weekDone: (n: number) => `Terminée · ${n} séances + le live`,
    weekCurrent: 'En cours · voir « Cette semaine »',
    weekFuture: (date: string | null, n: number) => `${date ? `À partir du ${date} · ` : ''}${n} séances + le live`,
    doneWord: 'Faite',
    testsNone: 'Test de départ à faire (2 min)',
    testsStart: (date: string, w: number) => `Départ fait${date ? ` le ${date}` : ''} · arrivée en semaine ${w}`,
    testsBoth: 'Départ et arrivée faits · compare tes résultats',
    reminders: (days: string, time: string) => `${days} à ${time} · modifier`,
    softerTitle: 'Une version plus douce ?',
    softerTextProgram: (title: string) => `Deux séances « Difficile » d’affilée. Tu peux passer à « ${title} » et revenir ici plus tard.`,
    softerTextHalf: 'Deux séances « Difficile » d’affilée : fais seulement la première moitié de la séance, ou essaie « Souplesse & récupération ».',
  },
  es: {
    started: 'Empezado el',
    startsOn: 'Empieza el',
    resume: 'Retomar · sesión',
    start: 'Empezar · sesión',
    weekTag: (d: number, t: number) => `${d} sesión${d > 1 ? 'es' : ''} de ${t} hecha${d > 1 ? 's' : ''}`,
    liveTitle: 'El live de la semana con Alejandra',
    liveSub: 'te ve y te corrige',
    liveNone: 'Todavía no está en el planning: recibirás el recordatorio la víspera en cuanto se publique.',
    weekDone: (n: number) => `Terminada · ${n} sesiones + el live`,
    weekCurrent: 'En curso · ver « Esta semana »',
    weekFuture: (date: string | null, n: number) => `${date ? `A partir del ${date} · ` : ''}${n} sesiones + el live`,
    doneWord: 'Hecha',
    testsNone: 'Test inicial por hacer (2 min)',
    testsStart: (date: string, w: number) => `Inicio hecho${date ? ` el ${date}` : ''} · final en la semana ${w}`,
    testsBoth: 'Inicio y final hechos · compara tus resultados',
    reminders: (days: string, time: string) => `${days} a las ${time} · modificar`,
    softerTitle: '¿Una versión más suave?',
    softerTextProgram: (title: string) => `Dos sesiones « Difícil » seguidas. Puedes pasar a « ${title} » y volver aquí más tarde.`,
    softerTextHalf: 'Dos sesiones « Difícil » seguidas: haz solo la primera mitad de la sesión, o prueba « Flexibilidad y recuperación ».',
  },
} as const;

export function sessionHref(slug: string, step: EngineStep): string {
  return `/compte/programmes/${slug}/seance/${encodeURIComponent(step.id)}`;
}

/**
 * Partie de la vidéo source (« partie 2 sur 3 ») quand une même vidéo est découpée en plusieurs
 * séances. Les segments identiques (séance refaite une autre semaine) comptent pour une seule partie.
 */
export function partOf(steps: EngineStep[], step: EngineStep): { index: number; count: number } | null {
  const key = step.videoId ?? step.videoTitle;
  if (!key) return null;
  const segs = new Map<string, number>();
  for (const s of steps) {
    if (s.kind !== 'video' || (s.videoId ?? s.videoTitle) !== key) continue;
    segs.set(`${s.startS ?? 0}-${s.endS ?? ''}`, s.startS ?? 0);
  }
  if (segs.size < 2) return null;
  const ordered = Array.from(segs.entries()).sort((a, b) => a[1] - b[1]).map(([k]) => k);
  const index = ordered.indexOf(`${step.startS ?? 0}-${step.endS ?? ''}`) + 1;
  return index > 0 ? { index, count: ordered.length } : null;
}

export { hoursMinutesLabel } from '@/lib/programmes/engine';

export function stepThumb(step: EngineStep, videos: Record<string, StepVideo>, cover: string): string {
  const v = step.videoId ? videos[step.videoId] : null;
  return v?.thumbnailUrl || cover;
}

export function buildAbout(program: CatalogProgram, lang: Lang): AboutData {
  return {
    benefits: (program.benefits ?? []).map((b) => ({ text: b[lang] || b.fr, icon: b.icon ?? null })),
    forWho: program.for_who ? program.for_who[lang] || program.for_who.fr : null,
    notFor: program.not_for ? program.not_for[lang] || program.not_for.fr : null,
    equipment: (program.equipment ?? []).map((e) => e[lang] || e.fr),
    faq: CATALOG_FAQ.map((f) => ({ q: f.q[lang] || f.q.fr, a: f.a[lang] || f.a.fr })),
    safety: CATALOG_SAFETY[lang] || CATALOG_SAFETY.fr,
    tests: ((program.tests ?? []) as Array<Record<string, unknown>>).map((t) => {
      const label = (t.label as { fr?: string; es?: string } | undefined) ?? {};
      const how = (t.how as { fr?: string; es?: string } | undefined) ?? {};
      const scale = (t.scale as { fr?: unknown; es?: unknown } | undefined) ?? {};
      const scaleList = (lang === 'es' && Array.isArray(scale.es) ? scale.es : scale.fr) as unknown;
      return {
        key: String(t.key ?? ''),
        label: (lang === 'es' ? label.es : label.fr) || label.fr || '',
        how: (lang === 'es' ? how.es : how.fr) || how.fr || '',
        type: String(t.type ?? 'count'),
        scale: Array.isArray(scaleList) ? scaleList.map(String) : null,
      };
    }),
    weeks: program.weeks,
  };
}

export function buildDiscoveryProps(args: {
  def: ProgramDefinition;
  lang: Lang;
  otherActive: { title: string; percent: number } | null;
  todayKey: string;
}): DiscoveryProps {
  const { def, lang } = args;
  const p = def.program;
  const videos = def.steps.filter((s) => s.kind === 'video').sort((a, b) => a.week - b.week || a.position - b.position);
  const weeks = Array.from(new Set(def.steps.map((s) => s.week))).sort((a, b) => a - b);
  let n = 0;
  const schedule = weeks.map((w) => {
    const detail = (p.weeks_detail ?? []).find((d) => d.week === w);
    const vids = videos.filter((s) => s.week === w);
    const mins = vids.map((s) => s.minutes).filter((m): m is number => m != null);
    return {
      week: w,
      focus: detail?.focus?.[lang] || detail?.focus?.fr || '',
      cue: detail?.cues?.[0]?.[lang] || detail?.cues?.[0]?.fr || null,
      sessions: vids.length,
      minMin: mins.length ? Math.min(...mins) : null,
      maxMin: mins.length ? Math.max(...mins) : null,
      hasLive: def.steps.some((s) => s.week === w && s.kind === 'live'),
      details: vids.map((s) => {
        n += 1;
        return { n, title: s.title[lang] || s.title.fr || s.videoTitle || '', minutes: s.minutes };
      }),
    };
  });
  return {
    lang,
    slug: p.slug,
    canStart: Boolean(def.programId),
    title: p.title[lang] || p.title.fr,
    promise: p.promise?.[lang] || p.promise?.fr || '',
    level: p.level,
    goals: p.goals ?? [],
    weeks: p.weeks,
    perWeek: p.sessions_per_week,
    minutesRange: p.minutes_range,
    coverUrl: def.coverUrl,
    schedule,
    totalSessions: videos.length,
    firstSessionHref: videos[0] ? sessionHref(p.slug, videos[0]) : null,
    otherActive: args.otherActive,
    todayKey: args.todayKey,
    firstSession: videos[0] ? { title: videos[0].title[lang] || videos[0].title.fr || videos[0].videoTitle || '', minutes: videos[0].minutes } : null,
    about: buildAbout(p, lang),
  };
}

function liveRow(live: WeeklyLive | null, timeZone: string, lang: Lang): WeekRow {
  const t = T[lang];
  if (!live) return { kind: 'live-none', key: 'live', text: t.liveNone };
  const d = new Date(live.startsAt);
  const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const time = new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'fr-FR', { timeZone, hour: '2-digit', minute: '2-digit' }).format(d);
  return {
    kind: 'live',
    key: `live-${live.id}`,
    dayShort: shortDateLabel(dayKey, lang).split(' ')[0],
    dayNum: String(keyToUtcNoon(dayKey).getUTCDate()),
    title: t.liveTitle,
    sub: `${time} · ${live.title} · ${t.liveSub}`,
    agendaHref: `/api/calendar/live/${live.id}`,
  };
}

export function buildInProgressProps(args: {
  def: ProgramDefinition;
  data: EnrollmentData;
  state: ProgramState;
  live: WeeklyLive | null;
  lang: Lang;
  todayKey: string;
  timeZone: string;
  postponePrompt?: boolean;
  softerProgram?: { slug: string; title: string } | null;
}): InProgressProps {
  const { def, data, state, live, lang, todayKey, timeZone } = args;
  const t = T[lang];
  const p = def.program;
  const slug = p.slug;
  const enr = data.enrollment;
  const started = enr.startDate <= todayKey ? `${t.started} ${dayMonthLabel(enr.startDate, lang)}` : `${t.startsOn} ${dayMonthLabel(enr.startDate, lang)}`;
  const weekDetail = (p.weeks_detail ?? []).find((w) => w.week === state.currentWeek);
  const weekRows: WeekRow[] = state.weekSessions.map((s) => ({
    kind: 'video' as const,
    key: s.step.id,
    n: s.n,
    title: s.step.title[lang] || s.step.title.fr || s.step.videoTitle || '',
    minutes: s.step.minutes,
    thumb: stepThumb(s.step, def.videos, def.coverUrl),
    status: s.status,
    dateLabel: s.dateKey
      ? s.status === 'done'
        ? `${t.doneWord} · ${shortDateLabel(s.dateKey, lang)}`
        : relativeDayLabel(s.dateKey, todayKey, lang)
      : null,
    href: sessionHref(slug, s.step),
  }));
  if (state.liveStepForWeek) weekRows.push(liveRow(live, timeZone, lang));

  const weeksList = Array.from(new Set(def.steps.map((s) => s.week))).sort((a, b) => a - b);
  const allWeeks: AllWeek[] = weeksList.map((w) => {
    const sess = state.sessions.filter((s) => s.step.week === w);
    const allDone = sess.length > 0 && sess.every((s) => s.status === 'done');
    const stateW: AllWeek['state'] = allDone ? 'done' : w === state.currentWeek ? 'current' : w < state.currentWeek ? 'done' : 'future';
    const firstPlanned = sess.find((s) => s.status !== 'done' && s.dateKey)?.dateKey ?? null;
    const detail = (p.weeks_detail ?? []).find((d) => d.week === w);
    return {
      index: w,
      focus: detail?.focus?.[lang] || detail?.focus?.fr || '',
      state: stateW,
      subtitle: stateW === 'done' ? t.weekDone(sess.length) : stateW === 'current' ? t.weekCurrent : t.weekFuture(firstPlanned ? shortDateLabel(firstPlanned, lang) : null, sess.length),
      sessions: sess.map((s) => ({
        n: s.n,
        title: s.step.title[lang] || s.step.title.fr || s.step.videoTitle || '',
        right: s.status === 'done' ? t.doneWord : s.step.minutes ? `${s.step.minutes} min` : '',
        done: s.status === 'done',
      })),
    };
  });

  const startTest = data.testPhases.includes('start');
  const endTest = data.testPhases.includes('end');
  const lastWeek = state.weeks;
  const testsSummary = startTest && endTest ? t.testsBoth : startTest ? t.testsStart(dayMonthLabel(enr.startDate, lang), lastWeek) : t.testsNone;
  const reminderTime = enr.reminderTime || '18:00';

  let softer: InProgressProps['softer'] = null;
  if (state.suggestSofter) {
    softer = args.softerProgram
      ? { href: `/compte/programmes/${args.softerProgram.slug}`, title: t.softerTitle, text: t.softerTextProgram(args.softerProgram.title) }
      : { href: '/compte/programmes/souplesse-recuperation', title: t.softerTitle, text: t.softerTextHalf };
  }

  return {
    lang,
    slug,
    enrollmentId: enr.id,
    paused: enr.status === 'paused',
    title: p.title[lang] || p.title.fr,
    coverUrl: def.coverUrl,
    level: p.level,
    startedLabel: `${started} · ${chosenDaysLabel(enr.chosenDays, lang)}`,
    done: state.done,
    total: state.total,
    percent: state.percent,
    resume: state.next ? { href: sessionHref(slug, state.next.step), label: `${state.done > 0 ? t.resume : t.start} ${state.next.n}` } : null,
    week: {
      index: state.currentWeek,
      weeks: state.weeks,
      focus: weekDetail?.focus?.[lang] || weekDetail?.focus?.fr || '',
      cue: weekDetail?.cues?.[0]?.[lang] || weekDetail?.cues?.[0]?.fr || null,
      tag: t.weekTag(state.weekDone, state.weekSessions.length),
    },
    weekRows,
    allWeeks,
    testsSummary,
    remindersSummary: t.reminders(chosenDaysLabel(enr.chosenDays, lang), reminderTime),
    settings: { chosenDays: state.chosenDays, reminderTime },
    about: buildAbout(p, lang),
    tests: {
      items: buildAbout(p, lang).tests,
      startDone: startTest,
      endDone: endTest,
      canRecordEnd: state.currentWeek >= lastWeek || state.isComplete,
    },
    postponePrompt: Boolean(args.postponePrompt),
    softer,
    completable: state.isComplete && enr.status !== 'completed',
  };
}

/** Programme plus doux du même parcours (SPEC §4.2) : niveau inférieur, même piste. */
export function softerProgramFor(program: CatalogProgram, all: CatalogProgram[], lang: Lang): { slug: string; title: string } | null {
  if (program.level <= 1) return null;
  const candidate = all.find((p) => p.track === program.track && p.level === program.level - 1);
  return candidate ? { slug: candidate.slug, title: candidate.title[lang] || candidate.title.fr } : null;
}

/** Libellé de niveau (« Débutante »). */
export function levelLabel(level: number, lang: Lang): string {
  return LEVELS_TEXT[level]?.[lang] ?? '';
}

/** Lundi (clé) de la semaine d'un jour. */
export function mondayOf(key: string): string {
  return addDays(key, -(isoWeekday(key) - 1));
}

/* ——— B05 lecteur ——— */

export type SessionViewProps = {
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
  startS: number;
  endS: number | null;
  videoDurationS: number | null;
  embedUrl: string | null;
  posterUrl: string;
  enrollmentId: string | null;
  stepId: string;
  initialFeeling: 'easy' | 'right' | 'hard' | null;
  initialDone: boolean;
  prev: { href: string; label: string } | null;
  next: { href: string; label: string; when: string | null } | null;
  weekList: Array<{ n: number; title: string; status: 'done' | 'now' | 'next'; when: string }>;
  live: { when: string } | null;
  softer: { href: string; text: string } | null;
};

/** Titre de vidéo lisible : sans le dossier entre crochets ni l'extension. */
export function cleanVideoTitle(title: string | null | undefined): string | null {
  if (!title) return null;
  const t = title
    .replace(/\.(mp4|mov|m4v)$/i, '')
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
    .replace(/^\s*\[[^\]]*\]\s*/, '')
    .replace(/^fitmangas\s*[–—-]\s*/i, '')
    .replace(/\s*\((?:\d+\s*(?:min|h)[^)]*)\)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return t || null;
}

export function vimeoEmbedFor(video: StepVideo | undefined): string | null {
  if (!video) return null;
  if (video.embedUrl) return video.embedUrl;
  if (video.vimeoVideoId) return `https://player.vimeo.com/video/${video.vimeoVideoId}`;
  return null;
}

export function buildSessionProps(args: {
  def: ProgramDefinition;
  data: EnrollmentData | null;
  state: ProgramState | null;
  step: EngineStep;
  lang: Lang;
  todayKey: string;
  timeZone: string;
  live: WeeklyLive | null;
  softerProgram?: { slug: string; title: string } | null;
}): SessionViewProps {
  const { def, data, state, step, lang, todayKey, timeZone, live } = args;
  const p = def.program;
  const t = T[lang];
  const videos = def.steps.filter((s) => s.kind === 'video').sort((a, b) => a.week - b.week || a.position - b.position);
  const idx = videos.findIndex((s) => s.id === step.id);
  const detail = (p.weeks_detail ?? []).find((w) => w.week === step.week);
  const video = step.videoId ? def.videos[step.videoId] : undefined;
  const sessionOf = (s: EngineStep) => state?.sessions.find((x) => x.step.id === s.id) ?? null;
  const me = sessionOf(step);
  const prevStep = idx > 0 ? videos[idx - 1] : null;
  const nextStep = idx >= 0 && idx < videos.length - 1 ? videos[idx + 1] : null;
  const nextSession = nextStep ? sessionOf(nextStep) : null;
  const titleOf = (s: EngineStep) => s.title[lang] || s.title.fr || s.videoTitle || '';
  const activeEnrollment = data && (data.enrollment.status === 'active' || data.enrollment.status === 'paused') ? data.enrollment.id : null;

  const weekList = (state?.sessions ?? [])
    .filter((s) => s.step.week === step.week)
    .map((s) => ({
      n: s.n,
      title: titleOf(s.step),
      status: s.step.id === step.id ? ('now' as const) : s.status === 'done' ? ('done' as const) : ('next' as const),
      when: s.dateKey ? (s.dateKey === todayKey ? relativeDayLabel(s.dateKey, todayKey, lang) : weekdayDayLabel(s.dateKey, lang)) : '',
    }));

  let liveInfo: SessionViewProps['live'] = null;
  if (live && state?.liveStepForWeek && state.liveStepForWeek.week === step.week) {
    const d = new Date(live.startsAt);
    const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    const time = new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'fr-FR', { timeZone, hour: '2-digit', minute: '2-digit' }).format(d);
    liveInfo = { when: `${weekdayDayLabel(dayKey, lang)} · ${time}` };
  }

  let softer: SessionViewProps['softer'] = null;
  if (state?.suggestSofter) {
    softer = args.softerProgram
      ? { href: `/compte/programmes/${args.softerProgram.slug}`, text: t.softerTextProgram(args.softerProgram.title) }
      : { href: '/compte/programmes/souplesse-recuperation', text: t.softerTextHalf };
  }

  const progress = data?.progress.find((x) => x.stepId === step.id);
  return {
    lang,
    slug: p.slug,
    programTitle: p.title[lang] || p.title.fr,
    n: idx + 1,
    total: videos.length,
    weekIndex: step.week,
    weekFocus: detail?.focus?.[lang] || detail?.focus?.fr || '',
    title: titleOf(step),
    objective: (step.titleLong && (step.titleLong[lang] || step.titleLong.fr)) || titleOf(step),
    cues: (detail?.cues ?? []).map((c) => c[lang] || c.fr).filter(Boolean),
    level: p.level,
    minutes: step.minutes,
    equipment: p.equipment?.[0] ? p.equipment[0][lang] || p.equipment[0].fr : null,
    videoTitle: cleanVideoTitle(video?.title ?? step.videoTitle),
    part: partOf(def.steps, step),
    startS: step.startS ?? 0,
    endS: step.endS ?? null,
    videoDurationS: video?.durationS ?? null,
    embedUrl: vimeoEmbedFor(video),
    posterUrl: video?.thumbnailUrl || def.coverUrl,
    enrollmentId: activeEnrollment,
    stepId: step.id,
    initialFeeling: progress?.feeling ?? null,
    initialDone: Boolean(progress?.completedAt) || me?.status === 'done',
    prev: prevStep ? { href: sessionHref(p.slug, prevStep), label: `${lang === 'es' ? 'Sesión' : 'Séance'} ${idx}` } : null,
    next: nextStep
      ? {
          href: sessionHref(p.slug, nextStep),
          label: `${lang === 'es' ? 'Sesión' : 'Séance'} ${idx + 2} : ${titleOf(nextStep)}`,
          when: nextSession?.dateKey && nextSession.status !== 'done' ? relativeDayLabel(nextSession.dateKey, todayKey, lang) : null,
        }
      : null,
    weekList,
    live: liveInfo,
    softer,
  };
}

/* ——— B01 (carte « Ton programme en cours ») et B06 (bloc « Mon programme » du tableau de bord) ——— */

export type WeekDotStatus = 'done' | 'today' | 'planned' | 'rest' | 'missed';
export type WeekDot = { key: string; letter: string; status: WeekDotStatus };

export type ActiveSummary = {
  lang: Lang;
  slug: string;
  programHref: string;
  title: string;
  level: number;
  coverUrl: string;
  paused: boolean;
  /** Toutes les séances sont faites mais le programme n'est pas encore « terminé » (B07). */
  completable: boolean;
  metaLine: string;
  weekIndex: number;
  weeks: number;
  weekFocus: string;
  weekCue: string | null;
  percent: number;
  done: number;
  total: number;
  timeLabel: string;
  endLabel: string | null;
  next: {
    n: number;
    title: string;
    minutes: number | null;
    kicker: string;
    when: string | null;
    isToday: boolean;
    meta: string;
    thumb: string;
    href: string;
    started: boolean;
  } | null;
  weekDots: WeekDot[];
  live: { label: string; href: string } | null;
};

const S = {
  fr: {
    meta: (w: number, ww: number, date: string) => `Semaine ${w} sur ${ww} · commencé le ${date}`,
    metaFuture: (date: string) => `Commence le ${date}`,
    metaPaused: (w: number, ww: number) => `En pause · semaine ${w} sur ${ww}`,
    today: 'Aujourd’hui',
    tomorrow: 'Demain',
    paused: 'En pause',
    sessionOf: (n: number, t: number) => `séance ${n} sur ${t}`,
    partOf: (i: number, title: string) => `partie ${i} de « ${title} »`,
    live: (when: string) => `Live de la semaine : ${when}`,
    letters: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  },
  es: {
    meta: (w: number, ww: number, date: string) => `Semana ${w} de ${ww} · empezado el ${date}`,
    metaFuture: (date: string) => `Empieza el ${date}`,
    metaPaused: (w: number, ww: number) => `En pausa · semana ${w} de ${ww}`,
    today: 'Hoy',
    tomorrow: 'Mañana',
    paused: 'En pausa',
    sessionOf: (n: number, t: number) => `sesión ${n} de ${t}`,
    partOf: (i: number, title: string) => `parte ${i} de « ${title} »`,
    live: (when: string) => `Live de la semana: ${when}`,
    letters: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  },
} as const;

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function buildActiveSummary(args: {
  def: ProgramDefinition;
  data: EnrollmentData;
  state: ProgramState;
  live: WeeklyLive | null;
  lang: Lang;
  todayKey: string;
  timeZone: string;
}): ActiveSummary {
  const { def, data, state, live, lang, todayKey, timeZone } = args;
  const s = S[lang];
  const p = def.program;
  const enr = data.enrollment;
  const paused = enr.status === 'paused';
  const weekDetail = (p.weeks_detail ?? []).find((w) => w.week === state.currentWeek);
  const titleOf = (st: EngineStep) => st.title[lang] || st.title.fr || st.videoTitle || '';

  const metaLine = paused
    ? s.metaPaused(state.currentWeek, state.weeks)
    : enr.startDate > todayKey
      ? s.metaFuture(shortDateLabel(enr.startDate, lang))
      : s.meta(state.currentWeek, state.weeks, dayMonthLabel(enr.startDate, lang));

  let practisedS = 0;
  for (const x of state.sessions) {
    const planned = (x.step.minutes ?? 0) * 60;
    practisedS += x.status === 'done' ? Math.max(planned, x.watchedS) : x.watchedS;
  }

  const lastPlanned = state.sessions.filter((x) => x.status !== 'done' && x.dateKey).map((x) => x.dateKey as string).sort().pop() ?? null;

  let next: ActiveSummary['next'] = null;
  if (state.next) {
    const st = state.next.step;
    const video = st.videoId ? def.videos[st.videoId] : undefined;
    const part = partOf(def.steps, st);
    const videoTitle = cleanVideoTitle(video?.title ?? st.videoTitle);
    const equipment = p.equipment?.[0] ? p.equipment[0][lang] || p.equipment[0].fr : null;
    const dateKey = state.next.dateKey;
    const when = paused || !dateKey ? null : relativeDayLabel(dateKey, todayKey, lang);
    const head = paused
      ? s.paused
      : !dateKey
        ? s.paused
        : dateKey === todayKey
          ? s.today
          : dateKey === addDays(todayKey, 1)
            ? s.tomorrow
            : capitalize(shortDateLabel(dateKey, lang));
    next = {
      n: state.next.n,
      title: titleOf(st),
      minutes: st.minutes,
      kicker: `${head} · ${s.sessionOf(state.next.n, state.total)}`,
      when,
      isToday: !paused && dateKey === todayKey,
      meta: [st.minutes ? `${st.minutes} min` : null, equipment, part && videoTitle ? s.partOf(part.index, videoTitle) : null]
        .filter(Boolean)
        .join(' · '),
      thumb: stepThumb(st, def.videos, def.coverUrl),
      href: sessionHref(p.slug, st),
      started: state.next.watchedS > 0,
    };
  }

  const monday = mondayOf(todayKey);
  const weekDots: WeekDot[] = s.letters.map((letter, i) => {
    const key = addDays(monday, i);
    const sessionsThatDay = state.sessions.filter((x) => x.dateKey === key);
    let status: WeekDotStatus = 'rest';
    if (sessionsThatDay.some((x) => x.status === 'done')) status = 'done';
    else if (sessionsThatDay.length) status = key === todayKey ? 'today' : 'planned';
    else if (!paused && key < todayKey && key >= enr.startDate && state.chosenDays.includes(isoWeekday(key))) status = 'missed';
    return { key, letter, status };
  });

  let liveInfo: ActiveSummary['live'] = null;
  if (live && state.liveStepForWeek) {
    const d = new Date(live.startsAt);
    const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    const time = new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'fr-FR', { timeZone, hour: '2-digit', minute: '2-digit' }).format(d);
    liveInfo = { label: s.live(`${shortDateLabel(dayKey, lang)} · ${time}`), href: '/compte/planning' };
  }

  return {
    lang,
    slug: p.slug,
    programHref: `/compte/programmes/${p.slug}`,
    title: p.title[lang] || p.title.fr,
    level: p.level,
    coverUrl: def.coverUrl,
    paused,
    completable: state.isComplete,
    metaLine,
    weekIndex: state.currentWeek,
    weeks: state.weeks,
    weekFocus: weekDetail?.focus?.[lang] || weekDetail?.focus?.fr || '',
    weekCue: weekDetail?.cues?.[0]?.[lang] || weekDetail?.cues?.[0]?.fr || null,
    percent: state.percent,
    done: state.done,
    total: state.total,
    timeLabel: hoursMinutesLabel(practisedS / 60),
    endLabel: !paused && !state.isComplete && lastPlanned ? dayMonthLabel(lastPlanned, lang) : null,
    next,
    weekDots,
    live: liveInfo,
  };
}
