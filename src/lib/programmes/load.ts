import { createAdminClient } from '@/lib/supabase/admin';
import { programBySlug, type CatalogProgram, type Localized } from '@/lib/programmes/catalogue';
import {
  computeProgramState,
  dayKeyInTimeZone,
  type EngineEnrollment,
  type EngineProgress,
  type EngineStep,
  type ProgramState,
} from '@/lib/programmes/engine';

/**
 * Lecture des programmes côté serveur (client service, après vérification de la session par la page).
 * Base d'abord (contenu modifiable dans l'admin B10) ; repli sur le catalogue JSON tant que les tables
 * du lot 3 n'existent pas (aucune inscription possible dans ce cas).
 */

export type StepVideo = {
  id: string;
  title: string | null;
  embedUrl: string | null;
  vimeoVideoId: string | null;
  durationS: number | null;
  thumbnailUrl: string | null;
};

export type ProgramDefinition = {
  program: CatalogProgram;
  /** uuid en base ; null = catalogue seul. */
  programId: string | null;
  steps: EngineStep[];
  videos: Record<string, StepVideo>;
  coverUrl: string;
};

export type EnrollmentData = {
  enrollment: EngineEnrollment;
  progress: EngineProgress[];
  testPhases: Array<'start' | 'end'>;
  certificateNumber: string | null;
  completedAt: string | null;
};

type Admin = ReturnType<typeof createAdminClient>;

const asLocalized = (v: unknown, fallback = ''): Localized => {
  if (v && typeof v === 'object') {
    const o = v as { fr?: unknown; es?: unknown };
    const fr = typeof o.fr === 'string' ? o.fr : fallback;
    return { fr, es: typeof o.es === 'string' && o.es ? o.es : fr };
  }
  if (typeof v === 'string') return { fr: v, es: v };
  return { fr: fallback, es: fallback };
};

export function catalogCover(program: CatalogProgram): string {
  const file = (program.cover_suggestion ?? '').split('/').pop() || 'alejandra-tapis.jpg';
  return file.startsWith('http') || file.startsWith('/') ? file : `/programmes/${file}`;
}

/** Étapes du catalogue (identifiants « semaine-position ») — aperçus et repli sans base. */
export function catalogSteps(program: CatalogProgram): EngineStep[] {
  const out: EngineStep[] = [];
  for (const w of program.weeks_detail ?? []) {
    (w.steps ?? []).forEach((s, i) => {
      const position = s.order ?? i + 1;
      out.push({
        id: `${w.week}-${position}`,
        week: w.week,
        position,
        kind: s.kind === 'live' ? 'live' : 'video',
        minutes: s.minutes ?? null,
        title: asLocalized(s.objective, s.video_title ?? ''),
        titleLong: null,
        videoTitle: s.video_title ?? null,
        videoId: null,
        startS: s.segment?.start_s ?? null,
        endS: s.segment?.end_s ?? null,
        liveStyle: (s as { live_style?: string }).live_style ?? null,
      });
    });
  }
  return out;
}

