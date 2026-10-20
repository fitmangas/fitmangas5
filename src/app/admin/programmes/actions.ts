'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { slugify } from '@/lib/programmes/admin-types';
import { A_VALIDER_LOT3 } from '@/content/a-valider';

export type AdminProgramResult = { ok: true; id?: string } | { ok: false; message: string };

function gate(): AdminProgramResult | null {
  if (!isProgrammesEnabled()) return { ok: false, message: A_VALIDER_LOT3.flagOff.fr };
  return null;
}

function touch() {
  revalidatePath('/admin/programmes');
  revalidatePath('/compte/programmes');
}

/** Colonnes modifiables depuis l'éditeur (rien d'autre n'est accepté). */
const PROGRAM_FIELDS = new Set([
  'title',
  'promise',
  'for_who',
  'not_for',
  'coach_note',
  'benefits',
  'equipment',
  'tests',
  'level',
  'track',
  'goals',
  'sessions_per_week',
  'minutes_range',
  'cover_url',
  'next_program_id',
  'live_style',
  'status',
]);
const STEP_FIELDS = new Set(['video_id', 'start_s', 'end_s', 'segment_to_validate', 'minutes', 'objective', 'objective_long', 'live_style']);

function pick(patch: Record<string, unknown>, allowed: Set<string>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.has(k)));
}

export async function saveProgramFieldsAction(programId: string, patch: Record<string, unknown>): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const clean = pick(patch, PROGRAM_FIELDS);
  if (!Object.keys(clean).length) return { ok: false, message: 'Rien à enregistrer.' };
  if ('status' in clean && !['draft', 'published', 'archived'].includes(String(clean.status))) return { ok: false, message: 'Statut inconnu.' };
  const admin = createAdminClient();
  const { error } = await admin
    .from('programs')
    .update({ ...clean, updated_at: new Date().toISOString() })
    .eq('id', programId);
  if (error) return { ok: false, message: error.message };
  touch();
  return { ok: true };
}

export async function setProgramStatusAction(programId: string, status: 'draft' | 'published' | 'archived'): Promise<AdminProgramResult> {
  return saveProgramFieldsAction(programId, { status });
}

export async function saveProgramWeekAction(weekId: string, patch: { focus?: unknown; cues?: unknown }): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const clean: Record<string, unknown> = {};
  if (patch.focus !== undefined) clean.focus = patch.focus;
  if (patch.cues !== undefined) clean.cues = patch.cues;
  const admin = createAdminClient();
  const { error } = await admin.from('program_weeks').update(clean).eq('id', weekId);
  if (error) return { ok: false, message: error.message };
  touch();
  return { ok: true };
}

export async function saveProgramStepAction(stepId: string, patch: Record<string, unknown>): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const clean = pick(patch, STEP_FIELDS);
  if (!Object.keys(clean).length) return { ok: false, message: 'Rien à enregistrer.' };
  const admin = createAdminClient();
  const { error } = await admin.from('program_steps').update(clean).eq('id', stepId);
  if (error) return { ok: false, message: error.message };
  touch();
  return { ok: true };
}

/**
 * Nouvel ordre des séances d'une semaine. En deux temps (positions provisoires puis définitives),
 * sinon la contrainte d'unicité (programme, semaine, position) refuse l'échange de deux séances.
 */
export async function reorderProgramStepsAction(programId: string, week: number, orderedIds: string[]): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const admin = createAdminClient();
  const { data: current, error: readErr } = await admin.from('program_steps').select('id').eq('program_id', programId).eq('week', week);
  if (readErr) return { ok: false, message: readErr.message };
  const known = new Set((current ?? []).map((r) => String(r.id)));
  if (orderedIds.length !== known.size || orderedIds.some((id) => !known.has(id))) return { ok: false, message: 'Ordre incomplet : recharge la page.' };
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await admin.from('program_steps').update({ position: 1000 + i }).eq('id', orderedIds[i]);
    if (error) return { ok: false, message: error.message };
  }
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await admin.from('program_steps').update({ position: i + 1 }).eq('id', orderedIds[i]);
    if (error) return { ok: false, message: error.message };
  }
  touch();
  return { ok: true };
}

/** Ajoute une séance vidéo en fin de semaine (avant le live). */
export async function addProgramStepAction(programId: string, week: number, videoId: string): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: steps, error }, { data: video }] = await Promise.all([
    admin.from('program_steps').select('id, kind, position').eq('program_id', programId).eq('week', week).order('position'),
    admin.from('standalone_vimeo_videos').select('title, duration_seconds').eq('id', videoId).maybeSingle(),
  ]);
  if (error) return { ok: false, message: error.message };
  const minutes = video?.duration_seconds ? Math.max(1, Math.round(Number(video.duration_seconds) / 60)) : null;
  const { data: inserted, error: insErr } = await admin
    .from('program_steps')
    .insert({
      program_id: programId,
      week,
      position: 900,
      kind: 'video',
      video_id: videoId,
      minutes,
      objective: { fr: String(video?.title ?? ''), es: '' },
    })
    .select('id')
    .single();
  if (insErr || !inserted) return { ok: false, message: insErr?.message ?? 'Ajout impossible.' };
  const list = steps ?? [];
  const ordered = [
    ...list.filter((s) => s.kind !== 'live').map((s) => String(s.id)),
    String(inserted.id),
    ...list.filter((s) => s.kind === 'live').map((s) => String(s.id)),
  ];
  const res = await reorderProgramStepsAction(programId, week, ordered);
  if (!res.ok) return res;
  return { ok: true, id: String(inserted.id) };
}

