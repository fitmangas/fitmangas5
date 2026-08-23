'use server';

import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import type { PromoBenefitType } from '@/lib/promo-codes/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { createStripePromoResources, deactivateStripePromotionCode } from '@/lib/stripe/promo-sync';

const stripeApiVersion = '2025-02-24.acacia';

const promoSchema = z
  .object({
    code: z.string().min(2).max(64),
    description: z.string().max(500).nullable().optional(),
    benefitType: z.enum(['percent', 'free_months']),
    discountPercent: z.number().min(0).max(100).optional(),
    freeMonths: z.number().int().min(1).max(12).optional(),
    unlimitedUsage: z.boolean(),
    maxRedemptions: z.union([z.number().int().positive(), z.null()]).optional(),
    validFrom: z.string().min(1),
    validUntil: z.string().nullable().optional(),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.benefitType === 'percent') {
      if (data.discountPercent == null || data.discountPercent <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Indique un pourcentage de réduction.',
          path: ['discountPercent'],
        });
      }
    }
    if (data.benefitType === 'free_months' && (data.freeMonths == null || data.freeMonths < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indique une durée de gratuité.',
        path: ['freeMonths'],
      });
    }
    if (!data.unlimitedUsage && (data.maxRedemptions == null || data.maxRedemptions < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indique un nombre d’utilisations ou coche « illimité ».',
        path: ['maxRedemptions'],
      });
    }
  });

export type PromoActionResult = { ok: true } | { ok: false; message: string };

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: stripeApiVersion });
}

export async function createPromoCodeAction(raw: unknown): Promise<PromoActionResult> {
  try {
    await requireAdmin();
    const parsed = promoSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message;
      return { ok: false, message: first ?? 'Données invalides.' };
    }
    const d = parsed.data;
    const stripe = stripeClient();
    if (!stripe) {
      return { ok: false, message: 'Stripe n’est pas configuré (STRIPE_SECRET_KEY).' };
    }

    const code = d.code.trim().toUpperCase();
    const benefitType = d.benefitType as PromoBenefitType;
    const maxRedemptions = d.unlimitedUsage ? null : (d.maxRedemptions ?? null);

    const stripeResources = await createStripePromoResources(stripe, {
      code,
      benefitType,
      discountPercent: d.discountPercent,
      freeMonths: d.freeMonths,
      maxRedemptions,
    });

    const admin = createAdminClient();
    const { error } = await admin.from('promo_codes').insert({
      code,
      description: d.description?.trim() || null,
      discount_percent: benefitType === 'percent' ? (d.discountPercent ?? 0) : 0,
      max_redemptions: maxRedemptions,
      valid_from: new Date(d.validFrom).toISOString(),
      valid_until: d.validUntil ? new Date(d.validUntil).toISOString() : null,
      active: d.active,
      metadata: {
        benefit_type: benefitType,
        free_months: benefitType === 'free_months' ? (d.freeMonths ?? 1) : null,
        stripe_coupon_id: stripeResources.couponId,
        stripe_promotion_code_id: stripeResources.promotionCodeId,
      },
    });
    if (error) {
      await deactivateStripePromotionCode(stripe, stripeResources.promotionCodeId);
      return { ok: false, message: error.message };
    }

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
    const { data: row, error: fetchError } = await admin
      .from('promo_codes')
      .select('metadata')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) return { ok: false, message: fetchError.message };

    const stripe = stripeClient();
    if (stripe && row?.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)) {
      const promoId = (row.metadata as Record<string, unknown>).stripe_promotion_code_id;
      if (typeof promoId === 'string') {
        await deactivateStripePromotionCode(stripe, promoId);
      }
    }

    const { error } = await admin.from('promo_codes').delete().eq('id', id);
    if (error) return { ok: false, message: error.message };
    revalidatePath('/admin/promos');
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erreur serveur.' };
  }
}
