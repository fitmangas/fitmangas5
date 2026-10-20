import { createAdminClient } from '@/lib/supabase/admin';
import { CATALOG_PROGRAMS } from '@/lib/programmes/catalogue';
import { catalogCover, catalogSteps } from '@/lib/programmes/load';
import type {
  AdminListItem,
  AdminProgramDetail,
  AdminStats,
  AdminStep,
  AdminTest,
  AdminVideo,
  AdminWeek,
  L10n,
} from '@/lib/programmes/admin-types';

/** Lecture de l'éditeur B10 (client service ; la page vérifie le rôle admin). */

type Admin = ReturnType<typeof createAdminClient>;

const l10n = (v: unknown): L10n => {
  if (v && typeof v === 'object') {
    const o = v as { fr?: unknown; es?: unknown };
    return { fr: typeof o.fr === 'string' ? o.fr : '', es: typeof o.es === 'string' ? o.es : '' };
  }
  if (typeof v === 'string') return { fr: v, es: '' };
  return { fr: '', es: '' };
};

function normalizeTests(raw: unknown): AdminTest[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t, i) => {
    const o = (t ?? {}) as Record<string, unknown>;
    const type = o.type === 'seconds' || o.type === 'scale' ? o.type : 'count';
    const scale = o.scale as { fr?: unknown; es?: unknown } | undefined;
    return {
      key: typeof o.key === 'string' && o.key ? o.key : `test_${i + 1}`,
      type,
      label: l10n(o.label),
      how: l10n(o.how),
      scale:
        type === 'scale'
          ? { fr: Array.isArray(scale?.fr) ? scale.fr.map(String) : [], es: Array.isArray(scale?.es) ? scale.es.map(String) : [] }
          : undefined,
    };
  });
}

export async function loadAdminProgramList(admin: Admin): Promise<{ items: AdminListItem[]; tablesMissing: boolean }> {
  const { data, error } = await admin
    .from('programs')
    .select('id, slug, status, level, weeks, title, cover_url, sort_order')
    .order('sort_order')
    .order('level');
  if (error) return { items: [], tablesMissing: true };
  const ids = (data ?? []).map((p) => String(p.id));
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: steps } = await admin.from('program_steps').select('program_id').in('program_id', ids).eq('kind', 'video');
    for (const s of steps ?? []) counts.set(String(s.program_id), (counts.get(String(s.program_id)) ?? 0) + 1);
  }
  return {
    tablesMissing: false,
    items: (data ?? []).map((p) => {
      const catalog = CATALOG_PROGRAMS.find((c) => c.slug === p.slug);
      return {
        id: String(p.id),
        slug: String(p.slug),
        title: l10n(p.title).fr || String(p.slug),
        status: (p.status as AdminListItem['status']) ?? 'draft',
        level: Number(p.level ?? 0),
        weeks: Number(p.weeks ?? 0),
        sessions: counts.get(String(p.id)) ?? 0,
        coverUrl: (p.cover_url as string | null) || (catalog ? catalogCover(catalog) : '/programmes/alejandra-tapis.jpg'),
      };
    }),
  };
}

export async function loadAdminProgramDetail(admin: Admin, id: string): Promise<AdminProgramDetail | null> {
  const { data: p, error } = await admin.from('programs').select('*').eq('id', id).maybeSingle();
  if (error || !p) return null;
  const [{ data: weeks }, { data: steps }] = await Promise.all([
    admin.from('program_weeks').select('id, week, focus, cues').eq('program_id', id).order('week'),
    admin
      .from('program_steps')
      .select('id, week, position, kind, video_id, start_s, end_s, segment_to_validate, minutes, objective, objective_long, live_style')
      .eq('program_id', id)
      .order('week')
      .order('position'),
  ]);
  const stepIds = (steps ?? []).map((s) => String(s.id));
  const withProgress = new Set<string>();
  if (stepIds.length) {
    const { data: prog } = await admin.from('program_step_progress').select('step_id').in('step_id', stepIds).limit(5000);
    for (const r of prog ?? []) withProgress.add(String(r.step_id));
  }
  const catalog = CATALOG_PROGRAMS.find((c) => c.slug === p.slug);
  const weekRows: AdminWeek[] = (weeks ?? []).map((w) => ({
    id: String(w.id),
    week: Number(w.week),
    focus: l10n(w.focus),
    cues: Array.isArray(w.cues) ? (w.cues as unknown[]).map(l10n) : [],
  }));
  const stepRows: AdminStep[] = (steps ?? []).map((s) => ({
    id: String(s.id),
    week: Number(s.week),
    position: Number(s.position),
    kind: s.kind === 'live' ? 'live' : 'video',
    videoId: s.video_id ? String(s.video_id) : null,
    startS: s.start_s == null ? null : Number(s.start_s),
    endS: s.end_s == null ? null : Number(s.end_s),
    toValidate: s.segment_to_validate === true,
    minutes: s.minutes == null ? null : Number(s.minutes),
    objective: l10n(s.objective),
    objectiveLong: s.objective_long ? l10n(s.objective_long) : null,
    liveStyle: (s.live_style as string | null) ?? null,
    hasProgress: withProgress.has(String(s.id)),
  }));
  return {
    id: String(p.id),
    slug: String(p.slug),
    status: (p.status as AdminProgramDetail['status']) ?? 'draft',
    level: Number(p.level ?? 0),
    track: String(p.track ?? ''),
    goals: Array.isArray(p.goals) ? (p.goals as string[]) : [],
    title: l10n(p.title),
    promise: l10n(p.promise),
    forWho: l10n(p.for_who),
    notFor: l10n(p.not_for),
    coachNote: l10n(p.coach_note),
    weeks: Number(p.weeks ?? weekRows.length),
    perWeek: Number(p.sessions_per_week ?? 3),
    minutesRange: String(p.minutes_range ?? ''),
    coverUrl: (p.cover_url as string | null) || (catalog ? catalogCover(catalog) : '/programmes/alejandra-tapis.jpg'),
    nextProgramId: (p.next_program_id as string | null) ?? null,
    liveStyle: String(p.live_style ?? ''),
    tests: normalizeTests(p.tests),
    weekRows,
    steps: stepRows,
    updatedAt: (p.updated_at as string | null) ?? null,
  };
}

