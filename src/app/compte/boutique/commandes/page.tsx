import Link from 'next/link';

import { GlassCard } from '@/components/ui/GlassCard';
import { getPrintfulOrderDetail, getPrintfulOrders, parseMoney, type PrintfulOrder } from '@/lib/printful';
import { createClient } from '@/lib/supabase/server';

function eur(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function byEmail(order: PrintfulOrder, email: string): boolean {
  const recipientEmail = order.recipient?.email?.toLowerCase() ?? order.packing_slip?.email?.toLowerCase() ?? '';
  return !!recipientEmail && recipientEmail === email;
}

export default async function CompteBoutiqueCommandesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const email = user.email?.toLowerCase() ?? '';
  const orders = await getPrintfulOrders(100).catch(() => []);
  const mine = orders.filter((order) => byEmail(order, email));

  const detailed = (
    await Promise.all(
      mine.map(async (order) => {
        const detail = await getPrintfulOrderDetail(order.id).catch(() => null);
        return detail ?? order;
      }),
    )
  ).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-5 pb-16 pt-4 md:px-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Boutique client</p>
          <h1 className="hero-signature-title mt-2 text-4xl md:text-5xl">Mes commandes</h1>
        </div>
        <Link href="/compte/boutique" className="btn-luxury-ghost px-4 py-2 text-[11px] tracking-[0.12em]">
          Retour boutique
        </Link>
      </header>

      {!detailed.length ? (
        <GlassCard className="p-6 text-sm text-luxury-muted">Aucune commande enregistrée pour le moment.</GlassCard>
      ) : (
        <div className="space-y-4">
          {detailed.map((order) => {
            const subtotal = parseMoney(order.retail_costs?.subtotal);
            const shipping = parseMoney(order.retail_costs?.shipping);
            const tax = parseMoney(order.retail_costs?.tax);
            const total = parseMoney(order.retail_costs?.total);
            return (
              <GlassCard key={order.id} className="p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-luxury-soft">Commande #{order.id}</p>
                    <p className="mt-1 text-sm text-luxury-muted">Créée le {fmtDate(order.created)}</p>
                    <p className="text-sm text-luxury-muted">Mise à jour {fmtDate(order.updated)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.14em] text-luxury-soft">Statut</p>
                    <p className="text-lg font-semibold text-luxury-ink">{order.status}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-luxury-muted">
                    <p>
                      <span className="font-medium text-luxury-ink">Client :</span> {order.recipient?.name ?? '—'}
                    </p>
                    <p>
                      <span className="font-medium text-luxury-ink">Email :</span> {order.recipient?.email ?? order.packing_slip?.email ?? '—'}
                    </p>
                    <p>
                      <span className="font-medium text-luxury-ink">Adresse :</span>{' '}
                      {[order.recipient?.address1, order.recipient?.address2, order.recipient?.city, order.recipient?.zip]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-luxury-muted">
                    <p>
                      <span className="font-medium text-luxury-ink">Sous-total :</span> {eur(subtotal)}
                    </p>
                    <p>
                      <span className="font-medium text-luxury-ink">Livraison :</span> {eur(shipping)}
                    </p>
                    <p>
                      <span className="font-medium text-luxury-ink">Taxe :</span> {eur(tax)}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-luxury-ink">Total :</span> <span className="font-semibold text-luxury-ink">{eur(total)}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/35 text-[10px] uppercase tracking-widest text-luxury-soft">
                        <th className="py-2 pr-4">Produit</th>
                        <th className="py-2 pr-4">Variante</th>
                        <th className="py-2 pr-4">Qté</th>
                        <th className="py-2">Prix</th>
                      </tr>
                    </thead>
                    <tbody className="text-luxury-muted">
                      {(order.items ?? []).map((item, idx) => (
                        <tr key={`${order.id}-${item.id ?? idx}`} className="border-b border-white/20">
                          <td className="py-2 pr-4 font-medium text-luxury-ink">{item.name ?? 'Produit'}</td>
                          <td className="py-2 pr-4">{item.variant_id ?? '—'}</td>
                          <td className="py-2 pr-4">{item.quantity ?? 1}</td>
                          <td className="py-2">{eur(parseMoney(item.retail_price ?? item.price))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.invoice_url ? (
                    <a
                      href={order.invoice_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-luxury-orange/35 bg-luxury-orange px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white"
                    >
                      Facture
                    </a>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-muted">
                      Facture indisponible
                    </span>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
