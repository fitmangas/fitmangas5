import { createAdminClient } from '@/lib/supabase/admin';
import { CATALOG_PROGRAMS, type CatalogProgram, type Localized } from '@/lib/programmes/catalogue';
import { dayKeyInTimeZone, dayMonthLabel, type Lang } from '@/lib/programmes/engine';
import { catalogCover, catalogSteps, findWeeklyLive, loadActiveProgram } from '@/lib/programmes/load';
import { buildActiveSummary, hoursMinutesLabel, type ActiveSummary } from '@/lib/programmes/view-models';

/**
 * Données du catalogue B01 (`/compte/programmes`) : programmes publiés + état de la cliente sur chacun
 * (en cours, en pause, terminé) + carte « Ton programme en cours ».
 * Base d'abord ; repli sur le catalogue JSON tant que les tables du lot 3 n'existent pas.
 */

export type CatalogCardState = 'discover' | 'active' | 'paused' | 'done';

export type CatalogCard = {
  slug: string;
  href: string;
  level: number;
  track: string;
  goals: string[];
  title: string;
  promise: string;
  weeks: number;
  perWeek: number;
  minutesRange: string;
  coverUrl: string;
  sessions: number;
  totalLabel: string;
  nextSlug: string | null;
  state: CatalogCardState;
  percent: number;
  weekLabel: string | null;
  doneLabel: string | null;
  certificateHref: string | null;
};

export type CatalogView = {
  lang: Lang;
  cards: CatalogCard[];
  active: ActiveSummary | null;
  source: 'db' | 'catalog';
};

const TXT = {
  fr: {
    week: (w: number, ww: number) => `Semaine ${w} sur ${ww}`,
    paused: 'En pause',
    doneOn: (d: string) => `Terminé le ${d}`,
  },
  es: {
    week: (w: number, ww: number) => `Semana ${w} de ${ww}`,
    paused: 'En pausa',
    doneOn: (d: string) => `Terminado el ${d}`,
  },
} as const;

const loc = (v: unknown, lang: Lang, fallback = ''): string => {
  if (v && typeof v === 'object') {
    const o = v as Partial<Localized>;
    return (lang === 'es' ? o.es || o.fr : o.fr) || fallback;
  }
  return typeof v === 'string' ? v : fallback;
};

function catalogCard(p: CatalogProgram, lang: Lang): CatalogCard {
  const videos = catalogSteps(p).filter((s) => s.kind === 'video');
  return {
    slug: p.slug,
    href: `/compte/programmes/${p.slug}`,
    level: p.level,
    track: p.track,
    goals: p.goals ?? [],
    title: p.title[lang] || p.title.fr,
    promise: p.promise?.[lang] || p.promise?.fr || '',
    weeks: p.weeks,
    perWeek: p.sessions_per_week,
    minutesRange: p.minutes_range,
    coverUrl: catalogCover(p),
    sessions: videos.length,
    totalLabel: hoursMinutesLabel(videos.reduce((a, s) => a + (s.minutes ?? 0), 0)),
    nextSlug: p.next_slug ?? null,
    state: 'discover',
    percent: 0,
    weekLabel: null,
    doneLabel: null,
    certificateHref: null,
  };
}