/** Supprime une séance que personne n'a encore suivie (sinon refus : la progression des clientes serait perdue). */
export async function deleteProgramStepAction(stepId: string): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const admin = createAdminClient();
  const { count } = await admin.from('program_step_progress').select('id', { count: 'exact', head: true }).eq('step_id', stepId);
  if ((count ?? 0) > 0) return { ok: false, message: 'Des clientes ont déjà suivi cette séance : remplace plutôt la vidéo.' };
  const { error } = await admin.from('program_steps').delete().eq('id', stepId);
  if (error) return { ok: false, message: error.message };
  touch();
  return { ok: true };
}

/** Active ou retire le live automatique d'une semaine. */
export async function setWeekLiveAction(programId: string, week: number, on: boolean, liveStyle: string | null): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const admin = createAdminClient();
  const { data: steps, error } = await admin.from('program_steps').select('id, kind, position').eq('program_id', programId).eq('week', week).order('position');
  if (error) return { ok: false, message: error.message };
  const lives = (steps ?? []).filter((s) => s.kind === 'live');
  if (!on) {
    for (const l of lives) {
      const { error: delErr } = await admin.from('program_steps').delete().eq('id', l.id);
      if (delErr) return { ok: false, message: delErr.message };
    }
    touch();
    return { ok: true };
  }
  if (lives.length) return { ok: true };
  const last = (steps ?? []).reduce((m, s) => Math.max(m, Number(s.position)), 0);
  const { error: insErr } = await admin
    .from('program_steps')
    .insert({ program_id: programId, week, position: last + 1, kind: 'live', live_style: liveStyle || null, objective: { fr: 'Le live de la semaine', es: 'El live de la semana' } });
  if (insErr) return { ok: false, message: insErr.message };
  touch();
  return { ok: true };
}

/** Ajoute une semaine à la fin du programme (thème à écrire, sans séance). */
export async function addProgramWeekAction(programId: string): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const admin = createAdminClient();
  const { data: weeks, error } = await admin.from('program_weeks').select('week').eq('program_id', programId);
  if (error) return { ok: false, message: error.message };
  const next = (weeks ?? []).reduce((m, w) => Math.max(m, Number(w.week)), 0) + 1;
  const { error: insErr } = await admin
    .from('program_weeks')
    .insert({ program_id: programId, week: next, focus: { fr: `Semaine ${next}`, es: `Semana ${next}` }, cues: [] });
  if (insErr) return { ok: false, message: insErr.message };
  await admin.from('programs').update({ weeks: next, updated_at: new Date().toISOString() }).eq('id', programId);
  touch();
  return { ok: true };
}

/** Nouveau programme en brouillon : titre, niveau, piste, durée, rythme ; semaines vides à remplir. */
export async function createProgramAction(input: {
  titleFr: string;
  level: number;
  track: string;
  weeks: number;
  perWeek: number;
}): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const title = input.titleFr.trim();
  if (title.length < 3) return { ok: false, message: 'Donne un titre au programme.' };
  const weeks = Math.min(8, Math.max(1, Math.round(input.weeks)));
  const perWeek = Math.min(6, Math.max(1, Math.round(input.perWeek)));
  const admin = createAdminClient();
  const base = slugify(title) || 'programme';
  let slug = base;
  for (let i = 2; i < 50; i += 1) {
    const { data } = await admin.from('programs').select('id').eq('slug', slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${i}`;
  }
  const { data: maxSort } = await admin.from('programs').select('sort_order').order('sort_order', { ascending: false }).limit(1);
  const { data: created, error } = await admin
    .from('programs')
    .insert({
      slug,
      status: 'draft',
      level: Math.min(3, Math.max(0, Math.round(input.level))),
      track: input.track || 'pilates',
      goals: [],
      title: { fr: title, es: '' },
      weeks,
      sessions_per_week: perWeek,
      sort_order: Number(maxSort?.[0]?.sort_order ?? 0) + 1,
    })
    .select('id')
    .single();
  if (error || !created) return { ok: false, message: error?.message ?? 'Création impossible.' };
  const rows = Array.from({ length: weeks }, (_, i) => ({
    program_id: created.id,
    week: i + 1,
    focus: { fr: `Semaine ${i + 1}`, es: `Semana ${i + 1}` },
    cues: [],
  }));
  const { error: wErr } = await admin.from('program_weeks').insert(rows);
  if (wErr) return { ok: false, message: wErr.message };
  touch();
  return { ok: true, id: String(created.id) };
}
