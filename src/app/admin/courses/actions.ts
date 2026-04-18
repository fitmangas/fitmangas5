'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

function slugFromTitle(title: string) {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);
  return (base || 'seance') + '-' + randomUUID().slice(0, 8);
}

const uuidSchema = z.string().uuid();

const courseUpsertSchema = z
  .object({
    title: z.string().min(1, 'Titre requis').max(500),
    description: z.string().max(20000).nullable().optional(),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    courseFormat: z.enum(['online', 'onsite']),
    courseCategory: z.enum(['individual', 'group']),
    capacityMax: z.union([z.number().int().positive(), z.null()]).optional(),
    isPublished: z.boolean(),
    location: z.string().max(500).nullable().optional(),
    liveUrl: z.string().nullable().optional(),
    jitsiLink: z.string().nullable().optional(),
    replayUrl: z.string().nullable().optional(),
    timezone: z.string().max(64).default('Europe/Paris'),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startsAt);
    const end = new Date(data.endsAt);
    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Date de début invalide', path: ['startsAt'] });
    }
    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Date de fin invalide', path: ['endsAt'] });
    }
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
      ctx.addIssue({ code: 'custom', message: 'La fin doit être après le début', path: ['endsAt'] });
    }
  });

function normalizeOptionalUrl(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const t = value.trim();
  if (!t) return null;
  try {
    // eslint-disable-next-line no-new
    new URL(t);
    return t;
  } catch {
    return null;
  }
}

export type ActionResult = { ok: true } | { ok: false; message: string };

export async function createCourseAction(raw: unknown): Promise<ActionResult> {
  try {
    const { user } = await requireAdmin();
    const parsed = courseUpsertSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg = Object.values(first).flat()[0] ?? parsed.error.message;
      return { ok: false, message: String(msg) };
    }

    const d = parsed.data;
    const admin = createAdminClient();

    const { error } = await admin.from('courses').insert({
      slug: slugFromTitle(d.title),
      title: d.title,
      description: d.description ?? null,
      course_format: d.courseFormat,
      course_category: d.courseCategory,
      starts_at: new Date(d.startsAt).toISOString(),
      ends_at: new Date(d.endsAt).toISOString(),
      timezone: d.timezone,
      capacity_max: d.capacityMax ?? null,
      location: d.location?.trim() || null,
      live_url: normalizeOptionalUrl(d.liveUrl),
      jitsi_link: normalizeOptionalUrl(d.jitsiLink),
      replay_url: normalizeOptionalUrl(d.replayUrl),
      is_published: d.isPublished,
      created_by: user.id,
      auto_add_for_monthly: d.courseFormat === 'online',
    });

    if (error) {
      console.error('[createCourse]', error);
      return { ok: false, message: error.message };
    }

    revalidatePath('/admin/courses');
    revalidatePath('/admin');
    revalidatePath('/compte');
    return { ok: true };
  } catch (e) {
    console.error('[createCourse]', e);
    return { ok: false, message: e instanceof Error ? e.message : 'Erreur serveur.' };
  }
}

export async function updateCourseAction(courseId: string, raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const idParse = uuidSchema.safeParse(courseId);
    if (!idParse.success) return { ok: false, message: 'Identifiant cours invalide.' };

    const parsed = courseUpsertSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? parsed.error.message;
      return { ok: false, message: String(msg) };
    }

    const d = parsed.data;
    const admin = createAdminClient();

    const { error } = await admin
      .from('courses')
      .update({
        title: d.title,
        description: d.description ?? null,
        course_format: d.courseFormat,
        course_category: d.courseCategory,
        starts_at: new Date(d.startsAt).toISOString(),
        ends_at: new Date(d.endsAt).toISOString(),
        timezone: d.timezone,
        capacity_max: d.capacityMax ?? null,
        location: d.location?.trim() || null,
        live_url: normalizeOptionalUrl(d.liveUrl),
        jitsi_link: normalizeOptionalUrl(d.jitsiLink),
        replay_url: normalizeOptionalUrl(d.replayUrl),
        is_published: d.isPublished,
        auto_add_for_monthly: d.courseFormat === 'online',
      })
      .eq('id', idParse.data);

    if (error) {
      console.error('[updateCourse]', error);
      return { ok: false, message: error.message };
    }

    revalidatePath('/admin/courses');
    revalidatePath('/admin');
    revalidatePath('/compte');
    return { ok: true };
  } catch (e) {
    console.error('[updateCourse]', e);
    return { ok: false, message: e instanceof Error ? e.message : 'Erreur serveur.' };
  }
}

export async function deleteCourseAction(courseId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const idParse = uuidSchema.safeParse(courseId);
    if (!idParse.success) return { ok: false, message: 'Identifiant cours invalide.' };

    const admin = createAdminClient();
    const { error } = await admin.from('courses').delete().eq('id', idParse.data);

    if (error) {
      console.error('[deleteCourse]', error);
      return { ok: false, message: error.message };
    }

    revalidatePath('/admin/courses');
    revalidatePath('/admin');
    revalidatePath('/compte');
    return { ok: true };
  } catch (e) {
    console.error('[deleteCourse]', e);
    return { ok: false, message: e instanceof Error ? e.message : 'Erreur serveur.' };
  }
}