export async function loadCatalogView(userId: string, lang: Lang, timeZone: string): Promise<CatalogView> {
  let admin: ReturnType<typeof createAdminClient> | null = null;
  try {
    admin = createAdminClient();
  } catch {
    admin = null;
  }

  if (admin) {
    const { data: rows, error } = await admin
      .from('programs')
      .select('id, slug, level, track, goals, title, promise, weeks, sessions_per_week, minutes_range, cover_url, next_program_id, sort_order')
      .eq('status', 'published')
      .order('sort_order')
      .order('level');
    if (!error && rows) {
      const ids = rows.map((r) => String(r.id));
      const slugById = new Map(rows.map((r) => [String(r.id), String(r.slug)]));
      const [{ data: steps }, { data: enrollments }, activeProgram] = await Promise.all([
        ids.length ? admin.from('program_steps').select('program_id, kind, minutes').in('program_id', ids) : Promise.resolve({ data: [] }),
        admin
          .from('program_enrollments')
          .select('id, program_id, status, completed_at, created_at')
          .eq('user_id', userId)
          .in('status', ['active', 'paused', 'completed'])
          .order('created_at', { ascending: false }),
        loadActiveProgram(userId, timeZone),
      ]);

      const latest = new Map<string, { id: string; status: string; completedAt: string | null }>();
      for (const e of enrollments ?? []) {
        const pid = String(e.program_id);
        if (!latest.has(pid)) latest.set(pid, { id: String(e.id), status: String(e.status), completedAt: (e.completed_at as string | null) ?? null });
      }

      const pausedIds = Array.from(latest.values()).filter((e) => e.status === 'paused').map((e) => e.id);
      const doneByEnrollment = new Map<string, number>();
      if (pausedIds.length) {
        const { data: prog } = await admin.from('program_step_progress').select('enrollment_id, completed_at').in('enrollment_id', pausedIds);
        for (const r of prog ?? []) {
          if (!r.completed_at) continue;
          const k = String(r.enrollment_id);
          doneByEnrollment.set(k, (doneByEnrollment.get(k) ?? 0) + 1);
        }
      }

      let active: ActiveSummary | null = null;
      if (activeProgram) {
        const { definition, data, state, todayKey } = activeProgram;
        const live = state.liveStepForWeek
          ? await findWeeklyLive(state.liveStepForWeek.liveStyle ?? definition.program.live_style ?? null, lang)
          : null;
        active = buildActiveSummary({ def: definition, data, state, live, lang, todayKey, timeZone });
      }

      const t = TXT[lang];
      const cards: CatalogCard[] = rows.map((r) => {
        const id = String(r.id);
        const slug = String(r.slug);
        const catalog = CATALOG_PROGRAMS.find((p) => p.slug === slug);
        const own = (steps ?? []).filter((s) => String(s.program_id) === id && s.kind === 'video');
        const sessions = own.length || (catalog ? catalogSteps(catalog).filter((s) => s.kind === 'video').length : 0);
        const totalMin = own.length
          ? own.reduce((a, s) => a + Number(s.minutes ?? 0), 0)
          : catalog
            ? catalogSteps(catalog).filter((s) => s.kind === 'video').reduce((a, s) => a + (s.minutes ?? 0), 0)
            : 0;
        const enr = latest.get(id);
        let state: CatalogCardState = 'discover';
        let percent = 0;
        let weekLabel: string | null = null;
        let doneLabel: string | null = null;
        let certificateHref: string | null = null;
        if (enr?.status === 'active' && active && active.slug === slug) {
          state = 'active';
          percent = active.percent;
          weekLabel = t.week(active.weekIndex, active.weeks);
        } else if (enr?.status === 'paused') {
          state = 'paused';
          percent = sessions ? Math.round(((doneByEnrollment.get(enr.id) ?? 0) / sessions) * 100) : 0;
          weekLabel = t.paused;
        } else if (enr?.status === 'completed') {
          state = 'done';
          percent = 100;
          doneLabel = enr.completedAt ? t.doneOn(dayMonthLabel(dayKeyInTimeZone(new Date(enr.completedAt), timeZone), lang)) : null;
          certificateHref = `/api/programmes/certificat/${enr.id}`;
        }
        const cover = typeof r.cover_url === 'string' && r.cover_url ? r.cover_url : catalog ? catalogCover(catalog) : '/programmes/alejandra-tapis.jpg';
        return {
          slug,
          href: `/compte/programmes/${slug}`,
          level: Number(r.level),
          track: String(r.track ?? catalog?.track ?? ''),
          goals: (r.goals as string[] | null) ?? catalog?.goals ?? [],
          title: loc(r.title, lang, catalog?.title.fr ?? slug),
          promise: loc(r.promise, lang, catalog?.promise.fr ?? ''),
          weeks: Number(r.weeks),
          perWeek: Number(r.sessions_per_week),
          minutesRange: String(r.minutes_range ?? catalog?.minutes_range ?? ''),
          coverUrl: cover,
          sessions,
          totalLabel: hoursMinutesLabel(totalMin),
          nextSlug: r.next_program_id ? slugById.get(String(r.next_program_id)) ?? null : catalog?.next_slug ?? null,
          state,
          percent,
          weekLabel,
          doneLabel,
          certificateHref,
        };
      });
      return { lang, cards, active, source: 'db' };
    }
  }

  return { lang, cards: CATALOG_PROGRAMS.map((p) => catalogCard(p, lang)), active: null, source: 'catalog' };
}

