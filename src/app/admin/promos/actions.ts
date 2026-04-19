'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

const promoSchema = z.object({
  code: z.string().min(2).max(64),
  description: z.string().max(500).nullable().optional(),
  discountPercent: z.number().min(0).max(100),
  maxRedemptions: z.union([z.number().int().positive(), z.null()]).optional(),
  validFrom: z.string().min(1),
  validUntil: z.string().nullable().optional(),
  active: z.boolean(),
});

export type PromoActionResult = { ok: true } | { ok: false; message: string };

export async function createPromoCodeAction(raw: unknown): Promise<PromoActionResult> {
  try {
    await requireAdmin();
    const parsed = promoSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: 'Données invalides.' };
    const d = parsed.data;
    const admin = createAdminClient();
    const { error } = await admin.from('promo_codes').insert({
      code: d.code.trim().toUpperCase(),
      description: d.description?.trim() || null,
      discount_percent: d.discountPercent,
      max_redemptions: d.maxRedemptions ?? null,
      valid_from: new Date(d.validFrom).toISOString(),
      valid_until: d.validUntil ? new Date(d.validUntil).toISOString() : null,
      active: d.active,
    });
    if (error) return { ok: false, message: error.message };
    revalidatePath('/admin/promos');
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erreur serveur.' };
  }
}

export async function deletePromoCodeAction(id: string): Promise<PromoActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin.from('promo_codes').delete().eq('id', id);
    if (error) return { ok: false, message: error.message };
    revalidatePath('/admin/promos');
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erreur serveur.' };
  }
}