async function tryAdmin(): Promise<Admin | null> {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/** Définition d'un programme publié (ou brouillon pour un admin). */
export async function loadProgramDefinition(slug: string, opts: { includeDrafts?: boolean } = {}): Promise<ProgramDefinition | null> {
  const catalog = programBySlug(slug);
  const admin = await tryAdmin();
  if (admin) {
    const { data: row, error } = await admin.from('programs').select('*').eq('slug', slug).maybeSingle();
    if (!error && row && (opts.includeDrafts || row.status === 'published')) {
      const programId = String(row.id);
      const [{ data: weekRows }, { data: stepRows }, nextRes] = await Promise.all([
        admin.from('program_weeks').select('week, focus, cues').eq('program_id', programId).order('week'),
        admin
          .from('program_steps')
          .select('id, week, position, kind, video_id, start_s, end_s, minutes, objective, objective_long, live_style')
          .eq('program_id', programId)
          .order('week')
          .order('position'),
        row.next_program_id
          ? admin.from('programs').select('slug').eq('id', row.next_program_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      const videoIds = Array.from(new Set((stepRows ?? []).map((s) => s.video_id).filter(Boolean))) as string[];
      const videos: Record<string, StepVideo> = {};
      if (videoIds.length) {
        const { data: vids } = await admin
          .from('standalone_vimeo_videos')
          .select('id, title, embed_url, vimeo_video_id, duration_seconds, thumbnail_url')
          .in('id', videoIds);
        for (const v of vids ?? []) {
          videos[String(v.id)] = {
            id: String(v.id),
            title: (v.title as string | null) ?? null,
            embedUrl: (v.embed_url as string | null) ?? null,
            vimeoVideoId: (v.vimeo_video_id as string | null) ?? null,
            durationS: (v.duration_seconds as number | null) ?? null,
            thumbnailUrl: (v.thumbnail_url as string | null) ?? null,
          };
        }
      }
      const steps: EngineStep[] = (stepRows ?? []).map((s) => ({
        id: String(s.id),
        week: Number(s.week),
        position: Number(s.position),
        kind: s.kind === 'live' ? 'live' : 'video',
        minutes: s.minutes == null ? null : Number(s.minutes),
        title: asLocalized(s.objective, videos[String(s.video_id)]?.title ?? ''),
        titleLong: s.objective_long ? asLocalized(s.objective_long) : null,
        videoTitle: s.video_id ? videos[String(s.video_id)]?.title ?? null : null,
        videoId: s.video_id ? String(s.video_id) : null,
        startS: s.start_s == null ? null : Number(s.start_s),
        endS: s.end_s == null ? null : Number(s.end_s),
        liveStyle: (s.live_style as string | null) ?? null,
      }));
      const weeksDetail = (weekRows ?? []).map((w) => ({
        week: Number(w.week),
        focus: asLocalized(w.focus),
        cues: Array.isArray(w.cues) ? (w.cues as unknown[]).map((c) => asLocalized(c)) : [],
        steps: steps
          .filter((s) => s.week === Number(w.week))
          .map((s) => ({
            kind: s.kind,
            order: s.position,
            video_title: s.videoTitle ?? undefined,
            minutes: s.minutes ?? undefined,
            objective: s.title,
            segment: s.startS != null || s.endS != null ? { start_s: s.startS ?? undefined, end_s: s.endS ?? undefined } : undefined,
          })),
      }));
      const program: CatalogProgram = {
        ...(catalog ?? ({} as CatalogProgram)),
        slug: String(row.slug),
        status: String(row.status),
        level: Number(row.level),
        track: String(row.track ?? catalog?.track ?? ''),
        goals: (row.goals as string[] | null) ?? catalog?.goals ?? [],
        intensity: (row.intensity as number | null) ?? catalog?.intensity,
        impact: (row.impact as string | null) ?? catalog?.impact,
        live_style: (row.live_style as string | null) ?? catalog?.live_style,
        title: asLocalized(row.title, catalog?.title.fr ?? String(row.slug)),
        promise: asLocalized(row.promise, catalog?.promise.fr ?? ''),
        for_who: row.for_who ? asLocalized(row.for_who) : catalog?.for_who,
        not_for: row.not_for ? asLocalized(row.not_for) : catalog?.not_for,
        benefits: Array.isArray(row.benefits) && (row.benefits as unknown[]).length ? (row.benefits as CatalogProgram['benefits']) : catalog?.benefits ?? [],
        equipment: Array.isArray(row.equipment) && (row.equipment as unknown[]).length ? (row.equipment as Localized[]) : catalog?.equipment ?? [],
        weeks: Number(row.weeks),
        sessions_per_week: Number(row.sessions_per_week),
        minutes_range: String(row.minutes_range ?? catalog?.minutes_range ?? ''),
        cover_suggestion: String(row.cover_url ?? catalog?.cover_suggestion ?? ''),
        next_slug: (nextRes.data as { slug?: string } | null)?.slug ?? catalog?.next_slug ?? null,
        tests: Array.isArray(row.tests) && (row.tests as unknown[]).length ? (row.tests as unknown[]) : catalog?.tests ?? [],
        weeks_detail: weeksDetail.length ? weeksDetail : catalog?.weeks_detail ?? [],
      };
      const cover = typeof row.cover_url === 'string' && row.cover_url ? row.cover_url : catalog ? catalogCover(catalog) : '/programmes/alejandra-tapis.jpg';
      return { program, programId, steps: steps.length ? steps : catalog ? catalogSteps(catalog) : [], videos, coverUrl: cover };
    }
  }
  if (!catalog) return null;
  return { program: catalog, programId: null, steps: catalogSteps(catalog), videos: {}, coverUrl: catalogCover(catalog) };
}

/** Dernière inscription de la cliente sur ce programme (active, en pause ou terminée). */
export async function loadEnrollment(userId: string, programId: string | null): Promise<EnrollmentData | null> {
  if (!programId) return null;
  const admin = await tryAdmin();
  if (!admin) return null;
  const { data: enr, error } = await admin
    .from('program_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .in('status', ['active', 'paused', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !enr) return null;
  return hydrateEnrollment(admin, enr as Record<string, unknown>);
}

async function hydrateEnrollment(admin: Admin, enr: Record<string, unknown>): Promise<EnrollmentData> {
  const id = String(enr.id);
  const [{ data: prog }, { data: tests }] = await Promise.all([
    admin.from('program_step_progress').select('step_id, completed_at, watched_s, feeling').eq('enrollment_id', id),
    admin.from('program_test_results').select('phase').eq('enrollment_id', id),
  ]);
  return {
    enrollment: {
      id,
      status: (enr.status as EngineEnrollment['status']) ?? 'active',
      startDate: String(enr.start_date ?? '').slice(0, 10),
      chosenDays: Array.isArray(enr.chosen_days) ? (enr.chosen_days as number[]) : [],
      postponedUntil: (enr.postponed_until as string | null) ?? null,
      reminderTime: typeof enr.reminder_time === 'string' ? enr.reminder_time.slice(0, 5) : null,
      createdAt: (enr.created_at as string | null) ?? null,
    },
    progress: (prog ?? []).map((p) => ({
      stepId: String(p.step_id),
      completedAt: (p.completed_at as string | null) ?? null,
      watchedS: Number(p.watched_s ?? 0),
      feeling: (p.feeling as EngineProgress['feeling']) ?? null,
    })),
    testPhases: (tests ?? []).map((t) => t.phase as 'start' | 'end'),
    certificateNumber: (enr.certificate_number as string | null) ?? null,
    completedAt: (enr.completed_at as string | null) ?? null,
  };
}

export type ActiveProgram = {
  definition: ProgramDefinition;
  data: EnrollmentData;
  state: ProgramState;
  todayKey: string;
};

/**
 * Programme actif de la cliente (tableau de bord, planning, catalogue, rappels).
 * `includePaused` : à défaut de programme actif, le dernier programme en pause (bloc du tableau de bord).
 */
export async function loadActiveProgram(userId: string, timeZone: string, opts: { includePaused?: boolean } = {}): Promise<ActiveProgram | null> {
  const admin = await tryAdmin();
  if (!admin) return null;
  const { data: rows, error } = await admin
    .from('program_enrollments')
    .select('*, programs(slug)')
    .eq('user_id', userId)
    .in('status', opts.includePaused ? ['active', 'paused'] : ['active'])
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(1);
  const enr = rows?.[0];
  if (error || !enr) return null;
  const rel = (enr as { programs?: { slug?: string } | Array<{ slug?: string }> | null }).programs;
  const slug = Array.isArray(rel) ? rel[0]?.slug : rel?.slug;
  if (!slug) return null;
  const definition = await loadProgramDefinition(slug, { includeDrafts: true });
  if (!definition) return null;
  const data = await hydrateEnrollment(admin, enr as Record<string, unknown>);
  const todayKey = dayKeyInTimeZone(new Date(), timeZone);
  const state = computeProgramState({ steps: definition.steps, progress: data.progress, enrollment: data.enrollment, todayKey, timeZone });
  return { definition, data, state, todayKey };
}

export type WeeklyLive = { id: string; title: string; startsAt: string; endsAt: string; language: string | null };

/**
 * Live de la semaine (SPEC §4.2) : prochain live publié du style demandé dans la langue de la cliente
 * (« Tous » = n'importe lequel) ; repli : prochain live dans sa langue ; sinon null.
 */
export async function findWeeklyLive(style: string | null | undefined, lang: 'fr' | 'es', fromIso = new Date().toISOString()): Promise<WeeklyLive | null> {
  const admin = await tryAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from('courses')
    .select('id, title, starts_at, ends_at, course_language, course_format')
    .eq('is_published', true)
    .eq('course_format', 'online')
    .gte('ends_at', fromIso)
    .order('starts_at', { ascending: true })
    .limit(40);
  if (error || !data?.length) return null;
  const inLang = data.filter((c) => !c.course_language || c.course_language === lang);
  const wanted = (style ?? '').trim().toLowerCase();
  const match =
    !wanted || wanted === 'tous'
      ? inLang[0]
      : inLang.find((c) => String(c.title ?? '').toLowerCase().includes(wanted)) ?? inLang[0];
  if (!match) return null;
  return {
    id: String(match.id),
    title: String(match.title ?? ''),
    startsAt: String(match.starts_at),
    endsAt: String(match.ends_at),
    language: (match.course_language as string | null) ?? null,
  };
}

/** Programme actif (titre, avancement) pour l'avertissement « il sera mis en pause » de la découverte et de la modale B04. */
export async function loadOtherActive(
  userId: string,
  exceptProgramId: string | null,
  lang: 'fr' | 'es',
): Promise<{ title: string; percent: number } | null> {
  const admin = await tryAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from('program_enrollments')
    .select('id, program_id, programs(title)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (!data || (exceptProgramId && String(data.program_id) === exceptProgramId)) return null;
  const rel = (data as { programs?: { title?: unknown } | Array<{ title?: unknown }> | null }).programs;
  const raw = Array.isArray(rel) ? rel[0]?.title : rel?.title;
  if (!raw) return null;
  const [{ count: total }, { count: done }] = await Promise.all([
    admin.from('program_steps').select('id', { count: 'exact', head: true }).eq('program_id', String(data.program_id)).eq('kind', 'video'),
    admin.from('program_step_progress').select('id', { count: 'exact', head: true }).eq('enrollment_id', String(data.id)).not('completed_at', 'is', null),
  ]);
  const loc = asLocalized(raw);
  return { title: loc[lang] || loc.fr, percent: total ? Math.round(((done ?? 0) / total) * 100) : 0 };
}
