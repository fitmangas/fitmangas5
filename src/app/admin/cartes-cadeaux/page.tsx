import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/require-admin';
import { isGiftsEnabled } from '@/lib/gifts/flag';
import { AdminGiftsManager } from '@/components/Gifts/AdminGiftsManager';
import { createAdminClient } from '@/lib/supabase/admin';
import { giftStats, loadAdminGifts, toAdminGiftRows } from '@/lib/gifts/admin-data';

export const dynamic = 'force-dynamic';

/** C05 — cartes cadeaux : ventes, envois, activations, conversion, remboursement, carte manuelle. */
export default async function AdminCartesCadeauxPage() {
  await requireAdmin();
  if (!isGiftsEnabled()) notFound();
  const { rows, tablesMissing } = await loadAdminGifts(createAdminClient());
  return <AdminGiftsManager rows={toAdminGiftRows(rows)} stats={giftStats(rows)} tablesMissing={tablesMissing} />;
}