export async function loadAdminVideos(admin: Admin): Promise<AdminVideo[]> {
  const { data, error } = await admin
    .from('standalone_vimeo_videos')
    .select('id, title, duration_seconds, thumbnail_url, embed_url, vimeo_video_id, vimeo_folder_name')
    .eq('validation_status', 'published')
    .eq('is_hidden', false)
    .order('title');
  if (error) return [];
  const used = new Map<string, Set<string>>();
  const { data: steps } = await admin.from('program_steps').select('program_id, video_id').not('video_id', 'is', null).limit(5000);
  for (const s of steps ?? []) {
    const v = String(s.video_id);
    if (!used.has(v)) used.set(v, new Set());
    used.get(v)!.add(String(s.program_id));
  }
  return (data ?? []).map((v) => ({
    id: String(v.id),
    title: String(v.title ?? 'Sans titre'),
    folder: String(v.vimeo_folder_name ?? 'Bibliothèque'),
    durationS: v.duration_seconds == null ? null : Number(v.duration_seconds),
    thumb: (v.thumbnail_url as string | null) || '/programmes/alejandra-tapis.jpg',
    embedUrl: (v.embed_url as string | null) ?? null,
    vimeoId: (v.vimeo_video_id as string | null) ?? null,
    usedIn: used.get(String(v.id))?.size ?? 0,
  }));
}

/** Statistiques de l'en-tête : inscrites, terminées, taux de fin, séance où l'on s'arrête le plus (+ % « Difficile »). */
export async function loadAdminStats(admin: Admin, programId: string, steps: AdminStep[], videoTitles: Map<string, string>): Promise<AdminStats> {
  const [{ data: mine }, { data: all }] = await Promise.all([
    admin.from('program_enrollments').select('id, status, created_at').eq('program_id', programId),
    admin.from('program_enrollments').select('status').limit(10000),
  ]);
  const rows = mine ?? [];
  const weekAgo = Date.now() - 7 * 86_400_000;
  const active = rows.filter((r) => r.status === 'active');
  const completed = rows.filter((r) => r.status === 'completed').length;
  const rate = (list: Array<{ status: unknown }>) => {
    const total = list.length;
    return total ? Math.round((list.filter((r) => r.status === 'completed').length / total) * 100) : null;
  };

  let drop: AdminStats['drop'] = null;
  const stopped = rows.filter((r) => r.status === 'abandoned' || r.status === 'paused').map((r) => String(r.id));
  const videos = steps.filter((s) => s.kind === 'video').sort((a, b) => a.week - b.week || a.position - b.position);
  if (stopped.length && videos.length) {
    const { data: prog } = await admin.from('program_step_progress').select('enrollment_id, step_id, completed_at').in('enrollment_id', stopped);
    const doneBy = new Map<string, Set<string>>();
    for (const r of prog ?? []) {
      if (!r.completed_at) continue;
      const k = String(r.enrollment_id);
      if (!doneBy.has(k)) doneBy.set(k, new Set());
      doneBy.get(k)!.add(String(r.step_id));
    }
    const stopCount = new Map<string, number>();
    for (const e of stopped) {
      const first = videos.find((v) => !doneBy.get(e)?.has(v.id));
      if (first) stopCount.set(first.id, (stopCount.get(first.id) ?? 0) + 1);
    }
    const top = Array.from(stopCount.entries()).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      const step = videos.find((v) => v.id === top[0])!;
      const { data: feelings } = await admin.from('program_step_progress').select('feeling').eq('step_id', step.id).not('feeling', 'is', null);
      const f = feelings ?? [];
      drop = {
        n: videos.indexOf(step) + 1,
        title: (step.videoId && videoTitles.get(step.videoId)) || step.objective.fr,
        hardPct: f.length ? Math.round((f.filter((x) => x.feeling === 'hard').length / f.length) * 100) : null,
      };
    }
  }

  return {
    active: active.length,
    activeNew7: active.filter((r) => new Date(String(r.created_at)).getTime() >= weekAgo).length,
    completed,
    finishRate: rate(rows),
    catalogRate: rate(all ?? []),
    drop,
  };
}

