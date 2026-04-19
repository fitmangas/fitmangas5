'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

const enrollmentStatusSchema = z.enum(['booked', 'attended', 'canceled', 'waitlist']);

const updateSchema = z.object({
  enrollmentId: z.string().uuid(),
  status: enrollmentStatusSchema,
});

export type AttendanceActionResult = { ok: true } | { ok: false; message: string };

export async function setEnrollmentStatusAction(raw: unknown): Promise<AttendanceActionResult> {
  try {
    await requireAdmin();
    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: 'Requête invalide.' };

    const admin = createAdminClient();
    const { data: enRow } = await admin
      .from('enrollments')
      .select('course_id, user_id')
      .eq('id', parsed.data.enrollmentId)
      .maybeSingle();

    const { error } = await admin
      .from('enrollments')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.enrollmentId);

    if (error) return { ok: false, message: error.message };

    if (enRow?.course_id) {
      revalidatePath(`/admin/courses/${enRow.course_id}/attendance`);
    }
    if (enRow?.user_id) {
      revalidatePath(`/admin/clients/${enRow.user_id}`);
    }
    revalidatePath('/admin/courses');
    revalidatePath('/admin');
    revalidatePath('/compte');
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erreur serveur.' };
  }
}
