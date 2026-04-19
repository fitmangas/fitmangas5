'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  courseId: z.string().uuid(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
});

export type PlanningActionResult = { ok: true } | { ok: false; message: string };

export async function rescheduleCourseAction(raw: unknown): Promise<PlanningActionResult> {
  try {
    await requireAdmin();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, message: 'Données invalides.' };
    }
    const { courseId, startsAt, endsAt } = parsed.data;
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return { ok: false, message: 'Dates invalides.' };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('courses')
      .update({
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
      })
      .eq('id', courseId);

    if (error) return { ok: false, message: error.message };

    revalidatePath('/admin/planning');
    revalidatePath('/admin/courses');
    revalidatePath('/compte');
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erreur serveur.' };
  }
}
