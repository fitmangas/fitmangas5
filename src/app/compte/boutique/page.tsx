import { BoutiqueOrderComposer } from '@/components/Compte/BoutiqueOrderComposer';
import { GlassCard } from '@/components/ui/GlassCard';
import { getPrintfulOrders, getPrintfulProducts, mapProductImage } from '@/lib/printful';
import { createClient } from '@/lib/supabase/server';

const ACTIVE_ORDER_STATUSES = new Set(['pending', 'draft', 'inprocess', 'onhold', 'fulfilled', 'partial']);

export default async function CompteBoutiquePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [products, orders] = await Promise.all([
    getPrintfulProducts().catch(() => []),
    getPrintfulOrders(80).catch(() => []),
  ]);

  const email = user.email?.toLowerCase() ?? '';
  const myOrders = orders.filter((o) => {
    const recipientEmail = o.recipient?.email?.toLowerCase() ?? o.packing_slip?.email?.toLowerCase() ?? '';
    return recipientEmail && recipientEmail === email;
  });
  const myInProgress = myOrders.filter((o) => ACTIVE_ORDER_STATUSES.has((o.status ?? '').toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 pb-16 pt-3 md:px-8">
      <header>
        <h1 className="hero-signature-title text-4xl md:text-5xl">Boutique FitMangas</h1>
      </header>

      <section className="grid gap-4 md:-mx-8 md:grid-cols-3 xl:-mx-12">
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-luxury-soft">Produits disponibles</p>
          <p className="mt-2 text-3xl font-semibold text-luxury-ink">{products.length}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-luxury-soft">Mes commandes</p>
          <p className="mt-2 text-3xl font-semibold text-luxury-ink">{myOrders.length}</p>
          {myOrders.length > 0 ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-orange">
                Voir
              </summary>
              <div className="mt-2 space-y-1 text-xs text-luxury-muted">
                {myOrders.slice(0, 4).map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-2">
                    <span>#{order.id}</span>
                    <span>{order.status}</span>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-luxury-soft">En cours</p>
          <p className="mt-2 text-3xl font-semibold text-luxury-ink">{myInProgress.length}</p>
        </GlassCard>
      </section>

      {products.length === 0 ? (
        <GlassCard className="p-5 text-sm text-luxury-muted">
          Aucun produit n&apos;est remonté par Printful. Vérifie `PRINTFUL_API_TOKEN` / `PRINTFUL_STORE_ID` puis recharge la page.
        </GlassCard>
      ) : (
        <BoutiqueOrderComposer
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            image: mapProductImage(p),
          }))}
        />
      )}
    </div>
  );
}
