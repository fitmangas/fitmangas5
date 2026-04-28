import { redirect } from 'next/navigation';

import { GlassCard } from '@/components/ui/GlassCard';
import { checkIsAdmin } from '@/lib/auth/admin';
import { getPrintfulOrders, getPrintfulProducts, mapProductImage, parseMoney } from '@/lib/printful';
import { createClient } from '@/lib/supabase/server';

type ProductGain = {
  productName: string;
  revenue: number;
  cost: number;
  gain: number;
  qty: number;
};

function eur(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

const ACTIVE_ORDER_STATUSES = new Set(['pending', 'draft', 'inprocess', 'onhold', 'fulfilled', 'partial']);

export default async function AdminBoutiquePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?error=auth');
  const gate = await checkIsAdmin(supabase, user);
  if (!gate.isAdmin) redirect('/login?error=forbidden');

  const [products, orders] = await Promise.all([
    getPrintfulProducts().catch(() => []),
    getPrintfulOrders(80).catch(() => []),
  ]);

  const inProgressOrders = orders.filter((o) => ACTIVE_ORDER_STATUSES.has((o.status ?? '').toLowerCase()));

  const gainsMap = new Map<string, ProductGain>();
  for (const order of orders) {
    for (const item of order.items ?? []) {
      const name = item.name?.trim() || `Produit #${item.variant_id ?? 'n/a'}`;
      const qty = item.quantity ?? 1;
      const revenue = parseMoney(item.retail_price ?? item.price) * qty;
      const cost = parseMoney(item.cost) * qty;
      const prev = gainsMap.get(name) ?? { productName: name, revenue: 0, cost: 0, gain: 0, qty: 0 };
      prev.revenue += revenue;
      prev.cost += cost;
      prev.gain += revenue - cost;
      prev.qty += qty;
      gainsMap.set(name, prev);
    }
  }
  const gains = [...gainsMap.values()].sort((a, b) => b.gain - a.gain).slice(0, 12);

  const totalRevenue = gains.reduce((sum, g) => sum + g.revenue, 0);
  const totalGain = gains.reduce((sum, g) => sum + g.gain, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-4 md:pl-6 md:pr-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Admin boutique</p>
        <h1 className="hero-signature-title mt-2 text-4xl md:text-5xl">Printful Store</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-luxury-soft">Produits actifs</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-luxury-ink">{products.length}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-luxury-soft">Commandes en cours</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-luxury-ink">{inProgressOrders.length}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-luxury-soft">CA estimé</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-luxury-ink">{eur(totalRevenue)}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-luxury-soft">Gain estimé</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-luxury-ink">{eur(totalGain)}</p>
        </GlassCard>
      </section>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Produits en vente</h2>
        {!products.length ? (
          <p className="mt-4 text-sm text-luxury-soft">Aucun produit synchronisé via Printful.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const image = mapProductImage(product);
              return (
                <article key={product.id} className="overflow-hidden rounded-2xl border border-white/50 bg-white/45">
                  <div className="aspect-[4/3] bg-[#f5f1eb]">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-luxury-soft">Mockup indisponible</div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 font-medium text-luxury-ink">{product.name}</p>
                    <p className="mt-2 text-xs text-luxury-muted">
                      Variantes: {product.variants} · Sync: {product.synced}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Commandes en cours</h2>
          {!inProgressOrders.length ? (
            <p className="mt-4 text-sm text-luxury-soft">Aucune commande active.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/35 text-[10px] uppercase tracking-widest text-luxury-soft">
                    <th className="py-2 pr-4">Commande</th>
                    <th className="py-2 pr-4">Statut</th>
                    <th className="py-2 pr-4">Client</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="text-luxury-muted">
                  {inProgressOrders.slice(0, 20).map((order) => (
                    <tr key={order.id} className="border-b border-white/20">
                      <td className="py-2 pr-4 font-medium text-luxury-ink">#{order.id}</td>
                      <td className="py-2 pr-4">{order.status}</td>
                      <td className="py-2 pr-4">{order.recipient?.email ?? order.packing_slip?.email ?? '—'}</td>
                      <td className="py-2">{new Date(order.created).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Résumé des gains par produit</h2>
          {!gains.length ? (
            <p className="mt-4 text-sm text-luxury-soft">Pas assez de données commandes pour calculer les gains.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/35 text-[10px] uppercase tracking-widest text-luxury-soft">
                    <th className="py-2 pr-4">Produit</th>
                    <th className="py-2 pr-4">Qté</th>
                    <th className="py-2 pr-4">CA</th>
                    <th className="py-2">Gain</th>
                  </tr>
                </thead>
                <tbody className="text-luxury-muted">
                  {gains.map((g) => (
                    <tr key={g.productName} className="border-b border-white/20">
                      <td className="py-2 pr-4 font-medium text-luxury-ink">{g.productName}</td>
                      <td className="py-2 pr-4 tabular-nums">{g.qty}</td>
                      <td className="py-2 pr-4 tabular-nums">{eur(g.revenue)}</td>
                      <td className="py-2 tabular-nums text-emerald-700">{eur(g.gain)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
