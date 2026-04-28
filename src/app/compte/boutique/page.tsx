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
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Espace client</p>
        <h1 className="hero-signature-title mt-2 text-4xl md:text-5xl">Boutique FitMangas</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-luxury-soft">Produits disponibles</p>
          <p className="mt-2 text-3xl font-semibold text-luxury-ink">{products.length}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-luxury-soft">Mes commandes</p>
          <p className="mt-2 text-3xl font-semibold text-luxury-ink">{myOrders.length}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-luxury-soft">En cours</p>
          <p className="mt-2 text-3xl font-semibold text-luxury-ink">{myInProgress.length}</p>
        </GlassCard>
      </section>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Commander</h2>
        <p className="mt-2 text-sm text-luxury-muted">
          Sélectionne un produit, une variante, puis confirme ton adresse pour créer ta commande Printful.
        </p>
        <div className="mt-5">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-white/45 bg-white/55 p-5 text-sm text-luxury-muted">
              Aucun produit n&apos;est remonté par Printful. Vérifie `PRINTFUL_API_TOKEN` / `PRINTFUL_STORE_ID` puis recharge la page.
            </div>
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
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Suivi des commandes</h2>
        {!myOrders.length ? (
          <p className="mt-4 text-sm text-luxury-soft">Aucune commande associée à ton e-mail pour l’instant.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/35 text-[10px] uppercase tracking-widest text-luxury-soft">
                  <th className="py-2 pr-4">Commande</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2">Facture</th>
                </tr>
              </thead>
              <tbody className="text-luxury-muted">
                {myOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/20">
                    <td className="py-2 pr-4 font-medium text-luxury-ink">#{order.id}</td>
                    <td className="py-2 pr-4">{order.status}</td>
                    <td className="py-2 pr-4">{new Date(order.created).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2">
                      {order.invoice_url ? (
                        <a
                          href={order.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-luxury-orange underline-offset-4 hover:underline"
                        >
                          Ouvrir
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
