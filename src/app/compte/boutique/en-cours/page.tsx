import Link from 'next/link';

import { GlassCard } from '@/components/ui/GlassCard';
import { getClientLang, localeFromClientLang } from '@/lib/compte/i18n';
import { getPrintfulOrderDetail, getPrintfulOrders, parseMoney, type PrintfulOrder } from '@/lib/printful';
import { createClient } from '@/lib/supabase/server';

const ACTIVE_ORDER_STATUSES = new Set(['pending', 'draft', 'inprocess', 'onhold', 'fulfilled', 'partial']);

function eur(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
}

function fmtDate(iso: string | undefined, locale: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  const lang = await getClientLang(supabase, user.id);
  const locale = localeFromClientLang(lang);
  const t =
    lang === 'en'
      ? {
          overline: 'Client shop',
          title: 'Tracking in progress',
          back: 'Back to shop',
          empty: 'No order in progress right now.',
          order: 'Order',
          lastActivity: 'Last activity',
          currentStatus: 'Current status',
          client: 'Client',
          email: 'Email',
          address: 'Address',
          shippingTrack: 'Shipping / tracking',
          carrier: 'Carrier',
          service: 'Service',
          number: 'Number',
          date: 'Date',
          track: 'Track package',
          wait: 'Tracking will be available once shipped.',
        }
      : lang === 'es'
        ? {
            overline: 'Tienda cliente',
            title: 'Seguimiento en curso',
            back: 'Volver a tienda',
            empty: 'No hay pedidos en curso por ahora.',
            order: 'Pedido',
            lastActivity: 'Última actividad',
            currentStatus: 'Estado actual',
            client: 'Cliente',
            email: 'Email',
            address: 'Dirección',
            shippingTrack: 'Envío / seguimiento',
            carrier: 'Transportista',
            service: 'Servicio',
            number: 'Número',
            date: 'Fecha',
            track: 'Seguir paquete',
            wait: 'El seguimiento estará disponible tras el envío.',
          }
        : {
            overline: 'Boutique client',
            title: 'Suivi en cours',
            back: 'Retour boutique',
            empty: 'Aucune commande en cours pour le moment.',
            order: 'Commande',
            lastActivity: 'Dernière activité',
            currentStatus: 'Statut actuel',
            client: 'Client',
            email: 'Email',
            address: 'Adresse',
            shippingTrack: 'Expédition / tracking',
            carrier: 'Transporteur',
            service: 'Service',
            number: 'Numéro',
            date: 'Date',
            track: 'Suivre le colis',
            wait: 'Le tracking sera disponible dès l’expédition.',
          };

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
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.overline}</p>
          <h1 className="hero-signature-title mt-2 text-4xl md:text-5xl">{t.title}</h1>
        </div>
        <Link href="/compte/boutique" className="btn-luxury-ghost px-4 py-2 text-[11px] tracking-[0.12em]">
          {t.back}
        </Link>
      </header>

      {!detailed.length ? (
        <GlassCard className="p-6 text-sm text-luxury-muted">{t.empty}</GlassCard>
      ) : (
        <div className="space-y-4">
          {detailed.map((order) => {
            const total = parseMoney(order.retail_costs?.total);
            return (
              <GlassCard key={order.id} className="p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-luxury-soft">{t.order} #{order.id}</p>
                    <p className="mt-1 text-sm text-luxury-muted">{t.lastActivity}: {fmtDate(order.updated, locale)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.14em] text-luxury-soft">{t.currentStatus}</p>
                    <p className="text-lg font-semibold text-luxury-ink">{order.status}</p>
                    <p className="text-sm text-luxury-muted">{eur(total, locale)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-luxury-muted">
                    <p>
                      <span className="font-medium text-luxury-ink">{t.client} :</span> {order.recipient?.name ?? '—'}
                    </p>
                    <p>
                      <span className="font-medium text-luxury-ink">{t.email} :</span> {order.recipient?.email ?? order.packing_slip?.email ?? '—'}
                    </p>
                    <p>
                      <span className="font-medium text-luxury-ink">{t.address} :</span>{' '}
                      {[order.recipient?.address1, order.recipient?.address2, order.recipient?.city, order.recipient?.zip]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-luxury-muted">
                    <p className="font-medium text-luxury-ink">{t.shippingTrack}</p>
                    {(order.shipments ?? []).length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {order.shipments?.map((shipment, idx) => (
                          <div key={`${order.id}-ship-${shipment.id ?? idx}`} className="rounded-xl border border-white/60 bg-white px-3 py-2">
                            <p>{t.carrier}: {shipment.carrier ?? '—'}</p>
                            <p>{t.service}: {shipment.service ?? '—'}</p>
                            <p>{t.number}: {shipment.tracking_number ?? '—'}</p>
                            <p>{t.date}: {fmtDate(shipment.shipped_at ?? shipment.created, locale)}</p>
                            {shipment.tracking_url ? (
                              <a href={shipment.tracking_url} target="_blank" rel="noreferrer" className="text-luxury-orange underline">
                                {t.track}
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2">{t.wait}</p>
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
