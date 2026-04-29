import Link from 'next/link';

import { BoutiqueOrderComposer } from '@/components/Compte/BoutiqueOrderComposer';
import { GlassCard } from '@/components/ui/GlassCard';
import { getClientLang } from '@/lib/compte/i18n';
import { sortPrintfulProducts } from '@/lib/printful-product-order';
import { getPrintfulOrders, getPrintfulProducts, mapProductImage } from '@/lib/printful';
import { createClient } from '@/lib/supabase/server';

const ACTIVE_ORDER_STATUSES = new Set(['pending', 'draft', 'inprocess', 'onhold', 'fulfilled', 'partial']);

export default async function CompteBoutiquePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const lang = await getClientLang(supabase, user.id);
  const t =
    lang === 'en'
      ? {
          title: 'FitMangas Shop',
          available: 'Available products',
          inProgress: 'In progress',
          orders: 'My orders',
          seeTracking: 'See tracking',
          seeHistory: 'See history',
          noProducts: 'No products returned by Printful. Check PRINTFUL_API_TOKEN / PRINTFUL_STORE_ID then refresh.',
        }
      : lang === 'es'
        ? {
            title: 'Tienda FitMangas',
            available: 'Productos disponibles',
            inProgress: 'En curso',
            orders: 'Mis pedidos',
            seeTracking: 'Ver seguimiento',
            seeHistory: 'Ver historial',
            noProducts: 'Printful no devolvió productos. Verifica PRINTFUL_API_TOKEN / PRINTFUL_STORE_ID y recarga.',
          }
        : {
            title: 'Boutique FitMangas',
            available: 'Produits disponibles',
            inProgress: 'En cours',
            orders: 'Mes commandes',
            seeTracking: 'Voir le suivi',
            seeHistory: 'Voir l’historique',
            noProducts: 'Aucun produit n’est remonté par Printful. Vérifie PRINTFUL_API_TOKEN / PRINTFUL_STORE_ID puis recharge la page.',
          };

  const [productsRaw, orders] = await Promise.all([
    getPrintfulProducts().catch(() => []),
    getPrintfulOrders(80).catch(() => []),
  ]);
  const products = await sortPrintfulProducts(productsRaw);

  const email = user.email?.toLowerCase() ?? '';
  const myOrders = orders.filter((o) => {
    const recipientEmail = o.recipient?.email?.toLowerCase() ?? o.packing_slip?.email?.toLowerCase() ?? '';
    return recipientEmail && recipientEmail === email;
  });
  const myInProgress = myOrders.filter((o) => ACTIVE_ORDER_STATUSES.has((o.status ?? '').toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 pb-16 pt-3 md:px-8">
      <header>
        <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
      </header>

      <section className="grid gap-4 md:-mx-8 md:grid-cols-3 xl:-mx-12">
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-luxury-soft">{t.available}</p>
          <p className="mt-2 text-3xl font-semibold text-luxury-ink">{products.length}</p>
        </GlassCard>
        <Link href="/compte/boutique/en-cours">
          <GlassCard className="h-full border border-black/8 p-5 transition hover:-translate-y-0.5 hover:border-luxury-orange/35 hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
            <p className="text-xs uppercase tracking-[0.16em] text-luxury-soft">{t.inProgress}</p>
            <p className="mt-2 text-3xl font-semibold text-luxury-ink">{myInProgress.length}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-muted">{t.seeTracking}</p>
          </GlassCard>
        </Link>
        <Link href="/compte/boutique/commandes">
          <GlassCard className="h-full border border-black/8 p-5 transition hover:-translate-y-0.5 hover:border-luxury-orange/35 hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
            <p className="text-xs uppercase tracking-[0.16em] text-luxury-soft">{t.orders}</p>
            <p className="mt-2 text-3xl font-semibold text-luxury-ink">{myOrders.length}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-muted">{t.seeHistory}</p>
          </GlassCard>
        </Link>
      </section>

      {products.length === 0 ? (
        <GlassCard className="p-5 text-sm text-luxury-muted">
          {t.noProducts}
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
