import Link from 'next/link';

import { GlassCard } from '@/components/ui/GlassCard';
import { getPrintfulOrderDetail, getPrintfulOrders, parseMoney, type PrintfulOrder } from '@/lib/printful';
import { createClient } from '@/lib/supabase/server';

const ACTIVE_ORDER_STATUSES = new Set(['pending', 'draft', 'inprocess', 'onhold', 'fulfilled', 'partial']);

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

export default async function CompteBoutiqueEnCoursPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const email = user.email?.toLowerCase() ?? '';
  const orders = await getPrintfulOrders(100).catch(() => []);
  const mine = orders.filter((order) => byEmail(order, email));
  const active = mine.filter((order) => ACTIVE_ORDER_STATUSES.has((order.status ?? '').toLowerCase()));

  const detailed = (
    await Promise.all(
      active.map(async (order) => {
        const detail = await getPrintfulOrderDetail(order.id).catch(() => null);
        return detail ?? order;
      }),
    )
  ).sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-5 pb-16 pt-4 md:px-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Boutique client</p>
          <h1 className="hero-signature-title mt-2 text-4xl md:text-5xl">Suivi en cours</h1>
        </div>
        <Link href="/compte/boutique" className="btn-luxury-ghost px-4 py-2 text-[11px] tracking-[0.12em]">
          Retour boutique
        </Link>
      </header>

      {!detailed.length ? (
        <GlassCard className="p-6 text-sm text-luxury-muted">Aucune commande en cours pour le moment.</GlassCard>
      ) : (
        <div className="space-y-4">
          {detailed.map((order) => {
            const total = parseMoney(order.retail_costs?.total);
            return (
              <GlassCard key={order.id} className="p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-luxury-soft">Commande #{order.id}</p>
                    <p className="mt-1 text-sm text-luxury-muted">Dernière activité: {fmtDate(order.updated)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.14em] text-luxury-soft">Statut actuel</p>
                    <p className="text-lg font-semibold text-luxury-ink">{order.status}</p>
                    <p className="text-sm text-luxury-muted">{eur(total)}</p>
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
                    <p className="font-medium text-luxury-ink">Expédition / tracking</p>
                    {(order.shipments ?? []).length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {order.shipments?.map((shipment, idx) => (
                          <div key={`${order.id}-ship-${shipment.id ?? idx}`} className="rounded-xl border border-white/60 bg-white px-3 py-2">
                            <p>Transporteur: {shipment.carrier ?? '—'}</p>
                            <p>Service: {shipment.service ?? '—'}</p>
                            <p>Numéro: {shipment.tracking_number ?? '—'}</p>
                            <p>Date: {fmtDate(shipment.shipped_at ?? shipment.created)}</p>
                            {shipment.tracking_url ? (
                              <a href={shipment.tracking_url} target="_blank" rel="noreferrer" className="text-luxury-orange underline">
                                Suivre le colis
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2">Le tracking sera disponible dès l&apos;expédition.</p>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
