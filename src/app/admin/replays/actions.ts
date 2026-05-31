'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/require-admin';
import { approveCourseReplay, linkCourseReplay, rejectCourseReplay } from '@/lib/replay-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export type ReplayActionResult = { ok: true } | { ok: false; message: string };

const linkSchema = z.object({
  courseId: z.string().uuid(),
  vimeoInput: z.string().min(1, 'URL ou ID Vimeo requis'),
});

const recordingIdSchema = z.string().uuid();

export async function linkCourseReplayAction(raw: unknown): Promise<ReplayActionResult> {
  try {
    const { user } = await requireAdmin();
    const parsed = linkSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors.vimeoInput?.[0] ?? 'Données invalides.';
      return { ok: false, message: String(msg) };
    }

    await linkCourseReplay({
      courseId: parsed.data.courseId,
      vimeoInput: parsed.data.vimeoInput,
      createdBy: user.id,
    });

    revalidatePath('/admin/courses');
    revalidatePath('/admin/replays');
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Impossible de lier le replay.';
    return { ok: false, message: msg };
  }
}

export async function approveCourseReplayAction(recordingId: string): Promise<ReplayActionResult> {
  try {
    await requireAdmin();
    const idParsed = recordingIdSchema.safeParse(recordingId);
    if (!idParsed.success) return { ok: false, message: 'Identifiant invalide.' };

    const admin = createAdminClient();
    const res = await approveCourseReplay(admin, idParsed.data);
    if (!res.ok) return { ok: false, message: res.error };

    revalidatePath('/admin/replays');
    revalidatePath('/admin/courses');
    revalidatePath('/compte/replays');
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Validation impossible.';
    return { ok: false, message: msg };
  }
}

export async function rejectCourseReplayAction(recordingId: string): Promise<ReplayActionResult> {
  try {
    await requireAdmin();
    const idParsed = recordingIdSchema.safeParse(recordingId);
    if (!idParsed.success) return { ok: false, message: 'Identifiant invalide.' };

    const admin = createAdminClient();
    const res = await rejectCourseReplay(admin, idParsed.data);
    if (!res.ok) return { ok: false, message: res.error };

    revalidatePath('/admin/replays');
    revalidatePath('/admin/courses');
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Rejet impossible.';
    return { ok: false, message: msg };
  }
}
