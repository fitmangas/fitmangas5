import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/require-admin';
import { isGiftsEnabled } from '@/lib/gifts/flag';
import { AdminGiftsManager } from '@/components/Gifts/AdminGiftsManager';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminCartesCadeauxPage() {
  await requireAdmin();
  if (!isGiftsEnabled()) notFound();
  let rows: Array<{ id: string; code: string; months: number; buyer: string; recipient: string; status: string; amount: string }> = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('gift_cards').select('id, code, months, buyer_name, recipient_name, status, amount_cents').order('created_at', { ascending: false }).limit(50);
    rows = (data ?? []).map((r) => ({
      id: String(r.id),
      code: String(r.code),
      months: Number(r.months),
      buyer: String(r.buyer_name),
      recipient: String(r.recipient_name),
      status: String(r.status),
      amount: `${Math.round(Number(r.amount_cents) / 100)} €`,
    }));
  } catch {
    rows = [];
  }
  return <AdminGiftsManager rows={rows} />;
}