/** Aperçu de développement : catalogue complet, « Les Fondations » en cours et « Souplesse » terminé. */
export function demoCatalogView(active: ActiveSummary | null, lang: Lang = 'fr'): CatalogView {
  const cards = CATALOG_PROGRAMS.map((p) => catalogCard(p, lang));
  for (const c of cards) {
    if (active && c.slug === active.slug) {
      c.state = 'active';
      c.percent = active.percent;
      c.weekLabel = TXT[lang].week(active.weekIndex, active.weeks);
    }
    if (c.slug === 'souplesse-recuperation') {
      c.state = 'done';
      c.percent = 100;
      c.doneLabel = TXT[lang].doneOn(dayMonthLabel('2026-09-28', lang));
      c.certificateHref = '/api/programmes/certificat/apercu';
    }
  }
  return { lang, cards, active, source: 'catalog' };
}

/**
 * Programmes publiés (sans état de cliente) : test de niveau public (D08).
 * Repli sur le catalogue tant que les tables du lot 3 n'existent pas ; `published` = démarrable en base.
 */
export async function loadPublicProgramCards(lang: Lang): Promise<Array<CatalogCard & { published: boolean }>> {
  let admin: ReturnType<typeof createAdminClient> | null = null;
  try {
    admin = createAdminClient();
  } catch {
    admin = null;
  }
  if (admin) {
    const { data: rows, error } = await admin
      .from('programs')
      .select('id, slug, level, track, goals, title, promise, weeks, sessions_per_week, minutes_range, cover_url, next_program_id')
      .eq('status', 'published');
    if (!error && rows) {
      const ids = rows.map((r) => String(r.id));
      const { data: steps } = ids.length ? await admin.from('program_steps').select('program_id, kind, minutes').in('program_id', ids) : { data: [] };
      const published = rows.map((r) => {
        const slug = String(r.slug);
        const catalog = CATALOG_PROGRAMS.find((p) => p.slug === slug);
        const base = catalog ? catalogCard(catalog, lang) : null;
        const own = (steps ?? []).filter((s) => String(s.program_id) === String(r.id) && s.kind === 'video');
        return {
          ...(base ?? catalogCard(CATALOG_PROGRAMS[0], lang)),
          slug,
          href: `/compte/programmes/${slug}`,
          level: Number(r.level),
          track: String(r.track ?? base?.track ?? ''),
          goals: (r.goals as string[] | null) ?? base?.goals ?? [],
          title: loc(r.title, lang, base?.title ?? slug),
          promise: loc(r.promise, lang, base?.promise ?? ''),
          weeks: Number(r.weeks),
          perWeek: Number(r.sessions_per_week),
          minutesRange: String(r.minutes_range ?? base?.minutesRange ?? ''),
          coverUrl: typeof r.cover_url === 'string' && r.cover_url ? r.cover_url : base?.coverUrl ?? '/programmes/alejandra-tapis.jpg',
          sessions: own.length || base?.sessions || 0,
          totalLabel: own.length ? hoursMinutesLabel(own.reduce((a, s) => a + Number(s.minutes ?? 0), 0)) : base?.totalLabel ?? '',
          published: true,
        };
      });
      // Programmes du catalogue non publiés : utiles au calcul du résultat, mais non démarrables.
      const missing = CATALOG_PROGRAMS.filter((p) => !published.some((x) => x.slug === p.slug)).map((p) => ({ ...catalogCard(p, lang), published: false }));
      return [...published, ...missing];
    }
  }
  return CATALOG_PROGRAMS.map((p) => ({ ...catalogCard(p, lang), published: false }));
}
