import { PromoCodesManager, type PromoRow } from '@/components/Admin/PromoCodesManager';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminPromosPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: promos, error } = await admin.from('promo_codes').select('*').order('created_at', { ascending: false });

  return (
    <div className="min-h-screen px-6 py-10 md:py-14">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-luxury-ink">Codes promos</h1>
            <p className="mt-2 max-w-xl text-sm text-luxury-muted">
              Stockage interne — branchement Stripe Checkout / Promotion Codes à prévoir pour application automatique.
            </p>
          </div>
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error.message}</p>
          ) : null}
        </header>
        <PromoCodesManager promos={(promos ?? []) as PromoRow[]} />
      </div>
    </div>
  );
}
