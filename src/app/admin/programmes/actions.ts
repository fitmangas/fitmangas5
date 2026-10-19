'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { A_VALIDER_LOT3 } from '@/content/a-valider';

export type AdminProgramResult = { ok: true } | { ok: false; message: string };

function gate(): AdminProgramResult | null {
  if (!isProgrammesEnabled()) return { ok: false, message: A_VALIDER_LOT3.flagOff.fr };
  return null;
}

export async function saveProgramFieldsAction(programId: string, patch: Record<string, unknown>): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('programs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', programId);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/admin/programmes');
  return { ok: true };
}

export async function setProgramStatusAction(programId: string, status: 'draft' | 'published' | 'archived'): Promise<AdminProgramResult> {
  return saveProgramFieldsAction(programId, { status });
}

export async function saveProgramWeekAction(
  weekId: string,
  patch: { focus?: unknown; cues?: unknown },
): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('program_weeks').update(patch).eq('id', weekId);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/admin/programmes');
  return { ok: true };
}

export async function saveProgramStepAction(stepId: string, patch: Record<string, unknown>): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('program_steps').update(patch).eq('id', stepId);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/admin/programmes');
  return { ok: true };
}

export async function reorderProgramStepsAction(
  programId: string,
  week: number,
  orderedIds: string[],
): Promise<AdminProgramResult> {
  const blocked = gate();
  if (blocked) return blocked;
  await requireAdmin();
  const admin = createAdminClient();
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await admin.from('program_steps').update({ position: i + 1 }).eq('id', orderedIds[i]).eq('program_id', programId).eq('week', week);
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath('/admin/programmes');
  return { ok: true };
}
