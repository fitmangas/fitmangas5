'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import {
  completeProgramInternal,
  postponeSessionInternal,
  recordFeedbackInternal,
  recordFeelingInternal,
  recordTestInternal,
  recordWatchedInternal,
  restartProgramInternal,
  setEnrollmentStatusInternal,
  startProgramInternal,
  type ProgramActionResult,
} from '@/lib/programmes/actions-core';
import { A_VALIDER_LOT1 } from '@/content/a-valider';

async function sessionUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function revalidateProgrammes() {
  revalidatePath('/compte');
  revalidatePath('/compte/programmes');
}

export async function startProgramAction(input: {
  programId: string;
  startDate: string;
  chosenDays: number[];
  reminderTime: string;
  reminderEmail: boolean;
  reminderInapp: boolean;
  reminderPush: boolean;
}): Promise<ProgramActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, message: A_VALIDER_LOT1.errors.generic.fr };
  const res = await startProgramInternal({ userId, ...input });
  if (res.ok) revalidateProgrammes();
  return res;
}

export async function pauseProgramAction(enrollmentId: string): Promise<ProgramActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, message: A_VALIDER_LOT1.errors.generic.fr };
  const res = await setEnrollmentStatusInternal(enrollmentId, userId, 'paused');
  if (res.ok) revalidateProgrammes();
  return res;
}

export async function resumeProgramAction(enrollmentId: string): Promise<ProgramActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, message: A_VALIDER_LOT1.errors.generic.fr };
  const res = await setEnrollmentStatusInternal(enrollmentId, userId, 'active');
  if (res.ok) revalidateProgrammes();
  return res;
}

export async function abandonProgramAction(enrollmentId: string): Promise<ProgramActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, message: A_VALIDER_LOT1.errors.generic.fr };
  const res = await setEnrollmentStatusInternal(enrollmentId, userId, 'abandoned');
  if (res.ok) revalidateProgrammes();
  return res;
}

export async function restartProgramAction(enrollmentId: string): Promise<ProgramActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, message: A_VALIDER_LOT1.errors.generic.fr };
  const res = await restartProgramInternal(enrollmentId, userId);
  if (res.ok) revalidateProgrammes();
  return res;
}

export async function recordWatchedAction(input: {
  enrollmentId: string;
  stepId: string;
  watchedS: number;
  autoComplete?: boolean;
}): Promise<ProgramActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, message: A_VALIDER_LOT1.errors.generic.fr };
  return recordWatchedInternal({ userId, autoComplete: Boolean(input.autoComplete), ...input });
}

export async function recordFeelingAction(input: {
  enrollmentId: string;
  stepId: string;
  feeling: 'easy' | 'right' | 'hard';
}): Promise<ProgramActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, message: A_VALIDER_LOT1.errors.generic.fr };
  return recordFeelingInternal({ userId, ...input });
}

export async function recordProgramTestAction(input: {
  enrollmentId: string;
  phase: 'start' | 'end';
  results: Record<string, unknown>;
}): Promise<ProgramActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, message: A_VALIDER_LOT1.errors.generic.fr };
  return recordTestInternal({ userId, ...input });
}

export async function completeProgramAction(enrollmentId: string): Promise<ProgramActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, message: A_VALIDER_LOT1.errors.generic.fr };
  const res = await completeProgramInternal(enrollmentId, userId);
  if (res.ok) revalidateProgrammes();
  return res;
}

export async function postponeSessionAction(enrollmentId: string): Promise<ProgramActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, message: A_VALIDER_LOT1.errors.generic.fr };
  const res = await postponeSessionInternal(enrollmentId, userId);
  if (res.ok) revalidateProgrammes();
  return res;
}

export async function recordProgramFeedbackAction(input: {
  enrollmentId: string;
  rating: number | null;
  message: string;
  publishConsent: boolean;
}): Promise<ProgramActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, message: A_VALIDER_LOT1.errors.generic.fr };
  return recordFeedbackInternal({ userId, ...input });
}
