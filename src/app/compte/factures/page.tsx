import Link from 'next/link';
import Stripe from 'stripe';

import { GlassCard } from '@/components/ui/GlassCard';
import { getClientLang, localeFromClientLang } from '@/lib/compte/i18n';
import { getPrintfulOrders } from '@/lib/printful';
import { createClient } from '@/lib/supabase/server';

export default async function CompteFacturesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const lang = await getClientLang(supabase, user.id);
  const locale = localeFromClientLang(lang);
  const t =
    lang === 'en'
      ? { title: 'Invoices', subtitle: 'Stripe subscriptions and shop invoices in one place.', stripe: 'Stripe invoices', shop: 'Shop invoices', back: 'Back profile', none: 'No invoice yet.', open: 'Open' }
      : lang === 'es'
        ? { title: 'Facturas', subtitle: 'Facturas Stripe y tienda en una sola página.', stripe: 'Facturas Stripe', shop: 'Facturas tienda', back: 'Volver perfil', none: 'Aún no hay facturas.', open: 'Abrir' }
        : { title: 'Factures', subtitle: 'Toutes les factures Stripe et boutique sur une page unique.', stripe: 'Factures Stripe', shop: 'Factures boutique', back: 'Retour profil', none: 'Aucune facture pour le moment.', open: 'Ouvrir' };

  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle();
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const customerId = profile?.stripe_customer_id?.trim() ?? null;

  let stripeInvoices: Array<{ id: string; created: number; status: string | null; amount_paid: number; currency: string; hosted_invoice_url: string | null }> = [];
  if (stripeKey && customerId) {
    try {
      const stripe = new Stripe(stripeKey);
      const list = await stripe.invoices.list({ customer: customerId, limit: 30 });
      stripeInvoices = list.data.map((inv) => ({
        id: inv.id,
        created: inv.created,
        status: inv.status,
        amount_paid: inv.amount_paid,
        currency: inv.currency,
        hosted_invoice_url: inv.hosted_invoice_url ?? null,
      }));
    } catch {
      stripeInvoices = [];
    }
  }

  let shopOrders: Awaited<ReturnType<typeof getPrintfulOrders>> = [];
  if (user.email) {
    try {
      const all = await getPrintfulOrders(100);
      const email = user.email.toLowerCase();
      shopOrders = all.filter((o) => {
        const recipientEmail = o.recipient?.email?.toLowerCase() ?? o.packing_slip?.email?.toLowerCase() ?? '';
        return recipientEmail === email && !!o.invoice_url;
      });
    } catch {
      shopOrders = [];
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 pb-16 pt-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
          <p className="mt-2 text-sm text-luxury-muted">{t.subtitle}</p>
        </div>
        <Link href="/compte/profil" className="btn-luxury-ghost px-5 py-2.5 text-[10px] tracking-[0.14em]">
          ← {t.back}
        </Link>
      </header>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">{t.stripe}</h2>
        {stripeInvoices.length === 0 ? (
          <p className="mt-3 text-sm text-luxury-muted">{t.none}</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {stripeInvoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/35 bg-white/25 px-4 py-3">
                <span>{new Date(inv.created * 1000).toLocaleDateString(locale)} · {(inv.amount_paid / 100).toLocaleString(locale, { style: 'currency', currency: inv.currency || 'eur' })}</span>
                {inv.hosted_invoice_url ? (
                  <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" className="font-semibold text-luxury-orange underline-offset-4 hover:underline">
                    {t.open}
                  </a>
                ) : (
                  <span className="text-luxury-soft">—</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">{t.shop}</h2>
        {shopOrders.length === 0 ? (
          <p className="mt-3 text-sm text-luxury-muted">{t.none}</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {shopOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/35 bg-white/25 px-4 py-3">
                <span>#{order.id} · {new Date(order.created).toLocaleDateString(locale)} · {order.status}</span>
                {order.invoice_url ? (
                  <a href={order.invoice_url} target="_blank" rel="noreferrer" className="font-semibold text-luxury-orange underline-offset-4 hover:underline">
                    {t.open}
                  </a>
                ) : (
                  <span className="text-luxury-soft">—</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </main>
  );
}
