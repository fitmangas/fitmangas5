'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/require-admin';
import { approveCourseReplay, linkCourseReplay, rejectCourseReplay } from '@/lib/replay-admin';
import { recoverOrphanCourseReplays } from '@/lib/replay-recover-orphans';
import { listDeadApprovedReplays, probeDeadReplaysForRestore } from '@/lib/replay-recovery';
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
    revalidatePath('/admin/videos');
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

    revalidatePath('/admin/videos');
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

    revalidatePath('/admin/videos');
    revalidatePath('/admin/courses');
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Rejet impossible.';
    return { ok: false, message: msg };
  }
}

/**
 * Masquer / réafficher un replay validé sans migration :
 * is_ready=false conserve validation_status='approved' mais retire l’accès client.
 */
/** Compte les replays validés dont Vimeo répond 404 (corbeille ou re-upload nécessaire). */
export async function probeDeadReplaysVimeoAction(): Promise<
  | { ok: true; dead: number; restored: number; message: string }
  | { ok: false; message: string }
> {
  try {
    await requireAdmin();
    const dead = await listDeadApprovedReplays();
    const { restored } = await probeDeadReplaysForRestore();
    const message =
      restored.length > 0
        ? `${restored.length} replay(s) de nouveau lisibles sur Vimeo.`
        : dead.length > 0
          ? `${dead.length} replay(s) encore introuvables sur Vimeo — restaurer la corbeille Vimeo ou lancer le pull VPS.`
          : 'Tous les replays validés sont lisibles sur Vimeo.';
    revalidatePath('/admin/videos');
    revalidatePath('/compte/replays');
    return { ok: true, dead: dead.length, restored: restored.length, message };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Sonde impossible.' };
  }
}

/** Scan Vimeo → crée les pending manquants (fichiers déjà uploadés mais jamais liés). */
export async function recoverOrphanReplaysAction(): Promise<
  | { ok: true; message: string; linked: number; stillMissing: number }
  | { ok: false; message: string }
> {
  try {
    await requireAdmin();
    const result = await recoverOrphanCourseReplays({ lookbackDays: 90 });
    revalidatePath('/admin/videos');
    revalidatePath('/admin/courses');
    revalidatePath('/compte/replays');
    const parts = [
      result.linked > 0
        ? `${result.linked} replay(s) remis en validation.`
        : 'Aucun fichier Vimeo orphelin à relier.',
      result.stillMissingRecent.length > 0
        ? `${result.stillMissingRecent.length} séance(s) récente(s) sans fichier sur Vimeo (pipeline enregistrement).`
        : null,
      result.failed > 0 ? `${result.failed} échec(s).` : null,
    ].filter(Boolean);
    return {
      ok: true,
      message: parts.join(' '),
      linked: result.linked,
      stillMissing: result.stillMissingRecent.length,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Récupération impossible.' };
  }
}

export async function setCourseReplayClientVisibilityAction(
  recordingId: string,
  visible: boolean,
): Promise<ReplayActionResult> {
  try {
    await requireAdmin();
    const idParsed = recordingIdSchema.safeParse(recordingId);
    if (!idParsed.success) return { ok: false, message: 'Identifiant invalide.' };

    const admin = createAdminClient();
    const { data: row, error: fetchError } = await admin
      .from('video_recordings')
      .select('id, validation_status, is_ready')
      .eq('id', idParsed.data)
      .maybeSingle();

    if (fetchError) return { ok: false, message: fetchError.message };
    if (!row) return { ok: false, message: 'Replay introuvable.' };
    if (row.validation_status !== 'approved') {
      return { ok: false, message: 'Seuls les replays validés peuvent être masqués ici.' };
    }

    const { error } = await admin
      .from('video_recordings')
      .update({
        is_ready: visible,
        available_at: visible ? new Date().toISOString() : null,
      })
      .eq('id', idParsed.data)
      .eq('validation_status', 'approved');

    if (error) return { ok: false, message: error.message };

    revalidatePath('/admin/videos');
    revalidatePath('/admin/courses');
    revalidatePath('/compte/replays');
    revalidatePath('/compte');
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Mise à jour impossible.';
    return { ok: false, message: msg };
  }
}
