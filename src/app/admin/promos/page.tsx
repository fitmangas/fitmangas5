import { PromoCodesManager, type PromoRow } from '@/components/Admin/PromoCodesManager';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminPromosPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: promos, error } = await admin.from('promo_codes').select('*').order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-neutral-900">Codes promos</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Stockage interne — branchement Stripe Checkout / Promotion Codes à prévoir pour application automatique.
          </p>
          {error ? <p className="mt-2 text-red-600">{error.message}</p> : null}
        </header>
        <PromoCodesManager promos={(promos ?? []) as PromoRow[]} />
      </div>
    </div>
  );
}