/* ——— Aperçu de développement (sans base) ——— */

export function demoAdminData(slug = 'les-fondations'): {
  items: AdminListItem[];
  detail: AdminProgramDetail;
  videos: AdminVideo[];
  stats: AdminStats;
} {
  const drafts = ['fessiers-jambes', 'barre-intense', 'boot-camp-hiit'];
  const items: AdminListItem[] = CATALOG_PROGRAMS.map((p) => ({
    id: p.slug,
    slug: p.slug,
    title: p.title.fr,
    status: drafts.includes(p.slug) ? 'draft' : 'published',
    level: p.level,
    weeks: p.weeks,
    sessions: catalogSteps(p).filter((s) => s.kind === 'video').length,
    coverUrl: catalogCover(p),
  }));
  const p = CATALOG_PROGRAMS.find((x) => x.slug === slug) ?? CATALOG_PROGRAMS[0];
  const titles = Array.from(new Set(CATALOG_PROGRAMS.flatMap((x) => catalogSteps(x).map((s) => s.videoTitle).filter(Boolean) as string[])));
  const videos: AdminVideo[] = titles.slice(0, 40).map((t, i) => ({
    id: `v${i + 1}`,
    title: t,
    folder: /barre/i.test(t) ? 'Barre Flow' : /stretch|yoga/i.test(t) ? 'Stretching' : /booty|hiit|cardio|dance/i.test(t) ? 'Boot Camp' : 'Pilates Mat',
    durationS: /60 ?min/i.test(t) ? 3671 : 1010 + i * 37,
    thumb: '/programmes/alejandra-tapis.jpg',
    embedUrl: null,
    vimeoId: null,
    usedIn: (i % 3) + (i === 0 ? 1 : 0),
  }));
  const vidByTitle = new Map(videos.map((v) => [v.title, v.id]));
  const steps: AdminStep[] = catalogSteps(p).map((s) => ({
    id: s.id,
    week: s.week,
    position: s.position,
    kind: s.kind,
    videoId: s.videoTitle ? vidByTitle.get(s.videoTitle) ?? null : null,
    startS: s.startS ?? null,
    endS: s.endS ?? null,
    toValidate: Boolean((p.weeks_detail ?? []).find((w) => w.week === s.week)?.steps?.find((x, i) => (x.order ?? i + 1) === s.position)?.segment?.to_validate),
    minutes: s.minutes,
    objective: { fr: s.title.fr, es: s.title.es },
    objectiveLong: null,
    liveStyle: s.liveStyle ?? null,
    hasProgress: false,
  }));
  return {
    items,
    videos,
    detail: {
      id: p.slug,
      slug: p.slug,
      status: drafts.includes(p.slug) ? 'draft' : 'published',
      level: p.level,
      track: p.track,
      goals: p.goals,
      title: p.title,
      promise: p.promise,
      forWho: p.for_who ?? { fr: '', es: '' },
      notFor: p.not_for ?? { fr: '', es: '' },
      coachNote: { fr: '', es: '' },
      weeks: p.weeks,
      perWeek: p.sessions_per_week,
      minutesRange: p.minutes_range,
      coverUrl: catalogCover(p),
      nextProgramId: p.next_slug ?? null,
      liveStyle: p.live_style ?? '',
      tests: normalizeTests(p.tests),
      weekRows: (p.weeks_detail ?? []).map((w) => ({ id: `w${w.week}`, week: w.week, focus: w.focus, cues: w.cues ?? [] })),
      steps,
      updatedAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    },
    stats: { active: 14, activeNew7: 3, completed: 6, finishRate: 43, catalogRate: 38, drop: { n: 4, title: 'Pilates Mat 2', hardPct: 41 } },
  };
}
