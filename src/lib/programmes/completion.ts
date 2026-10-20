import { createAdminClient } from '@/lib/supabase/admin';
import { CATALOG_PROGRAMS, type Localized } from '@/lib/programmes/catalogue';
import { daysBetween, dayKeyInTimeZone, type Lang } from '@/lib/programmes/engine';
import { loadProgramDefinition } from '@/lib/programmes/load';
import { buildAbout } from '@/lib/programmes/view-models';
import type { CompletionData } from '@/lib/programmes/completion-format';
import { resolveDisplayTimeZone } from '@/lib/time/tz-label';

export { periodLabel, statsLine, type CompletionData, type CompletionTest } from '@/lib/programmes/completion-format';

/**
 * Bilan d'un programme terminé : page B07, certificat PDF (B08), visuel story (B09).
 * Lecture serveur (client service) ; l'appelant vérifie que l'inscription appartient à la cliente (ou admin).
 */

const loc = (v: unknown, lang: Lang): string => {
  if (v && typeof v === 'object') {
    const o = v as Partial<Localized>;
    return (lang === 'es' ? o.es || o.fr : o.fr) || '';
  }
  return typeof v === 'string' ? v : '';
};

export async function loadCompletion(enrollmentId: string): Promise<CompletionData | null> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }
  const { data: enr, error } = await admin
    .from('program_enrollments')
    .select('id, user_id, status, start_date, completed_at, certificate_number, programs(slug, title)')
    .eq('id', enrollmentId)
    .maybeSingle();
  if (error || !enr) return null;
  const rel = (enr as { programs?: { slug?: string; title?: unknown } | Array<{ slug?: string; title?: unknown }> | null }).programs;
  const prog = Array.isArray(rel) ? rel[0] : rel;
  if (!prog?.slug) return null;

  const userId = String(enr.user_id);
  const [{ data: profile }, def, { data: progress }, { data: tests }, { data: feedbackRows }] = await Promise.all([
    admin.from('profiles').select('first_name, last_name, preferred_locale, display_timezone').eq('id', userId).maybeSingle(),
    loadProgramDefinition(prog.slug, { includeDrafts: true }),
    admin.from('program_step_progress').select('step_id, completed_at, watched_s').eq('enrollment_id', enrollmentId),
    admin.from('program_test_results').select('phase, results, created_at').eq('enrollment_id', enrollmentId),
    admin
      .from('program_feedback')
      .select('rating, message, publish_consent, consent_withdrawn_at, created_at')
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);
  const fb = feedbackRows?.[0];
  if (!def) return null;
  const lang: Lang = profile?.preferred_locale === 'es' ? 'es' : 'fr';
  const tz = resolveDisplayTimeZone((profile?.display_timezone as string | null) ?? null, lang);

  const videos = def.steps.filter((s) => s.kind === 'video');
  const byStep = new Map((progress ?? []).map((p) => [String(p.step_id), p]));
  let done = 0;
  let seconds = 0;
  for (const v of videos) {
    const p = byStep.get(v.id);
    const watched = Number(p?.watched_s ?? 0);
    if (p?.completed_at) {
      done += 1;
      seconds += Math.max((v.minutes ?? 0) * 60, watched);
    } else {
      seconds += watched;
    }
  }

  const startKey = String(enr.start_date ?? '').slice(0, 10);
  const endKey = enr.completed_at ? dayKeyInTimeZone(new Date(String(enr.completed_at)), tz) : dayKeyInTimeZone(new Date(), tz);
  const about = buildAbout(def.program, lang);
  const startRow = (tests ?? []).find((t) => t.phase === 'start');
  const endRow = (tests ?? []).find((t) => t.phase === 'end');
  const num = (row: typeof startRow, key: string): number | null => {
    const r = (row?.results ?? null) as Record<string, unknown> | null;
    const v = r ? r[key] : undefined;
    return typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null;
  };

  let first = ((profile?.first_name as string | null) ?? '').trim() || null;
  let last = ((profile?.last_name as string | null) ?? '').trim();
  if (!first && !last) {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      const meta = (authUser?.user?.user_metadata ?? {}) as Record<string, unknown>;
      const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
      first = str(meta.first_name) || str(meta.given_name) || str(meta.full_name).split(' ')[0] || null;
      last = str(meta.last_name) || str(meta.family_name);
    } catch {
      /* nom indisponible */
    }
  }
  return {
    lang,
    enrollmentId: String(enr.id),
    userId,
    status: String(enr.status),
    slug: prog.slug,
    title: loc(prog.title, lang) || def.program.title[lang] || def.program.title.fr,
    level: def.program.level,
    coverUrl: def.coverUrl,
    weeks: def.program.weeks,
    firstName: first,
    fullName: [first, last].filter(Boolean).join(' '),
    certificateNumber: (enr.certificate_number as string | null) ?? null,
    startKey,
    endKey,
    days: startKey ? Math.max(1, daysBetween(startKey, endKey) + 1) : 0,
    done,
    total: videos.length,
    minutes: Math.round(seconds / 60),
    tests: about.tests.map((t) => ({ key: t.key, label: t.label, type: t.type, scale: t.scale, start: num(startRow, t.key), end: num(endRow, t.key) })),
    testStartKey: startRow?.created_at ? dayKeyInTimeZone(new Date(String(startRow.created_at)), tz) : null,
    testEndKey: endRow?.created_at ? dayKeyInTimeZone(new Date(String(endRow.created_at)), tz) : null,
    canRecordEndTest: Boolean(startRow) && !endRow,
    testItems: about.tests,
    nextSlug: def.program.next_slug ?? null,
    feedback: fb
      ? {
          rating: fb.rating == null ? null : Number(fb.rating),
          message: String(fb.message ?? ''),
          consent: fb.publish_consent === true && !fb.consent_withdrawn_at,
        }
      : null,
  };
}

/** Aperçus de développement : « Les Fondations » terminé par Margaux Dupont (5 → 23 oct.). */
export function demoCompletion(slug = 'les-fondations', lang: Lang = 'fr'): CompletionData {
  const p = CATALOG_PROGRAMS.find((x) => x.slug === slug) ?? CATALOG_PROGRAMS[0];
  const about = buildAbout(p, lang);
  const values: Record<string, [number, number]> = { planche_genoux: [20, 45], pont: [30, 60], flexion: [1, 2] };
  const videos = (p.weeks_detail ?? []).flatMap((w) => (w.steps ?? []).filter((s) => s.kind !== 'live'));
  return {
    lang,
    enrollmentId: 'apercu',
    userId: 'demo',
    status: 'completed',
    slug: p.slug,
    title: p.title[lang] || p.title.fr,
    level: p.level,
    coverUrl: `/programmes/${(p.cover_suggestion ?? '').split('/').pop() || 'alejandra-tapis.jpg'}`,
    weeks: p.weeks,
    firstName: 'Margaux',
    fullName: 'Margaux Dupont',
    certificateNumber: 'FM-2026-1023-0042',
    startKey: '2026-10-05',
    endKey: '2026-10-23',
    days: 19,
    done: videos.length,
    total: videos.length,
    minutes: videos.reduce((a, s) => a + (s.minutes ?? 0), 0),
    tests: about.tests.map((t) => ({ key: t.key, label: t.label, type: t.type, scale: t.scale, start: values[t.key]?.[0] ?? null, end: values[t.key]?.[1] ?? null })),
    testStartKey: '2026-10-05',
    testEndKey: '2026-10-23',
    canRecordEndTest: false,
    testItems: about.tests,
    nextSlug: p.next_slug ?? null,
    feedback: null,
  };
}
