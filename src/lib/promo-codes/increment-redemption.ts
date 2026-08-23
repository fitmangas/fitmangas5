import type { SupabaseClient } from '@supabase/supabase-js';

export async function incrementPromoRedemption(admin: SupabaseClient, promoCodeId: string): Promise<void> {
  const id = promoCodeId.trim();
  if (!id) return;

  const { data: row, error: fetchError } = await admin
    .from('promo_codes')
    .select('redeemed_count')
    .eq('id', id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!row) return;

  const next = Number(row.redeemed_count ?? 0) + 1;
  const { error: updateError } = await admin.from('promo_codes').update({ redeemed_count: next }).eq('id', id);
  if (updateError) throw updateError;
}
